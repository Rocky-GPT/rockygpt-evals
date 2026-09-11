# Cheaper-model comparison

User authorized a maximum of **$5 total** on September 5, 2026. This is an
evaluation artifact, not a production model migration. No push is authorized.

The six available OpenAI candidates are GPT-5 nano, GPT-4o mini, GPT-5.6 Luna,
GPT-5.4 nano, GPT-5 mini, and GPT-5.4 mini. Gemini 3.5 Flash-Lite and DeepSeek V4
Flash cannot be tested because their provider credentials are not configured.

## Protocol

- Use clean Brain commit `a638942899cd6723381996ee0f64f66cab9b165e` through its
  actual `run_turn` entry point. This is a direct-runtime comparison; HTTP
  transport, server queueing and proxy latency are not measured.
- Run the existing 20-conversation / 27-turn acceptance corpus without editing
  questions or expectations. Cover eight diverse cases first, then all remaining
  cases. Rotate model order across cases. Preserve actual model-generated history.
- Use one captured campus time and the published dataset; retain before/after
  source hashes and dataset identity. Real read-only retrieval is measured.
- Use the same model for drafting and evidence review. Preserve runtime prompts,
  tools, schema, call budgets, token output limits, and timeouts. Pin dated model
  snapshots when available. Provider default draft reasoning remains unchanged.
- GPT-4o mini is a non-reasoning model: omit only its unsupported review reasoning
  parameter in the evaluation client. Force standard service tier on every model.
  These compatibility differences mean this is a comparison of models within the
  current runtime, not a controlled test of equal reasoning compute.
- No provider SDK retries. Runtime repair/review calls remain enabled and metered.
- Retain every call's input, output, usage, elapsed time and provider error in an
  immediate journal. Never log credentials. Test messages are synthetic students.
- Review student-visible responses against their own captured campus evidence
  and the original prose rubric. Citation presence is not factual accuracy.
- Compare full-rubric pass rates, unsupported claims, failures, model/tool counts,
  and latency alongside cost. A cheap incorrect response is not a successful
  answer. If coverage is incomplete, explicitly report unrun turns and compare
  matching questions; do not rank by unequal raw pass counts.
- A model's internal review is part of its runtime, not the independent semantic
  scoring oracle. Scoring uses offline Codex review of saved evidence, with no
  additional application-model API calls.

## Spending control

`authorized-budget-2026-09-05.json` is the shared durable ledger across output
directories and process restarts. An OS lock prevents simultaneous spenders. Each
call reserves the cost of the model's entire context window at the highest
applicable input/cache-write rate plus the requested maximum output before it is
sent. Completed usage replaces that reservation with a usage-derived estimate;
ambiguous failures retain the maximum. Explicit provider rejections are recorded
separately. A rate/quota rejection stops the entire run.

Luna's ledger conservatively bounds possible cache-write surcharges. The final
report can calculate a more precise estimate from the preserved
`input_tokens_details.cache_write_tokens`. Reasoning tokens are already included
in output tokens and must not be charged twice. Prices are provider API rates,
not Codex subscription usage; provider billing remains the final invoice.

Nine offline tests cover pre-call refusal, uncertain charges, cached/reasoning
token accounting, cache-write bounds, restart persistence, concurrent locking,
and precise completed-call cost calculation.

Official pricing: https://developers.openai.com/api/docs/pricing
Cache accounting: https://developers.openai.com/api/docs/guides/prompt-caching

## Run status

The comparison completed with 144 attempted turns reviewed and 18 dependent
follow-ups unrun after prior failures. See [results and recommendation](results-2026-09-05/RESULTS.md).
Known usage was $1.18453172, with a conservative upper bound of $3.49378132.
Paid testing has stopped. No model is marked verified.
