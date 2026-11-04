# Search reach check (2026-11-04)

Does the Brain's meaning search reach the page section that answers a how-to question? This set
compares the same graph's search with and without the three student questions the build now
writes for every page section (rockygpt-brain #159). It calls no chat model, only embeddings for
the questions (well under a cent), so it can be run as often as needed.

| group | questions | where the expected sections come from |
|---|---|---|
| `zl-answered` | 37 | The spent how-to set [blind-howto-20261102zl](../brain-blind-sets-2026-10/blind-howto-20261102zl/): the sections cited by an answer its graders marked correct. |
| `zl-missed` | 10 | The same set's misses whose answer is on a page: the sections that hold it, found by hand (the README there names most of them). |
| `paraphrase` | 32 | New how-to questions in students' words, each with the sections that answer it, found by hand in the 11-03 graph. |

Each question lists its expected sections as `[page, heading start]`, where the page is written the
way the meaning index labels it (`student accounts > taxinfo`). A question counts as reached when
any expected section is in the one call's pool of 60, and the summary also counts the pool's top 12
(what the section pick reads) and the default 24.

Honest limits: the person who built the change wrote the `paraphrase` questions and labels, so
they are not blind. The zl set was already run, so it is a regression check, not a blind one.

## Run (laptop, from the workspace root)

```
python3 pull-production-graph.py .local-logs/<folder>/dev-graph --dev
rockygpt-brain/.venv/bin/python local-env.py brain -- \
  rockygpt-brain/.venv/bin/python rockygpt-evals/search-reach-2026-11-04/search_ab.py \
  .local-logs/<folder>/dev-graph rockygpt-evals/search-reach-2026-11-04/questions.json .local-logs/<folder>/search-reach
```

It needs a Brain checkout with #159 (`MeaningIndex.load` keeps 8 bits) on `PYTHONPATH`, prints a
summary per group plus every question that the questions moved into or out of the pool, and writes
`ab.json`.
