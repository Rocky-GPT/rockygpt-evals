"""Reconcile passive SDK observations with each public acceptance response."""
from collections import Counter
import json
import math
from pathlib import Path
import statistics

P = Path(__file__).parent
suite = json.loads((P/"full-suite.json").read_text())
observations = [json.loads(line) for line in (P/"observations.jsonl").read_text().splitlines()]
by_id = {row["requestId"]: row for row in observations}
rows = []
for case in suite["results"]:
    for turn in case["turns"]:
        response = turn.get("response") or json.loads(turn["error"])
        observed = by_id[response["requestId"]]
        metrics = response.get("metrics", {})
        models = observed["model_calls"]
        reviews = len(observed["reviews"])
        executions = metrics.get("toolExecutions", sum(bool(item["arguments"]) for item in observed["trace"]))
        if metrics:
            assert models == metrics["modelCalls"]
            assert reviews == metrics["reviewCalls"]
            assert len(observed["trace"]) == metrics["toolRequests"]
            assert models - reviews == metrics["draftCalls"]
        rows.append({"case_id": case["id"], "turn": turn["turn"], "request_id": response["requestId"], "http_status": turn["http_status"], "model_calls": models, "completed_model_calls": len(observed["model_responses"]), "draft_calls": models-reviews, "review_calls": reviews, "tool_requests": len(observed["trace"]), "tool_executions": executions, "http_seconds": turn["elapsed_seconds"], "validation_failures": metrics.get("validationFailures", []), "model": response.get("model"), "dataset_version": response.get("datasetVersion")})
latencies = [row["http_seconds"] for row in rows]
summary = {"conversations_attempted": len(suite["results"]), "turns_attempted": len(rows), "turns_not_run": suite["summary"]["not_run_turns"], "machine_passing_conversations": suite["summary"]["machine_checks_passed_cases"], "http_statuses": dict(Counter(str(row["http_status"]) for row in rows)), "model_calls": sum(row["model_calls"] for row in rows), "completed_model_calls": sum(row["completed_model_calls"] for row in rows), "draft_calls": sum(row["draft_calls"] for row in rows), "review_calls": sum(row["review_calls"] for row in rows), "tool_requests": sum(row["tool_requests"] for row in rows), "tool_executions": sum(row["tool_executions"] for row in rows), "tools_requested_by_name": dict(Counter(item["tool"] for observed in observations for item in observed["trace"])), "connection_errors": sum(len(item.get("connection_errors", [])) for item in observations), "http_latency_seconds": {"median": statistics.median(latencies), "p95_nearest_rank": sorted(latencies)[math.ceil(.95*len(latencies))-1], "maximum": max(latencies), "total": round(sum(latencies),3)}, "observed_models": sorted({model["model"] for item in observations for model in item["model_responses"]}), "reasoning_tokens": sum(model["usage"]["output_tokens_details"].get("reasoning_tokens",0) for item in observations for model in item["model_responses"] if model.get("usage")), "validation_failure_codes": dict(Counter(code for row in rows for code in row["validation_failures"])), "semantic_review": "recorded separately; these metrics do not assert semantic correctness"}
(P/"metrics.json").write_text(json.dumps({"summary": summary, "turns": rows}, indent=2)+"\n")
print(json.dumps(summary,indent=2))
