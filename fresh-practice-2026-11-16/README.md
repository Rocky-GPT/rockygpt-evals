# Fresh practice messages, written without sight of the card rule (2026-11-16)

The one blind run of the answer cards plan (https://claude.ai/artifact/RFLL422vXcmnvWD17asNqE)
did not pass on 2026-11-16. One reason was the practice set the card rule had been set on
(`card-match-practice-2026-11-11/`): its writer had built the rule, so every question in it was
plain in exactly the way the rule wants. It said code answers 23 of 70 how-to questions; the
blind set said about 1 in 15.

This set is the replacement. It is **not** the blind 60 and was never mixed with it. It is a
practice set: read it, change it, add to it.

## Who wrote it, and how

A separate writer wrote the 90 messages from `writer-brief.md` alone. The brief asks for what
real students would type and says nothing about how the bot decides anything. The writer did not
read the Brain's code, the old practice set or the blind set.

One limit: the writer was another Claude thread of this project and could see the project's
shared notes, which say that two-sentence questions missed the cards. The brief does not
mention it, and the messages do not lean one way (27 of the 60 how-to messages are one
part), but a set from real students' chats would be better still.

## What is in `questions.json`

90 rows that `rocky bulk file` can read:

- 60 `how-to` messages (`A01` to `A60`): a student wants to get something done;
- 30 `other` messages (`B01` to `B30`): a plain fact, the student's own record, an opinion,
  events, people and courses, small talk. No card should answer these.

| field | meaning |
|---|---|
| `question` | Exactly what the student typed. |
| `who` | The student the writer imagined. |
| `wants` | How-to: the thing they want done. Other: the kind of message. |
| `measured.parts` | How many texts the search makes of the message: the whole message, then each longer sentence or "and how" clause, up to three. |
| `measured.questions` | How many of the message's sentences ask something. |
| `measured.cards_before`, `cards_after` | What the card gate did before and after the fix below: `said` (code answered from a card), `not_clear` (no card matched clearly), `not_reached` (the message never got to the card match). |
| `measured.matched_by` | Whether the card match used the whole message or its one question. |
| `measured.best_card`, `page`, `score`, `lead` | After the fix: the card that matched best, its page, its score, and how far it led the next card. |

## What was measured

Dev release v2-20261111224857 (6,459 cards), the whole chat path with the cards on.

**The card gate.** Before: a message reached the card match only when it was one part. After
(Brain dev, "Let a message with one question and some background reach its answer card"): a
message with exactly one question is matched by that question, and the card the whole message
matches best has to be the same card or a near-copy of it. The match rule itself did not change
(score 0.80 or more, lead 0.08 or more).

| | before | after |
|---|---|---|
| how-to messages code answers from a card | 2 of 60 | 5 of 60 |
| other messages code answers from a card | 0 of 30 | 0 of 30 |
| how-to messages that reach the card match | 19 of 60 | 37 of 60 |

The five answers, read by hand:

| id | asked | answered from | read |
|---|---|---|---|
| A14 | pay tuition monthly | Find tuition payment plan information | right, but thin: it says plans exist and gives the link |
| A41 | take 21 credits | Request a credit overload | right |
| A10 | laptop died, does the library lend laptops | Check out and use a loaner laptop | right (new) |
| A60 | put money on my account to print | Purchase additional printing credits | right (new) |
| A07 | roommate trouble, switch rooms mid-semester | Request a Spring 2027 room change | on topic, with the November 24 deadline, but not a mid-semester move (new) |

Why the other 55 how-to messages are not answered from a card, after the fix:

- 32 reach the match and match no card clearly. 24 score under 0.80 on their best card (the
  middle score of the 32 is 0.71; the plain questions of the old practice set scored higher).
  8 score 0.80 or more but lead the next card by less than 0.08: a second card scores almost
  as high.
- 7 ask two questions ("how do i cancel my housing and will i get charged for it"). A card
  answers one task, so these go to the page answer on purpose. Matched by one question alone,
  that message would have been answered from "Withdraw your fall housing request", for a
  student leaving in spring.
- 15 are held back by the gate's other conditions, which did not change. Most name a class, a
  program, a person, a club or an event, so another path reads them first. Which condition held
  each one was not recorded.
- 1 asks in words too short to search ("what do i do").

So sentence count was a small part of why the cards answer few real messages. The larger part is
that real wording does not match one card clearly.

**The sentence list a page answer picks from.** The same run counted what the two-stage page
answer offers the AI, before and after Brain dev's "Number a task entry once, in the page's own
words, for a two-stage answer". 52 of the 90 messages get that far with no model call (41 of
them how-to).

| | before | after |
|---|---|---|
| sentences offered, middle message (all 52) | 160.5 | 95.5 |
| sentences offered, middle how-to message (41) | 194 | 107 |
| lists cut off at the cap of 220 | 15 | 0 |
| lists holding a `(page: “…”)` quote | 51 | 0 |

## How it was measured, and what it cannot say

A free check: a temporary job on the rockygpt-data work branch downloaded the dev release, ran
the Brain's real chat path over the 90 messages, and refused every model call. Its one paid call
embedded the messages' parts: 2,175 tokens, $0.0003.

- The first read was off, so the counts say nothing about its three model calls. A real card
  answer still follows them. Do not read "code answers" here as "no AI call".
- With model calls refused, a message no code answers ends in an error. The check cannot say
  whether the page answers got better, only that the AI is now offered each task once. That
  needs paid calls.
- The five answers were read by one reader against the question, not against ramapo.edu.
