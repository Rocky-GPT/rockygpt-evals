# Frozen baseline — current Python brain, no fixes applied

**`results-FROZEN-baseline-tx.json` is the single authoritative baseline file.**
Its working duplicate was removed after a byte-identical SHA-256 check, so
there is never a question about which "baseline" is real. Every other results
file in this directory is prefixed `VOID-` and carries its rejection reason.

Recorded 2026-08-23. k=5, corpus date 2026-08-24 (Monday), campus timezone sent.
55 turns, ~7 minutes. Raw: `results-FROZEN-baseline-tx.json`.

**Do not regenerate these numbers after any fix.** The post-fix run writes to a
separate label and is compared scenario by scenario against this file.

| Category | Scored | Predicted |
| --- | ---: | ---: |
| Transportation | 15.0% | 84% |
| Ordinal | 50.0% | 80% |
| Discourse | 60.0% | 78% |
| Overall (these three) | 25.5% | 84% |
| Repeat consistency (k=5) | 54.5% | 68% |
| Grounding recall | 100.0% | 76% |

## Scenario level

| Pass | Scenario | All-k agreed | Expected |
| ---: | --- | --- | --- |
| 0% | tx-midday-0 | yes | 8:25 AM |
| 40% | tx-midday-1 | no | 2:05 PM |
| 0% | tx-midday-2 | yes | 6:10 PM |
| 0% | tx-boundary-before | yes | 3:10 PM |
| 0% | tx-boundary-exact | yes | 3:50 PM |
| 0% | tx-boundary-after | yes | 3:50 PM |
| 80% | tx-before-service | no | 7:00 AM |
| 0% | tx-after-service | yes | no further departures |
| 60% | tx-ordinal-next | no | 3:10 PM |
| 40% | tx-ordinal-miss-phrasing | no | 3:10 PM |
| 60% | tx-recall-spoken | no | the time stated in turn 1 |

## Root cause, recorded before the repair

Three distinct layers, deliberately separated so the model is not blamed for
what reaches it:

- **DATA contract defect A** — `/v1/search/shuttles` accepts and validates `at`
  and never passes it to `getShuttleTrips`
  (rockygpt-data/api/routes/search.ts). Retrieval is unfiltered by time.
- **DATA contract defect B** — called without `serviceDay`, the endpoint
  returns all three timetables interleaved and unsorted: 33 records mixing
  Weekday (12), Saturday (12) and Sunday (9). Measured, not inferred.
- **BRAIN tool defect** — `MAX_RECORDS_PER_CALL = 8` truncates a 12-trip
  weekday timetable from the front, with no signal to the model that records
  were dropped (rockygpt-brain-python/.../brain/tools.py:112).
- **Model behavior** — selects from the incomplete, unfiltered early-day slice
  it was given, and states departures that have already left.

`tx-before-service` scoring 80% while every mid-day and boundary case scores 0%
is consistent with this: it is the one scenario whose correct answer is the
first record in the truncated list.

**The correct answer was frequently absent from the model's context entirely.**
With `serviceDay=weekday`, the 12-trip timetable truncates to the first 8, so
4:40 PM, 6:10 PM, 8:20 PM and 9:40 PM are never visible. `tx-midday-2`
(expected 6:10 PM) and `tx-after-service` (expected "no further departures")
score 0% consistently because no reachable reasoning could have produced the
right answer. Without `serviceDay`, the first 8 of the interleaved 33 are:

```
10:00 AM Sunday    9:00 AM Saturday   7:00 AM Weekday    9:55 AM Saturday
11:00 AM Sunday    8:25 AM Weekday   11:00 AM Saturday  10:15 AM Weekday
```

Three weekday trips out of eight records, earliest-first. The model answered
"10:15 AM" to three different mid-day scenarios, which is the last weekday
departure it could see.

This reclassifies most of the transportation failures: they are **evidence
availability** failures, not model reasoning failures. That distinction matters
for the architecture question, because no amount of deterministic reasoning in
BRAIN recovers a record the tool layer removed before the model ran.

## Grounding presence is not evidence selection

100% grounding recall alongside 15% transportation correctness. Every wrong
answer carried `route: standard` and a real citation. Two separate concepts
are needed and the corpus now reports both:

- **Grounding presence** — did Rocky use evidence at all?
- **Evidence selection correctness** — did Rocky use the *right* evidence?

Rocky is currently excellent on the first and poor on the second for
transportation.

## Evidence-availability diagnostic

Captured against the *unfixed* DATA service, before any repair, by
reconstructing the model-visible slice: the same data call the tool makes, then
the same `MAX_RECORDS_PER_CALL = 8` cap. Raw: `availability-baseline.json`.

`withDay` = the model supplied `serviceDay`. `withoutDay` = it did not (the
argument is optional and the model is inconsistent about it, so availability
itself varies run to run).

| Scenario | Expected | Returned | Visible | withDay | withoutDay | Scored |
| --- | --- | ---: | ---: | --- | --- | ---: |
| tx-midday-0 | 8:25 AM | 12 | 8 | YES | YES | 0% |
| tx-midday-1 | 2:05 PM | 12 | 8 | YES | no | 40% |
| tx-midday-2 | 6:10 PM | 12 | 8 | **no** | no | 0% |
| tx-boundary-before | 3:10 PM | 12 | 8 | YES | no | 0% |
| tx-boundary-exact | 3:50 PM | 12 | 8 | YES | no | 0% |
| tx-boundary-after | 3:50 PM | 12 | 8 | YES | no | 0% |
| tx-before-service | 7:00 AM | 12 | 8 | YES | YES | 80% |
| tx-after-service | none | 12 | 8 | **no** | no | 0% |
| tx-ordinal-next | 3:10 PM | 12 | 8 | YES | no | 60% |
| tx-ordinal-miss-phrasing | 3:10 PM | 12 | 8 | YES | no | 40% |

**2 of 10** were unanswerable even in the best case. **8 of 10** were
unanswerable if the model omitted `serviceDay`.

### The one unambiguous reasoning failure

`tx-midday-0` is the only scenario where the correct record was visible under
*both* call shapes and the answer was still wrong on all five runs: at 7:07 AM,
with 8:25 AM in the evidence, Rocky answered 10:15 AM. That is a selection
failure with complete evidence in hand, and it is the only transportation
result in this baseline that speaks to reasoning rather than contracts.

Everything else is either unanswerable (2) or conditional on a tool argument
the eval cannot observe (7). Tool internals do not cross the service boundary
(`client.ts`), so the split between "model omitted serviceDay" and "model had
the evidence and chose wrong" is not recoverable from a black-box run. Closing
that gap needs a privacy-safe diagnostic field, not a bigger corpus.

## Hours evidence availability — the same defect, a different domain

Captured against unfixed DATA. Raw: `availability-hours-baseline.json`.

The data service returns 10 venues for a weekday; the tool boundary exposes 8.

| # | Venue | Visible without query | Visible with exact-name query |
| ---: | --- | --- | --- |
| 1-8 | Administrative Offices … Ramapo Bookstore | YES | YES |
| 9 | Rock Climbing Wall | **no** | YES |
| 10 | Sharp Fitness Center (Weight Room) | **no** | YES |

2 of 10 venues vanish whenever the model does not narrow with `q`. None remain
hidden when it narrows by published name.

This is the finding that generalises. Silent truncation at the tool boundary
hides tail records in **every** domain where the data service returns more than
`MAX_RECORDS_PER_CALL` rows, and whether the correct answer is reachable
depends on whether the model happened to narrow its query — a choice it makes
inconsistently and which nothing validates.

It is not a shuttle bug. It is a tool-result contract that permits arbitrary
truncation before semantic filtering, with no completeness signal to the
consumer.

Hours differs from transportation in one way that matters: narrowing by name
always recovers the record, so the model has a reliable escape it does not
always take. For shuttles, 2 of 10 scenarios were unrecoverable under *any*
argument choice, because time filtering did not exist at all.

## Deterministic-selection candidates — RESOLVED for transportation

Superseded by the A -> B -> C experiment (`RESULTS.md`). Kept for provenance.

| Capability | Status | Outcome |
| --- | --- | --- |
| `NEXT_DEPARTURE` | **REJECTED** | `tx-midday-0`, the pre-registered test, went 0% -> 100% under a DATA-contract repair alone. No brain logic was needed. |
| `ORDINAL_SELECT` | **REJECTED** | 50% -> 100% at state B with no brain change. |
| `OPEN_NOW` | Under test | Hours state B measures whether the same upstream pattern holds. |

The candidate table was built on a diagnostic that tested whether the correct
record was *present* in the model-visible evidence. It was, and the answer was
still wrong — which looked like proof of a reasoning failure. It was not: the
records were present but unsorted and mixed with distractors from two other
service days. Presence is not sufficiency.

---

# State A complete — hours and map

Recorded 2026-08-24, k=5 critical / k=3 broad, campus timezone sent, provider
healthy throughout. 0 error routes, 0 invalid scenarios in either run.
Frozen: `FROZEN-results-baseline-hours.json`, `FROZEN-results-baseline-map.json`.

| Category | Scored | Predicted | Consistency |
| --- | ---: | ---: | ---: |
| Hours | 49.9% | 86% | 65% |
| Map / entity (name) | 100.0% | 82% | 100% |
| Map / entity (action key) | 100.0% | 82% | 100% |

Grounding recall 100% in both.

## Map: no defect found

Verified against the standing instrumentation rule before interpreting: 0 error
routes, all `standard`, none invalid. `map-action` demands an exact
`locationKey` string match against the data service's own resolved key, across
27 runs — a lenient grader cannot produce that.

Entity resolution and location retrieval work. This was the highest-volume
category in the observed client traffic, and it is 18 points *above* prediction
rather than below. Nothing here argues for architectural change.

## Hours: a temporal-reasoning failure, not an availability failure

The two signals point in opposite directions, which is what makes this
conclusive.

**By venue — flat.** The two venues hidden past the tool's record cap score
45.3% and 56.0%, inside the range of the four fully visible ones (24.0-63.3%).
Availability is not the explanation; the model narrows with `q` often enough to
reach them.

**By probe type — a cliff.**

| Probe | Score |
| --- | ---: |
| at-open | 96.7% |
| mid-open | 77.8% |
| before-open | 63.3% |
| gap (between two windows) | 20.0% |
| after-close | 10.0% |
| **at-close** | **6.7%** |

Rocky reliably knows a venue is open when it is plainly open, and fails almost
completely at and after closing. `at-close` at 6.7% means it treats a window's
end as inclusive: asked at exactly the closing minute, it says "open".

This reproduces `schedule.ts`'s recorded observation directly — "called a gym
open at 10:30 while listing the two windows that exclude 10:30" — which the
`gap` probe measures at 20%. That claim moves from HISTORICAL to **MEASURED**.

## Why this is a stronger primitive candidate than next-departure

Unlike transportation: evidence availability is ruled out by the flat venue
distribution, grounding recall is 100% so the right schedule *was* retrieved,
and the failure concentrates in one identifiable operation — interval
containment at boundaries.

**But the admission rule (DESIGN.md §9.2) says repair upstream first.** The
data service returns `schedule` as a prose string (`"8:00am-9:30am and
11:30am-12:30pm"`) with no computed status, so the model is doing string
parsing plus clock comparison unaided. There is an upstream repair available
that is exactly parallel to the shuttle `at` defect: have the hours endpoint
compute `openNow` / `opensAt` / `closesAt` against the pinned `at` it already
accepts.

That repair must be measured before any BRAIN primitive is written. Hours now
has its own A → B experiment, and it is a better-posed one than transportation's
because availability has already been eliminated as a confound.

## Note on `availability-baseline.json`

The State A shuttle availability JSON was overwritten by a State B capture run
without `AVAILABILITY_LABEL` set, and renamed to `availability-state-b.json`.
The State A raw file is gone.

Nothing analytical is lost: the complete State A table — all ten scenarios with
expected departure, records returned, records visible, and presence under both
call shapes — is transcribed in the "Evidence-availability diagnostic" section
above, captured before any repair. It has deliberately **not** been
reconstructed into a JSON file, because a regenerated file would claim a
provenance it does not have.

`availability-hours-baseline.json` was unaffected and remains a genuine State A
capture.
