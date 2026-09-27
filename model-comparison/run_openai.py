#!/usr/bin/env python3
"""Historical comparison metadata and report helpers; paid execution is retired."""
import argparse
import hashlib
import json
import os
from pathlib import Path
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[2]
BRAIN = ROOT / "rockygpt-brain"
CORPUS = ROOT / "rockygpt-evals/brain-reset/conversations.json"
MILLION = Decimal(1_000_000)
# Standard USD per million tokens, checked against official pricing 2026-09-05.
# context is deliberately the entire context window, a conservative reservation.
MODELS = {
    "gpt-5-nano": dict(snapshot="gpt-5-nano-2025-08-07", input="0.05", cached="0.005", output="0.40", context=400000),
    "gpt-4o-mini": dict(snapshot="gpt-4o-mini-2024-07-18", input="0.15", cached="0.075", output="0.60", context=128000),
    "gpt-5.6-luna": dict(snapshot="gpt-5.6-luna", input="0.20", cached="0.02", output="1.20", context=1050000, long_input="0.40", long_cached="0.04", long_output="1.80", writes=True),
    "gpt-5.4-nano": dict(snapshot="gpt-5.4-nano-2026-03-17", input="0.20", cached="0.02", output="1.25", context=400000),
    "gpt-5-mini": dict(snapshot="gpt-5-mini-2025-08-07", input="0.25", cached="0.025", output="2.00", context=400000),
    "gpt-5.4-mini": dict(snapshot="gpt-5.4-mini-2026-03-17", input="0.75", cached="0.075", output="4.50", context=400000),
}


def plain(value):
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    raise TypeError(type(value).__name__)


def save(path, value):
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False, default=plain)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    temp.replace(path)


def fingerprints():
    files = sorted((BRAIN / "src/rockygpt_brain").rglob("*.py")) + sorted((BRAIN / "src/rockygpt_brain").glob("*.md")) + [CORPUS]
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--budget-usd", type=Decimal)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.execute:
        parser.error(
            "This historical comparison runner is retired. Phase 1 requires the Brain's "
            "shared development gateway and PostgreSQL ledger. Additional model comparisons "
            "are deferred until their adapters and release configuration are implemented."
        )
    print(json.dumps({
        "execute": False, "status": "retired", "historical_models": MODELS,
        "note": "Saved reports can still be summarized; new paid comparisons are disabled."
    }, indent=2))


if __name__ == "__main__":
    main()
