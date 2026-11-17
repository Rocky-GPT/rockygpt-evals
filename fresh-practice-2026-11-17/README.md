# Practice messages from seed rows, and the retest of the plain task line (2026-11-17)

A second practice set in the style of `fresh-practice-2026-11-16/`. It is **not** the blind 60
and was never mixed with it. It is a practice set: read it, change it, add to it.

It was written for one test: does a plain "How do I ...?" line, written by the first read, let
code answer more how-to messages from an answer card? The plan is at
https://claude.ai/artifact/7LLaS7wftDYBNYzvTUG147. **The test did not pass and nothing was
built.** The numbers are below, so the next person does not have to pay for them again.

## Who wrote it, and how

A separate writer thread wrote the 90 messages from `writer-brief.md` alone. The brief gives a
randomly drawn seed row for each message (an office, a kind of student, what just happened, the
time of year) and says nothing about how the bot decides anything.

Why seed rows: a first batch, written from the Nov 16 brief with new ids, came out half the same
as the Nov 16 set. A word count (nobody read the messages) found 10 of its 90 messages word for
word in that set and 12 more sharing most of their words. A writer given the same brief lands on
the same first ideas. That batch was not used and is not in this repo. In this set no message
shares 0.6 of its words with any earlier practice message, and the middle overlap (0.22) is that
of sets written apart.

Two limits. The writer was another Claude thread of this project and could see the project's
shared notes (they describe the earlier set in general terms and hold none of its messages).
And the seed rows spread the errands evenly over 21 offices, which is not how often real
students ask about each one. These errands are harder for the cards than the Nov 16 set: code as
built answers 3 of the 60 from a card (5 of 60 there).

## What is in `questions.json`

90 rows that `rocky bulk file` can read:

- 60 `how-to` messages (`E01` to `E60`): a student wants to get something done;
- 30 `other` messages (`F01` to `F30`): a plain fact, the student's own record, an opinion,
  events, people and courses, small talk. No card should answer these.

| field | meaning |
|---|---|
| `question` | Exactly what the student typed. |
| `who` | The student the writer imagined. |
| `wants` | How-to: the thing they want done. Other: the kind of message. |
| `measured.task_lines` | The plain line each of the read's 3 votes wrote (empty when it wrote none). |
| `measured.by_rule` | What the rule below did: `said` (code would answer from a card), `under_0.80` (the best card for the line scores under 0.80), `tie` (0.80 or more, but a second card is within 0.08), `reads_disagree` (fewer than 2 votes lead clearly to the same card), `not_near_own_words` (the card is not among the 3 best for the student's own words), `two_questions` (code counts more than one question), `no_line` (fewer than 2 votes wrote a line). |
| `measured.as_built` | Whether code on Brain dev answers the message from a card today, with no plain line. |
| `measured.best_card`, `score`, `lead` | The card the commonest line matches best, its score, and how far it leads the next card. |
| `measured.answered_from` | The card code would answer from, when `by_rule` is `said`. |

## The test

Dev release v2-20261116221526 (6,414 cards), Brain dev 782ca5c. The Brain's real first read ran
with one more tool field, `task`, on these 90 messages and on the 44 messages of
`fresh-2026-11-03/practice.json`; and as it is today on the 60 how-to messages. Three votes a
message, 582 calls, $0.0376 by the Brain's rates plus $0.0007 of embeddings. Nothing in the bot
changed.

The wording of the field and the rule were committed before these messages existed. The rule:
at least 2 of the 3 lines lead clearly (score 0.80 or more, lead 0.08 or more) to the same card
or a near-copy, that card is among the 3 best for the student's own words, code can say the card,
and code's own count finds one question in the message.

| check | bar | result |
|---|---|---|
| how-to messages code answers from a card | 12 of 60 or more | 9 of 60 (as built: 3) |
| a wrong card on the 30 other messages | none | 2 card answers, 1 of them off target |
| danger labels | unchanged | unchanged on all 60 messages read both ways |

The 9 answers, read by hand against the question (not against ramapo.edu):

| id | asked | answered from | read |
|---|---|---|---|
| E10 | move a transfer orientation date | Change your orientation date | right (the page was last changed in 2023) |
| E13 | set up direct deposit for a refund | Set up an online payment profile for direct-deposit refunds | right |
| E21 | change the car on a parking permit | Replace or swap a parking permit when changing vehicles or status | right |
| E31 | a friend staying over in my room | Register and host an overnight guest | right |
| E46 | library databases from home | Access subscribed databases and online journals off campus | right |
| E47 | the counseling form will not submit | Request ongoing individual counseling | right: it gives the phone number |
| E12 | change my meal plan to only dining dollars | Change your Spring 2027 meal plan | right on how, silent on whether such a plan exists |
| E06 | a career test to pick a major | Choose a major | partly: the card only mentions career tests |
| E43 | pay a late parking ticket online | Respond to a parking citation and pay any fine | partly: it says what happens to an unpaid fine, not whether it can be paid online |

The 2 answers on other messages: F24 "did my professors get my accommodation letters" got
"Request and activate accommodations for each class", which does not answer it (only the
student's record can). F29 "is there a specific person in student accounts for me ..." got
"Schedule a personal appointment" with the office's contacts, which is passable.

What the rest shows:

- The wording did its job: at least 2 votes wrote a line for all 60 how-to messages. An earlier
  wording, tested on the Nov 16 set, wrote one for 30 of 60 and got 5 card answers.
- The limit is on the card side. For 34 of the 60 the best card scores under 0.80, and by one
  reader's count about 27 of those errands have no card at all. 9 tie between two cards.
- The guards mattered. Four wrong cards were stopped only by them: E26 (a lost library book
  matched the library's collection policy), E35 (a deposit extension matched an old application
  page), E59 (help with notes matched study-skill links), F26 (a study abroad status question
  matched the admissions application card).
- The new wording writes a line for 14 of the 30 other messages too, mostly questions about the
  student's own record ("How do I check ...?"). That is where the off-target answer came from.
- Side effects on the read, same 60 messages: 1.42 s to 1.57 s (slowest of the 3 votes, middle
  message), $0.000186 to $0.000217 a message. Two single votes on one message disagree on some
  label in 31 of 100 pairs inside today's read and in 39 of 100 pairs between the two reads, so
  the new field moves the other labels a little more than they wobble by themselves.

## What it cannot say

- These are practice messages from a writer, not real students' chats.
- "Code answers" means the card match would let code write the answer. The first read's 3 model
  calls still come first.
- The script, the workflow and the full records are in the project's shared files
  (`answer-cards/task-line-retest-2026-11-17/`), not in this repo.
