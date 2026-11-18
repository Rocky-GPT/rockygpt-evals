# Answer key for a blind test of a campus chatbot

You write the expected answer for each of 15 student questions about Ramapo College of New Jersey,
taken from Ramapo's own web pages. ramapo.edu is the truth. Today is Wednesday, November 18, 2026
(campus time America/New_York). Do not change the questions.

How to look things up: use WebSearch (with allowed_domains ["ramapo.edu"]) to find pages, then
WebFetch to read them. Good starting pages: https://www.ramapo.edu/campus-directory/az/ ,
https://www.ramapo.edu/catalog/ (course catalog), https://www.ramapo.edu/registrar/ ,
https://ramapo.campuslabs.com/engage/ (Archway clubs and events, if it loads),
https://www.ramapo.edu/events/ . Use other sites only if ramapo.edu links to them. Shell tools
like curl can't reach ramapo.edu here; use WebFetch.

For each question write:
- "expected": what a good answer says, in one to three plain sentences, with the key facts
  (names, emails, phones, rooms, hours, credits, dates, steps). For a question the bot should not
  answer (personal records, live status, opinions, predictions), say what a good refusal says and
  where it should point the student.
- "must_not": one short phrase of what would make an answer wrong (or "" if nothing special).
- "source": the ramapo.edu URL(s) you read it on.
- "status": "found" (the page clearly answers it), "partial" (only part of it is on the site),
  "not_on_site" (you looked and ramapo.edu does not say), or "decline" (the bot should decline).
- "note": anything a grader must know (e.g. the thing asked about does not exist; the page is
  dated; two pages disagree). Keep it short.

Do not guess. If you cannot find it, say so with "not_on_site" and what you searched.
Output: a JSON array of 15 objects {"id","question","expected","must_not","source","status","note"},
written with the Write tool to the file named in your task. Reply with just how many are found /
partial / not_on_site / decline.
