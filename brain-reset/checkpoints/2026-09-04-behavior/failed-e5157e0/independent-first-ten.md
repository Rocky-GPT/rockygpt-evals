# Independent agent acceptance review: first ten conversations

Reported runtime: `e5157e0`. Dataset: `v2-20260904145456`. Agent review complete; human review pending.

**10/10 conversations and 12/12 turns pass the unchanged semantic rubrics. All 12 returned HTTP 200. No materially unsupported delivered claims detected.**

This subset used 58 model calls (39 draft, 19 review) and 47 tool requests / 47 executions. HTTP latency total 244.584s; median 14.497s; mean 20.382s; range 6.356–40.775s. These are first-ten metrics, not full-suite totals.

| Case / turn | Semantic | HTTP | Seconds | Finding |
|---|---|---:|---:|---|
| library-hours-and-contact / 1 | PASS | 200 | 12.451 | Missing Saturday library hours disclosed; exact contact supplied. |
| dining-menu-allergy / 1 | PASS | 200 | 35.587 | 24 distinct vegan choices cover all 27 retrieved Dinner records; allergen fields preserved and no safety inference. |
| academic-calendar-specific-term / 1 | PASS | 200 | 7.923 | Correct Fall 2026 full-semester start and add/drop refund deadline. |
| shuttle-saturday-trip / 1 | PASS | 200 | 14.591 | Feasible Saturday outbound and evening return timetable; live/holiday limits retained. |
| password-reset / 1 | PASS | 200 | 12.558 | Exact trusted reset URL and IT contact; no secrets requested. |
| counseling-access / 1 | PASS | 200 | 40.775 | Exact counseling contacts/location, hours and currently usable after-hours support. |
| course-catalog-versus-registration / 1 | PASS | 200 | 21.462 | Accurate introductory CMPS catalog information; live seats explicitly unavailable. |
| programs-and-clubs / 1 | PASS | 200 | 40.723 | Exact programs/requirements; student organizations separated from Ramapo Green Department. |
| campus-location-and-office / 1 | PASS | 200 | 24.888 | Financial Aid E-210 supported; library building location left unverified. |
| library-pronoun-then-topic-switch / 1 | PASS | 200 | 12.867 | Library referent and Sunday follow-up preserved; Financial Aid topic switch retrieves fresh contact. |
| library-pronoun-then-topic-switch / 2 | PASS | 200 | 14.403 | Library referent and Sunday follow-up preserved; Financial Aid topic switch retrieves fresh contact. |
| library-pronoun-then-topic-switch / 3 | PASS | 200 | 6.356 | Library referent and Sunday follow-up preserved; Financial Aid topic switch retrieves fresh contact. |

The first-ten history checks reproduce the actual prior returned answers exactly. Every delivered citation ID and metadata field matches its captured record. Local campus time is Friday September 4, 22:46–22:50; Saturday shuttle dates refer to September 5, and Sunday library follow-up refers to September 6.

The dining answer reports the dated Dinner menu, not an instruction that Dinner is still available after 22:46. All 27 retrieved vegan Dinner rows are cited and represented by 24 unique names; duplicated names at different stations have the same allergen fields. Retrieval remains truncated over all 143 date-matched menu rows, so exhaustive coverage of the entire menu is unproved. The response uses “these,” and no retrieved vegan Dinner item was omitted.

CMPS 130 would benefit from its published math/science aptitude and scientific-computing qualification alongside the beginner recommendation. The response correctly preserves that prior programming is recommended, not required. This course-fit omission does not make the catalog answer or unavailable-seat boundary false. The first library-hours follow-up also browses Sunday unnecessarily before completing an explicit Saturday search; it never returns Sunday hours as Saturday hours.

Delivered behavior and withheld drafts were assessed separately:

- The library draft really did transfer an event room reference to the general facility location; that inference was withheld and removed. LC417 itself is a real event venue, not an invented number.
- The counseling timestamp guard overreached on a correct conditional “during business hours / after hours” explanation. It was not a plan to arrive before today’s expired closing time. Repair recovered a correct Friday-night answer, at extra latency.
- The withheld no-peanuts statement was factually true for all 27 cited vegan Dinner records in the answer; its paragraph alone cited five. This was citation coverage repair, not a food-safety hallucination.
- The programs draft already separated Ramapo Green as a departmental group. Requiring the exact label Department improved precision but was a conservative paraphrase rejection; the delivered answer uses the exact category. A later program characterization was supported elsewhere but removed after a per-part citation rejection.
- Several repeated room/program references triggered local citation demands despite those facts being present in preceding cited parts. These are not counted as fabricated values. The Sunday absence statement was narrowed to inability to verify.
- The shuttle answer correctly uses later Plaza stops followed by campus returns as scheduled return options; no rejection occurred in this run.

Full per-turn reasoning, unchanged expectations, evidence IDs, omissions, histories, metrics and draft classifications are in `independent-first-ten.json`. This sidecar provides agent review of this subset only; the coordinator owns remaining cases, identity checks and checkpoint disposition. No runtime or expectation changes, database/model/network calls or commits were made.
