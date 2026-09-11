from decimal import Decimal

from summarize import cost


def test_known_cache_writes_are_charged_once():
    entry = {"model": "gpt-5.6-luna", "usage": {"input_tokens": 10000, "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 2048}, "output_tokens": 1000}}
    assert cost(entry) == (Decimal("0.0033024"), Decimal("0.0033024"))


def test_long_context_cache_reads_writes_and_output_rates():
    entry = {"model": "gpt-5.6-luna", "usage": {"input_tokens": 300000, "input_tokens_details": {"cached_tokens": 200000, "cache_write_tokens": 100000}, "output_tokens": 1000}}
    assert cost(entry) == (Decimal("0.0598"), Decimal("0.0598"))


def test_timeout_cost_is_a_range_not_an_invented_precise_charge():
    assert cost({"model": "gpt-5-mini", "budget_debit_usd": "0.1048"}) == (Decimal(0), Decimal("0.1048"))
