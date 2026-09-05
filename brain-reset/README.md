# Brain behavior verification

`conversations.json` is the fixed 20-conversation / 27-turn acceptance suite.
`run.py` sends complete, actual generated history on every follow-up. Its machine
checks validate the public contract; semantic review must compare every answer
with the current-turn evidence and the written expectations. A runtime model
review is not a substitute for this independent acceptance review.

```sh
python3 brain-reset/run.py --validate
python3 brain-reset/test_runner.py
python3 brain-reset/run.py --base-url http://127.0.0.1:8001 --interval 15 \
  --output brain-reset/results/full-suite.json
```

A final acceptance pass starts from an empty report, against a committed runtime.
Record the commit and source/suite hashes before and after, the active published
dataset, every response/error, tool evidence, actual model/tool-call counts, and
end-to-end HTTP latency. Retain failed runs. Do not combine individually successful
answers from different runs into a claimed full pass. A 429 stops the runner;
ordinary errors remain failed cases. Keep reported human review pending unless a
human actually reviewed it; an agent semantic review belongs in a separate report.

`evidence-gate-cases.json` is a separate, fixed component regression. It contains
27 captured, reconstructed or constructed candidates using exact campus records:
sixteen answers the support gate must reject and eleven it must accept. These include
the archived library/event inference and dining exclusion, paraphrases, legitimate
counterparts, unrelated citations, missing/old hours, and structured dates/contacts.
The added allergy pair distinguishes an unsupported risk ranking from blank
allergen fields from an answer that reports labels and asks dining staff about
ingredients and cross-contact. Its evidence comes from the captured runtime
`42b72f6` dining request; the original twelve cases remain unchanged. Provenance
includes source hashes and identifies reconstructed or withheld draft paragraphs.
Two more pairs from `37feee3` distinguish a department from student organizations
and a plan using already-past times from a feasible remaining-evening option.
A fully cited version of the elapsed plan isolates time reasoning from missing
citation rejection.
Seven additive cases from `e5157e0` cover an exact withheld evening revision
whose summary reuses earlier citations, a changed unsupported closing time, the
exact returned price-to-waiver conflict and its corrected counterpart, a catalog
presence/open-seat inference pair, and an exact conditional counseling draft
that must not be rejected as an expired plan. These use captured records, campus
clock and actual conversation from
`checkpoints/2026-09-04-behavior/failed-e5157e0/`; per-case provenance identifies exact
candidates versus constructed variants, source-file and observation hashes, and
any focused evidence selection. All original nineteen case objects and their
expectations remain unchanged.
It does not change the acceptance corpus or its expectations.

Run the actual gate using the Brain virtualenv and working directory, so the same
model configuration is loaded. The script makes one model call per candidate and
no tool/database calls; captured campus time and evidence remain fixed. Captured
search coverage stays in the fixtures for provenance; the factual gate receives
the actual records and conversation, without search counts or truncation flags.

```sh
cd ../rockygpt-brain
.venv/bin/python ../rockygpt-evals/brain-reset/check_evidence_gate.py \
  --output ../rockygpt-evals/brain-reset/results/evidence-gate.json
```

Checkpoint evidence is retained under `checkpoints/`. Temporary iteration reports
belong in ignored `results/`. Use only synthetic conversations for these runs.

An additional paired case explicitly leaves Birch at its closing time and proposes
attending an event afterward that ends at the same time. It distinguishes an
actually contradictory sequence from an optional visit without a stated duration.
The prior 26 cases and expectations are preserved.
