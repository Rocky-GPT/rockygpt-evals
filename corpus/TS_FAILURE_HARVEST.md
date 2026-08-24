# Historical failure harvest — TypeScript brain

Claims recorded in `rockygpt-brain/src/*.ts` module docstrings, quoted as
written. These are **historical observations, not measurements**: no run,
dataset, or trial log backing them survives in the repository. Each is marked
with whether the new corpus has since reproduced it against the Python brain.

| # | Module | Claim as written | Status |
| --- | --- | --- | --- |
| 1 | `relation.ts` | Given the ordered list *and* the selected row, the model "answered with the row the student had just asked to move past, four times out of four". "Three different ways of writing that instruction changed nothing." | **Partially reproduced.** `tx-ordinal-next` 60%, `tx-ordinal-miss-phrasing` 40% (k=5). Not 0/4, but well below chance-free. |
| 2 | `relation.ts` | The phrasings that break it include "if I miss it", "the earlier one", "what about the second". | **Reproduced directionally.** The corpus scenario using the docstring's own phrasing ("If I miss that one, what's my next chance?") scored 40% vs 60% for "What about the one after that?" |
| 3 | `shuttle.ts` | "Left to the model this becomes clock arithmetic over a wall of times." | **Strongly reproduced.** Transportation 15% (k=5), with every boundary case at 0% and consistently so. |
| 4 | `schedule.ts` | The model produced "the library is currently open, it opens at 7:45 AM" at 7:00, and "called a gym open at 10:30 while listing the two windows that exclude 10:30". | Hours baseline in progress. The corpus contains the exact analogue: a between-windows probe on every venue publishing two windows. |
| 5 | `discourse.ts` | "asked which departure it had first mentioned, Rocky named a time that was in the rows but had never been spoken aloud — every time." | **Partially reproduced.** `tx-recall-spoken` 60% (k=5): the recall turn repeats a time other than the one turn 1 actually stated in 2 of 5 runs. |
| 6 | `structured-values.ts` | "A stop time moved to a different stop. A single dated row widened into a range the row does not give." | Not yet tested. Needs a response-faithfulness category. |
| 7 | `evidence-support.ts` | Citations "never proved the row says the thing being claimed" — a menu row with a calorie count answering which item is cheapest; library opening hours answering whether the library has a printer. | **Strongly reproduced in kind.** 100% grounding recall alongside 15% transportation correctness: every wrong departure carried a real citation. |
| 8 | `evidence-support.ts` | Making the reader also name the field carrying the claim "refused correct answers... a good reply was withheld three times out of three". | Not tested. Recorded as a warning against over-strict faithfulness checks. |

## What this changes

Claims 3 and 7 are no longer historical. They are measured properties of the
current Python brain, arrived at independently — the corpus was written from
the data contracts, not from this code.

Claims 1, 2 and 5 reproduce at lower severity than the docstrings report. That
difference is itself informative: the Python brain fails these *sometimes*,
where the TS-era observation was total. A capability that fails 40-60% of the
time is a different engineering problem from one that fails always, and it is
the profile that argues hardest for determinism — an intermittent wrong answer
is the kind users do not learn to distrust.

Claim 8 is the only one arguing *against* adding machinery, and it should be
carried into any response-faithfulness design.
