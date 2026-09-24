# Library graph check, 2026-09-24

This morning's [browser acceptance run](../2026-09-24-browser-acceptance/README.md) found that every Library hours question tried the Library's profile first and got no hours back, so the answer came from a campus-hours search. Since then the Library entity links its own hours (rockygpt-data `f4bb85f`, `9f4d92e`), its building (`3166a72`) and its club page (`518de06`). This run asks the three Library cases again in Ask & Inspect, plus two new questions for the building and the second schedule, and grades how each answer was formed.

**Result:** 6 of 7 turns answered correctly. Four of the five Library hours turns used the graph or its profile lookup, and the Library profile now returns hours. "Where is the library?" failed: the model never looked at the relationship that places the Library in its building. The verdicts are an agent review; human review is pending.

## What ran

| | |
| --- | --- |
| Brain | pinned build `f8f85fd`, configuration hash `ce28a54e…`, deployed by another session at 18:06 |
| Dataset | `dev-profiles-offices-20260924-r3` on the local Postgres (port 55434); it carries all of the data changes above |
| Dev UI | `rockygpt-dev` `e1d0caf`, Ask & Inspect on :3100, driven in the desktop app's built-in browser |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Each case started from "Clear turns"; the follow-ups in case 2 carried the earlier turns. [turns.json](turns.json) has each turn's answer, citations, tool arguments, entity resolution and evidence IDs; [run.json](run.json) has the run details.

## Results

Ground truth from the release: Library (Main Building) is open Friday 7:45am–6:00pm, Saturday 10:00am–6:00pm and Sunday 12:00pm–12:00am in the fall semester (Aug. 26–Dec. 15, 2026). The Research Help Desk has no verified hours on any day: its source gives conflicting dates, and the record says so without calling the desk closed. The Library's contact is (201) 684-7578 and refdesk@ramapo.edu; Financial Aid's is (201) 684-7549, finaid@ramapo.edu, E-210.

| Case | Turn | Tools | Graph | Verdict |
| --- | --- | --- | --- | --- |
| library-hours-and-contact | 1 | `lookup_profile("Ramapo library")`: no match; then contacts and campus-hours searches | no | pass: Saturday hours and both contact details are right |
| library-pronoun-then-topic-switch | 1 | `search_campus(campus_hours, "library")`, exact records | no | pass |
| library-pronoun-then-topic-switch | 2 ("And Sunday?") | `lookup_profile("Library", hours)`: matched, 2 records | yes | pass: Sunday hours, and the desk's are kept separate |
| library-pronoun-then-topic-switch | 3 (Financial Aid) | `lookup_contact("Financial Aid")`: matched | yes | pass |
| outdated-hours-claim | 1 | `lookup_profile("Library", hours)`: matched, 2 records | yes | pass: Friday is 7:45am–6:00pm, not 2 a.m. |
| where-is-the-library (new) | 1 | contacts search, then `critical_facts` search for "Potter Library" | no | **fail**: `unsupported_claim`, safe fallback |
| research-help-desk-tomorrow (new) | 1 | `lookup_profile("Research Help Desk", hours)`: matched the Library through its alias, 2 records | yes | pass (partial status): the desk's hours are unverified, and the Library's hours don't stand in for them |

## Findings

1. **The Library profile now returns hours.** In the morning run, `lookup_profile("Library", hours)` returned nothing all four times. Here it returned both schedules every time it was called, and those answers needed no search.
2. **"Ramapo library" resolves to nothing.** Names resolve only as an exact name or reviewed alias, and the model added the college name. The answer was still right because the model fell back to search. A resolver that drops a leading "Ramapo" would fix this for every entity, not only the Library.
3. **Location questions don't reach the placement.** The Library's `located_at` relationship to the Peter P. Mercer Learning Commons is reachable only through `lookup_profile` with the `related` section. The model searched contacts instead. The Library's directory entry has no room, so its draft had no support, and the reviewer rejected it.
4. **The first hours question in case 2 skipped the graph.** It went straight to a campus-hours search and gave a correct exact answer. The router is off, so this path choice varies from turn to turn.
