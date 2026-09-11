"""Offline safety checks. No API client or database is constructed."""
import json
from decimal import Decimal
from types import SimpleNamespace

import pytest

from run_openai import Budget, BudgetStop, MeteredResponses


def test_cap_checked_before_call_and_failed_request_keeps_reservation(tmp_path):
    count = []

    def fail(**kwargs):
        count.append(kwargs)
        raise TimeoutError("network timeout")

    ledger = Budget("0.03", tmp_path / "ledger.json")
    meter = MeteredResponses(SimpleNamespace(responses=SimpleNamespace(create=fail)), "gpt-5-nano", ledger)
    with pytest.raises(TimeoutError):
        meter.create(model="gpt-5-nano", max_output_tokens=2400)
    first_debit = ledger.total()
    assert first_debit == Decimal("0.02096")
    with pytest.raises(BudgetStop):
        meter.create(model="gpt-5-nano", max_output_tokens=2400)
    assert len(count) == 1
    assert ledger.total() == first_debit
    assert json.loads(ledger.path.read_text())["entries"][0]["status"] == "uncertain_charge"


def test_account_for_cached_input_and_all_output_without_double_counting_reasoning(tmp_path):
    ledger = Budget("5", tmp_path / "ledger.json")
    entry = ledger.reserve("gpt-5-mini", 4096, {})
    ledger.settle(entry, {"input_tokens": 10000, "input_tokens_details": {"cached_tokens": 8000}, "output_tokens": 1000, "output_tokens_details": {"reasoning_tokens": 900}})
    assert ledger.total() == Decimal("0.0027")


def test_uncertain_luna_cache_writes_use_upper_bound(tmp_path):
    ledger = Budget("5", tmp_path / "ledger.json")
    entry = ledger.reserve("gpt-5.6-luna", 4096, {})
    ledger.settle(entry, {"input_tokens": 10000, "input_tokens_details": {"cached_tokens": 0}, "output_tokens": 1000})
    assert Decimal(entry["estimated_cost_usd"]) == Decimal("0.0032")
    assert ledger.total() == Decimal("0.0037")


def test_cannot_reset_existing_ledger_or_exceed_authorization(tmp_path):
    path = tmp_path / "ledger.json"
    Budget("5", path)
    with pytest.raises(ValueError):
        Budget("5", path)
    for amount in ("5.01", "0", "NaN", "Infinity", "-1"):
        with pytest.raises(ValueError):
            Budget(amount, tmp_path / "invalid.json")


def test_reservation_is_on_disk_before_provider_call(tmp_path):
    ledger = Budget("5", tmp_path / "ledger.json")

    def inspect(**kwargs):
        state = json.loads(ledger.path.read_text())
        assert Decimal(state["budget_debit_usd"]) > 0
        assert state["entries"][0]["status"] == "reserved"
        raise TimeoutError()

    meter = MeteredResponses(SimpleNamespace(responses=SimpleNamespace(create=inspect)), "gpt-5-nano", ledger)
    with pytest.raises(TimeoutError):
        meter.create(model="gpt-5-nano", max_output_tokens=2400)


def test_resume_preserves_spend_and_concurrent_process_is_locked_out(tmp_path):
    path = tmp_path / "ledger.json"
    ledger = Budget("0.03", path)
    ledger.reserve("gpt-5-nano", 2400, {})
    with pytest.raises(BlockingIOError):
        Budget("0.03", path, resume=True)
    ledger._lock_handle.close()
    resumed = Budget("0.03", path, resume=True)
    assert resumed.total() == Decimal("0.02096")
    with pytest.raises(BudgetStop):
        resumed.reserve("gpt-5-nano", 2400, {})
