"""Does the meaning search reach the page section that answers a how-to question, with and
without the three student questions the build writes for every section (Brain #159, 11-04)? Same
graph, same 8-bit index, same pool rules as the Brain's one call (60 by meaning, then the default
24); only the question vectors differ.

    python search_ab.py GRAPH_DIR QUESTIONS.json OUT_DIR

Needs BRAIN_OPENAI_API_KEY (embeddings only: about 300 short texts, well under a cent). Prints a
summary and writes OUT_DIR/ab.json. Never prints a secret."""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import numpy

from rockygpt_brain import one_call
from rockygpt_brain.retrieval.graph_store import POINTER
from rockygpt_brain.retrieval.meaning import MEANING_SUFFIX, VECTORS_SUFFIX, MeaningIndex


def embed(texts, model, dimensions):
    headers = {"content-type": "application/json",
               "authorization": "Bearer " + os.environ["BRAIN_OPENAI_API_KEY"]}
    if os.environ.get("BRAIN_OPENAI_PROJECT"):
        headers["openai-project"] = os.environ["BRAIN_OPENAI_PROJECT"]
    body = json.dumps({"model": model, "input": texts, "dimensions": dimensions}).encode()
    for attempt in range(5):
        try:
            request = urllib.request.Request("https://api.openai.com/v1/embeddings", data=body,
                                             headers=headers)
            with urllib.request.urlopen(request, timeout=120) as response:
                reply = json.load(response)
            return [row["embedding"] for row in sorted(reply["data"], key=lambda r: r["index"])]
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 4:
                raise RuntimeError(f"embeddings failed: {type(error).__name__}") from None
            time.sleep(3 * (attempt + 1))


def without_questions(release, out_dir):
    """The same index less its question vectors (offset -1), written beside OUT_DIR and loaded
    the way the Brain loads one."""
    meta = json.loads(release.with_suffix(MEANING_SUFFIX).read_text())
    size = int(meta["dimensions"])
    floats = numpy.fromfile(release.with_suffix(VECTORS_SUFFIX), dtype=numpy.float32).reshape(-1, size)
    owned = len(meta["owner"])
    keep = [k for k, offset in enumerate(meta["offsets"]) if offset != -1]
    rows = numpy.concatenate([floats[keep], floats[owned:]])
    stripped = dict(meta, owner=[meta["owner"][k] for k in keep],
                    offsets=[meta["offsets"][k] for k in keep])
    fake = out_dir / "release-noquestions.lbug"
    fake.with_suffix(MEANING_SUFFIX).write_text(json.dumps(stripped))
    rows.astype(numpy.float32).tofile(fake.with_suffix(VECTORS_SUFFIX))
    return MeaningIndex.load(fake), owned - len(keep)


def rank(order, labels_of, expect):
    for k, key in enumerate(order, 1):
        where, heading = labels_of.get(key, ("", ""))
        for want_where, want_heading in expect:
            if where == want_where and heading.lower().startswith(want_heading.lower()[:40]):
                return k
    return None


def main():
    graph, questions_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    out_dir.mkdir(parents=True, exist_ok=True)
    pointer = json.loads((graph / POINTER).read_text())
    release = graph / pointer["file"]
    full = MeaningIndex.load(release)
    plain, questions = without_questions(release, out_dir)
    meta = json.loads(release.with_suffix(MEANING_SUFFIX).read_text())
    asked_units = len({meta["owner"][k] for k, o in enumerate(meta["offsets"]) if o == -1})
    print(f"graph {pointer['dataset_version']}: {len(meta['units'])} sections, "
          f"{len(meta['owner'])} section vectors, {questions} of them written questions, "
          f"{asked_units} sections with questions")
    labels_of = {(u.record_id, u.index): tuple(label)
                 for u, label in zip(full.units, meta.get("labels") or [], strict=False)}
    items = json.loads(questions_path.read_text())
    texts = sorted({part for item in items for part in one_call.parts_of(item["question"])})
    vectors = {}
    for start in range(0, len(texts), 100):
        chunk = texts[start:start + 100]
        vectors.update(zip(chunk, embed(chunk, meta["model"], int(meta["dimensions"])), strict=True))
    rows = []
    for item in items:
        if not item.get("expect"):
            continue
        parts = [vectors[p] for p in one_call.parts_of(item["question"])]
        row = {"id": item["id"], "group": item["group"], "question": item["question"]}
        for name, index in (("with", full), ("without", plain)):
            _, pool = one_call.chosen_units(index, parts, one_call.POOL,
                                            per_part=one_call.POOL_PER_PART,
                                            per_page=one_call.POOL_PER_PAGE)
            _, default = one_call.chosen_units(index, parts)
            row[name] = {"pool": rank(pool, labels_of, item["expect"]),
                         "read24": rank(default, labels_of, item["expect"]),
                         "top5": [" | ".join(labels_of.get(k, ("?", "?"))) for k in pool[:5]]}
        rows.append(row)
    (out_dir / "ab.json").write_text(json.dumps(rows, indent=1))
    for group in sorted({r["group"] for r in rows}):
        mine = [r for r in rows if r["group"] == group]
        line = [f"{group}: {len(mine)} questions"]
        for name in ("with", "without"):
            pool = sum(r[name]["pool"] is not None for r in mine)
            top12 = sum((r[name]["pool"] or 99) <= 12 for r in mine)
            read24 = sum(r[name]["read24"] is not None for r in mine)
            line.append(f"{name} questions: in pool {pool}, pool top 12 {top12}, default 24 {read24}")
        print("; ".join(line))
    for r in rows:
        a, b = r["with"], r["without"]
        if (a["pool"] is None) != (b["pool"] is None) or ((a["pool"] or 99) <= 12) != ((b["pool"] or 99) <= 12):
            better = (a["pool"] or 99) < (b["pool"] or 99)
            print(f"{'GAIN' if better else 'LOSS'} {r['id']}: pool rank {b['pool']} -> {a['pool']} | {r['question']}")
            print(f"    with top5: {a['top5']}")
            print(f"    without top5: {b['top5']}")


if __name__ == "__main__":
    main()
