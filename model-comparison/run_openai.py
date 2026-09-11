#!/usr/bin/env python3
"""Compare the committed Brain with a durable, shared API spending ceiling.

No live requests without --execute and an explicit --budget-usd. Runtime source,
prompts, tools, timeouts, output caps and the original acceptance corpus are reused.
"""
import argparse
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
BRAIN = ROOT / "rockygpt-brain"
CORPUS = ROOT / "rockygpt-evals/brain-reset/conversations.json"
EXPECTED_HEAD = "a638942899cd6723381996ee0f64f66cab9b165e"
MILLION = Decimal(1_000_000)
# Standard USD per million tokens, checked against official pricing 2026-09-05.
# context is deliberately the entire context window, a conservative reservation.
MODELS = {
    "gpt-5-nano": dict(snapshot="gpt-5-nano-2025-08-07", input="0.05", cached="0.005", output="0.40", context=400000),
    "gpt-4o-mini": dict(snapshot="gpt-4o-mini-2024-07-18", input="0.15", cached="0.075", output="0.60", context=128000),
    "gpt-5.6-luna": dict(snapshot="gpt-5.6-luna", input="0.20", cached="0.02", output="1.20", context=1050000, long_input="0.40", long_cached="0.04", long_output="1.80", writes=True),
    "gpt-5.4-nano": dict(snapshot="gpt-5.4-nano-2026-03-17", input="0.20", cached="0.02", output="1.25", context=400000),
    "gpt-5-mini": dict(snapshot="gpt-5-mini-2025-08-07", input="0.25", cached="0.025", output="2.00", context=400000),
    "gpt-5.4-mini": dict(snapshot="gpt-5.4-mini-2026-03-17", input="0.75", cached="0.075", output="4.50", context=400000),
}


def plain(value):
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    raise TypeError(type(value).__name__)


def save(path, value):
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False, default=plain)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    temp.replace(path)


def fingerprints():
    files = sorted((BRAIN / "src/rockygpt_brain").rglob("*.py")) + sorted((BRAIN / "src/rockygpt_brain").glob("*.md")) + [CORPUS]
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


class BudgetStop(Exception):
    pass


class ProviderStop(Exception):
    pass


class Budget:
    def __init__(self, limit, path, resume=False):
        self.limit = Decimal(str(limit))
        if not self.limit.is_finite() or self.limit <= 0 or self.limit > 5:
            raise ValueError("Authorized total ceiling is $5; choose 0 < budget <= 5")
        self.path = path
        self._lock_handle = path.with_suffix(".lock").open("a")
        fcntl.flock(self._lock_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if path.exists() and not resume:
            raise ValueError("Existing ledger: refuse to reset spending history")
        if path.exists():
            previous = json.loads(path.read_text())
            if Decimal(previous["cap_usd"]) != self.limit:
                raise ValueError("Cannot change the existing shared authorization")
            self.entries = previous["entries"]
            if any(not Decimal(e["budget_debit_usd"]).is_finite() or Decimal(e["budget_debit_usd"]) < 0 for e in self.entries):
                raise ValueError("Invalid previous ledger")
        else:
            self.entries = []
        self.flush()

    def total(self):
        return sum((Decimal(e["budget_debit_usd"]) for e in self.entries), Decimal(0))

    def flush(self):
        save(self.path, {"cap_usd": str(self.limit), "budget_debit_usd": str(self.total()), "entries": self.entries})

    def reserve(self, model, output_cap, context):
        p = MODELS[model]
        rate = Decimal(p.get("long_input", p["input"]))
        if p.get("writes"):
            rate *= Decimal("1.25")
        reserve = (p["context"] * rate + output_cap * Decimal(p.get("long_output", p["output"]))) / MILLION
        if self.total() + reserve > self.limit:
            raise BudgetStop("Next request's conservative maximum would exceed the total cap")
        entry = dict(context, id=len(self.entries) + 1, model=model, reservation_usd=str(reserve), budget_debit_usd=str(reserve), status="reserved", max_output_tokens=output_cap)
        self.entries.append(entry)
        self.flush()  # Persist worst-case debit BEFORE the provider request.
        return entry

    def settle(self, entry, usage):
        p = MODELS[entry["model"]]
        n, out = usage["input_tokens"], usage["output_tokens"]
        cached = (usage.get("input_tokens_details") or {}).get("cached_tokens", 0)
        if not 0 <= cached <= n or out > entry["max_output_tokens"] or n > p["context"]:
            raise ProviderStop("Usage exceeded documented/requested bounds")
        prefix = "long_" if p.get("long_input") and n > 272000 else ""
        ir, cr, outr = (Decimal(p[prefix + k]) for k in ("input", "cached", "output"))
        base = ((n - cached) * ir + cached * cr + out * outr) / MILLION
        # New cache-write fields vary by SDK version. Bound unknown writes rather
        # than silently understating Luna cost. Report the interval explicitly.
        upper = base + ((n - cached) * ir * Decimal("0.25") / MILLION if p.get("writes") else 0)
        if upper > Decimal(entry["reservation_usd"]):
            raise ProviderStop("Calculated cost exceeded reservation")
        entry.update(usage=usage, estimated_cost_usd=str(base), estimated_cost_upper_usd=str(upper), budget_debit_usd=str(upper), status="completed")
        self.flush()


class MeteredResponses:
    def __init__(self, client, model, budget, journal=None):
        self.client, self.model, self.budget = client, model, budget
        self.journal = journal
        self.context, self.calls = {}, []

    def create(self, **kwargs):
        from openai import APIStatusError
        phase = "review" if kwargs.get("text", {}).get("format", {}).get("name") == "evidence_review" else "draft"
        adaptation = None
        if self.model == "gpt-4o-mini" and "reasoning" in kwargs:
            kwargs.pop("reasoning")
            adaptation = "Omit unsupported reasoning parameter for non-reasoning GPT-4o mini"
        kwargs["service_tier"] = "default"
        entry = self.budget.reserve(self.model, kwargs["max_output_tokens"], {**self.context, "phase": phase})
        started = time.monotonic()
        call = {"phase": phase, "adaptation": adaptation, "request": {k: v for k, v in kwargs.items() if k != "timeout"}}
        self.calls.append(call)
        try:
            response = self.client.responses.create(**kwargs)
            call["response"] = response.model_dump(mode="json")
            if response.usage is None:
                raise ProviderStop("Provider omitted usage; retain worst-case reservation and stop")
            self.budget.settle(entry, response.usage.model_dump())
            return response
        except Exception as error:
            call["error"] = {"type": type(error).__name__, "status": getattr(error, "status_code", None), "code": getattr(error, "code", None)}
            if isinstance(error, APIStatusError) and error.status_code in (400, 401, 403, 404, 429):
                # Explicit rejection before model execution is not a completed
                # generation. Other errors/timeouts retain the whole reservation.
                entry.update(status="provider_rejected", budget_debit_usd="0", error=call["error"])
            else:
                entry.update(status="uncertain_charge", error=call["error"])
            self.budget.flush()
            raise
        finally:
            call["elapsed_seconds"] = round(time.monotonic() - started, 3)
            if self.journal is not None:
                save(self.journal / f"call-{entry['id']:05d}.json", {"context": self.context, "model": self.model, "call": call, "ledger": entry})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--budget-usd", type=Decimal)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not args.execute or args.budget_usd is None:
        print(json.dumps({"execute": False, "models": MODELS, "corpus": str(CORPUS), "note": "No network calls. Supply --execute and --budget-usd to run."}, indent=2))
        return
    args.output.mkdir(parents=True, exist_ok=True)
    if (args.output / "report.json").exists():
        raise ValueError("Refuse to overwrite an existing comparison report")
    # One fixed authorization ledger across restarts/output directories; an OS
    # lock prevents concurrent comparisons from spending the same balance.
    budget = Budget(args.budget_usd, Path(__file__).with_name("authorized-budget-2026-09-05.json"), resume=True)
    journal = args.output / "calls"
    journal.mkdir(exist_ok=True)
    head = subprocess.check_output(["git", "-C", str(BRAIN), "rev-parse", "HEAD"], text=True).strip()
    dirty = subprocess.check_output(["git", "-C", str(BRAIN), "status", "--porcelain"], text=True).strip()
    if head != EXPECTED_HEAD or dirty:
        raise RuntimeError("Brain must be clean at the expected checkpoint")
    sys.path.insert(0, str(BRAIN / "src"))
    from dotenv import dotenv_values
    from openai import OpenAI, APIStatusError, RateLimitError
    from rockygpt_brain.contracts import ChatMessage
    from rockygpt_brain.data import CampusData
    from rockygpt_brain.engine import run_turn
    env = dotenv_values(BRAIN / ".env")
    key = os.environ.get("OPENAI_API_KEY") or env.get("OPENAI_API_KEY")
    database = os.environ.get("DATABASE_URL") or env.get("DATABASE_URL")
    if not key or not database:
        raise RuntimeError("Missing required local configuration")
    now = datetime.now(ZoneInfo("America/New_York"))
    before = fingerprints()
    cases = json.loads(CORPUS.read_text())["cases"]
    # Cover diverse failure modes early, then finish ALL original cases; no
    # expectation changes or semantic elimination based on partial results.
    first = ["password-reset", "dining-menu-allergy", "library-pronoun-then-topic-switch", "untrusted-instructions-as-campus-fact", "shuttle-saturday-trip", "private-records-with-general-help", "campus-location-and-office", "academic-calendar-specific-term"]
    order = first + [c["id"] for c in cases if c["id"] not in first]
    cases = sorted(cases, key=lambda c: order.index(c["id"]))
    spec = importlib.util.spec_from_file_location("original_harness", CORPUS.with_name("run.py"))
    harness = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(harness)
    check = CampusData(database, now)
    try:
        readiness = check.readiness()
    finally:
        check.close()
    report = {"runtime_commit": head, "fingerprints_before": before, "campus_time": now.isoformat(), "dataset": readiness, "models": MODELS, "planned_conversations_per_model": 20, "planned_turns_per_model": 27, "runtime_boundary": "Direct committed run_turn, not HTTP; excludes HTTP transport and initial readiness", "adaptations": ["Force standard service tier for predictable pricing", "GPT-4o mini review omits unsupported reasoning option; prompts/schema unchanged", "Same captured campus clock for all models", "SDK automatic retries disabled"], "results": [], "semantic_review": "pending"}
    save(args.output / "report.json", report)
    disabled = {}
    print(json.dumps({"ready": readiness, "cap_usd": str(budget.limit), "campus_time": now.isoformat()}), flush=True)
    stopped = None
    try:
        with OpenAI(api_key=key, max_retries=0, timeout=30.0) as client:
            for ci, case in enumerate(cases):
                models = list(MODELS)
                models = models[ci % len(models):] + models[:ci % len(models)]
                for model in models:
                    if model in disabled:
                        continue
                    meter = MeteredResponses(client, model, budget, journal)
                    history = [dict(m) for m in case["messages"]]
                    turns = case.get("turns", [None])
                    case_result = {"model": model, "case": case["id"], "expected_behaviors": case["expected_behaviors"], "turns": []}
                    report["results"].append(case_result)
                    for ti, turn in enumerate(turns):
                        if turn:
                            history.append({"role": "user", "content": turn["user"]})
                        obs = {"turn": ti + 1, "messages": [dict(m) for m in history], "expected_behaviors": (turn or case)["expected_behaviors"], "calls": [], "semantic_review": "pending"}
                        case_result["turns"].append(obs)
                        meter.calls = obs["calls"]
                        meter.context = {"case": case["id"], "turn": ti + 1}
                        data = CampusData(database, now)
                        def profile(frame, event, arg):
                            if event == "return" and frame.f_code is run_turn.__code__:
                                obs["evidence"] = list(frame.f_locals.get("evidence", {}).values())
                                obs["trace"] = frame.f_locals.get("trace", [])
                        started = time.monotonic()
                        try:
                            sys.setprofile(profile)
                            response = run_turn([ChatMessage(**m) for m in history], client=SimpleNamespace(responses=meter), data=data, model=MODELS[model]["snapshot"], now=now)
                            response["requestId"] = f"comparison-{ci}-{model}-{ti}"
                            obs["response"] = response
                            assertions = {**case.get("assertions", {}), **(turn or {}).get("assertions", {})}
                            obs["machine_checks"] = harness.response_checks(response, assertions)
                            history.append({"role": "assistant", "content": response["answer"]})
                        except (BudgetStop, ProviderStop) as error:
                            stopped = type(error).__name__ + ": " + str(error)
                            obs["error"] = {"type": type(error).__name__, "reason": str(error)}
                        except Exception as error:
                            obs["error"] = {"type": type(error).__name__, "status": getattr(error, "status_code", None), "code": getattr(error, "code", None)}
                            if isinstance(error, RateLimitError):
                                stopped = "Provider rate/quota rejection; no further calls"
                            elif isinstance(error, APIStatusError) and error.status_code in (400, 401, 403, 404):
                                disabled[model] = obs["error"]
                        finally:
                            sys.setprofile(None)
                            obs["elapsed_seconds"] = round(time.monotonic() - started, 3)
                            data.close()
                            if hasattr(data, "dataset") and data.dataset["version"] != readiness["dataset_version"]:
                                stopped = "Published dataset changed; comparison stopped"
                            save(args.output / "report.json", report)
                        print(json.dumps({"model": model, "case": case["id"], "turn": ti + 1, "seconds": obs["elapsed_seconds"], "calls": len(obs["calls"]), "error": obs.get("error"), "budget_debit_usd": str(budget.total())}), flush=True)
                        if "error" in obs:
                            case_result["not_run_turns"] = len(turns) - ti - 1
                            break
                    if stopped:
                        break
                if stopped:
                    break
    finally:
        report.update(stopped_reason=stopped, disabled_models=disabled, fingerprints_after=fingerprints(), budget_debit_usd=str(budget.total()))
        report["source_unchanged"] = before == report["fingerprints_after"]
        check = CampusData(database, now)
        try:
            report["dataset_after"] = check.readiness()
        except Exception as error:
            report["dataset_after_error"] = type(error).__name__
        finally:
            check.close()
        save(args.output / "report.json", report)
        save(args.output / "ledger.json", {"cap_usd": str(budget.limit), "budget_debit_usd": str(budget.total()), "entries": budget.entries})
        print(json.dumps({"finished": True, "stopped_reason": stopped, "budget_debit_usd": str(budget.total()), "disabled_models": disabled}), flush=True)


if __name__ == "__main__":
    main()
