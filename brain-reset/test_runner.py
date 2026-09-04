"""Tests of evaluation integrity; no model or campus service is needed."""

import copy
import contextlib
import http.server
import io
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from run import DEFAULT_CORPUS, load_cases, main, paced_caller, response_checks, run_case


def reply(answer="A supported answer."):
    return {"answer": answer, "status": "answered", "requestId": "test-request", "model": "test-model", "citations": []}


class RunnerTests(unittest.TestCase):
    def test_actual_http_replays_generated_assistant_history(self):
        requests = []

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                requests.append({"path": self.path, "body": json.loads(self.rfile.read(int(self.headers["Content-Length"])))})
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(reply(f"Generated response {len(requests)}")).encode())

            def log_message(self, *args):
                pass

        server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        case = {"id": "followup", "messages": [], "expected_behaviors": ["Keep the actual conversation history."], "turns": [{"user": "Library Saturday?"}, {"user": "And Sunday?"}, {"user": "Different question: Financial Aid?"}]}
        try:
            result = run_case(case, f"http://127.0.0.1:{server.server_port}", 5)
        finally:
            server.shutdown()
            server.server_close()
            worker.join()
        self.assertTrue(result["machine_checks_passed"])
        self.assertTrue(all(request["path"] == "/v1/chat" for request in requests))
        self.assertEqual(requests[2]["body"]["messages"], [
            {"role": "user", "content": "Library Saturday?"},
            {"role": "assistant", "content": "Generated response 1"},
            {"role": "user", "content": "And Sunday?"},
            {"role": "assistant", "content": "Generated response 2"},
            {"role": "user", "content": "Different question: Financial Aid?"},
        ])
        self.assertEqual(len(result["turns"][0]["messages"]), 1)
        self.assertEqual(result["turns"][1]["messages"], requests[1]["body"]["messages"])
        self.assertEqual(result["human_review"], "pending")

    def test_http_error_stops_dependent_turns_without_inventing_history(self):
        case = {"id": "transport-error", "messages": [], "expected_behaviors": ["Stop on a failed dependency."], "turns": [{"user": "First?"}, {"user": "Followup?"}]}
        result = run_case(case, "http://unused", 1, caller=lambda *_: {"error": "HTTP 503", "http_status": 503, "elapsed_seconds": 0.01})
        self.assertFalse(result["machine_checks_passed"])
        self.assertEqual(result["not_run_turns"], 1)
        self.assertEqual(len(result["turns"]), 1)
        self.assertEqual(result["turns"][0]["checks"][0]["name"], "request_succeeded")

    def test_malformed_success_response_fails_contract(self):
        response = reply()
        response["citations"] = [{"id": "duplicate", "title": "Campus data", "url": "javascript:alert(1)"}, {"id": "duplicate", "url": "/relative"}]
        failed = {check["name"] for check in response_checks(response, {}) if not check["passed"]}
        self.assertIn("citation_0_url", failed)
        self.assertIn("citation_1_metadata", failed)
        self.assertIn("citation_1_url", failed)
        self.assertIn("citation_ids_unique", failed)
        self.assertFalse(all(check["passed"] for check in response_checks([], {})))
        response["status"] = {"unexpected": "object"}
        self.assertTrue(any(check["name"] == "valid_status" and not check["passed"] for check in response_checks(response, {})))

    def test_prose_is_review_guidance_not_a_keyword_judge(self):
        case = {"id": "rubric", "messages": [{"role": "user", "content": "Is a date published?"}], "expected_behaviors": ["Must explain that no date is published."], "assertions": {"status_in": ["unavailable"]}}
        original = copy.deepcopy(case)
        response = reply("There isn't a verified entry for that term in the current data.")
        response["status"] = "unavailable"
        result = run_case(case, "http://unused", 1, caller=lambda *_: {"response": response, "http_status": 200, "elapsed_seconds": 0})
        self.assertTrue(result["machine_checks_passed"])
        self.assertEqual(result["human_review"], "pending")
        self.assertEqual(case, original)

    def test_default_corpus_is_valid_and_exercises_live_followups(self):
        cases = load_cases(DEFAULT_CORPUS)
        self.assertGreaterEqual(len(cases), 18)
        self.assertTrue(any(len(case.get("turns", [])) >= 3 for case in cases))
        self.assertTrue(all("expected_behaviors" in case for case in cases))

    def test_pacing_applies_to_followups_and_across_cases(self):
        now = [0.0]
        starts = []

        def request(*_):
            starts.append(now[0])
            now[0] += 2
            return {"response": reply(), "http_status": 200, "elapsed_seconds": 2}

        def sleep(seconds):
            now[0] += seconds

        case = {"id": "paced", "messages": [], "expected_behaviors": ["Preserve each live turn."], "turns": [{"user": "First?"}, {"user": "Second?"}]}
        with patch("run.time.monotonic", side_effect=lambda: now[0]), patch("run.time.sleep", side_effect=sleep):
            call = paced_caller(30, caller=request)
            run_case(case, "http://unused", 1, caller=call)
            run_case(case, "http://unused", 1, caller=call)
        self.assertEqual(starts, [0, 30, 60, 90])

    def test_resume_preserves_passes_and_original_report(self):
        calls = []

        def request(_base, messages, _timeout):
            calls.append(messages[-1]["content"])
            return {"response": reply(), "http_status": 200, "elapsed_seconds": 0}

        cases = [{"id": value, "messages": [{"role": "user", "content": value}], "expected_behaviors": ["Answer from evidence."]} for value in ("passed", "failed")]
        previous = [run_case(case, "http://unused", 1, caller=request) for case in cases]
        previous[1]["machine_checks_passed"] = False
        calls.clear()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            corpus = root / "corpus.json"
            original = root / "original.json"
            output = root / "resumed.json"
            corpus.write_text(json.dumps({"cases": cases}))
            original.write_text(json.dumps({"results": previous}))
            original_bytes = original.read_bytes()
            arguments = ["run.py", "--corpus", str(corpus), "--resume", str(original), "--output", str(output)]
            with patch("sys.argv", arguments), patch("run.paced_caller", return_value=request), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(main(), 0)
            self.assertEqual(calls, ["failed"])
            self.assertEqual(original.read_bytes(), original_bytes)
            resumed = json.loads(output.read_text())
            self.assertEqual(resumed["results"][0], previous[0])
            self.assertEqual(resumed["summary"]["machine_checks_passed_cases"], 2)
            calls.clear()
            with patch("sys.argv", arguments + ["--case", "passed"]), patch("run.paced_caller", return_value=request), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(main(), 1)  # The unselected prior failed case remains visible.
            self.assertEqual(calls, ["passed"])

    def test_http_429_stops_run_and_records_unrun_cases(self):
        requests = []

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                requests.append(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
                self.send_response(429)
                self.end_headers()
                self.wfile.write(b'{"reason":"rate_limited"}')

            def log_message(self, *args):
                pass

        server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                corpus, output = root / "cases.json", root / "report.json"
                expectations = ["Use current campus evidence."]
                corpus.write_text(json.dumps({"cases": [
                    {"id": "first", "messages": [], "expected_behaviors": expectations, "turns": [{"user": "First?", "expected_behaviors": expectations}, {"user": "Followup?", "expected_behaviors": expectations}]},
                    {"id": "second", "messages": [{"role": "user", "content": "Another case?"}], "expected_behaviors": expectations},
                ]}))
                arguments = ["run.py", "--corpus", str(corpus), "--output", str(output), "--base-url", f"http://127.0.0.1:{server.server_port}"]
                with patch("sys.argv", arguments), contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(main(), 1)
                report = json.loads(output.read_text())
                self.assertEqual(len(requests), 1)
                self.assertEqual(report["stopped_reason"], "http_429")
                self.assertEqual(report["summary"]["not_run_turns"], 2)
                self.assertEqual(report["not_run_cases"], [{"id": "second", "turns": 1, "reason": "http_429"}])
                self.assertEqual(report["results"][0]["not_run_turns"], 1)
        finally:
            server.shutdown()
            server.server_close()
            worker.join()


if __name__ == "__main__":
    unittest.main()
