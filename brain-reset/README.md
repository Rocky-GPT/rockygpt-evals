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
model configuration is loaded. The script makes one metered model call per
candidate and no campus retrieval calls; captured campus time and evidence remain
fixed. Captured search coverage, when present, is passed alongside the records
and conversation so the gate can distinguish complete matching results from a
truncated lookup. It cannot establish coverage beyond the recorded query/filters.
Reports refuse overwrites and retain beginning/ending runtime hashes.

```sh
cd ../rockygpt-brain
.venv/bin/python ../rockygpt-evals/brain-reset/check_evidence_gate.py \
  --output ../rockygpt-evals/brain-reset/results/evidence-gate.json
```

## Multi-hop graph conversations

`graph-conversations.json` holds 26 conversations (31 turns) whose answers need
two or more connected facts: a program's convener and that person's office, a
club's linked events, the options inside a requirement group. Each case declares
its graph path and the roadmap phase that publishes it (`now`, `organizations`,
`requirements`, `program-faculty`, `places`, `schools`, `aliases`). Expected
facts come from `dev-profiles-organizers-20260922` and go stale as events pass.
Predicate names for planned phases (`listed_faculty`, `office_at`,
`located_at`, `part_of`, `requirement_group`, `requirement_option`) are
provisional; rename them in the fixtures when the phase ships.

`check_graph_paths.py` walks each declared path through a published graph
export with no model calls. A case is ready when every hop reaches the expected
entities, blocked when something it needs is not published yet, and a mismatch
when published data disagrees with the fixture. Expectations are checked even for
blocked cases, so typos and renamed entities surface early. Mismatches fail, and
so does any case short of ready in a phase marked `shipped`; mark a phase
shipped once it lands. The first run found 7 of 26 ready (all `now` cases).

```sh
python3 brain-reset/check_graph_paths.py --base-url http://127.0.0.1:8000
python3 brain-reset/check_graph_paths.py --graph campus-knowledge-graph.json
python3 brain-reset/run.py --corpus brain-reset/graph-conversations.json \
  --output brain-reset/results/graph-suite.json
```

The first command reads the development-only `/v1/dev/graph/export`; the second
uses the Dev UI's **Download graph** file. Path readiness says nothing about
whether the Brain can use a path in chat: incoming convener edges, for example,
exist but no current profile section follows them. Only the paid `run.py` pass
and its semantic review measure answers.

Checkpoint evidence is retained under `checkpoints/`. Temporary iteration reports
belong in ignored `results/`. Use only synthetic conversations for these runs.

An additional paired case explicitly leaves Birch at its closing time and proposes
attending an event afterward that ends at the same time. It distinguishes an
actually contradictory sequence from an optional visit without a stated duration.
The prior 26 cases and expectations are preserved.
