# September 4, 2026 checkpoint

The [reviewed composite](verified-checkpoint.json) contains 20 conversations and
27 turns using `gpt-5.4-2026-03-05` and trusted release `v2-20260904145456`.
All 20 cases pass machine contract checks. The separate
[independent agent review](../../verification-review.md) checks factual support,
date and location scope, and conversation behavior. No human has reviewed these
reports; their `human_review` fields remain `pending`.

The composite retains 19 cases from the last complete frozen run and replaces
its failed password-reset answer with the successful targeted confirmation after
the final collection-discovery clarification. The JSON maps every case to its
source report and records this mixed-runtime limitation. The attempted fresh
full sweep after that clarification stopped when the API reported
`insufficient_quota` / `credit_balance_exhausted`. That interrupted sweep is not
counted as a completed semantic verification.

| Evidence | Purpose |
| --- | --- |
| [verified-checkpoint.json](verified-checkpoint.json), [readable report](verified-checkpoint.md) | Reviewed composite; exact original requests, responses, citations, traces, models, and timing are preserved. |
| [frozen-final-full.json](frozen-final-full.json) | Complete 20-case / 27-turn run before collection-discovery clarification. It contains the actual password-reset omission despite passing machine checks. |
| [password-confirmation.json](password-confirmation.json) | Successful targeted check after the discovery clarification; retrieves the verified reset URL and IT contact. |
| [shuttle-repeat-1.json](shuttle-repeat-1.json), [shuttle-repeat-2.json](shuttle-repeat-2.json) | Two independently generated correct shuttle itineraries, extracted without changing their recorded turns or responses. |
| [quota-stopped.json](quota-stopped.json) | Conservative resumed run that stopped on its first HTTP 429, retaining the failure and explicit unrun cases. |
| [quota-diagnostic.json](quota-diagnostic.json) | Sanitized full-prompt provider diagnostic establishing exhausted billing credits, with no reset headers. |

Across the composite's 27 retained turns, total HTTP time is 194.173 seconds,
median latency is 6.680 seconds, nearest-rank p95 is 11.644 seconds, and maximum
latency is 12.028 seconds. These are per-request measurements across the retained
attempts, not total wall time for the development and evaluation session.

Eight harness tests pass, including real localhost tests for full conversation
history replay and immediate stopping after HTTP 429. Corpus validation confirms
20 cases and 27 turns. Ordinary machine failures continue to the next independent
case; quota failures halt the run so failed requests are not repeatedly issued.
