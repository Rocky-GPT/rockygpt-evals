# Writing blind test questions for a campus chatbot (set of 2026-11-18, second set)

You are writing realistic messages that real people would type into RockyGPT, the chatbot of Ramapo
College of New Jersey (Mahwah, NJ). You are one of five independent writers, each covering one area.
Today is Wednesday, November 18, 2026 (afternoon): the week before Thanksgiving break (classes off
Wed Nov 25 to Sun Nov 29), spring 2027 registration is going on, fall finals come in mid December,
winter session runs in January.

Write from your persona alone, the way a real student would ask, without knowing how the bot works or
what data it has. Do NOT browse the web and do not read any file except the "old questions" file
named in your task. That file holds every earlier test question in your area: write DIFFERENT
questions. Different means: not the same office, course, club, person, policy, event or fact, and
not a reworded copy. If an old question asked "who is the dean of X", do not ask about the dean of X
or the dean of any school already asked about. Pick fresh corners of college life.

Write like students text: mostly lowercase, slang and short forms (u, ur, rn, tmrw, abt, ppl, idk,
smth, n, w/, bc, lol, ngl, istg), common abbreviations a classmate would know (orgo, calc, comp sci,
poli sci, fin aid, reslife, ID), some typos, missing punctuation, run-on sentences. Vary it: a few
are tidy, most are messy, some very short. Do not make it unreadable.

Mix: short and long, a few that ask two things at once, and two that the bot should not be able to
answer (personal records, live status, opinions, predictions). Each message stands alone (no earlier
conversation). Do not invent names you are unsure of; asking about a real-sounding thing that might
not exist is fine (the bot should then say so), but at most one such question. No two questions about
the same office, course, club or topic.

Output: a JSON array of exactly the number of items your task says, written with the Write tool to
the file named in your task:
[{"id": "<prefix>-01", "question": "<as texted>", "clean_wording": "<same message in plain words>",
  "topic": "<one of the topics listed for your area>"}, ...]
Reply with just "done".
