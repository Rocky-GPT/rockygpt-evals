# Old vs new, on the same questions

Two Brain versions answer the same frozen questions; Luna grades every answer against the set's key
with one rubric (`rubric.txt`); `paired.py` counts, per area (and common vs rare where the set marks
it), the questions both got, only the old one got, only the new one got, and neither got, and gives
an exact sign test on the two "only" counts. Added 2026-11-18 (tool review: promptfoo).

Each Brain answers every requested trial. Within a run, identical grader inputs share one
verdict, including when both answers arrive at once. The input includes the question, key,
reply and citations. When replaying saved results, `paired.py` lists questions with conflicting
grades for identical replies and excludes those questions from both score denominators.

Why paired: two different question sets can't show a change smaller than about 17 points out of 60
(rethink report, 2026-11-18). The same questions asked of both versions can.

## In the cloud (the usual way)

rockygpt-data's **Compare two Brains on the same questions** workflow (`compare-brains.yml`):
choose `old_ref`, `new_ref`, the question set, and `max_usd` (default $1.00, a hard stop in a
throwaway ledger for both Brains together). It starts both Brains on the live graph, runs this
folder, and puts the paired table in the run summary. Ask Dan before a run over about $1.

The cost is about $0.0012 per Brain answer plus one grader call per distinct graded input.
The 154-question open half of the steady ruler on two versions is about $0.50.

## By hand

```sh
npm install --prefix /tmp/pf promptfoo@0.126.0
OLD_BRAIN_URL=http://127.0.0.1:8013 NEW_BRAIN_URL=http://127.0.0.1:8014 \
SET=$PWD/../steady-ruler/open/open-half.json OPENAI_API_KEY=... \
  /tmp/pf/node_modules/.bin/promptfoo eval -c promptfooconfig.yaml --no-cache -o results.json
python3 paired.py results.json
```

- `SET`: a blind-set folder (`questions-frozen.json` + `answer-key.json`) or a keyed file
  (`steady-ruler/open/open-half.json`). The frozen hash is checked.
- `ONLY=o18b-pp-01,o18b-gn-01` asks only those ids. `--repeat 3` asks each question 3 times; most
  tries decide.

**Free dry run** (checks the wiring, costs nothing):

```sh
RATE=0.5 python3 dry-run/fake_brain.py 8201 & RATE=0.65 python3 dry-run/fake_brain.py 8202 &
OLD_BRAIN_URL=http://127.0.0.1:8201 NEW_BRAIN_URL=http://127.0.0.1:8202 SET=$PWD/../blind-2026-11-18b \
  COMPARE_GRADER=file://dry-run/fake-grader.mjs \
  /tmp/pf/node_modules/.bin/promptfoo eval -c promptfooconfig.yaml \
  --no-cache -o /tmp/dry.json
python3 paired.py /tmp/dry.json
```

To inspect the grader inputs, set `COMPARE_GRADER=file://dry-run/show-grader-prompt.mjs` and
`SHOW_PROMPTS=/tmp/prompts.txt`. Each recorded prompt contains the question and its key.
(promptfoo does not fill `{{ }}` in a rubric read from a file, so `load-set.mjs` fills it.)

## Not covered

The steady ruler's own rules: rebuild its `run_day` keys on the day of the run, and grade with two
graders, answers shuffled. This runner uses one grader and the keys as written.
