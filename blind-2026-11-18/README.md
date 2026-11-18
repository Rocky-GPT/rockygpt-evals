# Blind test, 2026-11-18: 77 questions, frozen

If you build or tune the RockyGPT bot, do not read these files. This is a blind test.

**Frozen. Do not edit, reword or relabel.** `questions-frozen.sha256` holds the hash; the runner
refuses to start if the file changed. **Run once (Dan said "run" 2026-11-18 13:33Z), report, stop.
No tuning to this set.**

## What is in it

| Area | ids | count |
| --- | --- | --- |
| people | pp-01..15 | 15 |
| events and clubs | ec-01..15 | 15 |
| academics | ac-01..15 | 15 |
| how-to | ht-01..15 | 15 |
| not about campus | gn-01..17 | 17 |

- Campus questions: four blind writers (no web, no bot code or data), new personas, the old
  blind 60 of their area shown only so they would not repeat it. Six that were too close to the
  October sets were swapped.
- Not about campus (Dan 11-18): general knowledge the bot should answer, life advice that should
  also point to real Ramapo clubs, offices or upcoming events, nonsense, things no bot can know,
  and two mixed messages. gn-16 and gn-17 are Dan's own examples.
- Every question was then rewritten the way students text (slang, short forms, typos), at Dan's
  ask. `clean_wording` keeps the plain version for graders.
- 13 questions should be declined (topic `out_of_scope` or `cant_answer`).

## Answer key

`answer-key.json`: for each id, `expected` (what a good answer says), `must_not`, `source`
(ramapo.edu pages read 2026-11-18), `status` (found 37, partial 19, not_on_site 3, decline 13,
general 5) and `note`. Written by checker agents with web access, following
`answer-key-brief.md`. ramapo.edu is the truth; when the graph the bot served disagrees with the
key, graders note it.

## Grade

Same verdicts as the 11-02 blind set: correct, incomplete, wrong, declined_ok, declined_wrong,
asked_ok, asked_wrong; severity none / minor / serious. Good = correct, declined_ok or asked_ok.
For `general_knowledge`, a refusal is declined_wrong (Dan wants these answered). For
`life_advice`, good means tips plus at least one real Ramapo club, office or event.
Two graders per area, the worse verdict counts.
