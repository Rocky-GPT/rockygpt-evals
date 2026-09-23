"""Tests of the graph path checker; no model, Brain or database is needed."""

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from check_graph_paths import DEFAULT_CORPUS, Graph, check_case, load_corpus, main
from run import load_cases

GRAPH = {
    "snapshot": {"dataset_version": "test-release"},
    "nodes": [
        {"id": "p1", "kind": "program", "name": "Computer Science BS", "aliases": ["TS-BS-CMPS"]},
        {"id": "p2", "kind": "program", "name": "Accounting BS", "aliases": []},
        {"id": "a", "kind": "person", "name": "Scott Frees", "aliases": []},
        {"id": "b", "kind": "person", "name": "Emma C. Rainforth", "aliases": []},
        {"id": "c1", "kind": "course", "name": "COMPUTER SCIENCE I", "aliases": ["CMPS 147"]},
        {"id": "e", "kind": "event", "name": "Gratitude Journals (2026-10-08)", "aliases": ["Gratitude Journals"]},
        {"id": "k", "kind": "club", "name": "Psychology Affiliation", "aliases": []},
        {"id": "v", "kind": "venue", "name": "Birch Tree Inn", "aliases": ["Birch"]},
        {"id": "s1", "kind": "office", "name": "Public Safety (Emergency)", "aliases": ["Public Safety"]},
        {"id": "s2", "kind": "office", "name": "Public Safety (Non-Emergency)", "aliases": []},
    ],
    "edges": [
        {"source": "p1", "target": "a", "type": "convener"},
        {"source": "a", "target": "c1", "type": "profile_course"},
        {"source": "e", "target": "k", "type": "organized_by"},
    ],
}


def case(start, hops=(), phase="now"):
    return {"id": "case", "graph": {"phase": phase, "start": start, "hops": list(hops)}}


def person(name):
    return {"kind": "person", "name": name}


class PathTests(unittest.TestCase):
    def setUp(self):
        self.graph = Graph(GRAPH)

    def test_ready_paths_follow_direction_and_allow_expected_absence(self):
        convener = {"predicate": "convener", "direction": "out", "expect": [person("Scott Frees")]}
        courses = {"predicate": "profile_course", "direction": "out", "expect": [{"kind": "course", "code": "CMPS 147"}]}
        self.assertEqual(check_case(case({"kind": "program", "name": "Computer Science BS"}, [convener, courses]), self.graph), ("ready", []))
        incoming = {"predicate": "organized_by", "direction": "in", "expect_count": 1, "expect_includes": [{"kind": "event", "name": "Gratitude Journals (2026-10-08)"}]}
        self.assertEqual(check_case(case({"kind": "club", "name": "Psychology Affiliation"}, [incoming]), self.graph)[0], "ready")
        absent = {"predicate": "convener", "direction": "out", "expect": []}
        self.assertEqual(check_case(case({"kind": "program", "name": "Accounting BS"}, [absent]), self.graph), ("ready", []))

    def test_published_disagreements_are_mismatches(self):
        wrong = {"predicate": "convener", "direction": "out", "expect": [person("Emma C. Rainforth")]}
        status, details = check_case(case({"kind": "program", "name": "Computer Science BS"}, [wrong]), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("reached Scott Frees, expected Emma C. Rainforth", details[0])
        promoted = {"predicate": "convener", "direction": "out", "expect": []}
        self.assertEqual(check_case(case({"kind": "program", "name": "Computer Science BS"}, [promoted]), self.graph)[0], "mismatch")
        counted = {"predicate": "organized_by", "direction": "in", "expect_count": 2}
        self.assertEqual(check_case(case({"kind": "club", "name": "Psychology Affiliation"}, [counted]), self.graph)[0], "mismatch")

    def test_unpublished_kinds_predicates_and_records_block(self):
        faculty = {"predicate": "listed_faculty", "direction": "out", "expect": [person("Scott Frees")]}
        self.assertEqual(check_case(case({"kind": "program", "name": "Accounting BS"}, [faculty]), self.graph),
                         ("blocked", ["hop 1: predicate listed_faculty is not published"]))
        status, details = check_case(case({"kind": "organization", "name": "Women's Center & LGBTQ+ Services"}), self.graph)
        self.assertEqual((status, details), ("blocked", ["no organization entities are published"]))
        group = {"record": "requirement_group", "label": "Math Electives"}
        self.assertEqual(check_case(case(group), self.graph)[0], "blocked")

    def test_typos_fail_even_when_the_phase_is_blocked(self):
        faculty = {"predicate": "listed_faculty", "direction": "out", "expect": [person("Scot Frees")]}
        status, details = check_case(case({"kind": "program", "name": "Accounting BS"}, [faculty], phase="program-faculty"), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("expected one person 'Scot Frees', found 0", details)

    def test_hops_after_an_unpublished_expected_kind_are_not_judged(self):
        organizer = {"predicate": "organized_by", "direction": "out", "expect": [{"kind": "organization", "name": "Women's Center"}]}
        onward = {"predicate": "organized_by", "direction": "in", "expect_count": 5}
        status, details = check_case(case({"kind": "event", "name": "Gratitude Journals (2026-10-08)"}, [organizer, onward]), self.graph)
        self.assertEqual((status, details), ("blocked", ["no organization entities are published"]))

    def test_aliases_must_resolve_to_exactly_the_intended_entities(self):
        self.assertEqual(check_case(case({"resolve": " birch ", "expect": [{"kind": "venue", "name": "Birch Tree Inn"}]}), self.graph), ("ready", []))
        missing = case({"resolve": "Potter Library", "expect": [{"kind": "venue", "name": "Birch Tree Inn"}]})
        self.assertEqual(check_case(missing, self.graph), ("blocked", ["alias 'Potter Library' is not published"]))
        both = [{"kind": "office", "name": "Public Safety (Emergency)"}, {"kind": "office", "name": "Public Safety (Non-Emergency)"}]
        status, details = check_case(case({"resolve": "Public Safety", "expect": both}), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("resolves to Public Safety (Emergency)", details[0])
        # The path after a blocked alias is still walked from the intended entities.
        convener = {"predicate": "convener", "direction": "out", "expect": [person("Emma C. Rainforth")]}
        blocked_alias = case({"resolve": "Computer Science", "expect": [{"kind": "program", "name": "Computer Science BS"}]}, [convener])
        self.assertEqual(check_case(blocked_alias, self.graph)[0], "mismatch")


RECORD_GRAPH = {
    **GRAPH,
    "nodes": [*GRAPH["nodes"], {"id": "c2", "kind": "course", "name": "CALCULUS II", "aliases": ["MATH 122"]}],
    "contextual_records": [
        {"id": "g1", "record_type": "requirement_group", "label": "Math Electives", "rule": {"choose": {"at_least": 2}}},
        {"id": "g2", "record_type": "requirement_group", "label": "Required Courses", "rule": {"choose": {"all": True}}},
        {"id": "g3", "record_type": "requirement_group", "label": "Required Courses", "rule": {"choose": None}},
        {"id": "g4", "record_type": "requirement_group", "label": "General Education: Quantitative Reasoning",
         "rule": None, "course_list": {"select_count": 1, "choose": {"at_least": 1}}},
    ],
    "record_edges": [
        *({"id": f"record-edge:{i}", "type": "requirement_group", "source": program, "target": group}
          for i, (program, group) in enumerate([("p1", "g1"), ("p1", "g2"), ("p1", "g4"), ("p2", "g3"), ("p2", "g4")])),
        *({"id": f"record-edge:{i + 5}", "type": "requirement_option", "source": group, "target": course}
          for i, (group, course) in enumerate([("g1", "c2"), ("g2", "c1"), ("g3", "c1"), ("g4", "c1")])),
    ],
}


def group(label, **constraints):
    return {"record": "requirement_group", "label": label, **constraints}


class RecordPathTests(unittest.TestCase):
    def setUp(self):
        self.graph = Graph(RECORD_GRAPH)
        self.program = {"kind": "program", "name": "Computer Science BS"}

    def test_programs_reach_groups_and_groups_reach_course_options(self):
        groups = {"predicate": "requirement_group", "direction": "out",
                  "expect_includes": [group("Math Electives", select_at_least=2), group("Required Courses")]}
        options = {"predicate": "requirement_option", "direction": "out", "expect_includes": [{"kind": "course", "code": "MATH 122"}]}
        self.assertEqual(check_case(case(self.program, [groups, options]), self.graph), ("ready", []))
        shared = {"predicate": "requirement_option", "direction": "out", "expect_count": 1}
        self.assertEqual(check_case(case(group("General Education: Quantitative Reasoning", select_at_least=1), [shared]), self.graph),
                         ("ready", []))

    def test_a_shared_label_needs_its_program_or_a_narrow_hop(self):
        reverse = {"predicate": "requirement_option", "direction": "in", "expect_includes": [
            group("Required Courses", program="Computer Science BS"), group("Required Courses", program="Accounting BS"),
            group("General Education: Quantitative Reasoning")]}
        self.assertEqual(check_case(case({"kind": "course", "code": "CMPS 147"}, [reverse]), self.graph), ("ready", []))
        ambiguous = {"predicate": "requirement_option", "direction": "in", "expect_includes": [group("Required Courses")]}
        status, details = check_case(case({"kind": "course", "code": "CMPS 147"}, [ambiguous]), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("expected one requirement_group 'Required Courses' where the path reaches it, found 2", details)
        self.assertEqual(check_case(case(group("Required Courses"), [ambiguous]), self.graph)[0], "mismatch")

    def test_published_choices_and_program_scope_must_agree(self):
        wrong_count = {"predicate": "requirement_group", "direction": "out", "expect_includes": [group("Math Electives", select_at_least=3)]}
        status, details = check_case(case(self.program, [wrong_count]), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("publishes choose {'at_least': 2}, expected at least 3", details[0])
        uninterpreted = {"predicate": "requirement_option", "direction": "in",
                         "expect_includes": [group("Required Courses", program="Accounting BS", select_at_least=1)]}
        self.assertEqual(check_case(case({"kind": "course", "code": "CMPS 147"}, [uninterpreted]), self.graph)[0], "mismatch")
        other_program = {"predicate": "requirement_group", "direction": "out", "expect_includes": [group("Math Electives")]}
        status, details = check_case(case({"kind": "program", "name": "Accounting BS"}, [other_program]), self.graph)
        self.assertEqual((status, details), ("mismatch", ["expected one requirement_group 'Math Electives' where the path reaches it, found 0"]))
        scoped = {"predicate": "requirement_option", "direction": "in", "expect_includes": [group("Math Electives", program="Accounting BS")]}
        status, details = check_case(case({"kind": "course", "code": "MATH 122"}, [scoped]), self.graph)
        self.assertEqual((status, details), ("mismatch", ["no requirement_group 'Math Electives' of Accounting BS is published"]))

    def test_record_typos_fail_even_when_the_walk_is_blocked(self):
        blocked = {"predicate": "listed_faculty", "direction": "out", "expect_includes": [group("Math Electivs")]}
        status, details = check_case(case(self.program, [blocked]), self.graph)
        self.assertEqual(status, "mismatch")
        self.assertEqual(details, ["no requirement_group 'Math Electivs' is published", "hop 1: predicate listed_faculty is not published"])
        # Records a knowledge index or older export does not carry stay blocked, not mismatched.
        status, details = check_case(case(self.program, [blocked]), Graph(GRAPH))
        self.assertEqual((status, details), ("blocked", ["hop 1: predicate listed_faculty is not published",
                                                         "no requirement_group records are published"]))


class ExternalIdTests(unittest.TestCase):
    def test_a_building_must_be_the_named_map_location_when_bindings_are_published(self):
        building = {"id": "b1", "kind": "building", "name": "Academic Building D", "aliases": [],
                    "source_bindings": [{"collection": "buildings", "source_key": "campus-map", "source_record_keys": ["1133371"]}]}
        office = {"id": "o1", "kind": "office", "name": "Registrar", "aliases": []}
        graph = Graph({"nodes": [building, office], "edges": [{"source": "o1", "target": "b1", "type": "located_at"}]})
        hop = lambda location: {"predicate": "located_at", "direction": "out", "expect": [
            {"kind": "building", "name": "Academic Building D", "concept3d_id": location}]}
        start = {"kind": "office", "name": "Registrar"}
        self.assertEqual(check_case(case(start, [hop("1133371")]), graph), ("ready", []))
        status, details = check_case(case(start, [hop("1133424")]), graph)
        self.assertEqual(status, "mismatch")
        self.assertIn("is not concept3d_id 1133424", details[0])
        # A knowledge index has no bindings to check against.
        del building["source_bindings"]
        self.assertEqual(check_case(case(start, [hop("1133424")]), Graph({"nodes": [building, office], "edges": graph.edges})), ("ready", []))


class CorpusTests(unittest.TestCase):
    def test_graph_corpus_is_valid_for_the_runner_and_the_checker(self):
        corpus = load_corpus(DEFAULT_CORPUS)
        runner_cases = load_cases(DEFAULT_CORPUS)
        self.assertEqual([case["id"] for case in runner_cases], [case["id"] for case in corpus["cases"]])
        self.assertTrue(20 <= len(corpus["cases"]) <= 30)
        used = {case["graph"]["phase"] for case in corpus["cases"]}
        self.assertEqual(used, {phase["id"] for phase in corpus["phases"]})
        self.assertTrue(all(case["graph"]["hops"] or "resolve" in case["graph"]["start"] for case in corpus["cases"]))

    def test_invalid_paths_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "corpus.json"
            base = {"phases": [{"id": "now", "status": "shipped", "title": "Now"}]}
            for graph, message in (
                ({"phase": "later", "start": person("A"), "hops": []}, "unknown phase"),
                ({"phase": "now", "start": {"kind": "person"}, "hops": []}, "exactly one of name or code"),
                ({"phase": "now", "start": person("A"), "hops": [{"predicate": "convener", "direction": "sideways"}]}, "out or in"),
                ({"phase": "now", "start": person("A"), "hops": [], "extra": True}, "graph must contain only"),
                ({"phase": "now", "start": group("A", select_at_least=0), "hops": []}, "positive integer"),
                ({"phase": "now", "start": group("A", program=" "), "hops": []}, "program must be text"),
            ):
                path.write_text(json.dumps({**base, "cases": [{"id": "x", "graph": graph}]}))
                with self.assertRaisesRegex(ValueError, message):
                    load_corpus(path)

    def test_shipped_phases_must_be_ready_while_planned_phases_may_block(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            graph = root / "graph.json"
            graph.write_text(json.dumps(GRAPH))
            corpus = root / "corpus.json"
            blocked_case = {"id": "faculty", "graph": {"phase": "next", "start": {"kind": "program", "name": "Accounting BS"},
                                                       "hops": [{"predicate": "listed_faculty", "direction": "out"}]}}
            for status, expected in (("planned", 0), ("shipped", 1)):
                corpus.write_text(json.dumps({"phases": [{"id": "next", "status": status, "title": "Next"}], "cases": [blocked_case]}))
                with contextlib.redirect_stdout(io.StringIO()) as output:
                    self.assertEqual(main(["--corpus", str(corpus), "--graph", str(graph)]), expected)
                self.assertIn("1 cases: 0 ready, 1 blocked, 0 mismatched.", output.getvalue())


if __name__ == "__main__":
    unittest.main()
