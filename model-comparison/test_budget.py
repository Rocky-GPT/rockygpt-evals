"""Retired experiments cannot bypass Phase 1 accounting."""
import sys
from unittest.mock import patch

import pytest

from run_openai import main


def test_paid_execution_is_disabled_before_creating_output(tmp_path):
    destination = tmp_path / "no-paid-run"
    with patch.object(sys, "argv", ["run_openai.py", "--execute", "--budget-usd", "5",
                                   "--output", str(destination)]):
        with pytest.raises(SystemExit) as error:
            main()
    assert error.value.code == 2
    assert not destination.exists()


def test_historical_metadata_remains_available_without_calls(tmp_path, capsys):
    with patch.object(sys, "argv", ["run_openai.py", "--output", str(tmp_path)]):
        main()
    assert '"status": "retired"' in capsys.readouterr().out
