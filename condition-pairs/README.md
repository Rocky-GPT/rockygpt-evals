# Condition pairs (2026-11-19)

Pair questions that check whether RockyGPT keeps a condition the student gives (home or away,
which days, a range, a clock limit, a part of the day, a kind of event, or a condition the bot
has no field for). Plan: "🎯 Keep student conditions in answers", Dan chose "Build Steps 0 to 2
on dev" on 2026-11-19.

- `pair-set.json`: 60 groups, 142 versions (30 change_one, 20 same_meaning, 10
  nothing_fits_likely; 25 teams, 35 events). Written by a blind writer that saw only
  `WRITER-BRIEF.md`, never the code. Frozen: `pair-set.sha256` must match before any run.
- `unseen-40.json` (added after the build): 40 pairs from a second blind writer, written after
  the code was done, for the "36 of 40" bar.

Each version carries `slots`: the conditions a careful person reads in it. Runs are checked by
script, not by a grader: each game or event an answer lists is held to the labelled conditions
on the live data, and the two answers of a pair are compared (change one condition: they must
differ when the data differs; same meaning: they must list the same items; nothing fits: the
answer must say none).

These questions are open (not the sealed steady ruler). Do not tune code to their words: the
fix is the record of conditions, not word rules.
