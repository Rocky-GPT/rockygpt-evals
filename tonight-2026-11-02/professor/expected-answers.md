# Professor questions: what a good answer says

Twenty questions a Ramapo professor might try after Dan's email. The questions are in
[questions.txt](questions.txt), in the same order, in the `rocky bulk` format:

```
./rocky bulk file rockygpt-evals/tonight-2026-11-02/professor/questions.txt          # laptop
./rocky bulk file rockygpt-evals/tonight-2026-11-02/professor/questions.txt --prod   # live website
```

Every expected answer below comes from ramapo.edu. The people, dean, provost, BIT and Canvas
answers were re-read on the live site on 2026-11-02; the rest come from the 2026-11-02 capture of
the same pages (release v2-20261102040147). "Must not" lists the mistakes that would embarrass the
bot in front of a professor.

| # | Question | A good answer says | Must not |
|---|----------|--------------------|----------|
| 1 | Who is Amruth Kumar? | Professor of Computer Science, School of Science, Nursing, and Health. Office ASB 408, amruth@ramapo.edu, (201) 684-7712. Courses include Computer Science I and II, Organization of Programming Languages, Artificial Intelligence. ([profile](https://www.ramapo.edu/snh/faculty/amruth-kumar/)) | Invent a degree, research area or office not on the profile. |
| 2 | What are Professor Kumar's office hours? | Tue./Fri. 11:35am-12:00pm and 3:25pm-4:00pm, via WebEx. | Give other days or say in person. |
| 3 | whats scott frees email and office | sfrees@ramapo.edu, office ASB409, (201) 684-7726. Office hours via WebEx by appointment. ([profile](https://www.ramapo.edu/snh/faculty/scott-frees/)) | Make up a different email pattern. |
| 4 | When are Sourav Dutta's office hours? | Mon./Thur. 11:10am-2:10pm. Office ASB406, sdutta1@ramapo.edu. ([profile](https://www.ramapo.edu/snh/faculty/sourav-dutta/)) | |
| 5 | Who is Dean Chen? | **Trap.** Dean Chen is a person's name: Professor of Political Science, School of Social Sciences and Social Work. Office G267, dchen@ramapo.edu, (201) 684-7755. Office hours T 12-1pm & 4-5pm, F 12-1pm. ([profile](https://www.ramapo.edu/sssw/faculty/dean-chen/)) | Treat "Dean" as a title, or answer with a dean named Chen (Benny Chan is SNH's dean). |
| 6 | Who is the dean of the School of Science, Nursing, and Health? | Benny Chan, Dean of SNH / Professor of Chemistry, bchan2@ramapo.edu. His page lists no office or personal phone. ([profile](https://www.ramapo.edu/snh/faculty/benny-chan/)) | Invent an office or phone for him. |
| 7 | Who is the dean of the Anisfield School of Business and how do I reach them? | Ed Petkus, Dean. Office ASB-333, epetkus@ramapo.edu, (201) 684-7377. ([profile](https://www.ramapo.edu/asb/faculty/ed-petkus/)) | |
| 8 | Who is the dean of the School of Social Science and Human Services? | **Old school name.** Today it is the School of Social Sciences and Social Work; its dean is Susan Hangen (also Professor of Anthropology & International Studies), office ASB-431D, shangen@ramapo.edu, (201) 684-7562. ([profile](https://www.ramapo.edu/sssw/faculty/susan-hangen/)) | Name Aaron Lorenz (he appears as dean only on an old 2024 Fulbright Day page). |
| 9 | Which professors teach computer science at Ramapo? | Computer science faculty listed on ramapo.edu: Ali Al-Juboori, Sourav Dutta, Scott Frees, Amruth Kumar, Victor J. Miller, Mohammad Mukhtaruzzaman. Data science faculty Osei Tweneboah and Debbie Yuster also teach CMPS courses. Listing most of them, with a pointer to the faculty pages, is fine. | Add names that are not Ramapo CS faculty. |
| 10 | Who is the provost? | Dr. Michael Middleton, Provost and Vice President for Teaching, Learning, & Growth. Office of the Provost: provost@ramapo.edu, (201) 684-7330, first floor of the Birch Mansion. ([leadership](https://www.ramapo.edu/president/met/)) | Name a past provost (for example Susan Gaulden, on a 2021 page). |
| 11 | What is CMPS 450? | Senior Project, 4 credits. Students find, research, design, implement, document and present a large programming project; it is the capstone of the Computer Science major. Prerequisites: CMPS 361 Software Design and CRWT 102 (or 102S) Critical Reading and Writing II. Course fee required. ([catalog](https://catalog.ramapo.edu/courses/CMPS450)) | Add a prerequisite or credit count not in the catalog. |
| 12 | What are the prerequisites for Software Design? | CMPS 361 Software Design needs CMPS 231 Data Structures with a minimum grade of C. 4 credits. ([catalog](https://catalog.ramapo.edu/courses/CMPS361)) | |
| 13 | How do I report a student for cheating on an exam? | Academic Integrity Policy: report to the Vice Provost's office with the reporting form (Google form or the PDF in the policy) or by email to academicintegrity@ramapo.edu. An instructor can either resolve it with the student and report the outcome (finding and sanction) to the Vice Provost, or refer the case to the Vice Provost. Report within 30 calendar days of discovery, and no later than the last day to submit grades for that term. ([catalog policy](https://catalog.ramapo.edu/pages/R532kjMfIcfnIkM0srb3#academic-integrity)) | Invent a different office, form or deadline. |
| 14 | I'm worried about a student in my class. Who do I contact? | The Behavioral Intervention Team (BIT): fill out the Student of Concern Report on the BIT website, or contact the chair, Kathleen Hallissey, at 201.684.7869 or bit@ramapo.edu. If anyone is in immediate danger, call Public Safety at 201-684-6666. ([BIT](https://www.ramapo.edu/bit/)) | Skip the emergency number if the answer mentions danger; send them to Counseling only. Asking "which kind of concern?" is acceptable. |
| 15 | Who do I contact for help with Canvas? | Instructional Design Center (IDC): log a ticket at helpdesk.ramapo.edu or email helpdesk@ramapo.edu (replies within a few hours on weekdays). IDC is in the Learning Commons, 2nd floor, Room 201, Mon-Fri 8:30 a.m.-4:30 p.m. LMS Administrator/Trainer Danielle Howarth, (201) 684-7103. ([IDC](https://www.ramapo.edu/idc/)) | Send them to Media Services or a generic IT number not on the IDC page. |
| 16 | What events are happening on campus this week? | Lists events from the campus calendar for the current week, with day, time and host, and says the list is from the calendar. On the 2026-11-02 capture, Tue Nov 3 had for example Election Night Watch Party (6 PM, Civic and Community Engagement Center) and Snack and Solve (5:30 PM, Data Science Club); Fri Nov 6 had Moonlight Masquerade (7 PM, The Overlook). The exact list depends on the day it is asked. | Give an event on the wrong day, or one that is not on the calendar; list past events as coming up. |
| 17 | Is there a computer science club? | Yes, the Computer Science Club: computerscienceclub@ramapo.edu, Archway page archway.ramapo.edu/computer/. Its mission is to promote interest in computer science through activities, events, competitions and projects. | Invent meeting times (none are listed). |
| 18 | Is there a chess club? | **Not in the club list.** It should say it found no chess club in Ramapo's club directory and can point to the club directory or the Center for Student Involvement. | Say yes, or invent a chess club's contact or meeting time. |
| 19 | What are the library hours? | Fall semester (Aug. 26 - Dec. 15, 2026): Mon-Thu 7:45am-12:00am (midnight), Fri 7:45am-6:00pm, Sat 10:00am-6:00pm, Sun 12:00pm-12:00am. Front doors lock 15 minutes before closing. ([hours](https://www.ramapo.edu/library/library-hours/)) | Give hours from another semester. |
| 20 | How many students are enrolled in my CMPS 450 section this semester? | **Out of scope.** It has no section or enrollment data; it should say so plainly and point to the course roster tools or the Registrar, without guessing a number. | Guess a number or a section. |

## How to read the results

- Good: matches the middle column (wording can differ; extra true facts are fine).
- Bad: anything in "Must not", any made-up name, number, email or room.
- Tonight's goal is no made-up facts. A real but outdated fact (for example a wrong week's event)
  is the only acceptable kind of miss, and it still goes on the fix list.
