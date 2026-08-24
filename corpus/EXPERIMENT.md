# A → B → C controlled experiment

**Status: prepared, not started.** Nothing runs until the model provider is
healthy. A provider error is never interpreted as a model failure.

## The question

How much of Rocky's measured failure is a contract defect, and how much
survives once the correct evidence reliably reaches the model? Only what
survives is an argument for deterministic reasoning in BRAIN.

## States

| State | DATA | BRAIN tool boundary | Status |
| --- | --- | --- | --- |
| **A** | `at` ignored; no `serviceDay` returns three timetables interleaved; unsorted | silent first-8 truncation | **Frozen.** `results-FROZEN-baseline-tx.json` |
| **B** | `at` filters to still-catchable trips; `serviceDay` defaults from `at`; sorted | unchanged — still silent, still 8 | Written, typechecks, **not live** |
| **C** | as B | truncation after semantic filtering, with explicit completeness metadata | **Not started** |

B answers: *how much failure disappears from giving the existing reasoning path
sane evidence?*

C answers: *once DATA is sane, does the brain's evidence packaging still
damage correctness?*

## Protocol

1. Valid hours baseline — critical boundary and availability cases at k=5,
   controls at k=3. Freeze.
2. Map/entity baseline at k=3. Freeze.
3. State A complete and frozen.
4. Enable B: restart DATA only.
5. Run the **transportation control suite only** — `transportation`,
   `ordinal`, `discourse`. 11 scenarios, 75 turns.
6. Compare A → B per category.
7. Enable C: restart BRAIN.
8. Run the same 11 scenarios again. 75 turns.
9. Compare A → B → C per category.
10. Only then decide which deterministic Python primitives to build.

B is a transportation DATA experiment. Running unrelated map turns after
changing shuttle filtering buys cost, not information — so steps 5 and 8 do not
re-run the whole corpus.

## Commands

```
# baselines (state A, before any restart)
CORPUS_ONLY=hours CORPUS_LABEL=baseline-hours npx tsx corpus/run.ts
CORPUS_ONLY=map,map-action CORPUS_LABEL=baseline-map npx tsx corpus/run.ts

# control suite, once per state
CORPUS_ONLY=transportation,ordinal,discourse CORPUS_LABEL=state-b npx tsx corpus/run.ts
CORPUS_ONLY=transportation,ordinal,discourse CORPUS_LABEL=state-c npx tsx corpus/run.ts
```

Nothing else changes between states: no scenario edits, no grader edits, no
prompt changes, no fixture edits. If an eval bug is found mid-sequence, every
run after the last known-good state is invalidated and re-run from A.

## Cost

| Step | Turns |
| --- | ---: |
| Hours baseline | 143 |
| Map baseline | 54 |
| State B control suite | 75 |
| State C control suite | 75 |
| **Total** | **347** |

The full corpus is 272 turns (60 scenarios). Running all three states across
every category would have been roughly 1,000.

## Repetition tiers

| Tier | k | Scenarios |
| --- | ---: | --- |
| `critical` | 5 | transportation, ordinal, discourse, hours boundaries and gaps |
| `broad` | 3 | map, map-action, hours mid-window controls |

Consistency across repetitions is itself a finding for critical scenarios —
Rocky was observed grounding on some runs and not others for identical input —
and a luxury for broad ones.

## Outcome hierarchy

```
HTTP / model provider failure   ->  UNSCORABLE
wrong factual answer            ->  FAIL
correct factual answer          ->  PASS
```

Never `provider unavailable -> brain got it wrong`. That conflation produced a
plausible-looking `map 0.0%` that was pure outage; see `VOID-hours-map-run.md`.

Per-scenario validity, for k repetitions:

| Scorable runs | Treatment |
| --- | --- |
| k | scored normally |
| k − 1 | scored, flagged `degraded` |
| ≤ k − 2 | scenario `invalid`, excluded from every average |

A run whose unscorable share exceeds 10% aborts and writes no results file.

## Pre-registered expectations

The sealed predictions in `PREDICTIONS.md` are not amended. Recorded here
before B runs, for the same reason:

- **B fixes most transportation failures.** 2 of 10 baseline scenarios were
  unanswerable and 7 depended on an optional argument B makes unnecessary.
- **`tx-midday-0` is the test.** Its correct record was visible under both call
  shapes at baseline and it failed 5/5. If it recovers under B, no
  deterministic primitive was needed. If it stays at 0% while its neighbours
  recover, that is a specific argument for `select_next_departure(records,
  now)` — one function, not an architecture.
  *(Scored below: it recovered. The primitive is rejected.)*
- **Ordinal and discourse should move less than transportation.** The repair
  is orthogonal to reference resolution. If they move a lot, the causal model
  is wrong and that matters more than the score.
- **C's marginal gain over B is the measurement that decides whether the
  record cap needs changing at all**, rather than merely being made honest.

## Standing instrumentation rule

An extreme score with perfect agreement — 0% or 100% across every repetition —
**triggers an instrumentation check before interpretation.** It is not by
itself evidence of anything, in either direction.

Verify, in order:

```
provider health
route != error on every run
expected evidence was available to the model
grader behaves correctly on a hand-checked case
```

If all four pass, the extreme score is a genuine and unusually strong finding.
`tx-midday-0` is the worked example: 0% across 5 runs, provider healthy, all
routes `standard`, the correct record verified present under both call shapes,
grader confirmed against the answer text by hand. That one is real.

`map 0.0%` is the counter-example: identical shape, and it was an outage.

The rule is a check, not a suspicion. A deterministic failure that reproduces
every time is exactly what this corpus exists to catch, and treating every
clean 0% as instrumentation error would discard the strongest results it can
produce.

## Green-light rule

The prepared sequence does not start on a successful probe alone. A probe only
proves the moment; the account state is what decides whether a 347-turn run
will finish.

| # | Check | Who |
| --- | --- | --- |
| 1 | Provider dashboard: billing/quota available, no exhausted usage limit, API access enabled | **Daniel** — account-scoped, not observable from here |
| 2 | Public provider status shows no relevant outage | either |
| 3 | Exactly one cheap probe through Rocky: HTTP succeeds, `route != "error"`, normal response | Claude |
| 4 | Rocky's own limiter (`security/rate_limit.py`) is no longer returning 429 | Claude |

Check 1 gates the rest. A successful probe while the dashboard still shows the
account capped is not a green light — it is the start of a run that will void
itself partway through, which is exactly what happened on 2026-08-23.

Checks 3 and 4 are a single probe each, run once. No polling loop.

## Sequence, once green

```
hours + map State A baselines  ->  freeze
State B (restart DATA)         ->  75-turn control suite
State C (restart BRAIN)        ->  75-turn control suite
                               ->  A -> B -> C table, scenario level
```

## What the experiment yields

| Comparison | Answers |
| --- | --- |
| A → B | How much failure came from the DATA contract |
| B → C | How much came from BRAIN evidence packaging |
| Residual after C | What reasoning actually needs deterministic Python |

The third bucket is the only one that justifies writing a reasoning layer. See
`rockygpt-brain-python/DESIGN.md` §9.2 for the admission rule that governs it.

## Deviation recorded — State C includes a prompt change

The protocol says no prompt changes between states. State C breaks that, and
the reason is recorded here rather than buried.

The evidence-integrity repair is two-part by construction: the envelope
declares `returned` and `truncated`, and the consumer is told what those mean.
Adding the fields alone would be a null intervention — metadata nothing reads
cannot change an answer — so C would measure nothing and "C showed no effect"
would be uninterpretable.

C is therefore defined as: **completeness metadata plus the prompt section that
makes it actionable**, treated as one intervention. It is not separable into
two measurable halves at this corpus size.

Consequence: a change between B and C cannot be attributed to the metadata
rather than the wording. Given that state B already returns ≤7 shuttle records
against a cap of 8, C is expected to show no effect on the transportation
control suite regardless — the informative C measurement is on hours, where 10
records still meet a cap of 8.

---

# OUTCOME — the pre-registered expectations, scored

Recorded after the run. See `RESULTS.md` for the full table.

| Expectation | Outcome |
| --- | --- |
| B fixes most transportation failures | **Correct.** 15.0% -> 92.5%, nine of eleven scenarios at 100%. |
| `tx-midday-0` is the test; recovery under B means no primitive was needed | **Recovered, 0% -> 100%.** `select_next_departure()` is rejected. |
| Ordinal and discourse should move less than transportation | **Half wrong.** Discourse held at 60% exactly as predicted, but ordinal went 50% -> 100% — the repair was *not* orthogonal to it, because ordinal traversal over a mis-ordered list is a different problem from ordinal traversal over a sorted one. |
| C's marginal gain decides whether the record cap needs changing | **Not answered.** B returned ≤7 records against a cap of 8, so C had nothing to act on. Moved to the hours suite. |

The ordinal miss is the useful one. "The one after that" was never a reference
resolution failure — it was correctly resolving a reference into a list whose
order was wrong. A deterministic ordinal primitive would have been built to fix
a problem that did not exist.
