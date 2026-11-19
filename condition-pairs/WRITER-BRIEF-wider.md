# Brief: texted question pairs on hours, shuttle, menus, academic dates and people

You are writing test questions for RockyGPT, a chatbot for students at Ramapo College of New
Jersey (Mahwah, NJ). Do NOT open, search or read any code repository, any file under
/home/user, or any other file in /mnt/project-files except this brief. Do not use the web. You
work from this brief only. Write the result to:

    /mnt/project-files/student-conditions-2026-11-19/wider-pairs/wider-pairs.json

## What is being tested

When a student gives a condition, the answer must keep it: answer for THAT day, THAT time, THAT
meal, THAT semester, THAT course, not a general answer. Five areas:

- **hours**: when a campus place is open (library, gym/fitness center, dining hall, bookstore,
  health center, registrar, financial aid, writing center, student center, pool). Conditions: a
  day ("sunday", "tmrw", "this sat", "over thanksgiving break", "during finals"), a clock limit
  ("after 10pm", "b4 8am", "til midnight", "by 5", "at 7am"), part of the day ("tonight",
  "in the morning").
- **shuttle**: the campus shuttle (to the Ramsey train station, to shopping, back to campus).
  Conditions: day, clock limit ("after my 6pm class", "b4 9am"), direction (to campus or from
  campus), where to.
- **menus**: what the dining hall or cafes serve. Conditions: day, meal (breakfast, lunch,
  dinner, late night, brunch), a diet need ("vegan", "gluten free", "halal", "vegetarian"), a
  dining place.
- **academic_dates**: the academic calendar. Conditions: which semester or session ("this
  spring", "next fall", "winter session", "summer 1"), which kind of date (first day of classes,
  add/drop, last day to withdraw, finals, reading day, spring break, grades posted,
  registration opens, commencement), and sometimes TWO kinds of date in one question ("when do
  finals end n when do spring classes start").
- **people**: who teaches, advises or runs something. Conditions: which course or subject, a
  course qualifier ("calc-based physics" vs "algebra-based physics", "intro psych" vs "abnormal
  psych", "the online section", "the nursing one"), which office or role ("chair of the bio
  dept", "my advisor for the cs major", "the person in charge of study abroad").

## Who writes like what

Write the way real college students text: lowercase, slang, typos, abbreviations (tmrw, rn, b4,
n, w, u, r, ppl, smth, lowkey, ngl, fr, caf, lib), missing punctuation, extra context about their
day, sometimes two questions in one. Mix in a few clean, polite ones (about 1 in 6). Do not use
any real person's name. Never ask about grades, emergencies or anything unsafe.

## The set

Write **40 groups**, 8 per area. Each group has 2 versions (a few may have 3). Kinds:

- **change_one** (5 per area): the versions differ in exactly ONE condition, so a correct bot
  must give different answers. Example: "is the lib open sunday after 10" / "is the lib open
  sunday b4 10am"; "whos teaching calc based physics" / "whos teaching algebra based physics".
- **same_meaning** (2 per area): the versions say the SAME conditions in different words, so a
  correct bot must give the same answer.
- **nothing_fits_likely** (1 per area): a condition narrow enough that the honest answer is
  "no" or "not then" (the gym at 4am, a shuttle at 3am, breakfast at 2pm). The bot must say so
  instead of answering something else as if it fit.

## Labels: the conditions a careful person reads in each version

For every version give `slots`: only the slots the question sets (anything left out means "not
said"). Days are always said relative to when the question is asked; never compute a date.

| slot | values |
| --- | --- |
| when | today, tonight, tomorrow, weekday (a named day), next_weekday ("next friday"), this_week, next_week, this_weekend, next_weekend, this_month, next_month, month, date (month + day), break, rest_of_term ("during finals", "end of the semester") |
| weekday | monday ... sunday (with weekday / next_weekday) |
| month, day | numbers (with date or month) |
| break_name, side | thanksgiving, winter, spring, summer, fall; side before, after or during |
| part_of_day | morning, afternoon, evening (night = evening) |
| clock | {"relation": "before" or "after" or "at" or "until" or "by" or "around" or "between", "hour": 10, "minute": 0, "half": "am" or "pm" or "none" (none = not said), "to_hour", "to_minute", "to_half" (between only)} |
| place | the place asked about, plain words ("library", "fitness center", "main dining hall") |
| direction | to_campus or from_campus (shuttle) |
| destination | where the shuttle goes, plain words ("ramsey train station") |
| meal | breakfast, brunch, lunch, dinner, late_night |
| diet | vegan, vegetarian, gluten_free, halal, kosher, dairy_free |
| term | {"season": "fall" or "spring" or "summer" or "winter", "which": "this" or "next" or "last" or "none", "part": "summer 1" etc. or ""} |
| date_kinds | list of the kinds of date asked, plain words (["last day to withdraw"], ["finals end", "first day of classes"]) |
| course | the course or subject with every qualifier the student gave ("calc-based physics 1", "intro to psych, online section") |
| role | the role asked about ("department chair", "academic advisor", "director") |
| other | any other condition the slots cannot hold, as short phrases |

## Output format (JSON, UTF-8)

```json
{
  "written_by": "blind writer, 2026-11-19, saw only WRITER-BRIEF.md (wider areas)",
  "groups": [
    {"id": "w01", "kind": "change_one", "area": "hours",
     "changed": "clock",
     "versions": [
       {"id": "w01a", "question": "...", "slots": {...}},
       {"id": "w01b", "question": "...", "slots": {...}}
     ],
     "note": "optional, one line"}
  ]
}
```

Ids w01 to w40, areas in blocks of 8 (hours w01-w08, shuttle w09-w16, menus w17-w24,
academic_dates w25-w32, people w33-w40). `changed` is the slot that differs (change_one only).
Check that the file is valid JSON with 40 groups before you finish. Reply with one line: the
path, the number of groups and versions, and the counts by kind and area.
