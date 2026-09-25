# Library hours scope check, 2026-09-24

The [last rerun](../2026-09-24-library-graph-rerun/README.md) found that the Library's two schedules read as a conflict. The Library entity links both "Library (Main Building)" and "Research Help Desk" from the campus-hours page, and the hours section compared them as one schedule, so it reported a schedule conflict every day.

Brain `8b0b173` compares hours only within one schedule. When one source lists a collection's schedules under different names, records are compared only within a name, ignoring case and spacing. Records from different sources, or without a name, are still all compared, because their names don't show a different schedule. Only the records of a conflicting schedule carry the disagreement. This run asks the same seven turns again.

**Result:** the hours conflict is gone. No turn's hours section reported a conflict, and no answer called the Library's schedules conflicting. Offline, all 16 entities with hours show no conflict over the next 14 days, where the Library showed one on every day before. 6 of 7 turns passed on the first try. "Where is the library?" failed once and passed on both retries; the failure was a name claim, not the location or the hours. The verdicts are an agent review; human review is pending.

## What ran

| | |
| --- | --- |
| Brain | `8b0b173`, configuration hash `52cfa622…`, deployed at 19:21 |
| Dataset | `dev-profiles-offices-20260924-r3` on the local Postgres, port 55434, the same as the last two runs |
| Dev UI | `rockygpt-dev` at `32e328b`, Ask & Inspect on :3100. The browser pane was hidden, so each question was typed and sent through the page's own text box and buttons from in-page JavaScript |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Each case started from "Clear turns". The follow-ups in case 2 carried the earlier turns. [turns.json](turns.json) has each turn's answer, citations with any disagreement notes, tool arguments, resolution, hours conflicts, placements, evidence IDs and, for the rejected try, the reviewer's reason. [run.json](run.json) has the run details.

## Results

The ground truth is the same as before. Library (Main Building) is open Friday 7:45am–6:00pm, Saturday 10:00am–6:00pm and Sunday 12:00pm–12:00am this fall. The Research Help Desk has no verified hours. The Library is in the Peter P. Mercer Learning Commons, and its directory department is "Potter Library". Financial Aid is (201) 684-7549, finaid@ramapo.edu, E-210 in Academic Building E.

| Case | Turn | Tools | Graph | Hours conflict | Verdict |
| --- | --- | --- | --- | --- | --- |
| library-hours-and-contact | 1 | `lookup_profile("Ramapo library", hours, contact)`: matched, read as "library" | yes | none | pass |
| library-pronoun-then-topic-switch | 1 | `lookup_profile("Library", hours)`: matched | yes | none | pass, and no timeout this time |
| library-pronoun-then-topic-switch | 2 ("And Sunday?") | `search_campus(campus_hours, "library")` | no | not asked | pass |
| library-pronoun-then-topic-switch | 3 (Financial Aid) | `lookup_contact("Financial Aid")`: placed in Academic Building E | yes | not asked | pass |
| outdated-hours-claim | 1 | `lookup_profile("library", hours)`: matched | yes | none | pass: Friday is 7:45 a.m.–6:00 p.m. |
| where-is-the-library | 1, first try | `lookup_contact("library")`: placed in the Peter P. Mercer Learning Commons | yes | not asked | **fail**: `unsupported_claim` on a name claim, safe fallback |
| where-is-the-library | 1, two retries | `lookup_contact`, once after a contacts search | yes | not asked | pass both times |
| research-help-desk-tomorrow | 1 | `search_campus(campus_hours, "Research Help Desk")`, exact records | no | not asked | pass: "Hours unavailable", not called closed |

## Findings

1. **The hours conflict is fixed.** The Library's hours records no longer carry "Linked records disagree on schedule". Case 1 now describes the Research Help Desk's own note about its source's dates instead of a clash between two schedules, and case 3 answers without mentioning the desk at all.
2. **"Where is the library?" failed once on a name, not the place.** The rejected draft said the directory identifies the Library as "Potter Library". The reviewer answered that the directory lists Potter Library only as the department. Both retries phrased it as the department and passed. The pressure comes from the Library's name property, which the shared entity-fact reader marks conflicting between the directory ("Library") and the Archway page ("Potter Library"). The directory record itself lists "Potter Library" as an alias and as the department, so this reads as a second name, not a disagreement.
3. **The model's path still varies.** "And Sunday?" and the Research Help Desk question used a campus-hours search this time, and both were right. The router is off.
4. **The Research Help Desk answer is terse.** The exact-records path answered "Hours unavailable" with status answered. It is correct and doesn't call the desk closed, but it no longer says why the hours are unverified, as the reviewed answers did.

The [name alias check](../2026-09-25-library-name-alias/README.md) removed the name conflict in finding 2; "Where is the library?" still failed for other reasons.
