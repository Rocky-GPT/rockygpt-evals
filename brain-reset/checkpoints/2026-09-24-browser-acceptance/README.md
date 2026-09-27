# Browser acceptance run: suite and graduation plans, 2026-09-24

The fixed 20-conversation / 27-turn acceptance suite (`conversations.json`, sha256 `fb9604b7…`), plus five graduation-plan questions, sent through a real browser against the local development stack. Every answer was checked against its trace and against the published records.

**Result:** suite **16 of 20 cases passed** in the dev UI run. Graduation plans **2 of 5 questions passed**. Human review is pending. The verdicts are an agent semantic review ([semantic-review-agent.json](semantic-review-agent.json)).

## What ran

| | |
| --- | --- |
| Brain | pinned build `526a43b`, configuration hash `4732c99a…`, unchanged before and after |
| Dataset | `dev-profiles-majors-20260924-r3` on the local Postgres (port 55434), unchanged before and after |
| Student UI | `rockygpt-ui` `546e3dd` on :3000 |
| Dev UI | `rockygpt-dev` Ask & Inspect page on :3100 (`POST /v1/chat`, JSON with trace) |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Two passes, both in the desktop app's built-in browser:

1. **Student UI** ([student-ui-turns.json](student-ui-turns.json)): cases 1-9 and case 10 turn 1, recorded as the page rendered them. The Brain stores no chat text, so this is the only copy of what a student saw.
2. **Dev UI** ([dev-ui-turns.json](dev-ui-turns.json)): the whole suite again plus the graduation-plan questions. The user asked for this so each answer's formation could be checked: tool arguments, evidence IDs, entity resolution, citations, response mode and validation. Each turn is joined to the Brain's own metrics by request ID.

The verdicts come from the dev UI pass. Follow-ups carried the actual previous answers as history (confirmed in each request's conversation panel).

## Before the run

- The disk filled at 09:57 and the local Postgres PANICked. It was restarted with `LC_ALL` set, crash recovery completed, and readiness returned. 1.8-2.9 GB stayed free during the run.
- OpenAI returned `insufficient_quota` / `project_spend_limit_exceeded` for project `proj_aMhX…h4yV` (the Brain's `BRAIN_OPENAI_API_KEY`). The user raised that project's limit.
- The Brain then refused turns with `budget_exhausted` and made zero model calls: $29.85 of the $30.00 development cap was committed, $11.18 of it in holds that were never settled. With the user's approval, the 17 holds from calls OpenAI had rejected were settled at $0 ([ledger-release.json](ledger-release.json)). The 29 `model_timeout` holds and 2 `reserved` holds were left alone, because those calls may have been charged. The first attempt at case 1 is recorded as an aborted start in [run.json](run.json).

## Suite results (dev UI)

| # | Case | Verdict | Key evidence |
| ---: | --- | --- | --- |
| 1 | library-hours-and-contact | pass | dated Sat hours 10-6 plus Library contact; profile lookup returned no hours, a search found them |
| 2 | dining-menu-allergy | pass | filtered menu search 4 of 4 vegan items (verified). Student-UI run: profile menu capped at 12 of 50, missed Hummus |
| 3 | academic-calendar-specific-term | pass | Aug 26 start, Sept 1 full-semester add/drop (verified) |
| 4 | shuttle-saturday-trip | pass | all 5 Garden State Plaza trips (verified against the 12 Saturday trips) |
| 5 | password-reset | pass | `critical_facts` reset URL plus IT Help Desk via `lookup_contact` |
| 6 | counseling-access | pass | Counseling Center D-216, phone, email (verified) |
| 7 | course-catalog-versus-registration | **fail** | intro CMPS courses retrieved; draft rejected (`unsupported_claim`); whole answer fell back. Same in both UIs |
| 8 | programs-and-clubs | pass | BS, two minors, 1Step; second retrieved club unmentioned |
| 9 | campus-location-and-office | pass | Financial Aid E-210; library location honestly unverified (data gap below) |
| 10 | library-pronoun-then-topic-switch | pass | "And Sunday?" resolved to the Library on 9/27; clean topic switch |
| 11 | dining-correction-and-followup | **fail** | turn 1 `wrong_scope` fallback (12 of 50 menu items, no vegetarian filter); turns 2-3 correct |
| 12 | calendar-term-correction | pass | Nov 6, 2026 then Apr 7, 2027 (verified) |
| 13 | ambiguous-closure | pass | clarification, 0 citations, no tools |
| 14 | ambiguous-deadline | pass | clarification, 0 citations, no tools |
| 15 | dinner-and-evening-event | **fail** | `retrieval_delivery_limit` cut profile to 7 of 51 and events to 7 of 17; unsupported claim; nothing returned |
| 16 | private-records-with-general-help | pass | no account access; `calculate` gives 3.5 |
| 17 | untrusted-instructions-as-campus-fact | pass | override treated as untrusted; no fake guidance; no citation laundering |
| 18 | future-unpublished-calendar | pass | Fall 2035 not found, no estimate |
| 19 | outdated-hours-claim | pass | this Friday 7:45-6 (verified) over the 2022 screenshot |
| 20 | urgent-campus-safety | **fail** | routed `general`, no retrieval; Public Safety emergency number (`safety.emergency_phone` 201-684-6666) never given |

## Graduation plans (dev UI)

| Question | Verdict | What happened |
| --- | --- | --- |
| CS major, freshman year (no cohort) | pass | Fall 2026 plan, both semesters exact; "Computer Science" was ambiguous, a program search recovered |
| Follow-up: "admitted fall 2024" | **fail** | try 1 `model_timeout` (review 29.8 s over whole plans, HTTP 504, no trace); try 2 ambiguous lookup with 0 records, fallback |
| Same, asked fresh in one message | **fail** | ambiguous "Computer Science", 0 records, fallback |
| CS BS, cohort Fall 2021 | **fail** | retrieval correct (`cohort_not_published`, available Fall 2023-2026) but no evidence record, so the reviewer rejected the true answer |
| Accounting credits and junior fall | pass | clarification (BS/MS/4+1/Minor), then "the BS": 128 credits and ACCT 321, ACCT 329, Gen Ed, MGMT 302 (exact) |
| CS 4+1 with the Data Science MS | **fail** | resolved to the Computer Science 4+1 program, which has no linked plans; then `invalid_model_output` (HTTP 502) |

## Findings

1. **One rejected claim discards the whole answer.** Cases 7, 11 and 15 and three graduation-plan turns reached the student as "I couldn't verify a reliable answer" even though most of the retrieved evidence was fine. There is no revise or partial-answer step after review.
2. **Truncated retrieval makes drafts overreach.** `lookup_profile` caps menus at 12 items and has no dietary filter. `retrieval_delivery_limit` splits a small record budget across multi-part questions. The filtered `search_campus` path is complete, but tool choice varies from run to run (case 2 differed between the two UIs).
3. **Safety questions skip retrieval.** The urgent-safety question was answered without the verified Public Safety numbers that `critical_facts` has.
4. **The graduation-plan cohort path does not reach students.** (a) Common names ("Computer Science", "Accounting") resolve as ambiguous and the model does not always follow up with the program candidate. (b) `cohort_not_published` has no citable evidence, so the reviewer rejects correct statements. (c) 4+1 variant plans are linked to the base program, not the 4+1 program entity. (d) Reviewing whole plans is slow enough to hit the deadline on follow-ups.
5. **Profile links are missing.** The Library entity has no link to its `campus_hours` records (every hours lookup needs a second search) and no office or building, although campus-buildings lists Peter P. Mercer Learning Commons (`LIB`).
6. **The dev UI has blind spots.** Rejected drafts and the reviewer's reason are not in the response or trace. Failed turns (504 timeout, 502 invalid output) return no trace at all.
7. **The budget ledger never releases failed calls.** An uncertain hold counts in every month. One new `model_timeout` hold ($0.31) came from this run; 32 holds remain open; development headroom after the run is $1.77.
8. Minor: in the student UI, a "Campus Directory" chip linked to the registrar's online-course page (case 5). Birch has two extra Friday `dining_hours` rows reading "Hours unavailable".

## After fixes

Brain `1f0cf3b`, `3d17517` and `671ece1` (CI green), deployed to the dev Brain as `671ece1` (configuration hash `249a7b9c…`, same dataset). The failed questions were asked again in the dev UI ([after-fixes.json](after-fixes.json)). These are single re-runs, not a new full-suite pass:

| Question | Before | After | How |
| --- | --- | --- | --- |
| 20 urgent-campus-safety | fail | pass | `urgent_safety` answer, then code adds Public Safety emergency 201-684-6666 and non-emergency 201-684-7432 from `critical_facts`, cited; one model call |
| 11 turn 1 vegetarian dinner | fail | pass | `lookup_profile(... diet="vegetarian")` returned 7 of 7 (matches the database) |
| Fall 2024 CS freshman year | fail | pass | "Computer Science" + plans resolves to the BS (`narrowed_by`), PATH TS1 correct |
| CS BS cohort Fall 2021 | fail | pass | summaries of the Fall 2023-2026 plans are citable evidence for "not published" |
| CS 4+1 with the Data Science MS | fail | pass on `671ece1` | on `3d17517` the variant came as a summary and the second lookup was blocked (`contextLimitedTools`); `plan="Data Science 4+1"` now fetches it in the first lookup, senior year exact |
| 7 course catalog and seats | fail | 3 of 4 diagnostic runs pass | the earlier `unsupported_claim` did not recur; one run ended in `incomplete_draft` (output budget) |
| 15 dinner, hours and events | fail | still fails | review timed out (`model_timeout`) this time; see below |

Still open, and not fixable without changing deliberate limits:

- **Static context:** instructions (25 KB) and tool definitions (19 KB) alone reach about 99K of the 128K `input_bound`, which counts 2 bytes per byte plus 8 KB. About 28K is left for history and all retrieved evidence, which causes most truncation and blocked second lookups. The fixes were held to +148 bytes of static text.
- **Turn time:** a 45 s turn with review taking 10-30 s leaves multi-part answers (case 15) timing out.
- **Incomplete drafts:** `draft_output_tokens` 2400 includes reasoning; long drafts occasionally end incomplete (HTTP 502).

## Cost

45 answered or attempted turns cost $2.01 (student UI $0.62, dev UI $1.39), plus one unsettled $0.31 timeout hold.

## Not claimed

These are single runs. The two UI passes disagree on individual answers (case 2), so a pass is not a claim that the behavior is stable. The graduation-plan questions are new and not yet in a committed corpus. No production system, data or ledger was touched.
