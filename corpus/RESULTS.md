# A → B → C results

Run 2026-08-24. Same 11 scenarios, same graders, same corpus date, k=5.
Provider healthy throughout; 0 error routes, 0 invalid scenarios in any state.

| State | Change |
| --- | --- |
| A | none — frozen baseline |
| B | DATA repair: `at` filters to still-catchable trips, `serviceDay` defaults from `at`, results sorted |
| C | B + evidence integrity: envelope declares `returned`/`truncated`, prompt tells the model what that means |

## Scenario level

| Scenario | A | B | C |
| --- | ---: | ---: | ---: |
| tx-midday-0 | 0% | **100%** | 100% |
| tx-midday-1 | 40% | 100% | 100% |
| tx-midday-2 | 0% | 100% | 100% |
| tx-boundary-before | 0% | 100% | 100% |
| tx-boundary-exact | 0% | 100% | 100% |
| tx-boundary-after | 0% | 100% | 100% |
| tx-before-service | 80% | 100% | 100% |
| tx-after-service | 0% | 40% | **100%** |
| tx-ordinal-next | 60% | 100% | 100% |
| tx-ordinal-miss-phrasing | 40% | 100% | 100% |
| tx-recall-spoken | 60% | 60% | 80% |

## Category level

| | A | B | C |
| --- | ---: | ---: | ---: |
| Transportation | 15.0% | 92.5% | **100.0%** |
| Ordinal | 50.0% | 100.0% | 100.0% |
| Discourse | 60.0% | 60.0% | 80.0% |
| Overall | 25.5% | 90.9% | 98.2% |
| Consistency | 54.5% | 81.8% | 90.9% |
| Grounding recall | 100.0% | 94.0% | 100.0% |
| Evidence missing (serviceDay given) | 2/10 | 0/10 | 0/10 |
| Evidence missing (serviceDay omitted) | 8/10 | 0/10 | 0/10 |

## Attribution

**B did essentially all of the work.** Nine of eleven scenarios reached 100% at
B. A → B is a clean attribution: only the data service changed, and the one
category orthogonal to the change — discourse — did not move.

**C's marginal contribution is a single scenario and it is confounded.**
`tx-after-service` moved 40% → 100%; every other scenario was already at 100%.
C bundled two changes (completeness metadata and the prompt section that makes
it readable), so the improvement cannot be attributed to either half.
`tx-recall-spoken` at 60% → 80% is 3/5 → 4/5 at k=5 and is not distinguishable
from run-to-run variance.

The honest statement is that **C is unproven on this suite**, which was
predicted in advance: state B returns ≤7 shuttle records against a cap of 8, so
truncation had nothing left to damage. The informative test of C is hours,
where 10 records still meet a cap of 8.

## Answers

| Question | Answer |
| --- | --- |
| Does `select_next_departure()` earn its place? | **No.** The pre-registered test, `tx-midday-0`, recovered fully under a data-contract repair. |
| Does ordinal resolution need deterministic code? | **No.** 50% → 100% at B with no brain change. |
| Is B sufficient? | For transportation and ordinal, yes. 92.5% and 100%, with the residual being absence semantics rather than reasoning. |
| Do we need C? | Unproven here. Justified on the general argument in EVIDENCE_INTEGRITY.md and still to be measured against hours. |
| Is E — contracts and retrieval were the real issue — the strongest conclusion? | **For transportation, ordinal and map: yes.** |

## What the corrected diagnostic changed

`tx-midday-0` was reported before this run as the one unambiguous reasoning
failure: correct evidence visible under both call shapes, wrong 5/5. It scored
100% at B.

The availability probe tested whether the expected record was *present*. It did
not test whether the slice was *ordered*, or how many distractors from other
service days sat beside it. At 7:07 AM the model was handed eight unsorted
records drawn from three interleaved timetables; 8:25 AM was among them and so
was 10:15 AM.

"Correct evidence reached the model" must mean present **and correctly ordered
and free of misleading distractors**. The diagnostic checked one of three, and
on that basis a deterministic primitive was nearly justified that the data
proves was never needed.

## Still open

- **Hours — 49.9%**, with a clean probe-type cliff (at-close 6.7%, after-close
  10%, gap 20%, at-open 96.7%) and flat venue distribution ruling out
  availability. An upstream repair exists and is untested: have the hours
  endpoint compute `openNow`/`opensAt`/`closesAt` against the `at` it already
  accepts. That must be measured before any BRAIN primitive.
- **Discourse — 60-80%**, unmoved by contract repairs, as expected. Conversation
  truth is the one area no upstream repair addresses.
- **Absence semantics.** `tx-after-service` needed an empty result to be
  legible as "no trips left today" rather than "lookup failed".

---

# HOURS — A → B

Run 2026-08-24, k=5 critical / k=3 broad, 31 scenarios, 143 turns per state.
Both states graded with the **same corrected grader**, applied offline to stored
transcripts. 0 provider errors in either run.

| State | Change |
| --- | --- |
| A | data service returns `schedule` as prose only |
| B | data service computes `openNow` / `opensAt` / `closesAt` / `statusReason` against the `at` it already accepted |

## By probe type

| Probe | A | B | delta |
| --- | ---: | ---: | ---: |
| at-open | 93.3% | 100.0% | +6.7 |
| mid-open | 83.3% | 100.0% | +16.7 |
| before-open | 70.0% | 100.0% | +30.0 |
| gap (between windows) | 100.0% | 100.0% | 0.0 |
| after-close | 72.5% | 96.7% | +24.2 |
| **at-close** | **6.7%** | **83.3%** | **+76.7** |

| | A | B |
| --- | ---: | ---: |
| Overall (readable answers) | 74.4% | **99.4%** |
| Overall (hedged answers counted as failures) | 66.0% | 98.1% |
| Consistency | 53.8% | 96.7% |
| Unreadable / hedged runs | 22/143 (15%) | 2/143 (1%) |

## Caveat on the A number

State A was scored by three successive grader versions — 56.8%, 79.0%, 74.4% —
as defects in the grader were found and fixed. **A is the less reliable
measurement.** Its answers hedge often ("it is not open right now *if* the
current time is…"), and 15% could not be read at all; those are excluded from
the readable-only figure, which inflates it. The hedged-as-fail column is the
conservative bound.

The B number has been stable and has a 1% unreadable rate. The comparison
survives every grader version tried: B is decisively better under all of them.

## Interpretation

`at-close` is the headline. **+76.7 points from deciding interval semantics in
code.** State A left "open until 4:30pm — is it open at 4:30?" to the model,
which answered "open" almost every time. State B fixes the convention as
half-open `[start, end)` in `src/data-v2/schedule-status.ts` and the question
stops being a judgement call.

`gap` scored 100% in both, which contradicts the earlier reading that the
between-windows case was a distinctive weakness. That earlier 20% was a grader
artifact. The `schedule.ts` docstring claim about a gym called open at 10:30
therefore **remains HISTORICAL and is not reproduced** — the correction matters,
because it was previously reported as measured.

## Admission-rule verdict

Hours B is at 99.4%. Per DESIGN.md §9.2, a deterministic BRAIN primitive is
admitted only if the failure survives the upstream repair.

**`schedule_status()` in BRAIN is REJECTED.** The computation belongs at the
data/capability boundary, where it now lives. The model consumes a structured
status and communicates it.

The single surviving failure is one run of `hours-sharp-fitness-center-after-close`,
where the model answered from a *Sunday* schedule for a Monday scenario — a
retrieval/day-selection slip, not interval arithmetic, and one run out of five.

---

# DISCOURSE — baseline

Run 2026-08-24, k=5, 8 scenarios, 120 turns. 0 transport failures, 0 unreadable.
History truncated to the last 10 entries, mirroring the browser.

| Scenario | Score | All-k agreed | Correct conversational evidence available? | Failure category |
| --- | ---: | --- | --- | --- |
| `dsc-immediate-recall` | 100% | yes | yes | — |
| `dsc-ordinal-first` | 100% | yes | yes | — |
| `dsc-ordinal-previous` | 100% | yes | yes | — |
| `dsc-entity-focus` | 100% | yes | yes | — |
| `dsc-false-claim-recall` | 100% | yes | yes | — |
| `tx-recall-spoken` | 100% | yes | yes | — (see below) |
| `dsc-conversation-truth` | **20%** | no | **yes** — 4 history entries, cap is 10 | **conversation truth** |
| `dsc-topic-shift-recall` | **0%** | yes | **no** — turn is outside the 10-entry window | evidence availability |
| Overall | 77.5% | 87.5% consistency | | |

## `tx-recall-spoken` passes for the wrong reason

It scored 60% / 60% / 80% across states A/B/C and 100% here, and none of that is
evidence of conversation memory. It does not advance the clock, so what Rocky
*said* and what is *currently true* are the same value. Re-querying the tool
produces the right answer without remembering anything.

`dsc-conversation-truth` exists to force them apart, and it does: the clock
advances 200 minutes, so the departure that is next at the end of the
conversation is a different trip from the one named at the start.

## `dsc-conversation-truth` — 20%, the real failure

Two failure modes, both wrong:

- **Substitution.** "The next Weekday Roadrunner Express shuttle departs at
  12:20 PM…" — asked what it had *said*, Rocky re-queries and reports what is
  true *now*. Turn one said 10:15 AM.
- **Fallback.** "I'm sorry, I wasn't able to put together a reliable answer."
  The grounding rule requires a current-turn `sourceId` for any campus factual
  claim; a claim about the conversation has no such source, so the turn falls
  back rather than answering.

The fallback is the more interesting one. Rocky is not failing to remember — the
transcript is right there in four history entries against a cap of ten. It is
failing because **the architecture has no category for "a claim about what I
said"**, so such a claim is treated as an unsourceable campus fact and refused.

## `dsc-topic-shift-recall` — 0%, and not a model failure

Every run returned the fallback. By the final turn the shuttle exchange has been
pushed out of the ten-entry window by five intervening topics, so it is not in
the request at all. No prompt or model change reaches this; the information is
absent before inference starts.

Conversation memory is a sliding window of ten raw transcript entries — five
exchanges — capped in `schemas/chat.py` and filled by the browser walking
backwards (`rockygpt-ui/app/page.tsx` `buildRequestHistory`). Menu listings and
club rosters compete for the same ten slots as the fact worth remembering.

---

# DECISIONS

## Deterministic functions that earned admission

**One.** A record of what Rocky said, and the rule that questions about the
conversation are answered from it rather than from a fresh tool call.

Admission-rule trace (DESIGN.md §9.2):

1. *Reproduced* — `dsc-conversation-truth`, 20% at k=5, inconsistent.
2. *Correct evidence reached the model* — turn one's text was in the request,
   4 history entries against a cap of 10. Verified, not assumed.
3. *Upstream repaired first* — **no upstream repair exists.** No change to the
   data service makes a system remember what it said. This is the one category
   where the contract cannot be the answer.
4. *Rerun* — not applicable.
5. *Survives* — yes.

What is actually deterministic is small: storing the claim, and looking it up.
The classification "this question is about the conversation" stays with the
model, exactly as `relation.ts` split it. Concretely:

- a server-side record of what was said, keyed by visitor **and** conversation
  (a conversation id alone is a client-supplied value)
- rendered into the prompt under its own heading, separate from evidence, with
  the rule that a retrieved row is not proof it was ever spoken
- a route for claims about the conversation, so the grounding rule stops forcing
  a fallback on a question that has no campus source by nature

## Deterministic functions rejected

| Function | Why |
| --- | --- |
| `select_next_departure()` | `tx-midday-0` 0% → 100% under a DATA-contract repair. |
| Ordinal/relation primitive | Ordinal 50% → 100% at state B with no brain change. The list was mis-ordered; the traversal was never broken. |
| `schedule_status()` in BRAIN | Hours 74.4% → 99.4% by computing status at the data boundary. `at-close` alone moved +76.7. |

Three candidates, all rejected, all because the upstream contract was the defect.

## DATA / capability changes justified

| Change | Evidence |
| --- | --- |
| `at` filters shuttle retrieval; `serviceDay` defaults from `at`; results sorted | transportation 15.0% → 92.5% |
| Hours endpoints compute `openNow` / `opensAt` / `closesAt` / `statusReason`, half-open `[start, end)` | hours 74.4% → 99.4%, `at-close` +76.7 |
| Empty result must be legible as "no service left today" rather than a lookup failure | `tx-after-service` 0% → 40% at B, 100% at C |
| Tool envelope declares `returned` / `truncated` | Justified by argument and by two measured availability failures; **not** isolated by a controlled run. |

## BRAIN / discourse changes justified

| Change | Evidence |
| --- | --- |
| Server-side record of assistant claims | `dsc-conversation-truth` 20% |
| A route for conversation claims that does not require a campus `sourceId` | Fallback is the dominant failure mode in that scenario |
| Structured claims instead of raw transcript in the window | `dsc-topic-shift-recall` 0% — the turn is evicted by five unrelated exchanges |

## Still unresolved

- **The record cap's value.** State C moved one transportation scenario and
  bundled a prompt change with the metadata, so its contribution is not
  attributed. Hours never tested it: state B made the answer reachable without
  more records. Whether `MAX_RECORDS_PER_CALL = 8` needs to change is unmeasured.
- **Hours state A is a range, not a point** — 56.8% / 79.0% / 74.4% across three
  grader versions, 15% of answers unreadable. Only the comparison is robust.
- **`gap` is not a weakness.** 100% in both hours states. The earlier 20% was a
  grader artifact, and `schedule.ts`'s gym-at-10:30 claim is **not reproduced**;
  it returns to HISTORICAL.
- **Real-traffic coverage** remains UNRESOLVED: 35 client questions, 13 distinct,
  one day, all test traffic.
- **Architecture C** has no supporting evidence and no experiment run against it.
- **Multi-domain planning** untested.

## Architecture status

| | Status |
| --- | --- |
| A — AI-heavy agent unchanged | Rejected: contracts and evidence needed work. |
| B — AI router + deterministic capabilities | **Strongly supported.** Every transportation and hours failure resolved here. |
| C — universal parser + workflow brain | Not justified. Nothing measured argues for it. |
| D — per-capability hybrid | Consistent with the results, and what the discourse admission implies: one domain gets brain-side state while the rest stay capability-shaped. |
| E — fix contracts and retrieval, not reasoning | **Proven for transportation, ordinal, hours, and map.** |

The measured shape is E for every closed-world domain, plus a narrow B/D
exception for discourse, which is the only place where no contract repair
exists.

---

# DISCOURSE — fallback root cause and fix

| Scenario | before | v1 | fixed |
| --- | ---: | ---: | ---: |
| topic-shift recall | 0% | 100% | 80% |
| false-claim recall (strict) | 0% | 80% | 100% |
| conversation truth | 20% | 80% | **100%** |
| immediate recall | 100% | 100% | 100% |
| ordinal previous | 100% | 100% | 100% |
| entity focus | 100% | 100% | 100% |
| tx recall spoken | 100% | 80% | 100% |
| ordinal first | 100% | 80% | 100% |
| **overall** | 65.0% | 90.0% | **97.5%** |
| **consistency** | 87.5% | 50.0% | **87.5%** |
| **fallbacks** | 7/40 (17.5%) | 3/40 (7.5%) | **0/40 (0%)** |

## Root cause

Traced, not guessed. Fallback branches were given a fixed vocabulary and the
reason persisted to `debug_info`; across 288 + 180 diagnostic turns exactly one
branch ever fired, and it split into two causes:

- **`submit_malformed:unknown:value_error`** — an empty error `loc` with a
  `value_error` can only be the single model-level validator,
  `_ungrounded_carries_no_citations`. The model submitted a route meaning "no
  campus source" (`ungrounded` or `conversation`) while attaching
  `citedSourceIds`, and the whole turn was discarded over a mislabeled field.
  Adding `conversation` to that validator widened a destructive path exactly as
  the new route came into use — it was selected 55 times per run.
- **`submit_citation_unresolved`** — the model cited a `sourceId` the turn never
  produced. Deliberate and security-relevant (THREAT_MODEL 3.4).

Four of the seven hypotheses were killed outright by the traces: route
classification was stable, `finalize` never downgraded a conversation answer,
the model recognised conversation-truth questions, and no valid conversation
claim was rejected for lacking a source.

## Fix

Two changes, both symmetric with a decision already documented in the codebase —
that rejecting a submission "is a heavy price for a mislabeled route when the
answer text itself is fine."

1. **Route/citation mismatch normalises instead of rejecting.** The raising
   validator is gone; `finalize.finalize` drops the contradictory citations and
   keeps the answer. Only ever in the conservative direction: a route claiming
   nothing was verified is never promoted to one claiming it was.
2. **One correction before abandoning a turn to an unresolved citation.** The
   retry names the `sourceId`s that do resolve. The guarantee is untouched — an
   id the turn never produced is still never accepted.

## Residual

`dsc-topic-shift-recall` at 4/5. The miss is not a fallback (0 in the run): on
one repetition the model answered the previous topic instead of recalling the
shuttle. One run at k=5 is within noise of v1's 5/5 and is not treated as a
regression, but it is the scenario to watch.
