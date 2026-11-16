# Page writer check, 2026-11-16

Step 3 of the plan "one simple page writer" (https://claude.ai/artifact/A5zNtra4kVHN62mGwuPmGG).
Dan approved this one paid run on 2026-11-16 (about $0.70).

`questions.json` holds 30 questions from the older how-to set zl
(`brain-blind-sets-2026-10/blind-howto-20261102zl`): its 19 graded misses that name the page the
answer needed, and 11 of its good answers. The blind 60 set is not used. Each row's `facts` is the
page (or the words) the graders said the answer needs, as the free search check used them.

Runs, on the laptop Brain (dev code, dev graph), 5 tries each:

    ./rocky bulk file rockygpt-evals/page-writer-check-2026-11-16/questions.json --brain 8013 \
        --repeat 5 --out rockygpt-evals/page-writer-check-2026-11-16/runs/today.json
    ./rocky bulk file rockygpt-evals/page-writer-check-2026-11-16/questions.json --brain 8013 \
        --repeat 5 --writer sections --out rockygpt-evals/page-writer-check-2026-11-16/runs/sections.json

Every try is graded with the zl set's own grader prompt and labels.

## Result (graded 2026-11-16)

Both runs: laptop Brain dev 9f83be5, dev graph v2-20261111224857 with the page marks added to the
laptop's meaning index only (54 of 2,315 pages not current). Spend $0.54 in all.

Graded: every try of the 19 misses and try 1 of the 11 good answers, both writers, 212 answers,
writer hidden (`grading/key.json`), two graders each with the zl grader prompt and the 11-02
SQLite; an answer counts good only when both graders say correct, declined_ok or asked_ok.
`python3 grading/score.py` prints the numbers.

| | Today's writer (ai) | Sections writer |
|---|---|---|
| Older misses, good tries | 51 of 95 | 43 of 95 |
| Good answers, try 1 | 10 of 11 | 8 of 11 |
| Wrong and serious by both graders | 7 | 2 |
| Cost of 150 answers | $0.37 | $0.17 |
| Median seconds an answer | 17.5 | 15.2 |

The sections writer does not pass (the plan's bar: more good answers, no area down). It is cheaper,
faster and makes fewer serious mistakes, but it leaves out facts its pages hold more often
(incomplete 33 vs 27 on the misses).
