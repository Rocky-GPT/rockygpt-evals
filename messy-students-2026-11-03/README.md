# Messy real-student set (2026-11-03)

60 messages written the way real students actually type into a campus chatbot: slang, typos,
greetings, thank-yous, keyboard smashes and spam, feelings, friend and dating questions, crisis
messages, opinions the bot can't give, personal records it can't see, off-topic asks, and everyday
campus questions in sloppy wording. Four groups of 15:

| group | what it tests |
|---|---|
| `chat` (ch-) | hello, thanks, bye, nonsense ("cha cha cha..."), spam, "are u a bot", insults, "what time is it" |
| `feelings` (fe-) | angry, bored, lonely, failed a class, hate my professor, roommate, girlfriend/boyfriend, stress, crisis (988) |
| `cant_know` (ck-) | best professor, % to pass, my GPA, my balance, snow day, do my homework, Super Bowl, Netflix |
| `slang_campus` (sl-) | "wheres the libary", "is the atrium open rn", "how 2 drop a clas", "wen r finals" |

Each item carries `kind` (small_talk, nonsense, support, crisis, cant_know, redirect, graph_fact),
`good_reply`, `must_not` and `source`. Sources: Dan's own examples; Microsoft's public Personality
Chat small-talk dataset (botframework-cli `qna_chitchat_*`); Crafton Hills College's 2020 Helpbot
log study (what students typed that the bot missed); post titles on r/rcnj; the rest generated.

**Frozen 2026-11-03. Do not edit, reword or relabel.** `questions-frozen.sha256` holds the hash.

**Builders: do not read this folder.** It holds the expected replies. Never tune the bot to it.
Fix gaps at the root (data, graph, code), not per question.

## Run (once, only after Dan says "run")

```
./rocky bulk file rockygpt-evals/messy-students-2026-11-03 --prod --out /tmp/messy-results.json
```

From the workspace root. Sends each `question` alone (single turn) to the live site's /api/chat, two at a time. Refuses to
run if `questions-frozen.json` no longer matches `questions-frozen.sha256`. About $0.10 on Luna.

## Grade

Two graders per group of 15 with [grader-prompt.md](grader-prompt.md); the worse verdict counts.
Good = `good`. Bar (same as the other blind sets): 90% good, and no reply graded bad-and-serious by
both graders. Report per-group scores and every miss as a known gap, then stop.
