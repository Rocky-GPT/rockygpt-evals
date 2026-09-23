#!/usr/bin/env python3
"""Check each multi-hop case's declared graph path against a published graph, without model calls.

A case is ready when every hop reaches its expected entities, blocked when a kind,
predicate, contextual record or alias it needs is not published yet, and a mismatch
when published data disagrees with the fixture. Expectations are checked even for
blocked cases, so a typo or a changed name surfaces before its phase ships.
Mismatches fail the check, and so does any case short of ready in a shipped phase.

Contextual records, such as requirement groups, are walked through the export's
record edges. A record label is only unique within a hop's result (many programs
have "Required Courses"), so a record expectation is matched there, optionally
narrowed to the program that lists it, and its published choice is checked.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_CORPUS = Path(__file__).with_name("graph-conversations.json")
PHASE_STATUSES = {"shipped", "planned"}
HOP_KEYS = {"predicate", "direction", "expect", "expect_includes", "expect_count"}
PATH_KEYS = {"phase", "start", "hops", "leaf", "note"}
# An external ID an entity expectation may name, and the linked collection whose keys hold it.
EXTERNAL_IDS = {"concept3d_id": "buildings"}


class Blocked(Exception):
    """Something the path needs is not published yet."""


class Mismatch(Exception):
    """Published data disagrees with the fixture."""


def normalize(value):
    # The Brain's exact name/alias semantics: collapse whitespace, ignore case.
    return " ".join(value.split()).casefold()


def text(value):
    return isinstance(value, str) and bool(value.strip())


def validate_spec(spec, where):
    if not isinstance(spec, dict):
        raise ValueError(f"{where}: expectation must be an object")
    if "record" in spec:
        if not text(spec["record"]) or not text(spec.get("label")):
            raise ValueError(f"{where}: a contextual record needs record and label text")
        if "program" in spec and not text(spec["program"]):
            raise ValueError(f"{where}: a record's program must be text")
        if "select_at_least" in spec and (type(spec["select_at_least"]) is not int or spec["select_at_least"] < 1):
            raise ValueError(f"{where}: select_at_least must be a positive integer")
    elif not text(spec.get("kind")) or sum(text(spec.get(key)) for key in ("name", "code")) != 1:
        raise ValueError(f"{where}: an entity needs a kind and exactly one of name or code")
    elif any(key in spec and not text(spec[key]) for key in (*EXTERNAL_IDS, "status")):
        raise ValueError(f"{where}: an external ID or status must be text")


def load_corpus(path):
    corpus = json.loads(Path(path).read_text(encoding="utf-8"))
    phases = corpus.get("phases")
    if not isinstance(phases, list) or not phases:
        raise ValueError("Corpus needs a nonempty phases array")
    statuses = {}
    for phase in phases:
        if not text(phase.get("id")) or phase["id"] in statuses or phase.get("status") not in PHASE_STATUSES:
            raise ValueError("Each phase needs a unique id and a shipped or planned status")
        statuses[phase["id"]] = phase["status"]
    cases = corpus.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("Corpus needs a nonempty cases array")
    for case in cases:
        where = case.get("id", "<missing id>")
        path = case.get("graph")
        if not isinstance(path, dict) or set(path) - PATH_KEYS:
            raise ValueError(f"{where}: graph must contain only {sorted(PATH_KEYS)}")
        if path.get("phase") not in statuses:
            raise ValueError(f"{where}: unknown phase {path.get('phase')!r}")
        start = path.get("start")
        if isinstance(start, dict) and "resolve" in start:
            if not text(start["resolve"]) or not isinstance(start.get("expect"), list) or not start["expect"]:
                raise ValueError(f"{where}: alias resolution needs text and expected entities")
            for spec in start["expect"]:
                validate_spec(spec, where)
                if "record" in spec:
                    raise ValueError(f"{where}: aliases resolve to entities, not records")
        else:
            validate_spec(start, where)
        if not isinstance(path.get("hops"), list):
            raise ValueError(f"{where}: hops must be an array")
        for hop in path["hops"]:
            if not isinstance(hop, dict) or set(hop) - HOP_KEYS or not text(hop.get("predicate")) or hop.get("direction") not in {"out", "in"}:
                raise ValueError(f"{where}: each hop needs a predicate and an out or in direction")
            for key in ("expect", "expect_includes"):
                if key in hop:
                    if not isinstance(hop[key], list):
                        raise ValueError(f"{where}: {key} must be an array")
                    for spec in hop[key]:
                        validate_spec(spec, where)
            if "expect_count" in hop and (type(hop["expect_count"]) is not int or hop["expect_count"] < 0):
                raise ValueError(f"{where}: expect_count must be a nonnegative integer")
    return corpus


class Graph:
    def __init__(self, payload):
        if not isinstance(payload.get("nodes"), list) or not isinstance(payload.get("edges"), list):
            raise ValueError("Graph JSON needs nodes and edges arrays (a graph export or knowledge index)")
        self.nodes = {node["id"]: node for node in payload["nodes"]}
        # A knowledge index or an export before schema 2 has no contextual records.
        self.records = {record["id"]: record for record in payload.get("contextual_records") or []}
        self.edges = payload["edges"] + [{key: edge[key] for key in ("source", "target", "type")}
                                         for edge in payload.get("record_edges") or []]
        self.kinds = {node["kind"] for node in self.nodes.values()}
        self.record_types = {record.get("record_type") for record in self.records.values()}
        self.predicates = {edge["type"] for edge in self.edges}
        snapshot = payload.get("snapshot") or {}
        self.dataset_version = snapshot.get("dataset_version") or payload.get("dataset_version")

    def names(self, ids):
        labels = sorted(self.nodes[i]["name"] if i in self.nodes else self.records[i]["label"] for i in ids)
        return ", ".join(labels[:6]) + (f" and {len(labels) - 6} more" if len(labels) > 6 else "") if labels else "nothing"

    def find(self, spec, within=None):
        """One entity by kind and exact name or code, or one record within a hop's result."""
        if "record" in spec:
            return self.find_record(spec, within)
        if spec["kind"] not in self.kinds:
            raise Blocked(f"no {spec['kind']} entities are published")
        if "code" in spec:
            found = [i for i, node in self.nodes.items() if node["kind"] == spec["kind"] and spec["code"] in node.get("aliases", [])]
        else:
            found = [i for i, node in self.nodes.items() if node["kind"] == spec["kind"] and normalize(node["name"]) == normalize(spec["name"])]
        if len(found) != 1:
            raise Mismatch(f"expected one {spec['kind']} {spec.get('name') or spec.get('code')!r}, found {len(found)}")
        # An export carries each node's source bindings; a knowledge index does not.
        bindings = self.nodes[found[0]].get("source_bindings")
        for key, collection in EXTERNAL_IDS.items():
            if key in spec and bindings is not None and not any(
                    binding.get("collection") == collection and spec[key] in binding.get("source_record_keys", [])
                    for binding in bindings):
                raise Mismatch(f"{spec['kind']} {spec.get('name') or spec.get('code')!r} is not {key} {spec[key]}")
        # A published status, such as retired, is part of the node.
        if "status" in spec and self.nodes[found[0]].get("status") != spec["status"]:
            status = self.nodes[found[0]].get("status") or "no status"
            raise Mismatch(f"{spec['kind']} {spec.get('name') or spec.get('code')!r} has {status}, expected {spec['status']}")
        return found[0]

    def find_record(self, spec, within):
        if spec["record"] not in self.record_types:
            raise Blocked(f"no {spec['record']} records are published")
        described = f"{spec['record']} {spec['label']!r}"
        found = {i for i, record in self.records.items() if record.get("record_type") == spec["record"]
                 and normalize(record.get("label") or "") == normalize(spec["label"])}
        if "program" in spec:
            program = self.find({"kind": "program", "name": spec["program"]})
            found = {edge["target"] for edge in self.edges if edge["type"] == "requirement_group"
                     and edge["source"] == program and edge["target"] in found}
            described += f" of {spec['program']}"
        if not found:
            raise Mismatch(f"no {described} is published")
        if within is None:
            # Without a hop result, only a start must be unique; an expectation just has to exist.
            return None
        if len(found & within) != 1:
            raise Mismatch(f"expected one {described} where the path reaches it, found {len(found & within)}")
        (record_id,) = found & within
        if "select_at_least" in spec:
            record = self.records[record_id]
            choose = (record.get("rule") or {}).get("choose") or (record.get("course_list") or {}).get("choose")
            if choose != {"at_least": spec["select_at_least"]}:
                raise Mismatch(f"{described} publishes choose {choose}, expected at least {spec['select_at_least']}")
        return record_id

    def resolve(self, value):
        key = normalize(value)
        return {i for i, node in self.nodes.items() if key in {normalize(name) for name in [node["name"], *node.get("aliases", [])]}}

    def step(self, current, hop):
        if hop["predicate"] not in self.predicates:
            raise Blocked(f"predicate {hop['predicate']} is not published")
        outgoing = hop["direction"] == "out"
        return {edge["target"] if outgoing else edge["source"] for edge in self.edges
                if edge["type"] == hop["predicate"] and (edge["source"] if outgoing else edge["target"]) in current}


def check_case(case, graph):
    """Walk the declared path; return (status, details)."""
    path = case["graph"]
    mismatches, blocks = [], []

    def ids(specs, within=None):
        found, complete = set(), True
        for spec in specs:
            try:
                value = graph.find(spec, within)
                if value is not None:
                    found.add(value)
            except Blocked as reason:
                blocks.append(str(reason))
                complete = False
            except Mismatch as reason:
                mismatches.append(str(reason))
                complete = False
        return found if complete else None

    start = path["start"]
    if "resolve" in start:
        # Keep walking from the intended entities so the rest of the path is still checked.
        current = ids(start["expect"])
        if current is not None:
            hits = graph.resolve(start["resolve"])
            if not hits:
                blocks.append(f"alias {start['resolve']!r} is not published")
            elif hits != current:
                mismatches.append(f"{start['resolve']!r} resolves to {graph.names(hits)}, expected {graph.names(current)}")
    elif "record" in start:
        # A starting record must be unique among all published records.
        current = ids([start], set(graph.records))
    else:
        current = ids([start])
    for number, hop in enumerate(path["hops"], 1):
        before = len(blocks)
        result = None
        if current is not None:
            try:
                result = graph.step(current, hop)
            except Blocked as reason:
                blocks.append(f"hop {number}: {reason}")
        exact = ids(hop["expect"], result) if "expect" in hop else None
        includes = ids(hop["expect_includes"], result) if "expect_includes" in hop else None
        if result is None:
            current = None
            continue
        label = f"hop {number} ({hop['predicate']} {hop['direction']})"
        if exact is not None and result != exact:
            mismatches.append(f"{label} reached {graph.names(result)}, expected {graph.names(exact)}")
        if includes is not None and not includes <= result:
            mismatches.append(f"{label} is missing {graph.names(includes - result)}")
        if "expect_count" in hop and len(result) != hop["expect_count"]:
            mismatches.append(f"{label} reached {len(result)}, expected {hop['expect_count']}")
        # An unpublished expected kind makes any later hop meaningless.
        current = result if len(blocks) == before else None
    details = mismatches + list(dict.fromkeys(blocks))
    return ("mismatch" if mismatches else "blocked" if blocks else "ready"), details


def fetch(base_url):
    url = base_url.rstrip("/") + "/v1/dev/graph/export"
    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise ValueError(f"{url} returned HTTP {error.code}; the export is development-only") from None
    except (OSError, ValueError) as error:
        raise ValueError(f"Could not read {url}: {error}") from None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--graph", type=Path, help="A downloaded graph export or knowledge index JSON file")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Development Brain origin, used when --graph is absent")
    parser.add_argument("--validate", action="store_true", help="Validate the corpus without reading a graph")
    args = parser.parse_args(argv)
    try:
        corpus = load_corpus(args.corpus)
        if args.validate:
            print(f"Valid graph corpus: {len(corpus['cases'])} cases across {len(corpus['phases'])} phases")
            return 0
        graph = Graph(json.loads(args.graph.read_text(encoding="utf-8")) if args.graph else fetch(args.base_url))
    except (OSError, ValueError) as error:
        parser.error(str(error))
    snapshot = corpus.get("snapshot", {}).get("dataset_version")
    print(f"Graph dataset {graph.dataset_version}; corpus snapshot {snapshot}")
    if graph.dataset_version != snapshot:
        print("Note: the datasets differ, so dated facts such as events may have changed since the fixtures were written.")
    results = {case["id"]: check_case(case, graph) for case in corpus["cases"]}
    failed = False
    for phase in corpus["phases"]:
        cases = [case for case in corpus["cases"] if case["graph"]["phase"] == phase["id"]]
        ready = sum(results[case["id"]][0] == "ready" for case in cases)
        print(f"\n{phase['id']} ({phase['status']}): {ready}/{len(cases)} ready — {phase['title']}")
        for case in cases:
            status, details = results[case["id"]]
            failed = failed or status == "mismatch" or (phase["status"] == "shipped" and status != "ready")
            print(f"  {status:<8} {case['id']}" + (f" — {'; '.join(details)}" if details else ""))
    counts = {status: sum(result[0] == status for result in results.values()) for status in ("ready", "blocked", "mismatch")}
    print(f"\n{len(results)} cases: {counts['ready']} ready, {counts['blocked']} blocked, {counts['mismatch']} mismatched. No model calls were made.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
