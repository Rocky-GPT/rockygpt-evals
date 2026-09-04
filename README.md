# rockygpt-evals

Black-box conversation evaluation for RockyGPT. The first-principles Brain suite
is in [`brain-reset/conversations.json`](brain-reset/conversations.json).

It contains 20 realistic student conversations and 27 requests, including four
live multi-turn conversations. Later requests replay the actual generated
assistant answers with the full conversation history. Coverage includes trusted
campus facts, compound requests, corrections, pronouns, topic changes,
clarification, private records, prompt injection, unavailable future data, and
outdated user claims.

## Running the current Brain suite

Python 3.10+ is sufficient; the runner uses only the standard library. Start the
Brain with its trusted database connection first. The runner needs only the Brain URL;
it does not read service credentials or import either implementation.

```sh
python3 brain-reset/run.py --validate
python3 -m unittest discover -s brain-reset -p 'test_*.py'
python3 brain-reset/run.py --base-url http://127.0.0.1:8000 --output brain-reset/results/latest.json
```

Live runs call `POST /v1/chat` and spend model tokens. Select a bounded subset by
repeating `--case`:

```sh
python3 brain-reset/run.py --base-url http://127.0.0.1:8000 \
  --case library-pronoun-then-topic-switch \
  --case dinner-and-evening-event \
  --output brain-reset/results/smoke.json
```

Each run writes JSON with complete requests, responses, model, timing, citation
metadata, dataset version, and contract-check results. A sibling Markdown report
contains answers, citations, and the expected behaviors for human review.
Reports are updated after each completed case so earlier results survive a later
request failure. A failed request stops that conversation's dependent turns and
continues with the next independent case. HTTP 429 stops the entire run immediately;
the report preserves that failure and records the remaining cases and turns as
not run. Inspect the provider's actual quota/reset information before resuming.
Requests are not retried automatically.

For a limited model API quota, add `--interval 30`. This spaces every request
start, including follow-up turns, by at least 30 seconds. Resume failed or unrun
cases while preserving the original report with:

```sh
python3 brain-reset/run.py --base-url http://127.0.0.1:8000 --interval 30 \
  --resume brain-reset/results/initial.json \
  --output brain-reset/results/checkpoint.json
```

With `--resume`, an explicit `--case` selection reruns those cases even if their
machine checks passed. Use that when semantic review finds an incorrect answer.
The resumed report retains other case results; the original file remains intact.

Machine assertions cover the response contract, valid citation metadata, and a
few stable case-specific properties such as requesting clarification when no
referent exists. They do **not** score prose with phrase matching or certify
factual support merely because a citation exists. Review the answers against the
active trusted dataset and each case's prose rubric. The reports deliberately
mark semantic review as pending. A nonzero exit indicates a machine check or HTTP
failure; a zero exit does not mean all answers are correct.

This corpus reads the existing trusted data schema and source catalog as its
coverage boundary. It does not freeze current hours, menus, or event dates into
test expectations. To verify the Brain's behavior when retrieval itself returns
stale records or fails, run the Brain's deterministic dependency-failure tests;
the outdated-hours case here checks an old user claim against the actual live
dataset.

## Retained checkpoint evidence

The [September 4 checkpoint](brain-reset/checkpoints/2026-09-04/README.md)
preserves a reviewed 20-conversation / 27-turn composite, its exact source
responses, the password-discovery correction, two independent shuttle
regressions, and the interrupted quota-limited sweep. The composite spans the
last complete run and a targeted check after the final discovery clarification;
an attempted fresh full sweep was blocked by exhausted API credits.
[Independent agent review](brain-reset/verification-review.md) is recorded
separately from machine results. Human review remains pending.

## Historical suites

The TypeScript suites and `corpus/` reports predate the Brain restart and remain
as historical artifacts. Their routing, state, and answer-shape expectations are
not the acceptance criteria for the rebuilt Brain. Their existing npm commands
are retained for deliberate historical comparisons.
