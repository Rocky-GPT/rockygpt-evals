# Library graph rerun, 2026-09-24

The [first Library graph check](../2026-09-24-library-graph/README.md) found two Brain problems. "Ramapo library" resolved to no identity, because a name has to match exactly and the model added the college name. "Where is the library?" failed, because the Library's placement in the Peter P. Mercer Learning Commons was only reachable through the related section, and the model never asked for it.

Brain `9353756` fixes both. A name that matches nothing is tried once more without a leading "the" or campus name, and the rest must still be an exact name or alias. The contact section now carries the entity's verified building, with the building's map record to cite. Brain `60fc50a` also shows that placement to the reviewer. This run asks the same seven turns again.

**Result:** 7 of 7 turns answered correctly, up from 6 of 7. "Where is the library?" now says the Peter P. Mercer Learning Commons and cites the map record that holds the reviewed statement. "Ramapo library" now resolves to the Library. Six of the seven turns used the graph, up from four. One turn timed out on its first try and passed on a retry. The verdicts are an agent review; human review is pending.

## What ran

| | |
| --- | --- |
| Brain | `60fc50a`, configuration hash `a60f1301…`, deployed at 18:48. It also carries two commits other sessions made meanwhile: `c7ceb97` for shuttles and `7123991` for dining halls |
| Dataset | `dev-profiles-offices-20260924-r3` on the local Postgres, port 55434, the same as the first run |
| Dev UI | `rockygpt-dev` `e1d0caf`, Ask & Inspect on :3100, driven in the desktop app's built-in browser |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Each case started from "Clear turns". The follow-ups in case 2 carried the earlier turns. [turns.json](turns.json) has each turn's answer, citations, tool arguments, entity resolution, placements and evidence IDs. [run.json](run.json) has the run details, the retry and one earlier try that isn't counted.

## Results

The ground truth is the same as in the first run. Library (Main Building) is open Friday 7:45am–6:00pm, Saturday 10:00am–6:00pm and Sunday 12:00pm–12:00am this fall. The Research Help Desk has no verified hours. The Library's contact is (201) 684-7578 and refdesk@ramapo.edu, and its directory department is "Potter Library". Financial Aid's is (201) 684-7549, finaid@ramapo.edu, E-210. Two placements are new to the answers: the campus-hours page puts the Library in the Peter P. Mercer Learning Commons, and room E-210 is in Academic Building E by its prefix.

| Case | Turn | Tools | Graph | Verdict | First run |
| --- | --- | --- | --- | --- | --- |
| library-hours-and-contact | 1 | `lookup_profile("Ramapo library", contact, hours)`: matched the Library, read as "library", 5 records | yes | pass: Saturday hours and both contact details, with the desk's hours kept separate | pass, through search after no match |
| library-pronoun-then-topic-switch | 1 | first try timed out, HTTP 504 after 32.5 s; the retry ran two `search_campus(campus_hours)` calls and answered from exact records | no | pass on retry | pass |
| library-pronoun-then-topic-switch | 2 ("And Sunday?") | `lookup_profile("Library", hours)`: matched, 2 records | yes | pass | pass |
| library-pronoun-then-topic-switch | 3 (Financial Aid) | `lookup_contact("Financial Aid")`: matched, placed in Academic Building E | yes | pass: now adds "E-210 in Academic Building E" and links its map page | pass |
| outdated-hours-claim | 1 | `lookup_profile("Library", hours)`: matched, 2 records | yes | pass: Friday is 7:45am–6:00pm, not 2 a.m. | pass |
| where-is-the-library | 1 | contacts search, then `lookup_contact("Library", office, department)`: matched, placed in the Peter P. Mercer Learning Commons | yes | **pass**: cites the map record's reviewed statement, and "Potter Library" is the directory's department field | fail |
| research-help-desk-tomorrow | 1 | `lookup_profile("Research Help Desk", hours)`: matched the Library through its alias, 2 records | yes | pass with partial status: the desk's hours stay unverified | pass |

## Findings

1. **Both fixes work on real questions.** "Ramapo library" resolved in one call with no search. "Where is the library?" reached the placement through `lookup_contact`, and the reviewer accepted the building.
2. **The model still searches before it looks up the Library's location.** It ran a contacts search first, so the answer took two retrieval rounds. It was right, but a two-round answer has less room left for evidence.
3. **Contact answers now say which building.** Financial Aid's answer names Academic Building E and links its map page, cited from the building's own record.
4. **The Library's two schedules read as a conflict.** The Library entity links both the "Library (Main Building)" and "Research Help Desk" hours, and the hours section compares them as one schedule, so it reports a schedule conflict. The model kept them apart every time, but case 5 still says "the published records conflict", and the uncounted try on `9353756` came back partial, calling the schedules conflicting. The section should compare schedules only within one published name, the way it already keeps dining and campus hours apart.
5. **One turn timed out.** The first try at case 2's first turn ran past the Brain's turn deadline on its third model call, after 29.6 s of draft time. The retry answered in 9 s. The timed-out turn left an unsettled hold of $0.25 in the Brain's budget ledger.

The [hours scope check](../2026-09-24-library-hours-scope/README.md) fixed finding 4: the Library's two schedules no longer read as a conflict.
