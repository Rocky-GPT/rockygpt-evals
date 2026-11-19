# Brief: write texted question pairs that test whether a campus chatbot keeps the student's conditions

You are writing test questions for RockyGPT, a chatbot for students at Ramapo College of New
Jersey (Mahwah, NJ). Do NOT open, search or read any code repository, any file under
/home/user, or any other file in /mnt/project-files except this brief. You work from this brief
only. Write the result to:

    /mnt/project-files/student-conditions-2026-11-19/pair-set/pair-set.json

## What is being tested

When a student gives a condition, the answer must keep it. Conditions here are:

- **home or away** for a varsity game ("next home game", "away meets")
- **which days**: one day, several days ("mon and tues"), a range ("dec 1-4", "wed thru sun"), a
  week ("this week or next"), "the next 3 days", a weekend, tonight, a break ("before
  thanksgiving break", "after winter break")
- **a clock limit**: before, after, around or between times ("til 2", "after my 5pm class",
  "around lunch", "between 12 and 3", "b4 noon")
- **part of the day**: morning, afternoon, evening/night
- **what kind of event** ("comedy", "free food", "volunteering")
- **another condition the bot has no field for** ("for commuters", "free to get in", "online",
  "for grad students"). These are conditions about the EVENT, not about the student. "im a
  commuter stuck here til 2" is about the student (who they are) plus a clock limit (til 2); it
  is NOT the condition "for commuters". "anything for commuters" IS that condition.

## Who writes like what

Write the way real college students text: lowercase, slang, typos, abbreviations (tmrw, rn, b4,
n, w, u, r, ppl, smth, lowkey, ngl, fr), missing punctuation, extra context about their day,
sometimes two questions in one. Mix in a few clean, polite ones (about 1 in 6). Vary sports
(basketball, soccer, swim/diving, lacrosse, baseball, softball, volleyball, track, field hockey,
cross country; men's and women's) and vary days, times and kinds of event. Do not use any real
event names or real opponent names. Never ask about grades, emergencies or anything unsafe.

## The set

Write **60 groups**. Each group has 2 or 3 **versions** of one question. Kinds of group:

- **change_one** (about 30 groups): the versions differ in exactly ONE condition, so a correct
  bot must give different answers. Example: "whens the next home bball game" / "whens the next
  away bball game"; "anything happening today b4 2" / "anything happening today after 5".
- **same_meaning** (about 20 groups): the versions say the SAME conditions in different words,
  so a correct bot must give the same answer. Example: "anything on campus til 2pm" / "gotta
  leave at 2, anything going on before then" / "events b4 2 today?"
- **nothing_fits_likely** (about 10 groups): conditions narrow enough that often nothing will
  fit (a very early hour, a far-off narrow window, home games for a sport whose season is over).
  The bot must then say none fits instead of showing something else as if it fit.

Spread: about 25 groups about varsity games (teams) and about 35 about campus events.

## Labels: the conditions a careful person reads in each version

For every version give `slots`: only the slots the question sets (anything left out means "not
said"). Days are always said relative to when the question is asked; never compute a date.

| slot | values |
| --- | --- |
| when | today, tonight, tomorrow, weekday (a named day: "fri", "this sat"), next_weekday ("next friday"), this_week, next_week, this_weekend, next_weekend, this_month, next_month, month (a month by name, no day), date (month + day), break, rest_of_term ("before finals", "end of the semester"), coming_days ("the next 3 days") |
| weekday | monday ... sunday (with weekday / next_weekday) |
| month, day | numbers (with date or month) |
| days_ahead | a number, with coming_days ("next 3 days" = 3) |
| through | the LAST day of a range that starts at the first day: {"weekday": "sunday"} or {"month": 12, "day": 4} |
| also | up to 2 MORE separate days or weeks: [{"when": "weekday", "weekday": "tuesday"}], [{"when": "next_week"}] |
| break_name, side | thanksgiving, winter, spring, summer, fall; side before, after or during |
| part_of_day | morning, afternoon, evening (night = evening) |
| clock | {"relation": "before" or "after" or "around" or "between", "hour": 2, "minute": 0, "half": "am" or "pm" or "none" (none = the student did not say am/pm), "to_hour": 3, "to_minute": 0, "to_half": "pm"} (to_* only for between) |
| home_away | home, away |
| about | what kind of event, in a few plain words ("comedy shows"); "" when they ask only what is on |
| other | conditions about the event the slots cannot hold, as short phrases ("for commuters", "free entry", "online") |

Examples:
- "anything happening today around lunch? stuck on campus til 2" -> {"when": "today", "clock":
  {"relation": "before", "hour": 2, "minute": 0, "half": "none"}, "about": ""}. Here "around
  lunch" and "til 2" overlap; label the condition that limits most clearly, and add a `note`.
- "whats going on next mon and tues" -> {"when": "next_weekday", "weekday": "monday", "also":
  [{"when": "next_weekday", "weekday": "tuesday"}], "about": ""}
- "any comedy stuff dec 1-4" -> {"when": "date", "month": 12, "day": 1, "through": {"month": 12,
  "day": 4}, "about": "comedy"}
- "next home lax game" -> {"home_away": "home"}

## Output format (JSON, UTF-8)

```json
{
  "written_by": "blind writer, 2026-11-19, saw only WRITER-BRIEF.md",
  "groups": [
    {"id": "g01", "kind": "change_one", "area": "teams",
     "changed": "home_away",
     "versions": [
       {"id": "g01a", "question": "...", "slots": {...}},
       {"id": "g01b", "question": "...", "slots": {...}}
     ],
     "note": "optional, one line"}
  ]
}
```

`changed` is the slot that differs (change_one only). `area` is "teams" or "events". Check that
the file is valid JSON and has 60 groups before you finish. Reply with one line: the path, the
number of groups and versions, and the counts by kind and area.
