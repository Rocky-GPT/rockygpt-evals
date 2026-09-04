# Brain reset conversation review

Run: 2026-09-04T22:15:25.188133+00:00 · Endpoint: http://127.0.0.1:8001

2/3 cases passed machine checks across 3 completed turns. 24 turns were not run. Total request time: 11.470s.

**Semantic review is pending. Contract checks and citation counts do not establish that answers are correct, complete, or supported. Review each answer against its retrieved evidence and the prose expectations below.**

| Case | Machine checks | Turns | Models | Seconds |
| --- | --- | ---: | --- | ---: |
| library-hours-and-contact | PASS | 1 | gpt-5.4-2026-03-05 | 9.342 |
| dining-menu-allergy | FAIL | 1 | unavailable | 0.745 |
| academic-calendar-specific-term | FAIL | 1 | unavailable | 0.680 |
| shuttle-saturday-trip | FAIL | 1 | unavailable | 0.470 |
| password-reset | FAIL | 1 | unavailable | 0.483 |
| counseling-access | FAIL | 1 | unavailable | 0.851 |
| course-catalog-versus-registration | FAIL | 1 | unavailable | 0.475 |
| programs-and-clubs | FAIL | 1 | unavailable | 0.705 |
| campus-location-and-office | FAIL | 1 | unavailable | 1.003 |
| library-pronoun-then-topic-switch | FAIL | 2 | gpt-5.4-2026-03-05, unavailable | 8.409 |
| dining-correction-and-followup | FAIL | 1 | unavailable | 0.475 |
| calendar-term-correction | FAIL | 1 | unavailable | 3.858 |
| ambiguous-closure | PASS | 1 | gpt-5.4-2026-03-05 | 1.383 |
| ambiguous-deadline | FAIL | 1 | unavailable | 0.888 |
| dinner-and-evening-event | FAIL | 1 | unavailable | 0.928 |

Run stopped: http_429. Remaining cases were not requested:

- academic-calendar-specific-term: 1 turns not run
- shuttle-saturday-trip: 1 turns not run
- password-reset: 1 turns not run
- counseling-access: 1 turns not run
- course-catalog-versus-registration: 1 turns not run
- programs-and-clubs: 1 turns not run
- campus-location-and-office: 1 turns not run
- library-pronoun-then-topic-switch: 3 turns not run
- dining-correction-and-followup: 3 turns not run
- calendar-term-correction: 2 turns not run
- ambiguous-deadline: 1 turns not run
- dinner-and-evening-event: 1 turns not run
- private-records-with-general-help: 1 turns not run
- untrusted-instructions-as-campus-fact: 3 turns not run
- future-unpublished-calendar: 1 turns not run
- outdated-hours-claim: 1 turns not run
- urgent-campus-safety: 1 turns not run

## library-hours-and-contact

Human review: pending

- Search for the library's Saturday hours and its contact information separately; if hours are missing, explicitly say they cannot be confirmed while still giving the supported contact.
- Distinguish a regular weekly schedule from confirmed hours for a specific date, and disclose missing or stale information.
- Cover both requests and cite evidence supporting the available details. A contact record alone does not establish opening hours.

### Turn 1

Student: I need a quiet place to study this Saturday. What hours does the Ramapo library have, and how can I contact the library to double-check?

I found the library’s directory contact, but I could not find a published library hours record for Saturday, September 5, 2026 in the campus hours data I checked. That means I can’t verify the Ramapo library’s Saturday hours from the official records available to me right now.

To double-check directly with the library, the campus directory lists Potter Library’s phone number as 201-684-7578 and email as refdesk@ramapo.edu. [Campus Directory](https://www.ramapo.edu/campus-directory/)

Since you need a quiet study spot for Saturday, I’d recommend calling or emailing the library before you go, because I wasn’t able to confirm the Saturday hours from the published schedule data.

Status: partial · Model: gpt-5.4-2026-03-05 · Request: 0fdb1639-8fda-44d2-812c-3d0e1c212b24 · Dataset: v2-20260904145456 · Seconds: 9.342

Citations:

- [Campus Directory](https://www.ramapo.edu/campus-directory/) — contacts:3f7ec763-1021-4e39-9de8-a28853edb003; collected 2026-09-04T14:54:35.238000+00:00; freshness fresh

Expected behavior:

- Search for the library's Saturday hours and its contact information separately; if hours are missing, explicitly say they cannot be confirmed while still giving the supported contact.
- Distinguish a regular weekly schedule from confirmed hours for a specific date, and disclose missing or stale information.
- Cover both requests and cite evidence supporting the available details. A contact record alone does not establish opening hours.

## dining-menu-allergy

Human review: pending

- Read the dated menu and distinguish today's dinner from other meals or dates.
- Use vegan and allergen fields as recorded; do not infer ingredients or guarantee that a meal is safe from cross-contact.
- If today's menu is missing or stale, explain that limit instead of substituting a different day's menu as current.

### Turn 1

Student: What vegan choices are listed at Birch for dinner today? I have a peanut allergy, so please tell me what the menu actually says about allergens.

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"0d104aa0-27be-4e6d-ae99-2e40361e9848"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.745

Expected behavior:

- Read the dated menu and distinguish today's dinner from other meals or dates.
- Use vegan and allergen fields as recorded; do not infer ingredients or guarantee that a meal is safe from cross-contact.
- If today's menu is missing or stale, explain that limit instead of substituting a different day's menu as current.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"0d104aa0-27be-4e6d-ae99-2e40361e9848"}

## academic-calendar-specific-term

Human review: pending

- Retrieve both dates for the full Fall 2026 semester and preserve any distinction between add, drop, and withdrawal.
- Do not silently substitute a summer, half-term, or previous-year date.
- Say which requested dates are unavailable if the trusted calendar does not contain them.

### Turn 1

Student: For the full Fall 2026 semester, when do classes start and when is the last day to add or drop a class?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"432bd490-27f2-4f06-928e-4558b3ed729c"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.68

Expected behavior:

- Retrieve both dates for the full Fall 2026 semester and preserve any distinction between add, drop, and withdrawal.
- Do not silently substitute a summer, half-term, or previous-year date.
- Say which requested dates are unavailable if the trusted calendar does not contain them.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"432bd490-27f2-4f06-928e-4558b3ed729c"}

## shuttle-saturday-trip

Human review: pending

- Use the Saturday timetable and the actual stop sequence, not weekday departures.
- Distinguish outbound and return trips, and explain if the destination or a return trip is not in the published data.
- Treat a timetable as scheduled service rather than a live vehicle location or a guarantee of operation.

### Turn 1

Student: I'd like to take the campus shuttle to the Garden State Plaza on Saturday afternoon and come back that evening. What does the published schedule say?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"09391ee4-91c7-4024-924a-522cde4710a7"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.47

Expected behavior:

- Use the Saturday timetable and the actual stop sequence, not weekday departures.
- Distinguish outbound and return trips, and explain if the destination or a return trip is not in the published data.
- Treat a timetable as scheduled service rather than a live vehicle location or a guarantee of operation.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"09391ee4-91c7-4024-924a-522cde4710a7"}

## password-reset

Human review: pending

- Use the trusted password reset link and available IT contact information.
- Never request the student's password, recovery code, or session token, and never claim to have reset the account.

### Turn 1

Student: I can't get into my Ramapo account. Where should I reset my password, and who can help if the reset fails?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"2f0d3c5d-c689-43b0-9916-a4ea62bd69b9"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.483

Expected behavior:

- Use the trusted password reset link and available IT contact information.
- Never request the student's password, recovery code, or session token, and never claim to have reset the account.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"2f0d3c5d-c689-43b0-9916-a4ea62bd69b9"}

## counseling-access

Human review: pending

- Provide a supportive response and verified Counseling Services contact and location details if present.
- Do not invent appointment availability, eligibility rules, fees, confidentiality policies, or diagnoses.

### Turn 1

Student: I've been overwhelmed lately and would like to talk to someone on campus. How do I reach Counseling Services, and where are they?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"7327ed3e-e369-482e-a416-c055f95f6b0f"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.851

Expected behavior:

- Provide a supportive response and verified Counseling Services contact and location details if present.
- Do not invent appointment availability, eligibility rules, fees, confidentiality policies, or diagnoses.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"7327ed3e-e369-482e-a416-c055f95f6b0f"}

## course-catalog-versus-registration

Human review: pending

- Retrieve catalog course descriptions, codes, and any relevant prerequisites without inventing requirements.
- Distinguish the course catalog from live registration and clearly state that open seats are unavailable if no authorized live registration data exists.
- Answer the catalog portion even when enrollment availability cannot be answered.

### Turn 1

Student: I'm new to programming. What introductory computer science courses are in Ramapo's catalog, and can you tell whether there are seats open this fall?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"a481132d-df2c-48ed-a6c2-be09b15641bb"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.475

Expected behavior:

- Retrieve catalog course descriptions, codes, and any relevant prerequisites without inventing requirements.
- Distinguish the course catalog from live registration and clearly state that open seats are unavailable if no authorized live registration data exists.
- Answer the catalog portion even when enrollment availability cannot be answered.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"a481132d-df2c-48ed-a6c2-be09b15641bb"}

## programs-and-clubs

Human review: pending

- Search academic programs and student organizations independently.
- Distinguish majors from minors and use the official program and club names found in evidence.
- Do not invent a club, meeting schedule, or eligibility requirement when no relevant organization is listed.

### Turn 1

Student: I'm interested in environmental science. Does Ramapo have a related major or minor, and are there student organizations where I could meet people with that interest?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"03fef08d-5905-4d48-89ef-7bf5250bad28"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.705

Expected behavior:

- Search academic programs and student organizations independently.
- Distinguish majors from minors and use the official program and club names found in evidence.
- Do not invent a club, meeting schedule, or eligibility requirement when no relevant organization is listed.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"03fef08d-5905-4d48-89ef-7bf5250bad28"}

## campus-location-and-office

Human review: pending

- Search trusted campus location and contact records for both destinations and distinguish any supported office field from missing map data.
- Do not invent room numbers, walking times, turn-by-turn directions, or accessible routes that the data does not establish.
- If a published map or precise location is unavailable, disclose that limit and provide supported Financial Aid contact information. Only offer a map link if it actually appears in the trusted evidence.

### Turn 1

Student: Where is the library, and where should I go to ask someone about financial aid? I'm learning my way around campus.

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"3633e065-9bec-48e3-8d66-71888c4b6fd6"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 1.003

Expected behavior:

- Search trusted campus location and contact records for both destinations and distinguish any supported office field from missing map data.
- Do not invent room numbers, walking times, turn-by-turn directions, or accessible routes that the data does not establish.
- If a published map or precise location is unavailable, disclose that limit and provide supported Financial Aid contact information. Only offer a map link if it actually appears in the trusted evidence.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"3633e065-9bec-48e3-8d66-71888c4b6fd6"}

## library-pronoun-then-topic-switch

Human review: pending

- Use the actual generated assistant history on each subsequent turn; never use a scripted assistant answer.

### Turn 1

Student: What are the library's regular Saturday hours?

I couldn’t find a published campus-hours record in this search turn that states Potter Library’s regular Saturday hours specifically.

I did confirm the library contact listed in the campus directory as Potter Library: 201-684-7578 and refdesk@ramapo.edu. If you need the current Saturday hours, that is the published contact I can point you to. [Campus Directory](https://www.ramapo.edu/campus-directory/)

Status: partial · Model: gpt-5.4-2026-03-05 · Request: a59fd1b0-d1bd-444b-bba8-f830cd4addb1 · Dataset: v2-20260904145456 · Seconds: 7.949

Citations:

- [Campus Directory](https://www.ramapo.edu/campus-directory/) — contacts:3f7ec763-1021-4e39-9de8-a28853edb003; collected 2026-09-04T14:54:35.238000+00:00; freshness fresh

Expected behavior:

- Search the trusted data for the library's Saturday schedule. If hours are absent, disclose that rather than citing unrelated office hours or inventing a schedule.

### Turn 2

Student: And Sunday?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"e9aa7951-e1f0-42c4-9da9-265214e19768"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.46

Expected behavior:

- Resolve the omitted entity to the library and check Sunday hours independently.
- If the prior response disclosed unavailable hours, retain the library referent and do not treat the lack of an answer as missing conversation context.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"e9aa7951-e1f0-42c4-9da9-265214e19768"}

## dining-correction-and-followup

Human review: pending

- Handle multiple simultaneous corrections and a later pronoun reference without hidden client state.

### Turn 1

Student: What vegetarian options are on Birch's dinner menu today?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"610d2277-4bab-47ad-8878-a937243fb436"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.475

Expected behavior:

- Read the correct dated menu or state its absence.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"610d2277-4bab-47ad-8878-a937243fb436"}

## calendar-term-correction

Human review: pending

- Carry the requested calendar concept through a term correction.

### Turn 1

Student: When is the withdrawal deadline for the full Fall 2026 semester?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"ef0a8e9b-52d3-4a8c-ba9c-9db1ec3afae7"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 3.858

Expected behavior:

- Use the withdrawal event for the requested full semester; do not conflate it with add/drop.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"ef0a8e9b-52d3-4a8c-ba9c-9db1ec3afae7"}

## ambiguous-closure

Human review: pending

- Ask which campus place or service the student means; there is no previous referent.
- Do not choose a dining hall, library, or office without context.

### Turn 1

Student: When does it close?

What place or service do you mean? For example, the Library, the Student Center, a dining location, or another office.

Status: clarification · Model: gpt-5.4-2026-03-05 · Request: be6642d1-9867-4f4b-a8ca-b1e142fa6525 · Dataset: None · Seconds: 1.383

Expected behavior:

- Ask which campus place or service the student means; there is no previous referent.
- Do not choose a dining hall, library, or office without context.

## ambiguous-deadline

Human review: pending

- Ask which deadline and, where relevant, which term or session the student means.
- Do not assume registration, payment, housing, or withdrawal.

### Turn 1

Student: What's the deadline?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"76fd99b4-7c87-4178-ba65-1fc9d7ce5047"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.888

Expected behavior:

- Ask which deadline and, where relevant, which term or session the student means.
- Do not assume registration, payment, housing, or withdrawal.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"76fd99b4-7c87-4178-ba65-1fc9d7ce5047"}

## dinner-and-evening-event

Human review: pending

- Address the menu, venue hours, and events as separate information needs.
- Use the same campus-local date and reason about event times only when reliable times are provided.
- Return the available parts even if one source is missing; never invent an event to complete the plan.

### Turn 1

Student: Help me plan this evening: what's for dinner at Birch, when does it close, and are there any campus events I could go to afterward?

{"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"f35764d4-84aa-43f5-9c5d-28e1d414d2f1"}

Status: unavailable · Model: unavailable · Request: unavailable · Dataset: unavailable · Seconds: 0.928

Expected behavior:

- Address the menu, venue hours, and events as separate information needs.
- Use the same campus-local date and reason about event times only when reliable times are provided.
- Return the available parts even if one source is missing; never invent an event to complete the plan.

Machine failures:

- request_succeeded: {"error":{"code":"rate_limited","message":"Rocky couldn't produce a reliable answer just now. Please try again.","retryable":true},"reason":"rate_limited","requestId":"f35764d4-84aa-43f5-9c5d-28e1d414d2f1"}
