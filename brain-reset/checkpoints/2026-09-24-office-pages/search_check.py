"""Search-only check of the Brain's document search against one local release (no model calls).

Usage: .venv/bin/python search_check.py <dbname> <out.json>
"""

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from rockygpt_brain.retrieval.data import CampusData
from rockygpt_brain.retrieval.models import SearchQuery

BENCHMARK = Path(
    "/Users/danielrajakumar/code/RockyGPT/rockygpt-evals/brain-reset/checkpoints/"
    "2026-09-24-program-pages/retrieval-benchmark.json"
)

# Office questions: the office folder the answer should come from, within the top 4.
OFFICE_CASES = [
    ("FAFSA priority deadline", "/finaid/"),
    ("financial aid award letter explained", "/finaid/"),
    ("tuition payment plan", "/student-accounts/"),
    ("refund of a credit balance on my student account", "/student-accounts/"),
    ("scholarships students can apply for", "/scholarships/"),
    ("placement test schedule", "/testing/"),
    ("disability accommodations request", "/oss/"),
    ("report sexual misconduct Title IX", "/titleix/"),
    ("student code of conduct hearing process", "/student-conduct/"),
    ("writing tutor appointment", "/crw/"),
    ("study abroad application", "/study-abroad/"),
    ("EOF program eligibility", "/eof-program/"),
    ("honors program requirements", "/honors/"),
    ("join a fraternity or sorority", "/greek/"),
    ("on-campus jobs for students", "/on-campus-employment/"),
    ("new student orientation", "/orientation/"),
    ("library printing", "/library/"),
    ("veterans education benefits", "/military/"),
    ("international student I-20 visa", "/inter"),
    ("substance use recovery support", "/sud/"),
    ("LGBTQ+ services", "/womenscenter/"),
    ("commencement tickets", "/commencement/"),
    ("student government elections", "/sga/"),
    ("campus Wi-Fi connect device residence hall", "/resnet/"),
    ("career fair", "/careercenter/"),
    ("first-generation students support", "/first-gen/"),
    ("peer facilitators", "/peer-facilitators/"),
    ("transfer admission requirements", "/undergraduate/"),
]


def run(dbname: str) -> dict:
    data = CampusData(
        f"host=127.0.0.1 port=55434 dbname={dbname} user=brain_campus_reader",
        datetime.now(UTC),
    )

    def search(query: str, limit: int) -> tuple[list[dict], float]:
        started = time.perf_counter()
        result = data.search(SearchQuery(collection="documents", query=query, limit=limit))
        elapsed = (time.perf_counter() - started) * 1000
        records = result.get("records") or result.get("results") or []
        return [{"title": r.get("title"), "url": r.get("url")} for r in records], elapsed

    offices = []
    for query, folder in OFFICE_CASES:
        top, elapsed = search(query, 4)
        rank = next((i + 1 for i, r in enumerate(top) if folder in (r["url"] or "")), None)
        offices.append({"query": query, "expected_folder": folder, "rank": rank, "top4": top,
                        "ms": round(elapsed, 1)})

    benchmark = []
    for case in json.loads(BENCHMARK.read_text())["queries"]:
        top, elapsed = search(case["query"], case["limit"])
        entry = {"query": case["query"], "limit": case["limit"], "titles": [r["title"] for r in top],
                 "ms": round(elapsed, 1)}
        if case.get("required"):
            url = case["required"]["url"]
            entry["required_url"] = url
            entry["required_url_rank"] = next(
                (i + 1 for i, r in enumerate(top) if (r["url"] or "").rstrip("/") == url.rstrip("/")), None)
        benchmark.append(entry)
    data.close()
    return {"database": dbname, "offices": offices, "benchmark": benchmark}


if __name__ == "__main__":
    result = run(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result, indent=1))
    found = sum(1 for o in result["offices"] if o["rank"])
    print(f"{sys.argv[1]}: office questions answered from the office's pages in the top 4: "
          f"{found}/{len(result['offices'])}")
    required = [b for b in result["benchmark"] if "required_url" in b]
    print("required cases with their page in the top k:",
          sum(1 for b in required if b["required_url_rank"]), "/", len(required))
    ms = sorted(o["ms"] for o in result["offices"]) + sorted(b["ms"] for b in result["benchmark"])
    ms.sort()
    print("median search ms:", ms[len(ms) // 2])
