#!/usr/bin/env python3
"""Offline comparison accounting; does not call any provider or modify raw runs."""
import argparse
from collections import Counter
from decimal import Decimal
import json
import math
from pathlib import Path
import statistics

from run_openai import MODELS, MILLION, save


def cost(entry):
    usage = entry.get("usage")
    if usage is None:
        return Decimal(0), Decimal(entry["budget_debit_usd"])
    p = MODELS[entry["model"]]
    n, out = usage["input_tokens"], usage["output_tokens"]
    details = usage.get("input_tokens_details") or {}
    cached = details.get("cached_tokens", 0)
    prefix = "long_" if p.get("long_input") and n > 272000 else ""
    ir, cr, outr = (Decimal(p[prefix + k]) for k in ("input", "cached", "output"))
    amount = ((n - cached) * ir + cached * cr + out * outr) / MILLION
    if p.get("writes"):
        written = details.get("cache_write_tokens")
        if written is None:
            return amount, amount + (n - cached) * ir * Decimal("0.25") / MILLION
        if not 0 <= written <= n - cached:
            raise ValueError("Unexpected cache-write accounting")
        amount += written * ir * Decimal("0.25") / MILLION
    return amount, amount


def percentile(values, q):
    return sorted(values)[math.ceil(q * len(values)) - 1] if values else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run", type=Path)
    args = parser.parse_args()
    run = json.loads((args.run / "report.json").read_text())
    ledger_file = args.run / "ledger.json"
    if not ledger_file.exists():
        ledger_file = Path(__file__).with_name("authorized-budget-2026-09-05.json")
    ledger = json.loads(ledger_file.read_text())
    reviews_file = args.run / "semantic-review.json"
    reviews = json.loads(reviews_file.read_text()) if reviews_file.exists() else {"turns": []}
    judged = {(r["model"], r["case"], r["turn"]): r for r in reviews["turns"]}
    result = {"cap_usd": ledger["cap_usd"], "runtime_commit": run["runtime_commit"], "campus_time": run["campus_time"], "dataset": run["dataset"], "stopped_reason": run.get("stopped_reason"), "models": {}, "notes": ["Costs are usage-derived API estimates, not a billing invoice.", "Unknown timeout charges use a conservative range: zero to retained maximum reservation.", "Output cost includes reasoning tokens once. Luna cache writes are charged using reported write tokens.", "Latency is direct runtime time, excluding HTTP transport; p95 uses nearest rank.", "A full semantic pass requires every original turn expectation, not just valid JSON."]}
    for model in MODELS:
        cases = [c for c in run["results"] if c["model"] == model]
        turns = [(c["case"], t) for c in cases for t in c["turns"] if "elapsed_seconds" in t]
        entries = [e for e in ledger["entries"] if e["model"] == model]
        costs = [cost(e) for e in entries]
        low = sum((c[0] for c in costs), Decimal(0))
        high = sum((c[1] for c in costs), Decimal(0))
        times = [t["elapsed_seconds"] for _, t in turns]
        passed = sum(judged.get((model, c, t["turn"]), {}).get("result") == "pass" for c, t in turns)
        unsupported = [claim for c, t in turns for claim in judged.get((model, c, t["turn"]), {}).get("unsupported_claims", [])]
        errors = Counter(t["error"]["type"] for _, t in turns if "error" in t)
        n_judged = sum((model, c, t["turn"]) in judged for c, t in turns)
        requests = sum(sum(item.get("type") == "function_call" for item in call.get("response", {}).get("output", [])) for _, t in turns for call in t["calls"])
        executions = sum(sum(trace.get("reason") not in {"tool_budget", "invalid_arguments", "unknown_tool"} for trace in t.get("trace", [])) for _, t in turns)
        row = {"conversations_attempted": len(cases), "turns_attempted": len(turns), "turns_planned": 27, "turns_unrun": 27 - len(turns), "answers_returned": sum("response" in t for _, t in turns), "turns_reviewed": n_judged, "semantic_passes": passed, "semantic_failures": n_judged - passed, "unsupported_claim_count": len(unsupported), "unsupported_claims": unsupported, "errors": dict(errors), "model_calls": len(entries), "draft_calls": sum(e["phase"] == "draft" for e in entries), "review_calls": sum(e["phase"] == "review" for e in entries), "tool_requests": requests, "tool_executions": executions, "input_tokens": sum(e.get("usage", {}).get("input_tokens", 0) for e in entries), "output_tokens": sum(e.get("usage", {}).get("output_tokens", 0) for e in entries), "reasoning_tokens": sum((e.get("usage", {}).get("output_tokens_details") or {}).get("reasoning_tokens", 0) for e in entries), "cost_lower_usd": str(low), "cost_upper_usd": str(high), "cost_per_semantic_pass_lower_usd": str(low / passed) if passed else None, "cost_per_semantic_pass_upper_usd": str(high / passed) if passed else None, "latency_median_seconds": statistics.median(times) if times else None, "latency_p95_seconds": percentile(times, .95), "latency_max_seconds": max(times) if times else None, "latency_total_seconds": round(sum(times), 3)}
        result["models"][model] = row
        answer_times = [t["elapsed_seconds"] for _, t in turns if "response" in t]
        row["answer_latency_median_seconds"] = statistics.median(answer_times) if answer_times else None
        row["turns_with_unsupported_claims"] = sum(bool(judged.get((model, c, t["turn"]), {}).get("unsupported_claims")) for c, t in turns)
        row["failure_reasons"] = dict(Counter(t["error"].get("code") or t["error"]["type"] for _, t in turns if "error" in t))
        row["all_attempts_cost_per_returned_answer_lower_usd"] = str(low / len(answer_times)) if answer_times else None
        row["all_attempts_cost_per_returned_answer_upper_usd"] = str(high / len(answer_times)) if answer_times else None
        row["first_turns_attempted"] = sum(t["turn"] == 1 for _, t in turns)
        row["first_turn_semantic_passes"] = sum(t["turn"] == 1 and judged.get((model, c, t["turn"]), {}).get("result") == "pass" for c, t in turns)
        row["fully_passed_conversations"] = sum(not c.get("not_run_turns") and all(judged.get((model, c["case"], t["turn"]), {}).get("result") == "pass" for t in c["turns"]) for c in cases if c["turns"])
    result["total_cost_lower_usd"] = str(sum((Decimal(m["cost_lower_usd"]) for m in result["models"].values()), Decimal(0)))
    result["total_cost_upper_usd"] = str(sum((Decimal(m["cost_upper_usd"]) for m in result["models"].values()), Decimal(0)))
    result["run_status"] = "stopped" if run.get("stopped_reason") else ("completed" if "fingerprints_after" in run else "running")
    result["source_unchanged"] = run.get("source_unchanged")
    result["dataset_unchanged"] = run.get("dataset_after") == run["dataset"] if "dataset_after" in run else None
    result["all_attempted_turns_reviewed"] = all(m["turns_reviewed"] == m["turns_attempted"] for m in result["models"].values())
    save(args.run / "summary.json", result)
    print(json.dumps({"cost_lower": result["total_cost_lower_usd"], "cost_upper": result["total_cost_upper_usd"], "models": {m: {k:v for k,v in r.items() if k in ("turns_attempted", "semantic_passes", "answers_returned", "model_calls", "errors", "cost_lower_usd", "cost_upper_usd", "latency_median_seconds")} for m,r in result["models"].items()}}, indent=2))


if __name__ == "__main__":
    main()
