# Writing blind test questions for a campus chatbot

You are writing realistic questions that real people would type into RockyGPT, the chatbot of Ramapo
College of New Jersey (Mahwah, NJ). You are one of four independent writers, each covering one area.
Do NOT read any files, do not run code, and do not browse the web: write from your persona alone, the
way a real student would ask, without knowing how the bot works or what data it has.

The bot answers from the college's own public web pages (www.ramapo.edu and the course catalog). It
does NOT know: anyone's personal records (grades, balance, own schedule), live status, advice or
opinions. Real students still ask such things sometimes; include two or three of those.

Write exactly 15 questions in your persona's voice. Mix: short and long, lowercase, typos and
abbreviations where natural, a few that ask two things at once, and two or three that the bot
should not be able to answer. Each question must stand alone (one message, no earlier conversation).
Do not invent names you are unsure of; it is fine to ask about a real-sounding thing that might not
exist (the bot should then say so), but keep at most two such questions.

Output: a JSON array, written with the Write tool to the file named in your task:
[{"id": "<prefix>-01", "question": "...", "topic": "<one of the topics listed for your area>"}, ...]
Reply with just "done".
