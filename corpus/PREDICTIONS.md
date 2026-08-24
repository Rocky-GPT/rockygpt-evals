# Pre-registered baseline predictions

Sealed 2026-08-23 by Daniel Rajakumar, BEFORE the scored corpus was built or run.
Do not edit after the first scored run. Amendments go in a dated appendix below.

## Category predictions (current Python brain, no fixes applied)

| Category | Predicted |
| --- | ---: |
| Transportation correctness | 84% |
| Hours / availability | 86% |
| Map / entity resolution | 82% |
| Academic dates | 85% |
| Dining / menu | 92% |
| Events | 85% |
| Grounding-required recall | 76% |
| Ordinal / follow-up resolution | 80% |
| Conversation / discourse truth | 78% |
| Final-response factual faithfulness | 94% |
| Overall computable correctness | 84% |
| Repeat consistency, k=5 | 68% |

**Repeat consistency** is defined as: the percentage of scenarios where all five
repetitions reach the same correctness/grounding outcome. It does NOT require an
identical tool-call trace. Exact tool-route consistency is predicted separately
at ~50%.

## Predicted failure profile, most to least frequent

1. Tool/capability selection + grounding
2. Discourse/reference handling
3. DATA/tool contract problems
4. Deterministic temporal/ordinal mistakes
5. Final-answer factual mutation

Explicitly NOT predicted: that shuttle arithmetic is Rocky's largest problem.

## Shuttle `at` experiment prediction

Sealed before the DATA defect is touched.

Fixing shuttle `at` will materially improve transportation correctness but will
not eliminate the category's failures. If baseline transportation is ~84%, the
DATA fix alone is predicted to reach roughly **92-96%**, not 100%.

A jump to ~99-100% would be strong evidence against building further BRAIN
machinery for next-departure.

## Standing caveat

The 35 client-origin rows in the brain's chat_logs (2026-08-23) are a
test-session sample, not representative student usage: 13 distinct questions
across 35 rows. They must not be used for traffic weighting. Traffic-weighted
architecture decisions remain UNRESOLVED until real traffic exists.
