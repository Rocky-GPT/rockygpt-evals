"""Evaluation work shares the Brain accounting boundary; no paid tests here."""
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

import check_evidence_gate as runner
from rockygpt_brain.accounting import PaidCallError


def setup_run(tmp_path, monkeypatch, error=None):
    corpus = tmp_path / "cases.json"
    case = {
        "id": "one", "candidate": {"status": "answered", "parts": [
            {"kind": "guidance", "text": "Try a study schedule.", "evidence_ids": []}]},
        "messages": [{"role": "user", "content": "Study help"}], "evidence": [],
        "campus_time": "2026-09-11T12:00:00-04:00",
        "expected": {"supported": True, "parts": [{"part_index": 0, "supported": True}]},
    }
    corpus.write_text(json.dumps({"cases": [case, {**case, "id": "two"}]}))
    output = tmp_path / "report.json"
    monkeypatch.setattr("sys.argv", ["check_evidence_gate.py", "--corpus", str(corpus),
                                    "--output", str(output), "--interval", "0"])
    monkeypatch.setattr(runner, "load_dotenv", lambda *args: None)
    monkeypatch.setattr(runner, "load_deployment", lambda: SimpleNamespace(environment="development"))
    context = MagicMock()
    client = context.__enter__.return_value
    client.request_id = "request-test"
    client.usage.report.return_value = {
        "modelCalls": 0 if error else 1, "costNusd": 0 if error else 123, "unsettledNusd": 0,
    }
    factory = MagicMock(return_value=context)
    monkeypatch.setattr(runner, "open_gateway", factory)
    review = MagicMock()
    review.parts = [SimpleNamespace(part_index=0, verdict="supported")]
    review.model_dump.return_value = {"parts": [{"part_index": 0, "verdict": "supported"}]}
    checker = MagicMock(return_value=review, side_effect=error)
    monkeypatch.setattr(runner, "review_answer", checker)
    return output, factory, checker


def test_denied_budget_is_not_counted_as_a_model_call(tmp_path, monkeypatch):
    output, factory, checker = setup_run(tmp_path, monkeypatch, PaidCallError("budget_exhausted"))
    assert runner.main() == 1
    report = json.loads(output.read_text())
    assert report["summary"]["model_calls"] == 0
    assert report["summary"]["unrun"] == 1
    assert report["summary"]["passed"] == 0
    assert report["results"][0]["error_code"] == "budget_exhausted"
    assert checker.call_count == factory.call_count == 1


def test_component_usage_is_reported_per_case(tmp_path, monkeypatch):
    output, factory, _ = setup_run(tmp_path, monkeypatch)
    assert runner.main() == 0
    report = json.loads(output.read_text())
    assert report["summary"]["model_calls"] == 2
    assert report["summary"]["cost_nusd"] == 246
    assert report["summary"]["unrun"] == 0
    assert factory.call_count == 2
    assert report["kind"] == "component_regression_on_archived_evidence"


def test_component_eval_cannot_use_production_configuration(tmp_path, monkeypatch):
    _, factory, _ = setup_run(tmp_path, monkeypatch)
    monkeypatch.setattr(runner, "load_deployment", lambda: SimpleNamespace(environment="production"))
    with pytest.raises(ValueError, match="development"):
        runner.main()
    factory.assert_not_called()
