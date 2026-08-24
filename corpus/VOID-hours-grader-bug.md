# VOID — both hours runs, grader defect

Reported `hours A 49.9%` and `hours B 53.5%`. **Neither number is usable.**

## The defect

`statesOpen()` decided what an answer claimed by scanning the whole text for
"open" and "closed". Answers routinely contain both:

> "The Auxiliary Gym is currently closed. It is currently between these time
> windows."   — scored 0%, and it is exactly right

> "The Administrative Offices are currently closed. They open at 8:30 AM and
> close at 4:30 PM today."   — scored 20%, also right

Finding both words, the function returned "ambiguous", and the grader treated
ambiguous as **fail**. Correct answers were recorded as wrong.

## Why the delta looked like a regression

State B gives the model computed `openNow` / `opensAt` / `closesAt`, so its
answers describe both the current status *and* the upcoming window. Richer
answers contain both words more often, so the better system graded worse:

| Probe | A | B | apparent |
| --- | ---: | ---: | ---: |
| before-open | 63.3% | 26.7% | −36.7 |
| gap | 20.0% | 0.0% | −20.0 |

A repair cannot make a system worse at the thing it repairs. That inversion was
the signal.

## Fixes applied

1. **Currentness decides.** An assertion carrying "currently", "right now", "at
   the moment" is the status claim, wherever it appears. Only without such a
   marker does the first copula-linked status word count, and then only if it
   is not introducing a time range ("is open **from** 9:00 AM to 5:00 PM"
   describes a schedule, not this moment). Validated against 11 real answer
   strings covering both phrasing orders.
2. **Ambiguous is now `unscorable`, never `fail`.** With the existing >10%
   unscorable abort, a future grader defect stops the suite instead of quietly
   reporting a low score.
3. **Every answer from every repetition is now stored** in the results file. A
   grader fix can be replayed against a completed run offline. Had this existed,
   neither hours run would have needed re-running.

## Consequence

Per the protocol in EXPERIMENT.md — an eval bug invalidates every run after the
last known-good state — hours A and hours B are both discarded and re-run from
A. Re-running A requires reverting the DATA hours change first, since State A is
defined by prose-only schedules.

The transportation A/B/C results are **unaffected**: they are graded by
`statesTime`, which matches specific clock values and was never involved.
