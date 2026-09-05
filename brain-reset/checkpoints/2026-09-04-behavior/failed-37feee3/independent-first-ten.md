# Independent agent review: first ten conversations

Runtime `37feee3`; dataset `v2-20260904145456`. Human review remains pending. Scores use returned answers, exact current-turn evidence and frozen prose expectations, not runtime approval.

**8/10 conversations and10/12 turns pass.** The location request returnsHTTP502; the programs answer omits Ramapo Green's Department distinction while grouping it with student-organization/club leads.

| Case /turn | Semantic | HTTP | Seconds | Finding |
| --- | --- | ---: | ---: | --- |
| library-hours-and-contact /1 | pass | 200 | 10.210 | Accurately states that Saturday September5 library hours were not found and separately supplies the exact Potter Library phone/email. The empty Saturday browse returned all11 hours records without a library entry. |
| dining-menu-allergy /1 | pass | 200 | 24.416 | All20 reported vegan Dinner records, station distinctions, and allergen labels match September4 evidence. None of the retrieved dinner allergen lists mentions peanut. Both factual paragraphs cite the20 relevant records. |
| academic-calendar-specific-term /1 | pass | 200 | 7.889 | Correctly gives August26,2026 as the Fall2026 full-semester start and September1,2026 as full-semester add/drop for100% tuition refund. |
| shuttle-saturday-trip /1 | pass | 200 | 21.914 | Every stated campus-departure, Garden State Plaza stop, and campus-return tuple matches the September5 Saturday timetable. The answer distinguishes scheduled service from live/holiday guarantees. |
| password-reset /1 | pass | 200 | 8.722 | Uses the trusted password.ramapo.edu reset link and exact IT Help Desk phone/email. Does not request secrets or claim to reset the account. |
| counseling-access /1 | pass | 200 | 10.454 | Counseling phone/email, Academic Building D/D-216, academic-year hours, and emergency counseling24/7/365 via201-684-7522 match the cited directory, counseling page, and suicide-prevention page. |
| course-catalog-versus-registration /1 | pass | 200 | 39.274 | The course codes/titles/descriptions, CMPS130 experience qualifier, CMPS148 continuation, Class Schedule directory mention, and inability to verify fall open seats match the evidence. |
| programs-and-clubs /1 | fail | 200 | 22.296 | Academic program names, major/minor distinctions, and curriculum facts are supported. The student-organization paragraph groups Ramapo Green with student organizations, and the follow-up offer refers to the options as clubs, while its source category is Department. |
| campus-location-and-office /1 | fail | 502 | 17.422 | HTTP502 invalid_model_output returns no student answer, including none of the supported Financial Aid contact/location information. |
| library-pronoun-then-topic-switch /1 | pass | 200 | 15.060 | The final answer preserves unavailable regular Saturday hours and provides the exact Potter Library contact without substituting another facility's schedule. |
| library-pronoun-then-topic-switch /2 | pass | 200 | 14.819 | Resolves Sunday to the library, identifies Sunday September6, and accurately states that the complete supplied Sunday campus-hours set has no library entry. The contact is freshly retrieved. |
| library-pronoun-then-topic-switch /3 | pass | 200 | 6.232 | Correctly switches to Financial Aid and freshly retrieves201-684-7549,finaid@ramapo.edu,and E-210 without carrying over library hours. |

## Main evidence findings

- Dining now returns all20 verified vegan dinner records with20 citations per factual paragraph. All allergen labels are correct. The no-peanut statement is limited to retrieved items and explicitly does not establish safety or absence of cross-contact.
- Ramapo Green is a real listing whose `fields.category` is `Department`. The returned answer groups it with student-organization leads and refers to the choices as clubs without preserving that distinction. This is an implied category error, not an invented organization.
- The course answer meets the catalog/live-registration rubric, but should identify graduate DATA501/601 and CMPS130's math/science emphasis when advising a beginner.
- The shuttle answer gives every correct tuple. Its extra boarding-verification caveat is unnecessarily conservative; the withheld scheduled return itinerary was a reasonable interpretation of the ordered timetable.
- Both actual follow-up histories match previous generated answers, resolve Sunday correctly, and switch to Financial Aid correctly.

## Withheld drafts and gate behavior

- Gate rejection is not proof of a false claim. It rejected a supported Environmental Science/Avian Ecology summary, and pressured a relevant CMPS selection into an unqualified longer list including graduate courses.
- Location draft1 retains an event-room-to-library inference despite its caveat. Draft2 removes it and is a sound partial answer, but no completed verdict is retained andHTTP502 withholds all help. All six provider responses were completed; the exact internal validation failure is not exposed.
- The corrected dining omission and the withheld7:30PM-as-afternoon label are separate from invented source facts or allergy-safety inferences.

Detailed expectations, evidence IDs, limitations, counts and draft diagnoses are in `independent-first-ten.json`. No runtime, corpus, data, network, or commit changes were made.
