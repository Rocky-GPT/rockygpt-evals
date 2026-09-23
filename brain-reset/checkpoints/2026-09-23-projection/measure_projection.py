"""Measure projection size and latency against the running dev Brain.

Usage: python3 measure_projection.py OUTPUT_JSON [VERSION]
VERSION is the projection path segment (v1 or v2).
"""
import json, sys, time, urllib.parse, urllib.request

BASE = "http://127.0.0.1:8000/v1/dev/graph"
CASES = [("Birch Tree Inn", "venue", "menu_offerings"), ("Birch Tree Inn", "venue", None),
         ("Registrar", "office", None), ("Scott Frees", "person", None),
         ("Computer Science BS", "program", None), ("School of Science, Nursing, and Health", "school", None)]

def get(path, params):
    url = f"{BASE}/{path}?{urllib.parse.urlencode(params)}"
    start = time.perf_counter()
    with urllib.request.urlopen(url, timeout=60) as response:
        body = response.read()
    return body, time.perf_counter() - start

version = sys.argv[2] if len(sys.argv) > 2 else "v1"
index_body, index_secs = get("knowledge", {})
index = json.loads(index_body)
nodes = {(n["name"], n["kind"]): n["id"] for n in index["nodes"]}
out = {"knowledge": {"kb": len(index_body) / 1024, "secs": index_secs}}
for name, kind, group in CASES:
    params = {"entity_id": nodes[(name, kind)], "dataset_version": index["dataset_version"],
              "identity_hash": index["identity_hash"], "limit": 100}
    if group:
        params["record_group"] = group
    runs = []
    for _ in range(3):
        body, secs = get(f"projection/{version}", params)
        runs.append(secs)
    payload = json.loads(body)
    records = sum(len(g["records"]) for g in payload["record_groups"])
    assertions = sum(len(p["assertions"]) for p in payload["properties"]) + sum(
        len(p["assertions"]) for g in payload["record_groups"] for r in g["records"]
        for p in [*r["context"], *r["properties"]])
    out[f"{name}:{group}"] = {"kb": len(body) / 1024, "secs": min(runs), "records": records,
                              "assertions": assertions,
                              "not_migrated": sorted(c["collection"] for c in payload["coverage"]
                                                     if c["reason"] == "collection_not_migrated")}
json.dump(out, open(sys.argv[1], "w"), indent=1)
for key, value in out.items():
    print(f"{key:48} {value['kb']:8.1f} KB {value['secs']:6.3f} s", {k: v for k, v in value.items() if k not in ("kb", "secs")})
