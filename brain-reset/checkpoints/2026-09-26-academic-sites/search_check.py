"""Search-only check of the Brain's document search against one local release (no model calls).

Asks school, program and center questions, reruns the office questions from the 2026-09-24
office-pages checkpoint, and the program-pages retrieval benchmark.

Usage (from a Brain checkout or build, with its src on PYTHONPATH):
  .venv/bin/python search_check.py <dbname> <out.json>
"""

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from rockygpt_brain.retrieval.data import CampusData
from rockygpt_brain.retrieval.models import SearchQuery

CHECKPOINTS = Path("/Users/danielrajakumar/code/RockyGPT/rockygpt-evals/brain-reset/checkpoints")
BENCHMARK = CHECKPOINTS / "2026-09-24-program-pages" / "retrieval-benchmark.json"
sys.path.insert(0, str(CHECKPOINTS / "2026-09-24-office-pages"))
from search_check import OFFICE_CASES  # noqa: E402

# School, program and center questions: the folder the answer should come from, within the top 4.
ACADEMIC_CASES = [
    ("who is the dean of the School of Arts, Humanities, and Education", "/ahe/"),
    ("Jane Addams Papers Project", "/ahe/"),
    ("Salameno Center for British Studies", "/ahe/"),
    ("Anisfield School of Business AACSB accreditation", "/asb/"),
    ("School of Science, Nursing, and Health research honors", "/snh/"),
    ("psychology student symposium abstract submission", "/sssw/"),
    ("nursing program admission requirements", "/nursing/"),
    ("MBA program admission requirements", "/mba/"),
    ("Master of Science in Nursing tracks", "/msn/"),
    ("Doctor of Nursing Practice program", "/dnp/"),
    ("Master of Science in Accounting CPA 150 credit hours", "/msac/"),
    ("Master of Arts in Special Education", "/mase/"),
    ("Master of Public Policy program", "/mpp/"),
    ("teacher certification program requirements", "/te/"),
    ("social work field practicum", "/social-work/"),
    ("Center for Holocaust and Genocide Studies internships for students", "/holocaust/"),
    ("Holocaust and genocide studies minor courses", "/holocaust/"),
    ("data science master's program", "/dmc/"),
    ("investigative genetic genealogy certificate", "/igg/"),
    ("Sabrin Center for Free Enterprise lecture series", "/sabrincenter/"),
    ("Sharp Sustainability Education Center", "/ssec/"),
    ("photography lab open hours", "/photolab/"),
    ("digital humanities projects", "/dh/"),
    ("Studies in Arts and Humanities general education course", "/siah/"),
    ("certificate programs and workshops", "/certificates/"),
    ("Master of Arts in Liberal Studies accepting applications", "/mals/"),
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

    def folder_cases(cases: list[tuple[str, str]]) -> list[dict]:
        rows = []
        for query, folder in cases:
            top, elapsed = search(query, 4)
            rank = next((i + 1 for i, r in enumerate(top) if folder in (r["url"] or "")), None)
            rows.append({"query": query, "expected_folder": folder, "rank": rank, "top4": top,
                         "ms": round(elapsed, 1)})
        return rows

    academic = folder_cases(ACADEMIC_CASES)
    offices = folder_cases(OFFICE_CASES)
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
    return {"database": dbname, "academic": academic, "offices": offices, "benchmark": benchmark}


if __name__ == "__main__":
    result = run(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result, indent=1))
    for name in ("academic", "offices"):
        found = sum(1 for row in result[name] if row["rank"])
        print(f"{sys.argv[1]}: {name} questions answered from the expected site in the top 4: "
              f"{found}/{len(result[name])}")
    required = [b for b in result["benchmark"] if "required_url" in b]
    print("required benchmark cases with their page in the top k:",
          sum(1 for b in required if b["required_url_rank"]), "/", len(required))
    ms = sorted([row["ms"] for name in ("academic", "offices") for row in result[name]]
                + [b["ms"] for b in result["benchmark"]])
    print("median search ms:", ms[len(ms) // 2])
