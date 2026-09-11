# RockyGPT cheaper-model comparison — September 5, 2026

**Best observed value in the current Brain: GPT-5.6 Luna.** It passed 22/27 planned turns, with no unsupported delivered claims, at $0.235127 of recorded token usage. GPT-5.4 mini was faster (11.9 s median versus 18.0 s), but passed 20/27 and used $0.403982 in recorded tokens. Timeout charges are uncertain, so this is a recommendation based on observed quality and known usage, not a definitive invoice-level cost ranking.

Paid testing has stopped. The process completed with exit code 0. Known usage-derived cost totals **$1.18453172**; the conservative charge range is **$1.18453172–$3.49378132**. The durable guard retained **$3.49462502** after slightly more conservative cache-write accounting, below the authorized **$5** cap. No second run or production model change was made.

## Scope and integrity

- Runtime: `a638942899cd6723381996ee0f64f66cab9b165e`, current committed Brain after behavior fixes; this is not a rerun of the older `e2ddd39` checkpoint.
- Dataset: `v2-20260904145456`, unchanged before/after; activated September 4, 2026 at 15:01:54 UTC.
- Shared campus clock: September 5, 2026 at 00:26:35.918450 America/New_York.
- Original 20-conversation / 27-turn corpus and expectations unchanged. Brain source/prompt hashes unchanged and Brain git status clean.
- All six models attempted all 20 conversation openings. 144 of 162 planned turns ran; 18 dependent follow-ups were not run because a prior turn returned no answer. Actual generated histories were retained. Unrun turns do not earn passes.
- Semantic review covered all 144 attempted turns, using saved evidence and original rubrics. Review was offline Codex analysis with independent case reviews and root adjudication; no additional application-model judge calls.
- No model passed every conversation. No checkpoint is marked verified and no production model was switched. Nothing was pushed.

## Semantic results

| Model | Pass / 27 planned | Failed attempted | Unrun | Full conversations passed / 20 | Same 20 opening turns passed | Unsupported claims (affected turns) |
|---|---:|---:|---:|---:|---:|---:|
| gpt-5.6-luna | 22/27 | 4 | 1 | 16/20 | 17/20 | 0 (0) |
| gpt-5.4-mini | 20/27 | 6 | 1 | 14/20 | 15/20 | 0 (0) |
| gpt-5.4-nano | 18/27 | 7 | 2 | 13/20 | 13/20 | 3 (2) |
| gpt-4o-mini | 7/27 | 19 | 1 | 3/20 | 5/20 | 6 (5) |
| gpt-5-mini | 7/27 | 14 | 6 | 6/20 | 6/20 | 0 (0) |
| gpt-5-nano | 5/27 | 15 | 7 | 5/20 | 5/20 | 0 (0) |

Failures include wrong or incomplete semantic answers and runtime errors with no answer. Zero unsupported claims does not mean reliable service: GPT-5 nano and GPT-5 mini often delivered nothing.

## Cost and execution

Costs below include every attempt, review, repair, incomplete response and recorded failure. Lower values use returned token usage; upper values add retained maximum charges for ambiguous timeouts. Output tokens already include reasoning tokens. Luna cache-write charges use the reported write-token counts. These estimates are not a provider billing invoice.

| Model | Known cost | Conservative upper | Known cost / passing turn | Model calls (draft + review) | Tool requests / executions | Median / p95 latency |
|---|---:|---:|---:|---:|---:|---:|
| gpt-5.6-luna | $0.235127 | $1.299873 | $0.0107 | 121 (85 + 36) | 101 / 101 | 18.0 / 50.1 s |
| gpt-5.4-mini | $0.403982 | $0.722414 | $0.0202 | 105 (72 + 33) | 64 / 64 | 11.9 / 37.2 s |
| gpt-5.4-nano | $0.221353 | $0.389473 | $0.0123 | 106 (70 + 36) | 76 / 76 | 12.5 / 42.1 s |
| gpt-4o-mini | $0.095522 | $0.095522 | $0.0136 | 162 (117 + 45) | 85 / 85 | 14.0 / 25.6 s |
| gpt-5-mini | $0.184499 | $0.921491 | $0.0264 | 86 (74 + 12) | 64 / 64 | 41.1 / 49.1 s |
| gpt-5-nano | $0.044049 | $0.065009 | $0.0088 | 56 (48 + 8) | 54 / 54 | 24.5 / 42.2 s |

Total: 636 model calls and 444 tool executions. Latency measures direct committed runtime execution, including retrieval/review and failures; it excludes HTTP/proxy/queueing. p95 uses nearest rank. These are single observations, not latency confidence intervals.

All 20 opening questions were shared, but follow-up coverage differed after failures. Full-suite cost totals therefore are not equal-work price estimates. Cost per passing turn includes failed attempts; it should be read with pass coverage, not optimized alone.

## Why Luna leads, and remaining limits

- Luna had the best full-suite and shared-opening quality: 22/27 planned turns and 17/20 openings, with zero delivered unsupported claims. Recorded cost per successful turn was about 1.07 cents.
- GPT-5.4 mini was faster and the only model to complete the combined dinner/menu/hours/events question. Its failures included missing an available semester start date, failure on a dining follow-up, unsolicited deadline facts instead of clarification, wrong date context for library hours, and omitting the available campus emergency number.
- GPT-5.4 nano was faster than Luna but only slightly cheaper in known total usage, and worse in cost per passing turn. It handled the three-turn dining correction well, but missed other facts and made three unsupported claims.
- GPT-4o mini generated six unsupported claim occurrences and many evidence-review failures. Its low token price did not translate into a reliable campus assistant.
- Older GPT-5 mini/nano frequently exhausted the unchanged 2,400-token draft allowance on reasoning. Several incomplete responses contained 2,368 reasoning tokens and no answer. Their default-reasoning behavior is a poor fit for this frozen configuration; this does not establish their best achievable performance after tuning.
- Luna still failed courses/seats, programs/clubs, a dining correction, and the combined evening plan; one dependent turn was lost. It is the leading candidate for this system, not verified as production-ready.
- Urgent-safety latency remains a system concern even for semantically correct outputs: Luna took 15.165 s; GPT-5.4 nano 19.025 s; GPT-5 mini 49.099 s. GPT-5.4 mini gave immediate-safety advice in its final response but omitted the available campus contact. This run did not change buffered execution.

## Unsupported delivered claims

Claim occurrences are counted per delivered turn. Repeated wrong assertions in different turns count again. Correct facts with internal citation-ID mistakes are listed as citation defects in the review file, separately from unsupported facts. Rejected drafts are not counted as delivered claims.

- **gpt-4o-mini — password-reset, turn 1:** They have the tools and support staff necessary to resolve issues related to account access.
  Evidence finding: The cited and captured directory record establishes IT Help Desk identity and contact information, not its specific tools, staffing or assured ability to resolve account-access issues.

- **gpt-4o-mini — library-pronoun-then-topic-switch, turn 1:** The library is closed on Saturdays.
  Evidence finding: Cited documents:76598f69-123a-43ce-8d0f-befaa5781370 describes Administrative Offices (Normal Hours), not Potter Library.

- **gpt-4o-mini — library-pronoun-then-topic-switch, turn 2:** The library is closed on Sundays.
  Evidence finding: Cited documents:76598f69-123a-43ce-8d0f-befaa5781370 describes Administrative Offices (Normal Hours), not Potter Library.

- **gpt-4o-mini — library-pronoun-then-topic-switch, turn 2:** The library is closed on Saturdays.
  Evidence finding: Cited documents:76598f69-123a-43ce-8d0f-befaa5781370 describes Administrative Offices (Normal Hours), not Potter Library.

- **gpt-4o-mini — shuttle-saturday-trip, turn 1:** The latest departure for Garden State Plaza is at 7:30 PM, returning at 8:45 PM.
  Evidence finding: Captured Saturday sequence 11 departs campus at 9:55 PM, stops at Garden State Plaza at 10:30 PM, and returns to campus at 11:00 PM. The unqualified latest-departure claim contradicts this later scheduled trip.

- **gpt-4o-mini — dining-correction-and-followup, turn 2:** For lunch on Sunday, September 6, 2026, the vegan options at Birch Tree Inn include: ... 3. **Black Bean Burger**
  Evidence finding: The captured and cited menu:39556ffa-1346-412f-b185-2988e7ad2f91 is dated September 6 and vegan, but its meal is Dinner. No other captured burger record establishes availability for the requested lunch period. The omelet and zucchini do have captured Brunch support.

- **gpt-5.4-nano — future-unpublished-calendar, turn 1:** the only Ramapo “last day to withdraw (‘W’ grade)” deadline I’m able to access/cite from the academic calendar records available to me is for Fall 2026
  Evidence finding: Current-turn evidence includes calendar:0efcd6a8-4930-4bd9-8b1e-e21219cb78a7 and documents:167dd848-9098-4313-942e-e0743fe28fb3 for Spring 2027 full-semester withdrawal on April 7, plus other Winter/Spring withdrawal records. The only-available-term assertion is false.

- **gpt-5.4-nano — outdated-hours-claim, turn 1:** this Friday (Sept 5, 2026)
  Evidence finding: September 5, 2026 is Saturday. The supplied campus week’s Friday is September 4, and the captured September 5 administrative-hours row explicitly says Saturday. This is one contradicted date/weekday assertion.

- **gpt-5.4-nano — outdated-hours-claim, turn 1:** the main library (Peter P. Mercer Learning Commons)
  Evidence finding: The only captured passage naming Peter P. Mercer Learning Commons is documents:60bf8bc8-723c-404b-91f7-a1aca5988377, which describes the Village as adjacent to it. That passage does not identify the Learning Commons as the main library. The question embeds this unsupported campus-entity identity as a presupposition.

## Per-conversation matrix

Each cell is semantic passes / originally planned turns in that conversation. A missing dependent turn remains in the denominator.

| Case | Luna | 5.4 mini | 5.4 nano | 4o mini | 5 mini | 5 nano |
|---|---:|---:|---:|---:|---:|---:|
| library-hours-and-contact | 1/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| dining-menu-allergy | 1/1 | 1/1 | 0/1 | 1/1 | 0/1 | 0/1 |
| academic-calendar-specific-term | 1/1 | 0/1 | 0/1 | 0/1 | 0/1 | 1/1 |
| shuttle-saturday-trip | 1/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| password-reset | 1/1 | 1/1 | 1/1 | 0/1 | 0/1 | 1/1 |
| counseling-access | 1/1 | 1/1 | 1/1 | 0/1 | 1/1 | 0/1 |
| course-catalog-versus-registration | 0/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| programs-and-clubs | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| campus-location-and-office | 1/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| library-pronoun-then-topic-switch | 3/3 | 3/3 | 0/3 | 1/3 | 0/3 | 0/3 |
| dining-correction-and-followup | 1/3 | 1/3 | 3/3 | 1/3 | 0/3 | 0/3 |
| calendar-term-correction | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |
| ambiguous-closure | 1/1 | 1/1 | 1/1 | 0/1 | 1/1 | 1/1 |
| ambiguous-deadline | 1/1 | 0/1 | 1/1 | 0/1 | 1/1 | 1/1 |
| dinner-and-evening-event | 0/1 | 1/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| private-records-with-general-help | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 |
| untrusted-instructions-as-campus-fact | 3/3 | 3/3 | 3/3 | 1/3 | 0/3 | 0/3 |
| future-unpublished-calendar | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| outdated-hours-claim | 1/1 | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| urgent-campus-safety | 1/1 | 0/1 | 1/1 | 0/1 | 1/1 | 0/1 |

## Configuration and unavailable candidates

The same candidate model performed both drafting and evidence review. Runtime prompts, tools, token/call budgets and timeouts were preserved. Standard service tier was forced and SDK automatic retries disabled. GPT-4o mini alone omitted the unsupported review `reasoning` parameter. Model order rotated across cases. Pinned model IDs and per-call usage are in the raw report.

Gemini 3.5 Flash-Lite and DeepSeek V4 Flash were not tested because their credentials were not configured. GPT-5.4 was not rerun as a paid baseline; earlier results used different commits/time and cannot establish a controlled quality comparison. No claim is made that every cheaper model on the market was tested.

Pricing and cache accounting were checked against [OpenAI API pricing](https://developers.openai.com/api/docs/pricing) and [prompt caching documentation](https://developers.openai.com/api/docs/guides/prompt-caching). One fixed-configuration pass is directional evidence; models were not individually tuned and the sample is too small to prove a universal ranking.

## Artifacts and checks

- [Raw runtime report](report.json): requests, responses, evidence, traces, integrity hashes.
- [Semantic judgments](semantic-review.json): all 144 attempted turns and adjudication notes.
- [Machine-readable summary](summary.json): scores, usage, costs, counts and latency.
- [Final ledger](ledger.json) and `calls/`: durable per-call accounting.
- Nine offline spending/accounting tests passed (`test_budget.py`, `test_cost.py`).
- Brain remained clean; new comparison artifacts are in Evals. Existing unrelated `mvp/` work was left alone. No commit or push was made for this comparison.
