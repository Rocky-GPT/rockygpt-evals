# rockygpt-evals

Answer-quality suites for RockyGPT.

Each suite drives real turns and asserts on what comes back — that answers are
grounded in retrieved evidence, that refusals happen when they should, that
follow-ups keep their referent, and that deterministic questions stay
deterministic.

## Running

    npm install
    cp .env.example .env
    npm run test:contracts
    npm run test:core
    npm run test:grounding
    npm run test:torture

Suites are black-box clients. Set `BRAIN_URL` and `DATA_URL` to local or
deployed services; no service source tree, model key, or database credential is
needed in this repository.

`test:contracts` checks readiness, invalid-request handling, documented request
bounds, and the public data response shapes without spending model tokens.
`test:core` runs every focused answer-quality suite and does spend real model
tokens. The torture runner remains an explicit, larger diagnostic.

## Grading with Jev

Checks that ask what an answer *claims* (open or closed right now, no more
shuttles today, a fact held back, a denial of something never said) are read by
Jev, TypeSafe's classifier, when `TYPESAFE_API_KEY` (or the Brain's
`BRAIN_TYPESAFE_API_KEY`) is set. A run of about 120 answers costs about a cent.

Jev only decides when it is at least 90% sure. Without a key, when a call
fails, or when Jev is unsure, the old word check decides, exactly as before.
Suites that use it print who graded what and what Jev cost, and the corpus
results file stores both verdicts beside every answer, so a disagreement can be
read rather than trusted. `npm run test:unit` tests the grader against a fake Jev.
