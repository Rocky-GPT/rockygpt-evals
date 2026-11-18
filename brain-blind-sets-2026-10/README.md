# Brain blind sets, October to November 2026

These 73 frozen question sets and their graded results came from `rockygpt-brain/evals/` on
2026-11-03, so all question sets live in this repository. Each folder keeps its frozen questions
(`questions-frozen.json` plus `.sha256`), its answers and its grading files, unchanged.

Every folder used to carry its own copy of `run_blind.py`. Those 72 copies were removed. To ask a
set again, use the workspace's one runner from the workspace root. It checks the frozen hash first
and saves rows in the same shape the graders read (`{...case, answered_at, seconds, body}`):

```
./rocky bulk file rockygpt-evals/brain-blind-sets-2026-10/blind-howto-20261102zl --brain 8013 --out /tmp/run.json
./rocky bulk file rockygpt-evals/brain-blind-sets-2026-10/blind-howto-20261102zl --prod --out /tmp/live.json
```

A set that has been run is spent as a blind check. Re-running it is a regression check, not a
blind one.
