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
