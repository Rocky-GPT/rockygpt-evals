# Blind test, 2026-11-18 (second set, "18b"): 77 questions, frozen

If you build or tune the RockyGPT bot, do not read these files. This is a blind test.

**Frozen. Do not edit, reword or relabel.** `questions-frozen.sha256` holds the hash; the runner
refuses to start if the file changed. Dan asked for a fresh blind set, written, run once on the
live bot and reported (2026-11-18 17:12Z). Run once after the 11-18 fix release, report, stop.
No tuning to this set.

## What is in it

| Area | ids | count |
| --- | --- | --- |
| people | pp-01..15 | 15 |
| events and clubs | ec-01..15 | 15 |
| academics | ac-01..15 | 15 |
| how-to | ht-01..15 | 15 |
| not about campus | gn-01..17 | 17 |

- Written by five blind writer agents (no web, no bot code, data, fix plans or results), each shown
  only the earlier blind questions of its area (sets of 2026-11-02 and 2026-11-18, and the
  professor check) so it would not repeat them (`writer-brief-common.md`). Written in student
  texting style from the start; `clean_wording` keeps the plain version for graders.
- Then every question was compared word by word with about 6,000 older questions in this repo
  (all blind and practice sets); 12 that asked the same fact as an older one were swapped.
- Not about campus: general knowledge (5) and everyday advice (4) the bot should now answer (Dan,
  11-18), nonsense (2), can't-know (3), and mixed general + campus messages (3).
- 11 questions should be declined (topics `out_of_scope` and `cant_answer`).

## Answer key

`answer-key.json`: for each id, `expected`, `must_not`, `source`, `status` (found 39, partial 19,
not_on_site 1, decline 11, general 7) and `note`. Written by five checker agents with web access
following `answer-key-brief.md`, checked on live ramapo.edu 2026-11-18. Events answers were then
completed from the Archway events list (archway.ramapo.edu/events) and two course prerequisites
from catalog.ramapo.edu, both read in a browser because they need JavaScript. ramapo.edu is the
truth.

## Grade

Same verdicts as the earlier sets: correct, incomplete, wrong, declined_ok, declined_wrong,
asked_ok, asked_wrong; severity none / minor / serious. Good = correct, declined_ok or asked_ok.
Two graders per area, the worse verdict counts.
