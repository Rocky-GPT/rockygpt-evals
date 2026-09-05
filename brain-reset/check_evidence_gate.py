#!/usr/bin/env python3
"""Replay fixed bad answers and supported counterparts through the actual Brain review gate.

Run with the Brain virtualenv from its working directory so the same configuration
and editable runtime are used. This is a component regression, not end-to-end acceptance.
"""

import argparse
import datetime as dt
import hashlib
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI, RateLimitError

from rockygpt_brain.contracts import Answer, ChatMessage
from rockygpt_brain.engine import review_answer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=Path(__file__).with_name("evidence-gate-cases.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--interval", type=float, default=10)
    args = parser.parse_args()
    load_dotenv(Path.cwd() / ".env")
    corpus = json.loads(args.corpus.read_text())
    model = os.getenv("OPENAI_CHAT_MODEL") or "gpt-5.4"
    report = {
        "started_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "kind": "component_regression_on_archived_evidence",
        "corpus_sha256": hashlib.sha256(args.corpus.read_bytes()).hexdigest(),
        "model": model,
        "results": [],
    }
    last_start = None
    with OpenAI(max_retries=0) as client:
        for case in corpus["cases"]:
            if last_start is not None:
                time.sleep(max(0, args.interval - (time.monotonic() - last_start)))
            last_start = time.monotonic()
            item = {"id": case["id"], "model_calls": 1, "tool_calls": 0, "passed": False}
            stopped = False
            try:
                review = review_answer(
                    Answer.model_validate(case["candidate"]),
                    messages=[ChatMessage.model_validate(message) for message in case["messages"]],
                    evidence={record["id"]: record for record in case["evidence"]},
                    client=client,
                    model=model,
                    now=dt.datetime.fromisoformat(case["campus_time"]),
                    timeout=30,
                )
                supported = all(part.verdict == "supported" for part in review.parts)
                by_part = {part.part_index: part.verdict == "supported" for part in review.parts}
                item.update({
                    "review": review.model_dump(mode="json"),
                    "supported": supported,
                    "passed": supported == case["expected"]["supported"] and all(
                        by_part[expected["part_index"]] == expected["supported"]
                        for expected in case["expected"]["parts"]
                    ),
                })
            except Exception as error:
                # Keep provider account details and credentials out of reports.
                item["error_type"] = type(error).__name__
                causes = []
                cause = error.__cause__
                while cause is not None:
                    causes.append({"type": type(cause).__name__, "errno": getattr(cause, "errno", None)})
                    cause = cause.__cause__
                item["causes"] = causes
                stopped = isinstance(error, RateLimitError)
            item["elapsed_seconds"] = round(time.monotonic() - last_start, 3)
            report["results"].append(item)
            report["summary"] = {
                "passed": sum(result["passed"] for result in report["results"]),
                "attempted": len(report["results"]),
                "planned": len(corpus["cases"]),
                "model_calls": len(report["results"]),
                "tool_calls": 0,
            }
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
            print(f"{'PASS' if item['passed'] else 'FAIL'} {case['id']} ({item['elapsed_seconds']}s)", flush=True)
            if stopped:
                print("Stopped after provider rate/quota failure.", flush=True)
                break
    return 0 if report["summary"]["passed"] == len(corpus["cases"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
