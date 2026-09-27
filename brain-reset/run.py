#!/usr/bin/env python3
"""Black-box conversations, with observable checks and an honest human-review report."""

import argparse
import datetime as dt
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

STATUSES = {"answered", "partial", "clarification", "unavailable"}
ASSERTION_KEYS = {"status_in", "min_citations", "max_citations"}
DEFAULT_CORPUS = Path(__file__).with_name("conversations.json")


def load_cases(path):
    corpus = json.loads(Path(path).read_text(encoding="utf-8"))
    cases = corpus.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("Corpus must contain a nonempty cases array")
    seen = set()
    for case in cases:
        case_id = case.get("id")
        if not isinstance(case_id, str) or not case_id or case_id in seen:
            raise ValueError("Each case requires a unique nonempty id")
        seen.add(case_id)
        messages = case.get("messages")
        if not isinstance(messages, list):
            raise ValueError(f"{case_id}: messages must be an array")
        for message in messages:
            if message.get("role") not in {"user", "assistant"} or not isinstance(message.get("content"), str) or not message["content"].strip():
                raise ValueError(f"{case_id}: invalid conversation message")
        turns = case.get("turns")
        if turns is not None:
            if not isinstance(turns, list) or not turns:
                raise ValueError(f"{case_id}: turns must be a nonempty array")
            if messages and messages[-1]["role"] != "assistant":
                raise ValueError(f"{case_id}: seeded messages must end with assistant before live turns")
            for turn in turns:
                if not isinstance(turn.get("user"), str) or not turn["user"].strip():
                    raise ValueError(f"{case_id}: each live turn needs nonempty user text")
        elif not messages or messages[-1]["role"] != "user":
            raise ValueError(f"{case_id}: messages must end with user when turns are absent")
        for item in [case, *(turns or [])]:
            if not isinstance(item.get("expected_behaviors"), list) or not item["expected_behaviors"] or not all(isinstance(value, str) and value.strip() for value in item["expected_behaviors"]):
                raise ValueError(f"{case_id}: expected_behaviors must be nonempty prose")
            checks = item.get("assertions", {})
            if not isinstance(checks, dict) or set(checks) - ASSERTION_KEYS:
                raise ValueError(f"{case_id}: unknown assertion type")
            if "status_in" in checks and (not isinstance(checks["status_in"], list) or not checks["status_in"] or any(value not in STATUSES for value in checks["status_in"])):
                raise ValueError(f"{case_id}: status_in must contain known response statuses")
            for key in ("min_citations", "max_citations"):
                if key in checks and (type(checks[key]) is not int or checks[key] < 0):
                    raise ValueError(f"{case_id}: {key} must be a nonnegative integer")
    return cases


def response_checks(response, assertions):
    """Never mistake keyword matching or citation presence for factual accuracy."""
    checks = []

    def check(name, passed, detail):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    check("response_object", isinstance(response, dict), "Response is a JSON object")
    if not isinstance(response, dict):
        return checks
    for key in ("answer", "requestId", "model"):
        check(f"{key}_present", isinstance(response.get(key), str) and bool(response[key].strip()), f"{key} is a nonempty string")
    check("valid_status", isinstance(response.get("status"), str) and response["status"] in STATUSES, f"status={response.get('status')!r}")
    citations = response.get("citations")
    check("citations_array", isinstance(citations, list), "citations is an array")
    if isinstance(citations, list):
        ids = []
        for index, citation in enumerate(citations):
            is_object = isinstance(citation, dict)
            check(f"citation_{index}_metadata", is_object and all(isinstance(citation.get(key), str) and bool(citation[key].strip()) for key in ("id", "title", "url")), "Citation has nonempty id, title, and url")
            if is_object:
                url = citation.get("url", "")
                try:
                    parsed = urllib.parse.urlparse(url) if isinstance(url, str) else None
                    valid_url = parsed is not None and parsed.scheme in {"http", "https"} and bool(parsed.hostname)
                except ValueError:
                    valid_url = False
                check(f"citation_{index}_url", valid_url, "Citation URL is an absolute HTTP(S) URL")
                ids.append(citation.get("id"))
        check("citation_ids_unique", len(ids) == len({str(value) for value in ids}), "Citation identifiers are unique")
        for key, comparison in (("min_citations", lambda count, bound: count >= bound), ("max_citations", lambda count, bound: count <= bound)):
            if key in assertions:
                check(key, comparison(len(citations), assertions[key]), f"count={len(citations)}, bound={assertions[key]}")
    if "status_in" in assertions:
        check("expected_status", response.get("status") in assertions["status_in"], f"Expected one of {assertions['status_in']}, got {response.get('status')!r}")
    return checks


def post_chat(base_url, messages, timeout):
    request = urllib.request.Request(
        base_url.rstrip("/") + "/v1/chat",
        data=json.dumps({"messages": messages}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as http:
            raw = http.read().decode("utf-8")
            status = http.status
        return {"http_status": status, "response": json.loads(raw), "elapsed_seconds": round(time.monotonic() - started, 3)}
    except urllib.error.HTTPError as error:
        try:
            body = error.read().decode("utf-8", errors="replace")
        finally:
            error.close()
        return {"http_status": error.code, "error": body, "elapsed_seconds": round(time.monotonic() - started, 3)}
    except (OSError, ValueError) as error:
        return {"http_status": None, "error": f"{type(error).__name__}: {error}", "elapsed_seconds": round(time.monotonic() - started, 3)}


def run_case(case, base_url, timeout, caller=post_chat):
    history = [dict(message) for message in case["messages"]]
    turns = case.get("turns", [None])
    result = {"id": case["id"], "tags": case.get("tags", []), "expected_behaviors": case["expected_behaviors"], "human_review": "pending", "turns": []}
    for index, turn in enumerate(turns):
        if turn is not None:
            history.append({"role": "user", "content": turn["user"]})
        checks = dict(case.get("assertions", {}))
        checks.update((turn or {}).get("assertions", {}))
        # Copy at the call boundary: saved requests cannot change as history grows.
        messages = [dict(message) for message in history]
        observation = caller(base_url, messages, timeout)
        response = observation.get("response")
        observation.update({"turn": index + 1, "messages": messages, "expected_behaviors": (turn or {}).get("expected_behaviors", case["expected_behaviors"]), "assertions": checks})
        observation["checks"] = response_checks(response, checks) if "error" not in observation else [{"name": "request_succeeded", "passed": False, "detail": observation["error"]}]
        observation["machine_checks_passed"] = all(check["passed"] for check in observation["checks"])
        result["turns"].append(observation)
        if observation.get("http_status") == 429:
            result["stop_reason"] = "http_429"
        if not isinstance(response, dict) or not isinstance(response.get("answer"), str) or not response["answer"].strip():
            result["not_run_turns"] = len(turns) - index - 1
            break
        history.append({"role": "assistant", "content": response["answer"]})
    result["machine_checks_passed"] = all(turn["machine_checks_passed"] for turn in result["turns"]) and not result.get("not_run_turns", 0)
    return result


def paced_caller(interval, caller=post_chat):
    """Share one start-time clock across all cases and every follow-up turn."""
    last_started = None

    def call(base_url, messages, timeout):
        nonlocal last_started
        if last_started is not None:
            remaining = interval - (time.monotonic() - last_started)
            if remaining > 0:
                time.sleep(remaining)
        last_started = time.monotonic()
        return caller(base_url, messages, timeout)

    return call


def update_summary(report, planned_cases):
    deferred = {item["id"] for item in report.get("not_run_cases", [])}
    current = [item for item in report["results"] if item["id"] not in deferred]
    completed = [turn for item in current for turn in item["turns"]]
    report["summary"] = {"cases": len(current), "planned_cases": planned_cases, "completed_turns": len(completed), "not_run_turns": sum(item.get("not_run_turns", 0) for item in current) + sum(item["turns"] for item in report.get("not_run_cases", [])), "machine_checks_passed_cases": sum(item["machine_checks_passed"] for item in current), "elapsed_seconds": round(sum(turn["elapsed_seconds"] for turn in completed), 3), "semantic_review": "pending"}


def report_markdown(report):
    summary = report["summary"]
    lines = ["# Brain reset conversation review", "", f"Run: {report['started_at']} · Endpoint: {report['base_url']}", "", f"{summary['machine_checks_passed_cases']}/{summary['cases']} cases passed machine checks across {summary['completed_turns']} completed turns. {summary['not_run_turns']} turns were not run. Total request time: {summary['elapsed_seconds']:.3f}s.", "", "**Semantic review is pending. Contract checks and citation counts do not establish that answers are correct, complete, or supported. Review each answer against its retrieved evidence and the prose expectations below.**", "", "| Case | Machine checks | Turns | Models | Seconds |", "| --- | --- | ---: | --- | ---: |"]
    for case in report["results"]:
        models = sorted({str(turn.get("response", {}).get("model", "unavailable")) for turn in case["turns"] if isinstance(turn.get("response", {}), dict)})
        elapsed = sum(turn["elapsed_seconds"] for turn in case["turns"])
        lines.append(f"| {case['id']} | {'PASS' if case['machine_checks_passed'] else 'FAIL'} | {len(case['turns'])} | {', '.join(models)} | {elapsed:.3f} |")
    if report.get("stopped_reason"):
        lines.extend(["", f"Run stopped: {report['stopped_reason']}. Remaining cases were not requested:", "", *[f"- {item['id']}: {item['turns']} turns not run" for item in report.get("not_run_cases", [])]])
    for case in report["results"]:
        lines.extend(["", f"## {case['id']}", "", "Human review: pending", "", *[f"- {expectation}" for expectation in case["expected_behaviors"]]])
        for turn in case["turns"]:
            response = turn.get("response", {})
            lines.extend(["", f"### Turn {turn['turn']}", "", "Student: " + turn["messages"][-1]["content"], ""])
            if isinstance(response, dict):
                lines.extend([str(response.get("answer", turn.get("error", "No answer returned."))), "", f"Status: {response.get('status', 'unavailable')} · Model: {response.get('model', 'unavailable')} · Request: {response.get('requestId', 'unavailable')} · Dataset: {response.get('datasetVersion', 'unavailable')} · Seconds: {turn['elapsed_seconds']}"])
                citations = response.get("citations", [])
                if isinstance(citations, list) and citations:
                    lines.extend(["", "Citations:", ""])
                    for citation in citations:
                        if isinstance(citation, dict):
                            lines.append(f"- [{citation.get('title', 'Untitled')}]({citation.get('url', '')}) — {citation.get('id', '')}; collected {citation.get('collected_at', 'unspecified')}; freshness {citation.get('freshness', 'unspecified')}")
            else:
                lines.append("Invalid response: " + json.dumps(response))
            lines.extend(["", "Expected behavior:", "", *[f"- {expectation}" for expectation in turn["expected_behaviors"]]])
            failed = [check for check in turn["checks"] if not check["passed"]]
            if failed:
                lines.extend(["", "Machine failures:", "", *[f"- {check['name']}: {check['detail']}" for check in failed]])
    return "\n".join(lines) + "\n"


def save_report(output, report):
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    output.with_suffix(".md").write_text(report_markdown(report), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Brain origin; /v1/chat is appended")
    parser.add_argument("--output", type=Path, default=Path("brain-reset/results/latest.json"), help="JSON report path; also writes a sibling .md review report")
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--case", action="append", dest="case_ids", help="Run a case id; repeat to select several")
    parser.add_argument("--resume", type=Path, help="Preserve results from this report and rerun only machine-failed/unrun cases; explicit --case selections also rerun passed cases")
    parser.add_argument("--interval", type=float, default=0, help="Minimum seconds between request starts, including follow-ups (use 30 for limited API quota)")
    parser.add_argument("--timeout", type=float, default=120, help="Timeout per HTTP request in seconds")
    parser.add_argument("--validate", action="store_true", help="Validate the corpus without making HTTP requests")
    args = parser.parse_args()
    try:
        all_cases = load_cases(args.corpus)
        cases = all_cases
        prior_results = {}
        if args.resume:
            if args.resume.resolve() == args.output.resolve():
                raise ValueError("--resume and --output must differ so the original audit report is preserved")
            prior = json.loads(args.resume.read_text(encoding="utf-8"))
            prior_results = {result["id"]: result for result in prior["results"]}
            if set(prior_results) - {case["id"] for case in all_cases}:
                raise ValueError("Resume report contains cases outside this corpus")
        if args.case_ids:
            unknown = set(args.case_ids) - {case["id"] for case in cases}
            if unknown:
                raise ValueError("Unknown case ids: " + ", ".join(sorted(unknown)))
            cases = [case for case in cases if case["id"] in args.case_ids]
        elif args.resume:
            cases = [case for case in cases if not prior_results.get(case["id"], {}).get("machine_checks_passed", False)]
        if args.timeout <= 0:
            raise ValueError("--timeout must be positive")
        if not 0 <= args.interval <= 60:
            raise ValueError("--interval must be between 0 and 60 seconds")
        if args.output.suffix.lower() != ".json":
            raise ValueError("--output must have a .json extension")
    except (OSError, ValueError) as error:
        parser.error(str(error))
    if args.validate:
        print(f"Valid corpus: {len(cases)} cases, {sum(len(case.get('turns', [None])) for case in cases)} turns")
        return 0
    report = {"corpus": str(args.corpus.resolve()), "started_at": dt.datetime.now(dt.timezone.utc).isoformat(), "base_url": args.base_url, "interval_seconds": args.interval, "human_review": "pending", "results": list(prior_results.values())}
    if args.resume:
        report["resumed_from"] = str(args.resume.resolve())
    call = paced_caller(args.interval)
    planned_cases = len(set(prior_results) | {case["id"] for case in cases})
    for case_index, case in enumerate(cases):
        result = run_case(case, args.base_url, args.timeout, caller=call)
        result["evaluated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        prior_results[case["id"]] = result
        report["results"] = [prior_results[item["id"]] for item in all_cases if item["id"] in prior_results]
        if result.get("stop_reason") == "http_429":
            report["stopped_reason"] = "http_429"
            report["not_run_cases"] = [{"id": pending["id"], "turns": len(pending.get("turns", [None])), "reason": "http_429"} for pending in cases[case_index + 1:]]
        update_summary(report, planned_cases)
        save_report(args.output, report)
        print(f"{'PASS' if result['machine_checks_passed'] else 'FAIL'} {case['id']} ({len(result['turns'])} turns)", flush=True)
        if result.get("stop_reason") == "http_429":
            print("Stopped after HTTP 429; check provider limits before resuming.", flush=True)
            break
    if not cases:
        update_summary(report, planned_cases)
        save_report(args.output, report)
    print(f"Reports: {args.output.resolve()} and {args.output.with_suffix('.md').resolve()}")
    print("Machine checks complete; semantic review remains required.")
    return 0 if all(case["machine_checks_passed"] for case in report["results"]) else 1


if __name__ == "__main__":
    sys.exit(main())
