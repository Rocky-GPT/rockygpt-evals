# rockygpt-evals

Answer-quality suites for RockyGPT.

Each suite drives real turns and asserts on what comes back — that answers are
grounded in retrieved evidence, that refusals happen when they should, that
follow-ups keep their referent, and that deterministic questions stay
deterministic.

## Running

    npm install
    cp .env.example .env
    npm run test:grounding
    npm run test:torture

Suites are black-box clients. Set `BRAIN_URL` and `DATA_URL` to local or
deployed services; no service source tree, model key, or database credential is
needed in this repository.
