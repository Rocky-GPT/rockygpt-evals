# Brief: write practice messages for a campus help chatbot

This is a pure writing task. Please do NOT read rockygpt-brain, rockygpt-evals or any other repo for it,
and never open `rockygpt-evals/tonight-2026-11-02/` (the frozen blind set) or
`rockygpt-evals/card-match-practice-2026-11-11/`. The point of this job is that the writer has not seen
how the bot decides things, so the messages are not shaped by it. Do not write "easy" or "hard" cases
for the bot; just write what real students would send.

## The college

Ramapo College of New Jersey, a public college of about 5,500 students in Mahwah, NJ. Mostly
undergraduates (residential and commuter), some graduate students, some transfer and international
students. The chatbot answers from the college's own public web pages (offices such as the Registrar,
Financial Aid, Student Accounts, Residence Life, Public Safety, Dining, Health Services, Counseling,
the IT help desk, the library, the Cahill Career Center, the Roukema Center for International
Education, the Office of Specialized Services, Athletics and the Bradley Center, the Center for
Student Involvement, Admissions, Graduate programs, EOF, Academic Advising, Testing, Study Abroad).

## What to write: 90 messages that students type into the chatbot

**Part A, 60 messages.** The student wants to GET SOMETHING DONE at the college (a process, a request,
a form, an application, a fix for a problem). For each one, first imagine one specific student and what
just happened to them or what they need this week (lost something, got a bill or a fine, wants to
change something they signed up for, missed a date, is new and confused, has a conflict, needs
paperwork for a job or a visa, wants to join, book or borrow something). Then write the message that
student would actually send, in their own words. Students do not know the college's official names
for forms and offices, and they write the way they text. Let each message come out however it
naturally would for that student; do not aim for any particular mix of styles or lengths, and do not
make them all alike. Spread the topics widely across the offices above and across first-years,
upperclassmen, commuters, residents, transfers, grad students and international students. Do not
repeat a task.

**Part B, 30 messages.** Campus messages that are NOT asking how to get something done. A mix of: a
plain fact question (when, where, who, how much, is X open), a question only the student's own record
could answer (their grade, their balance, whether their form went through), asking for an opinion or
a recommendation, something about events, clubs, people or courses, and a few bits of small talk or
off-topic. Same rule: imagine a specific student first.

Invent everything fresh. Do not copy or paraphrase any existing question set. No real people's names.

## Output

One JSON file, `/mnt/project-files/answer-cards/practice-messages-2026-11-16.json`: an array of 90
objects in this shape, ids A01 to A60 and B01 to B30:

```json
{"id": "A01", "part": "A",
 "who": "a few words about the imagined student and situation",
 "message": "exactly what they typed",
 "wants": "part A: the thing they want done, in 3 to 8 plain words; part B: fact / own record / opinion / events-people-courses / small talk"}
```

Check that the file is valid JSON with 90 rows, then tell the answer cards thread
("Fix answer cards after blind run") that it is there. Nothing else is needed: no code, no PR, no run.
