# Follow-up questions practice set (2026-11-11)

Step F0 of the plan "Follow-up questions for vague asks"
(https://claude.ai/artifact/HdMjBibQKVQ3nTMDQK117B): the bot asks one short follow-up question
when a question is vague, and code decides when, from the answer cards.

40 short conversations, written before any code for the plan and before the answer cards exist:

- 20 where the bot **should ask** one follow-up, each with the student's reply and the right
  answer after it;
- 20 **look-alikes** that sound the same and must **not** get a question back.

## Why the file has 60 rows

`rocky bulk` sends a conversation as `first message || next message` and keeps only the **last**
reply. A "should ask" conversation needs two replies checked (the question, then the answer), so
each one is two rows:

| group | rows | what is sent | the last reply should be |
|---|---|---|---|
| `ask` | `fu-ask-01` to `fu-ask-20` | the first message alone | one short follow-up question |
| `reply` | `fu-reply-01` to `fu-reply-20` | the same first message, then the student's reply | the right answer for what the student replied |
| `look` | `fu-look-01` to `fu-look-20` | a look-alike (1 to 3 messages) | an answer, with no question |

`fu-ask-NN` and `fu-reply-NN` are the same conversation (`pair` holds the number).

| field | meaning |
|---|---|
| `ask` | The kind of follow-up. `kind`: one task whose steps change by kind of student (7 pairs). `one`: the words fit 2 to 4 different tasks (13 pairs). |
| `axis` | For `kind` asks: `where_you_live`, `level` (undergraduate or graduate) or `how_you_came_in` (first-year, transfer, international). |
| `choices` | What the follow-up should offer, in any wording. `choices_optional` may be offered too. A "Show both" choice is fine on `kind` asks. |
| `reply_means` | Which choice the student's reply stands for. Many replies never use the choice's own words (see "Open points"). |
| `rule` | For look-alikes: the rule that says "do not ask" (table below). |
| `good_reply` | The facts a good reply gives. |
| `must_not` | What makes the reply wrong. |
| `note` | Page conflicts and other things a grader should know. |
| `pages` | The ramapo.edu pages the facts were read from. |

## The look-alike rules

| `rule` | rows | why the bot must not ask |
|---|---|---|
| `kind_in_message` | 4 | The message already says the kind, in the student's own words ("i live in laurel hall", "Sophomore here"). |
| `kind_earlier_in_chat` | 3 | The student said the kind earlier in this chat. |
| `small_difference` | 3 | The kinds differ by a line or two, so one answer says both. |
| `date_only` | 2 | The only split is the term. Code goes by the day it is asked. |
| `safety_first` | 3 | Emergencies never get a question. Health and safety answers come first. |
| `students_default` | 1 | Students are the default. The bot never asks "student or guest?". |
| `one_clear_task` | 2 | The words fit one task. Nothing to ask. |
| `one_follow_up_only` | 2 | The bot already asked once in this chat about this question. It never asks twice. |

## Bars (the plan's step F2)

- A follow-up question on at least **18 of the 20** `ask` rows.
- A question on **none of the 20** `look` rows.
- A right answer on at least **18 of the 20** `reply` rows.

## Run

From the workspace root, against a laptop Brain:

```
./rocky bulk file rockygpt-evals/follow-up-practice-2026-11-11 --brain <port> --out <file>
```

About $0.10 a run on Luna (60 rows, 86 messages). `rocky bulk` refuses to run if `questions.json`
no longer matches `questions.sha256`.

**The baseline has not been run.** It needs a Brain that can use Luna: the laptop Brain, or the
live site with `--prod`. Cloud threads can reach neither (the proxy blocks the live site), so it
has to be run from the Mac. Run it once on today's bot before step F2, so the before and after
can be compared.

## Grade

Same verdicts as the blind set: correct, wrong, incomplete, declined_ok, declined_wrong, asked_ok,
asked_wrong, with severity none / minor / serious.

- `ask` rows: good = `asked_ok`. That means one short question that offers the `choices`. A
  question about something else ("which office?") is `asked_wrong`. A reply that answers every
  choice correctly without asking still misses the bar, but list it apart from wrong answers: it
  is long, not wrong.
- `reply` rows: good = `correct`. A second question is `asked_wrong`.
- `look` rows: good = `correct`. Any question is `asked_wrong`.

Dates: the date answers are written for 2026-11-11 and stay right as written until 2026-11-24, the
first listed date to pass. After that, grade against the graph the Brain served on the day asked
(`answered_at`): a date that has passed must never be given as still open.

## How it was written

- **Situations and expected replies**: picked by the plan's author from real task data, the
  one-time page read of 2026-10-21 (8,710 tasks on 2,574 pages). Each `kind` pair is a real task
  whose steps differ by kind of student. Each `one` pair is a real set of 2 to 4 tasks that one
  everyday word fits.
- **The students' words**: written by a separate writer that saw only a brief
  ([writer-brief.md](writer-brief.md)): no pages, no expected replies, nothing about how the bot
  decides.
- **Facts**: read from the pages' own words in the 2026-10-21 read, then checked against the live
  bot's data of 2026-11-07 (release `v2-20261107105629`). 386 of the 398 page quotes used were
  unchanged. The ones that changed are in the rows' `note` fields and in the list below.
- **No leaks from frozen sets**: no student message shares a 4-word run with the frozen blind 60,
  the frozen messy-students set or the frozen fresh check set (checked by script, without reading
  their expected replies). The parking permit rows are on the same topic as one blind question,
  because parking is the example Dan gave for this feature. The wording is different.

## Honest limit

The person who wrote the plan picked the situations and wrote the expected replies, so this set is
not blind. It is a practice set: `questions.sha256` guards it against edits, and it is not frozen,
so the Repeat Test page can run it. The 20 "should ask" situations are the ones that were easy to
see in the task data, so real vague questions will be more varied than these. Passing the bars is
the floor, not proof. A miss means fix its cause for every question of that kind, never that one
question.

## Pages that disagree (found while writing)

These are data findings. No row's `good_reply` depends on one side of them.

| topic | one page says | another page says |
|---|---|---|
| Sales tax on a commuter's parking fee | 7% (Public Safety, parking permits) | 6.63% (Student Accounts, parking) |
| Credits that must be taken at Ramapo to graduate | at least 48 (Registrar, graduation) | the final 32 (catalog, graduation requirements) |
| Housing deposit due date for Fall 2027 | February 1, 2027 (Residence Life) | "by February 2" (Student Accounts, deposits) |
| Can commuters take part in housing selection? | yes, with the deposit (Student Accounts) | no (Residence Life) |
| What a Health Services visit costs | free for enrolled students | billed to insurance (page written after Valley Medical Group took over) |
| Spring 2027 insurance and parking waiver deadline | February 19, 2027 (as read 2026-10-21) | February 26, 2027 (the same pages in the 2026-11-07 data) |

## Open points for the build (found while writing)

1. **Replies rarely use the kind's own words.** "i drive in from home every day" (commute),
   "hs senior" and "straight out of high school" (first-year), "I'm coming from a New Jersey
   community college" (transfer), "im in a masters program" (graduate), "I'm a junior working on
   my bachelor's degree" (undergraduate). The word list that reads a reply has to cover these.
2. **Kinds said sideways in the question.** A hall name means lives on campus; a class year
   (sophomore, junior) means undergraduate.
3. **Leave of absence against medical leave.** The tie rule says ask which one. The health rule
   says answer first. The two pull apart here, so the item was left out of the set. It needs a
   decision before step F2.
4. **Near-twin tasks.** Lost ID card and damaged ID card are two tasks that differ by one line
   (`fu-look-10`). The "say both" rule is written for kinds of student. It should cover tied tasks
   this small too, or the bot will ask a question nobody needs.
5. **Replies that do not pick one.** "all of them" (`fu-look-19`) and "never mind" plus a new
   question (`fu-look-20`).
6. **Weak ties.** `fu-ask-19` (locker) is the weakest of the 13: a person might just guess the
   rental. It is in the set to help set the cut-off for "the words fit equally".
7. **The runner keeps only the last reply.** In `fu-look-07`, `fu-look-19` and `fu-look-20` the
   first reply should be a follow-up question, and that reply is not checked. A later runner
   option that keeps every reply would let one row check both.
