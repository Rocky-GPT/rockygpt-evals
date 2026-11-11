# Answer cards: practice set for "one card clearly matches" (2026-11-11)

Step 4 of the answer cards plan (https://claude.ai/artifact/RFLL422vXcmnvWD17asNqE): code answers
a how-to question from an answer card only when one card clearly matches the question. This is
the set the "clearly matches" rule was set on. It is **not** the blind 60 and was never mixed
with it. It is a practice set: change it or add to it freely.

`questions.json` has 90 rows that `rocky bulk file` can read:

- 70 `how-to` questions a student might type (`cm-how-01` to `cm-how-70`);
- 20 `look-alike` questions no card should answer (`cm-look-01` to `cm-look-20`): not a how-to
  ("when is spring break"), two asks in one, or nothing the campus pages cover ("how do i make
  pasta").

| field | meaning |
|---|---|
| `want` | A pattern the right card's task name or page address should match. `null` for a look-alike. |
| `measured.best_card`, `page` | The card that scored best on 2026-11-11, and its winning page. |
| `measured.score`, `lead` | That card's score against the question, and how far it led the next card. |
| `measured.rule_fires` | Whether the rule (score 0.80 or more, lead 0.08 or more) fires. |
| `measured.right_card` | Whether the best card matches `want` (`null` for a look-alike). |
| `measured.chat` | What the whole chat path did with the cards on: `said` (code answered from the card, no AI call), `not_clear` (no card led), `not_plain` (the question names a class, a program, a person, an event or a club, so another path reads it first), `too_long`, `date_changed`. |

## What was measured (dev release v2-20261111174533, 6,459 cards)

- The rule fires on 15 of the 70 how-to questions from a card code can answer, every one the
  right card, and on 0 of the 20 look-alikes. Three more clear the rule on a card code does not
  answer from (two need a look, one is a 13-line list).
- Through the whole chat path, code answered 10 of the 70 and 0 of the 20. Of the other 5: four
  name a class, a minor, credits or an advisor, so the catalog or people path reads them first;
  one (scholarships) has a deadline that passed, which the date rule now sees.
- A looser lead of 0.04 fires on 24 of 70, but then also on a look-alike ("when is the last day
  to withdraw") and on a doubtful one (an advisor appointment answered from a new-student
  orientation page).
- 38 how-to questions have no card that leads. Most have a good card that ties with a
  near-copy: "how do i get a parking permit" scores 0.905 on two cards. Fewer duplicate cards
  would raise the share more than a looser rule would.

## Running it

The numbers above cost about $0.0004 in all: the questions were embedded (a hundredth of a cent
per run) and no AI answer was written. A real run writes an AI answer for every question code
does not answer, about $0.07 for the set:

    ./rocky bulk file rockygpt-evals/card-match-practice-2026-11-11 --cards --out cards-on.json

`--cards` turns the answer cards on for the run (the Brain's setting is off). Under each reply,
`rocky ask "..." --cards` says whether code answered from a card, and why not.
