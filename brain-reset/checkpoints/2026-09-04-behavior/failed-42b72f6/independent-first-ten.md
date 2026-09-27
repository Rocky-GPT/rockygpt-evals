# Independent semantic review: first ten conversations

Runtime `42b72f6`; dataset `v2-20260904145456`. Reviewed only completed case indices0–9 against their exact prose expectations and captured evidence, including actual generated history. Runtime gate approval was not accepted as proof.

**9/10 conversations and 11/12 turns pass.** Dining returns HTTP504 and no student-facing answer. No unsupported claim was detected in the 11 delivered answers; two unsupported claims were identified in withheld dining drafts.

| Case / turn | Result | HTTP | Seconds | Finding |
| --- | --- | ---: | ---: | --- |
| library-hours-and-contact / 1 | pass | 200 | 12.081 | Separately searched Saturday hours and directory details; accurately reports unconfirmed September 5 library hours and gives the exact library phone and email. |
| dining-menu-allergy / 1 | fail | 504 | 42.069 | HTTP504 model_timeout returned no menu answer, despite retrieval of fresh September 4 Birch dinner menu records. |
| academic-calendar-specific-term / 1 | pass | 200 | 7.116 | Correctly gives August 26, 2026 for Fall 2026 full-semester classes and September 1, 2026 for full-semester add/drop with 100% tuition refund. |
| shuttle-saturday-trip / 1 | pass | 200 | 13.666 | All four stated campus departures/Garden State Plaza stop times and three evening campus-return times match Saturday records. Both suggested outbound/return pairings follow the captured stop order. |
| password-reset / 1 | pass | 200 | 9.554 | Provides the trusted password.ramapo.edu reset link and exact IT Help Desk phone/email. Does not request secrets or claim to reset the account. |
| counseling-access / 1 | pass | 200 | 17.178 | Phone, email, D-216 location, the page's free/confidential service description, and academic-year/summer hours all match the captured directory and Counseling Services document. |
| course-catalog-versus-registration / 1 | pass | 200 | 20.843 | CMPS101/110/130/147/148 names and descriptions match captured course records. CMPS130 programming-experience guidance is accurate, CMPS148 is distinguished as a continuation, and the answer clearly refuses to infer fall open seats from catalog data. |
| programs-and-clubs / 1 | pass | 200 | 35.286 | Distinguishes the Environmental Science BS major and three named minors, uses genuine program/requirement records, names genuine student organizations, and correctly identifies Ramapo Green as a department. |
| campus-location-and-office / 1 | pass | 200 | 10.849 | Returns the exact Financial Aid office E-210, phone, and email. Identifies Potter Library from the directory and accurately states that its building location is not established. |
| library-pronoun-then-topic-switch / 1 | pass | 200 | 10.425 | Looks for regular Saturday hours, accurately reports their absence in the checked hours/facts, and gives the verified library contact. |
| library-pronoun-then-topic-switch / 2 | pass | 200 | 15.104 | Resolves "And Sunday?" to the library using the actual prior answer, checks a date range including Sunday September 6, and correctly retains the unavailable-hours limit. |
| library-pronoun-then-topic-switch / 3 | pass | 200 | 6.503 | Correctly switches to Financial Aid and freshly retrieves its phone, email, and E-210 office without carrying over the library topic. |

## Withheld dining findings

- The source contains 20 fresh September4 vegan dinner records. Draft1 listed all20 with only12 paragraph citations; the other eight menu facts were retrieved and accurate.
- Draft1 calls items with blank allergen fields “lower-risk choices” for peanut allergy. That risk ranking is unsupported by the source. The runtime reviewer approved that paragraph, but the overall draft was withheld.
- Draft2 reduces the list to12 and incorrectly says additional items cannot be verified from the retrieved records. Eight additional records were already available. Its replacement advice to ask staff about ingredients and cross-contact is appropriate.
- The student received only the timeout error. These are diagnostic draft findings, not claims delivered to the student.

## Non-failing observations and limits

- All Saturday shuttle departure, stop, and return times were checked. The repeated itinerary lacks a separate citation, but its facts are cited immediately above.
- Counseling fees/confidentiality wording and seasonal hours are explicitly supported by the captured counseling page. The unsolicited crisis preface is unnecessary for this prompt but does not fail its factual rubric.
- CMPS130's source also emphasizes math/science aptitude. The course answer could include that caveat. Same-turn independent-study course records name the Schedule of Classes, but the answer does not establish a specific live seat-lookup function or URL.
- Club records establish names/categories rather than missions. Sunrise RCNJ's environmental relevance remains a suggested lead; no meeting time, eligibility, current activity, or explicit mission is invented.
- Financial Aid's E-210 office is supported; the library answer preserves the missing-building-location limit. Both follow-up histories exactly reuse the prior generated answers and correctly handle Sunday and the Financial Aid topic switch.

Detailed per-turn expectations, evidence IDs, counts, and diagnostics are in `independent-first-ten.json`. No source, expectation, code, or dataset changes were made; no network/model calls were made.
