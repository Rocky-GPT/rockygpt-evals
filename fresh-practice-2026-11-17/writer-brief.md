# Brief (second round): write practice messages for a campus help chatbot, from seed rows

This is a pure writing task. Please do NOT read rockygpt-brain, rockygpt-evals or any other repo for it,
and never open `rockygpt-evals/tonight-2026-11-02/` (the frozen blind set),
`rockygpt-evals/card-match-practice-2026-11-11/`, `rockygpt-evals/fresh-practice-2026-11-16/` or any
other file under `/mnt/project-files/answer-cards/` (this brief is the one exception). Do not read the
project's plan documents or other threads for it either. The point of this job is that the writer has
not seen how the bot decides things, so the messages are not shaped by it. Do not write "easy" or
"hard" cases for the bot; just write what real students would send.

## Why a second round

The first round (`practice-messages-2026-11-17.json`) came out too close to a set that an earlier
writer wrote from the same brief: a word count (nobody read the messages) found 10 messages that are
word for word the same as the earlier set and 12 more that share most of their words. The builder has
already studied that earlier set, so repeats cannot test anything. This round starts every message
from a seed row that a random draw picked, so it cannot land on the same first ideas. Please do not
reuse, reword or look at your first-round messages or their situations: start from the seed rows.

## The college

Ramapo College of New Jersey, a public college of about 5,500 students in Mahwah, NJ. Mostly
undergraduates (residential and commuter), some graduate students, some transfer and international
students. The chatbot answers from the college's own public web pages.

## Part A, 60 messages: the student wants to GET SOMETHING DONE

Each row gives an office or area, a student, what just happened, and the time of year. For each row,
imagine that one specific student and one concrete thing they need to get done this week (a process,
a request, a form, an application, a fix for a problem) that has to do with that office or area. Then
write the message the student would actually send, in their own words. Students do not know the
college's official names for forms and offices (they often do not know which office handles their
problem, so the office's name need not appear), and they write the way they text. Let each message
come out however it naturally would for that student; do not aim for any particular mix of styles or
lengths, and do not make them all alike. If a row's parts do not fit together, keep the office and
change the part that does not fit. Do not repeat a task. Keep the errands everyday ones: what the
row's student would really need, not something rare made up to be different.

| id | office or area | student | what just happened | time of year |
|---|---|---|---|---|
| E01 | Student Accounts | international student | missed a date | first week of the spring term |
| E02 | Center for Student Involvement | first-year living on campus | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | first week of the spring term |
| E03 | Financial Aid | junior commuter | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | first week of the spring term |
| E04 | Study Abroad | graduate student | wants to join, book or borrow something | first week of the fall term |
| E05 | IT help desk | junior commuter | is new and confused | winter break |
| E06 | Cahill Career Center | sophomore living on campus | wants to apply or sign up for something | the weeks when students pick next term's classes |
| E07 | Center for Student Involvement | first-year commuter | something broke or stopped working | winter break |
| E08 | Residence Life | sophomore living on campus | is new and confused | middle of the fall term |
| E09 | Testing | transfer student in their first term | was told no, or told to do something they do not understand | first week of the fall term |
| E10 | Admissions | junior commuter | has a conflict between two things | summer |
| E11 | Study Abroad | transfer student in their first term | is new and confused | first week of the fall term |
| E12 | Dining | graduate student | has a conflict between two things | the weeks when students pick next term's classes |
| E13 | Student Accounts | junior commuter | wants to join, book or borrow something | summer |
| E14 | EOF | first-year commuter | wants to join, book or borrow something | finals week |
| E15 | Academic Advising | sophomore living on campus | missed a date | middle of the fall term |
| E16 | Office of Specialized Services | international student | has a conflict between two things | summer |
| E17 | Counseling | international student | wants to join, book or borrow something | winter break |
| E18 | Health Services | first-year living on campus | missed a date | first week of the spring term |
| E19 | EOF | graduate student | was told no, or told to do something they do not understand | finals week |
| E20 | Testing | first-year commuter | wants to change something they signed up for | first week of the fall term |
| E21 | Public Safety | first-year living on campus | wants to change something they signed up for | winter break |
| E22 | Registrar | international student | has a conflict between two things | first week of the fall term |
| E23 | Dining | graduate student | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | finals week |
| E24 | Graduate programs | graduate student | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | summer |
| E25 | Study Abroad | graduate student | wants to apply or sign up for something | summer |
| E26 | the library | graduate student | lost something | finals week |
| E27 | Health Services | first-year commuter | got a bill, a fee or a fine | first week of the fall term |
| E28 | Cahill Career Center | transfer student in their first term | wants to cancel, drop or leave something | the weeks when students pick next term's classes |
| E29 | EOF | senior in their last year | wants to change something they signed up for | winter break |
| E30 | Student Accounts | junior commuter | has a conflict between two things | first week of the fall term |
| E31 | Public Safety | first-year living on campus | is new and confused | middle of the spring term |
| E32 | Health Services | graduate student | got a bill, a fee or a fine | summer |
| E33 | Graduate programs | first-year commuter | wants to apply or sign up for something | the weeks when students pick next term's classes |
| E34 | Cahill Career Center | international student | is new and confused | the weeks when students pick next term's classes |
| E35 | Admissions | junior commuter | has a conflict between two things | winter break |
| E36 | Academic Advising | first-year living on campus | wants to apply or sign up for something | first week of the spring term |
| E37 | Graduate programs | first-year commuter | wants to change something they signed up for | winter break |
| E38 | Athletics and the Bradley Center | senior in their last year | is new and confused | first week of the spring term |
| E39 | Athletics and the Bradley Center | junior commuter | wants to cancel, drop or leave something | finals week |
| E40 | IT help desk | first-year commuter | got a bill, a fee or a fine | middle of the spring term |
| E41 | Roukema Center for International Education | first-year living on campus | lost something | the weeks when students pick next term's classes |
| E42 | Residence Life | first-year commuter | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | finals week |
| E43 | Public Safety | graduate student | missed a date | finals week |
| E44 | Roukema Center for International Education | international student | is new and confused | winter break |
| E45 | Counseling | senior in their last year | has a conflict between two things | winter break |
| E46 | the library | transfer student in their first term | is new and confused | winter break |
| E47 | Counseling | transfer student in their first term | something broke or stopped working | summer |
| E48 | Academic Advising | transfer student in their first term | was told no, or told to do something they do not understand | summer |
| E49 | Roukema Center for International Education | senior in their last year | missed a date | first week of the spring term |
| E50 | Dining | international student | is new and confused | winter break |
| E51 | Registrar | international student | wants to cancel, drop or leave something | first week of the spring term |
| E52 | Residence Life | first-year living on campus | needs paperwork or proof for someone outside the college (a job, a visa, insurance, a landlord) | summer |
| E53 | IT help desk | transfer student in their first term | lost something | middle of the fall term |
| E54 | Financial Aid | sophomore living on campus | is new and confused | first week of the spring term |
| E55 | Admissions | first-year living on campus | was told no, or told to do something they do not understand | middle of the spring term |
| E56 | Testing | international student | was told no, or told to do something they do not understand | finals week |
| E57 | Registrar | first-year commuter | was told no, or told to do something they do not understand | middle of the fall term |
| E58 | Athletics and the Bradley Center | junior commuter | was told no, or told to do something they do not understand | middle of the spring term |
| E59 | Office of Specialized Services | international student | wants to change something they signed up for | middle of the fall term |
| E60 | Center for Student Involvement | first-year living on campus | something broke or stopped working | middle of the spring term |

## Part B, 30 messages: campus messages that are NOT asking how to get something done

Each row gives the kind of message, an area, a student and the time of year. Same rule: imagine a
specific student first, then write what they would type.

| id | kind | area | student | time of year |
|---|---|---|---|---|
| F01 | a plain fact (when, where, who, how much, is it open) | Health Services | international student | finals week |
| F02 | small talk or off-topic | (none) | senior in their last year | summer |
| F03 | events, clubs, people or courses | Admissions | first-year commuter | first week of the spring term |
| F04 | an opinion or a recommendation | IT help desk | sophomore living on campus | first week of the spring term |
| F05 | an opinion or a recommendation | Registrar | first-year commuter | summer |
| F06 | a plain fact (when, where, who, how much, is it open) | Registrar | sophomore living on campus | summer |
| F07 | a plain fact (when, where, who, how much, is it open) | campus life in general | transfer student in their first term | middle of the spring term |
| F08 | small talk or off-topic | (none) | first-year living on campus | finals week |
| F09 | small talk or off-topic | (none) | senior in their last year | winter break |
| F10 | events, clubs, people or courses | campus life in general | international student | middle of the fall term |
| F11 | something only the student's own record could answer | Health Services | senior in their last year | finals week |
| F12 | a plain fact (when, where, who, how much, is it open) | campus life in general | junior commuter | finals week |
| F13 | a plain fact (when, where, who, how much, is it open) | Center for Student Involvement | graduate student | summer |
| F14 | something only the student's own record could answer | Academic Advising | junior commuter | middle of the fall term |
| F15 | something only the student's own record could answer | IT help desk | first-year commuter | summer |
| F16 | a plain fact (when, where, who, how much, is it open) | EOF | international student | winter break |
| F17 | an opinion or a recommendation | Graduate programs | first-year living on campus | first week of the fall term |
| F18 | events, clubs, people or courses | Health Services | graduate student | middle of the spring term |
| F19 | a plain fact (when, where, who, how much, is it open) | Admissions | graduate student | first week of the fall term |
| F20 | an opinion or a recommendation | Center for Student Involvement | international student | first week of the fall term |
| F21 | events, clubs, people or courses | Athletics and the Bradley Center | international student | middle of the fall term |
| F22 | something only the student's own record could answer | Dining | transfer student in their first term | summer |
| F23 | an opinion or a recommendation | Graduate programs | graduate student | middle of the spring term |
| F24 | something only the student's own record could answer | Office of Specialized Services | first-year commuter | middle of the fall term |
| F25 | events, clubs, people or courses | Testing | first-year living on campus | the weeks when students pick next term's classes |
| F26 | something only the student's own record could answer | Roukema Center for International Education | sophomore living on campus | middle of the spring term |
| F27 | events, clubs, people or courses | the library | junior commuter | first week of the spring term |
| F28 | small talk or off-topic | (none) | senior in their last year | middle of the spring term |
| F29 | events, clubs, people or courses | Student Accounts | first-year commuter | the weeks when students pick next term's classes |
| F30 | a plain fact (when, where, who, how much, is it open) | Graduate programs | first-year commuter | summer |

Invent everything fresh. Do not copy or paraphrase any existing question set. No real people's names.

## Output

One JSON file, `/mnt/project-files/answer-cards/practice-messages-2026-11-17b.json`: an array of 90
objects in this shape, ids E01 to E60 (part A) and F01 to F30 (part B), in the order of the tables:

```json
{"id": "E01", "part": "A",
 "who": "a few words about the imagined student and situation",
 "message": "exactly what they typed",
 "wants": "part A: the thing they want done, in 3 to 8 plain words; part B: fact / own record / opinion / events-people-courses / small talk"}
```

Check that the file is valid JSON with 90 rows, then send a message to the answer cards thread
(thread id cmsg_014fZXCJJ4gu2vWGDRf37rfwTwAPn6uce7L7bKa2HnbLsp) that says the file is there, and whether
you opened any existing question set or any other file under `/mnt/project-files/answer-cards/` in the
first round or this one (a plain yes or no, with the file names if yes). Nothing else is needed: no
code, no PR, no run. Please do not post the messages themselves in any thread or note: the builder
must not see them before the test has run.
