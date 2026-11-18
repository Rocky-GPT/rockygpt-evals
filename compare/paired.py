"""Old vs new on the same questions: how many each got right, and whether the difference is real.

Reads the JSON promptfoo writes (`promptfoo eval -o results.json`) and prints, per area and in all:
both right, only old, only new, both wrong; then the exact two-sided sign test on the questions
where they differ (McNemar's exact test). With --repeat N each question was asked N times per
side: a side "gets" a question when most of its tries pass (a tie counts as a miss).

Plain words for the last line: p under 0.05 means "a difference this big would happen by luck
less than 1 time in 20"; above that, the change has not been shown to help or hurt.

Usage: python3 paired.py results.json [--old old] [--new new] [--json summary.json]
Standard library only.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


def sign_test(only_old: int, only_new: int) -> float:
    """Exact two-sided p of a split this uneven, when each differing question is a fair coin."""
    n = only_old + only_new
    if n == 0:
        return 1.0
    k = min(only_old, only_new)
    tail = sum(math.comb(n, i) for i in range(k + 1)) / 2**n
    return min(1.0, 2 * tail)


def rows(results: dict[str, Any]) -> list[dict[str, Any]]:
    inner = results.get("results", results)
    found = inner.get("results") if isinstance(inner, dict) else inner
    if not isinstance(found, list):
        raise SystemExit("No results list in this file; was it written by `promptfoo eval -o`?")
    return found


def tally(results: dict[str, Any], old: str, new: str) -> dict[str, Any]:
    tries: dict[tuple[str, str], list[bool]] = defaultdict(list)
    area: dict[str, str] = {}
    for row in rows(results):
        side = (row.get("provider") or {}).get("label") or (row.get("provider") or {}).get("id")
        test = row.get("testCase") or {}
        qid = (test.get("vars") or row.get("vars") or {}).get("id") or test.get("description")
        if side not in (old, new) or not qid:
            continue
        area[qid] = (test.get("vars") or {}).get("area") or "all"
        tries[(qid, side)].append(bool(row.get("success")))

    def gets(qid: str, side: str) -> bool | None:
        got = tries.get((qid, side))
        return None if not got else sum(got) * 2 > len(got)

    groups: dict[str, dict[str, int]] = defaultdict(lambda: {"both": 0, "only_old": 0,
                                                              "only_new": 0, "neither": 0})
    missing = []
    for qid in sorted(area):
        o, n = gets(qid, old), gets(qid, new)
        if o is None or n is None:
            missing.append(qid)
            continue
        cell = "both" if o and n else "only_old" if o else "only_new" if n else "neither"
        for name in (area[qid], "ALL"):
            groups[name][cell] += 1
    summary: dict[str, Any] = {"old": old, "new": new, "missing": missing, "areas": {}}
    for name, g in sorted(groups.items(), key=lambda item: (item[0] == "ALL", item[0])):
        total = sum(g.values())
        summary["areas"][name] = {**g, "questions": total,
                                  "old_right": g["both"] + g["only_old"],
                                  "new_right": g["both"] + g["only_new"],
                                  "p": sign_test(g["only_old"], g["only_new"])}
    return summary


def report(summary: dict[str, Any]) -> str:
    lines = [f"{'area':<14}{'questions':>10}{'old':>6}{'new':>6}{'only old':>10}{'only new':>10}{'p':>8}"]
    for name, a in summary["areas"].items():
        lines.append(f"{name:<14}{a['questions']:>10}{a['old_right']:>6}{a['new_right']:>6}"
                     f"{a['only_old']:>10}{a['only_new']:>10}{a['p']:>8.3f}")
    every = summary["areas"].get("ALL")
    if every:
        change = every["new_right"] - every["old_right"]
        verdict = ("a real difference (p < 0.05)" if every["p"] < 0.05
                   else "not shown to differ: could be luck (p >= 0.05)")
        lines.append(f"\nNew vs old: {change:+d} of {every['questions']} questions, {verdict}.")
    if summary["missing"]:
        lines.append(f"Not answered by both sides, left out: {', '.join(summary['missing'])}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("results", type=Path)
    parser.add_argument("--old", default="old")
    parser.add_argument("--new", default="new")
    parser.add_argument("--json", type=Path, help="also write the summary here")
    args = parser.parse_args(argv)
    summary = tally(json.loads(args.results.read_text(encoding="utf-8")), args.old, args.new)
    print(report(summary))
    if args.json:
        args.json.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
