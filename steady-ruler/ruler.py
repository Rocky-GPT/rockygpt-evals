#!/usr/bin/env python3
"""The steady ruler: one fixed bank of keyed questions, used to compare two Brain versions on the
same questions. Standard library only. See README.md for the rules.

  python3 steady-ruler/ruler.py validate
      Checks the open half (shape, ids, hash) and that the sealed file matches its hash.
  python3 steady-ruler/ruler.py rekey-list open
      Lists open questions whose key must be rebuilt on the day of a run (freshness run_day), and
      the seasonal ones to leave out of the core score outside their season.
  python3 steady-ruler/ruler.py compare A.json B.json [--sealed] [--questions FILE]
      A.json and B.json are verdict lists [{"id","verdict","severity"}] for two versions on the
      same questions. Prints good counts per area and kind, the paired table, and how likely the
      difference is to be luck (exact two-sided sign test on the questions where they differ).
      --sealed prints totals only, never a question id (the rule for the sealed half).
"""

import hashlib
import json
import math
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
OPEN = HERE / "open" / "open-half.json"
OPEN_SHA = HERE / "open" / "open-half.sha256"
SEALED = HERE / "sealed" / "sealed-half.json.enc"
SEALED_SHA = HERE / "sealed" / "sealed-half.enc.sha256"

AREAS = {"people", "events_clubs", "academics", "howto", "general"}
KINDS = {"common", "rare"}
FRESH = {"stable", "term", "run_day", "seasonal"}
STATUS = {"found", "partial", "not_on_site", "decline", "general"}
GOOD = {"correct", "declined_ok", "asked_ok"}
VERDICTS = GOOD | {"incomplete", "wrong", "declined_wrong", "asked_wrong"}
FIELDS = ["id", "question", "clean_wording", "area", "topic", "kind", "freshness", "checked_on",
          "expected", "must_not", "source", "status", "note"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_rows(rows: list[dict], where: str) -> list[str]:
    errs, seen = [], set()
    for r in rows:
        rid = r.get("id", "?")
        for f in FIELDS:
            if f not in r:
                errs.append(f"{where} {rid}: missing {f}")
        if rid in seen:
            errs.append(f"{where} {rid}: duplicate id")
        seen.add(rid)
        for f, ok in (("area", AREAS), ("kind", KINDS), ("freshness", FRESH), ("status", STATUS)):
            if r.get(f) not in ok:
                errs.append(f"{where} {rid}: bad {f} {r.get(f)!r}")
        if not str(r.get("question", "")).strip() or not str(r.get("expected", "")).strip():
            errs.append(f"{where} {rid}: empty question or expected")
    return errs


def validate() -> int:
    errs = []
    rows = json.loads(OPEN.read_text())
    errs += check_rows(rows, "open")
    want = OPEN_SHA.read_text().split()[0]
    if sha(OPEN) != want:
        errs.append("open-half.json does not match open-half.sha256 (the open half is frozen; "
                    "a change needs a new version and a README line)")
    if SEALED.exists():
        if sha(SEALED) != SEALED_SHA.read_text().split()[0]:
            errs.append("sealed-half.json.enc does not match its hash")
    else:
        errs.append("sealed-half.json.enc is missing")
    for e in errs:
        print("ERROR", e)
    c = Counter((r["area"], r["kind"]) for r in rows)
    print(f"open half: {len(rows)} questions; sealed file present: {SEALED.exists()}")
    print("open by area/kind:", dict(sorted(c.items())))
    return 1 if errs else 0


def rekey_list(which: str) -> int:
    if which != "open":
        print("Only the open half is listed by id. For the sealed half, the run thread unseals it "
              "and rebuilds the run_day keys itself (see README).")
        return 1
    rows = json.loads(OPEN.read_text())
    for r in rows:
        if r["freshness"] in ("run_day", "seasonal"):
            extra = f" (season: {r['season']})" if r.get("season") else ""
            print(f"{r['id']}\t{r['freshness']}{extra}\t{r['question'][:90]}")
    return 0


def sign_test_p(only_a: int, only_b: int) -> float:
    n, k = only_a + only_b, min(only_a, only_b)
    if n == 0:
        return 1.0
    p = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * p)


def compare(a_path: str, b_path: str, sealed: bool, qpath: str | None) -> int:
    a = {v["id"]: v for v in json.loads(Path(a_path).read_text())}
    b = {v["id"]: v for v in json.loads(Path(b_path).read_text())}
    for name, d in (("A", a), ("B", b)):
        bad = [i for i, v in d.items() if v.get("verdict") not in VERDICTS]
        if bad:
            print(f"{name}: {len(bad)} rows with an unknown verdict")
            return 1
    ids = sorted(set(a) & set(b))
    if len(ids) != len(a) or len(ids) != len(b):
        print(f"Note: only the {len(ids)} questions both versions answered are compared.")
    meta = {}
    if qpath:
        meta = {r["id"]: r for r in json.loads(Path(qpath).read_text())}
    elif not sealed:
        meta = {r["id"]: r for r in json.loads(OPEN.read_text())}
    ga = {i: a[i]["verdict"] in GOOD for i in ids}
    gb = {i: b[i]["verdict"] in GOOD for i in ids}
    n = len(ids)
    print(f"Questions: {n}")
    print(f"A good: {sum(ga.values())} ({100*sum(ga.values())/n:.0f}%)   "
          f"B good: {sum(gb.values())} ({100*sum(gb.values())/n:.0f}%)")
    if meta:
        for key in ("area", "kind"):
            groups = sorted({meta[i][key] for i in ids if i in meta})
            for g in groups:
                gi = [i for i in ids if meta.get(i, {}).get(key) == g]
                print(f"  {key}={g:13} n={len(gi):3}  A {sum(ga[i] for i in gi):3}  "
                      f"B {sum(gb[i] for i in gi):3}")
    both = sum(ga[i] and gb[i] for i in ids)
    only_a = [i for i in ids if ga[i] and not gb[i]]
    only_b = [i for i in ids if gb[i] and not ga[i]]
    neither = n - both - len(only_a) - len(only_b)
    print(f"Both good {both}, only A {len(only_a)}, only B {len(only_b)}, neither {neither}")
    p = sign_test_p(len(only_a), len(only_b))
    print(f"Chance a gap this size is luck (sign test): {p:.2f}  "
          f"({'real difference' if p < 0.05 else 'could be luck'})")
    for name, d in (("A", a), ("B", b)):
        serious = sum(1 for i in ids if d[i].get("severity") == "serious")
        wrong = sum(1 for i in ids if d[i]["verdict"] == "wrong")
        print(f"{name}: wrong {wrong}, serious {serious}  (safety bar: at most 2 misleading per 100)")
    if not sealed:
        print("Only A good:", " ".join(only_a) or "-")
        print("Only B good:", " ".join(only_b) or "-")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd = argv[1]
    if cmd == "validate":
        return validate()
    if cmd == "rekey-list" and len(argv) == 3:
        return rekey_list(argv[2])
    if cmd == "compare" and len(argv) >= 4:
        q = None
        if "--questions" in argv:
            q = argv[argv.index("--questions") + 1]
        return compare(argv[2], argv[3], "--sealed" in argv, q)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
