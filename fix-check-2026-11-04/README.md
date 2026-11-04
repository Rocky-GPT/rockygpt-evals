# Check set for the blind-miss fixes (2026-11-04)

60 questions, 15 per area (people, events and clubs, academics, how-to), written before any code
for the plan "Fix plan for the blind-test misses". They are the same kinds as the 19 misses of the
2026-11-04 blind run, asked about other offices, programs, policies, months and events, plus a few
questions code answers today (person, course, hours, phone, shuttle) to catch anything the fixes
break.

None is a blind question or a rewording of one. The set shares no 4-word run with the frozen blind
set, the frozen fresh check set, `practice-b.json` or `practice-c.json` (checked by script; the
frozen check set was compared by script without reading it).

| field | meaning |
|---|---|
| `good_reply` | The facts a good answer gives, read from the 2026-11-03 release graph (ramapo.edu pages as captured). |
| `must_not` | What makes the answer wrong or incomplete. |
| `tests` | The cause the question exercises (`leader_on_other_page`, `who_teaches`, `month_window`, `policy_across_sections`, ...). |
| `fixes` | The plan's fix numbers that should make it pass. |

Honest limit: the person building the fixes wrote this set, so it is not blind. `questions.sha256`
guards it against edits (`rocky bulk` refuses a changed file). A miss means fix its cause for every
question of that kind, never that one question. It is not frozen, so the Repeat Test page can run it.

Dates: event, deadline and "today" answers assume the set is asked between 2026-11-04 and
2026-11-08. Grade them against the graph the Brain served on the day asked (`answered_at`), not
against `good_reply` alone.

## Run (laptop Brain, diagnostics on)

```
./rocky bulk file rockygpt-evals/fix-check-2026-11-04 --brain <port> --repeat 5 --parallel 8 --out <file>
```

From the workspace root. Eight at a time matches the Repeat Test page. About $0.40 per run of
300 answers on Luna.

## Grade

Same verdicts as the blind set: correct, wrong, incomplete, declined_ok, declined_wrong, asked_ok,
asked_wrong, with severity none / minor / serious. Good = correct, declined_ok or asked_ok.

Each run reports the first-try score per area, how many questions give the same facts in every
try, timeouts, and seconds per answer.
