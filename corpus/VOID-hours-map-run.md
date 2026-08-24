# VOID — hours/map baseline run of 2026-08-23

**These numbers must not be used.** Reported as
`hours 30.6% / map 0.0% / map-action 0.0%`, they measure a provider outage,
not Rocky.

- 202 of 345 runs returned `route: "error"` — "The model provider is unavailable."
- The upstream model provider began returning `429 Too Many Requests` at
  scenario index 28 and never recovered within the run.
- The brain's own rate limiter (`security/rate_limit.py`) then began returning
  429 to the eval as well, compounding it.
- Scenarios 0-27 (hours) completed before the outage. They are not salvaged:
  a partial category score is not comparable to a full one, and the whole
  category is re-run rather than stitched.

The frozen transportation baseline (`results-FROZEN-baseline-tx.json`) is
**unaffected** — verified 0 of 55 runs carried an error route, and only
`standard` and `ungrounded` appear.

## Why the number looked plausible

The runner graded an error response as a normal wrong answer. `client.ts`
converts a non-OK HTTP response into `{route: 'error', answer: 'The model
provider is unavailable.'}` rather than throwing, so the grader received that
string, found no expected time in it, and scored `fail`. An outage was
therefore indistinguishable from a brain that answers everything incorrectly.

Fixed in the runner: an `error` route is now `unscorable`, never `fail`; a
scenario with no scorable runs is excluded from category averages rather than
counted as 0%; and a run whose unscorable share exceeds a threshold aborts and
writes nothing.

## Other files in this directory marked VOID

- `VOID-results-smoke-no-timezone.json` — the first smoke run, taken before the
  runner sent `timezone`. The brain put a bare UTC timestamp in the system
  prompt and the model read it as campus local time, so every hours answer was
  four hours out. Measures a path production never takes; the browser always
  sends a timezone (`rockygpt-ui/app/page.tsx`).
- `VOID-results-smoke-k1.json` — a k=1 grader-validation run, never intended as
  a measurement.
- `VOID-run-hours-map.log` — console output of the outage run.

`results-FROZEN-baseline-tx.json` is the only authoritative baseline recorded
so far. `results-baseline-tx.json` is its identical working copy.
