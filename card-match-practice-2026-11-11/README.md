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

## After near-copies (same day, same release)

The fourth point was fixed without joining more cards. Each card now names its near-copies: the
cards that pass every join rule at a lower average (0.78 alike, no pair under 0.70), which is
one task worded apart on two pages. A card no longer has to lead those. Of a card and its
near-copies within the lead, the page said is the best match's, unless a near-copy is on a page
that is not old while the best match's is, or on the own page of an office that handles both.

- The rule alone fires on 25 of the 70 how-to questions (14 before, with the cards rebuilt that
  day) and still on 0 of the 20 look-alikes.
- Through the whole chat path, code answers 16 of the 70 (10 before) and 0 of the 20. The six
  new ones: parking permit, change my meal plan, apply for financial aid, campus wifi,
  emotional support animal, campus tour. The other nine name a class or a major ("how do i
  withdraw from a class"), so the catalog's pick runs first; the free check refuses that AI
  call, so it cannot show whether the card answers after it.
- Whose page is said was set by reading 51 cases with each candidate's answer side by side.
  The best match alone gave the weaker page in 4 of 11 practice cases ("connect to the campus
  wifi" from a 2021 FAQ). The join's finer rules, newest date and most steps, picked wrong
  pages across cards, so they are not used.
- Known weak answer: "how do i schedule a campus tour" comes from a page that still mentions
  COVID-19 guidelines, while a near-copy has the registration link. Both are current
  Admissions pages.

The `measured` fields in `questions.json` are from the first measurement, before near-copies.

## Running it

The numbers above cost about $0.001 in all: the questions were embedded (a hundredth of a cent
per run) and no AI answer was written. A real run writes an AI answer for every question code
does not answer, about $0.07 for the set:

    ./rocky bulk file rockygpt-evals/card-match-practice-2026-11-11 --cards --out cards-on.json

`--cards` turns the answer cards on for the run (the Brain's setting is off). Under each reply,
`rocky ask "..." --cards` says whether code answered from a card, and why not.
