# Brain behavior checkpoint — unverified

Runtime: `a638942899cd6723381996ee0f64f66cab9b165e` on `codex/brain-evidence-gate`.
The published dataset remains `v2-20260904145456`. No dataset, original acceptance
expectation, or synthesis-prompt change was made. Nothing was pushed.

**This checkpoint is not verified.** The model API returned HTTP 429 with
`insufficient_quota` / `credit_balance_exhausted`, without retry or reset headers.
The final component run stopped after its first failed provider call. One separate
minimal diagnostic confirmed the credit error, then model calls stopped.
The full 20-conversation / 27-turn acceptance suite has not run on this commit.
No unsupported-claim or latency result is available for its final student answers.

## What changed

- Every draft receives a separate evidence review before release. Source IDs,
  provenance, freshness, output limits, and safe source links remain checked in code.
- The runtime rejects identified source-to-entity scope errors, inferred allergy
  safety, unsupported factual premises, and elapsed dated plans. Conditional
  service procedures retain their conditions; they do not expire at today's closing.
- Same-answer summaries can reuse earlier citations while explicit citations keep
  their own scope. Menu lists can retain all retrieved item citations. Expanded
  records survive overlapping searches; small collection discovery helps find
  actual published programs and organizations.
- Retrieval and repair share bounded execution without consuming each other's
  last call slots. Repaired answers receive a new review. Invalid review contracts
  get one bounded retry. Metrics distinguish draft/review and requested/executed
  tool calls, including safe failure paths.
- Evidence review uses medium reasoning. A complex review can use up to 30 seconds
  within the existing 50-second turn and 52-second HTTP bounds. Both existing
  clients allow 60 seconds. The system still has one model-driven loop and two
  read-only campus tools; no phrase routing or extra service was introduced.

## Validation and limits

Local checks pass: **120 Brain tests**, Ruff, strict mypy (10 source files), and
**8 evaluation-harness tests**. The wheel matches the committed runtime and includes
both instruction files without credentials or retired classifier files. One upstream
TestClient deprecation warning remains. Two harness tests required loopback socket
permission; all eight passed with that permission.

The frozen original suite and runner hashes are unchanged. Runtime, component,
helper, wheel and dataset identities are retained in [blocked-a638942](blocked-a638942/).
That folder includes the aborted component report and the provider diagnostic.
The component attempt made **1 failed model call, 0 tool calls**, taking 1.156 seconds;
the diagnostic was **1 additional failed model call, 0 tool calls**. These are not
student acceptance timings. The prepared six-case premise stability check was not run.

The latest completed full run used the earlier `e5157e0` runtime, **not this checkpoint**:

| Measure | Earlier full-run result |
| --- | --- |
| Semantic conversations | 18 / 20 pass |
| Semantic turns | 25 / 27 pass |
| Unsupported delivered claims | 1 policy inference |
| HTTP results | 26 × 200; 1 × 504 |
| Model calls | 117 attempted: 77 draft, 40 review; 116 completed |
| Tools | 82 requests, 82 executions; all `search_campus` |
| HTTP latency | median 12.558 s; nearest-rank p95 40.775 s; maximum 42.057 s |
| Total HTTP time | 467.051 s, excluding pacing gaps |

Its failures were a timeout after repeated citation repair and the narrow inference
that a posted tuition charge disproves a universal waiver. The price itself was
accurate, and the injection was refused. These findings motivated subsequent
changes; they do not establish that the final implementation now passes.
See [the complete failed run](failed-e5157e0/README.md) and both independent reviews there.

The last completed component run, on `cf391a1`, passed **25 / 26**. It rejected the
policy inference and accepted the conditional counseling answer, but overrejected an
optional evening plan by assuming the student stayed until service closing. The
final reviewer instruction preserves actual conditions and stated activity durations;
a new negative counterpart tests explicit departure at an event's closing time.
That final change remains unverified live because the API credit was exhausted.
These model-based checks are not a formal proof of factual entailment.

## Retained evidence

- [Original frozen e2ddd39 acceptance](failed-e2ddd39/acceptance.md): 17 / 20 conversations,
  24 / 27 turns; two unsupported or overbroad claims and one HTTP error.
- `failed-42b72f6/`, `failed-37feee3/`, and `failed-e5157e0/` preserve later unsuccessful
  full runs. Provider failures and unrun turns remain visible.
- `component-iterations/` preserves the intermediate component results, including
  conservative failures. `cases-through-26.json` reconstructs the exact prior corpus
  bytes and matches the recorded SHA-256; the final 27-case corpus preserves those
  26 objects and adds one explicit incompatible-sequence case.
- [Machine-readable status and metrics](verification-summary.json) separates the
  blocked final checkpoint from completed earlier runs.

All semantic assessments are agent reviews against captured records and unchanged
rubrics. No human review or verification claim is implied by passing machine checks.
Timings include passive observation overhead and describe sequential samples, not load.

## Resume without changing the checkpoint

Restore API credit, confirm Brain is clean at `a638942`, then run the complete fixed
component corpus and the separately prepared premise stability check. Start the
unchanged acceptance runner with an empty report against that exact runtime and the
current published dataset, retaining before/after identities, actual histories,
evidence, model/tool counts and latency. Review every delivered answer independently.
Only mark verified after a full semantic pass; do not substitute a composite of runs.
Do not push. A supervised acceptance launcher and passive observer are retained in
`blocked-a638942/`; use a fresh output directory when resuming.
