# Blind set, four areas, frozen 2026-11-02

60 questions, 15 per area: people, events and clubs, academics, how-to. Written by four independent
writers who saw only their brief (see [writer-briefs](writer-briefs/)), never the bot's code or data.

**Frozen. Do not edit, reword or relabel.** `questions-frozen.sha256` holds the hash; the runner
refuses to start if the file changed.

**Not run yet. Wait for Dan's "run".** Then run it once, report, and stop.

## Run (once, on the laptop, Brain on :8013)

```
./rocky bulk file rockygpt-evals/tonight-2026-11-02/blind-four-areas --brain 8013 --out /tmp/blind-four-areas-results.json
```

From the workspace root (the one runner, `rocky bulk`; it checks the frozen hash first). Add
`--prod` instead of `--brain 8013` to ask the live site. Two questions at a time, the default
(four at once hit the 52 s turn limit). Each row keeps the full response and
`answered_at`, so graders can judge date questions ("tonight", "this week") against the day asked.
About $0.10 on Luna.

## Grade

- Two graders per batch of 15 (one batch per area); the worse of the two verdicts counts.
- Truth is ramapo.edu as captured in the release graph the Brain served. Same verdicts as the
  2026-11-02 how-to set: correct, wrong, incomplete, declined_ok, declined_wrong, asked_ok,
  asked_wrong, with severity none / minor / serious.
- Good = correct, declined_ok or asked_ok.

## Bar

- At least 90% good **in each area** (14 of 15).
- No answer graded wrong-and-serious by both graders.
- Report per-area scores and every miss as a known gap. No tuning to this set.
