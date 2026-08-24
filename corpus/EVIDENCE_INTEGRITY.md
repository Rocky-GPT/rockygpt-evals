# Tool result contract — evidence integrity

A BRAIN capability requirement, promoted from a shuttle bug after the same
defect was measured in a second, unrelated domain.

## The defect

`brain/tools.py` truncates every tool result to `MAX_RECORDS_PER_CALL = 8`,
taking the first 8 records of whatever the data service returned, before any
semantic filtering, with no signal to the model that anything was removed.

Measured consequences, both against unfixed DATA:

**Transportation.** `/v1/search/shuttles` called without `serviceDay` returns
33 records — Weekday (12), Saturday (12), Sunday (9) — interleaved and
unsorted. The first 8 contain three weekday trips, all early morning. With
`serviceDay=weekday`, the 12-trip timetable truncates to 8 and the last four
departures of the day are never visible. 2 of 10 baseline scenarios were
unanswerable under any argument choice; 8 of 10 were unanswerable if the model
omitted the optional `serviceDay`.

**Hours.** 10 venues published for a weekday, 8 exposed. Rock Climbing Wall
and Sharp Fitness Center vanish whenever the model does not narrow with `q`.

Two domains, same cause. The defect is the contract, not either dataset.

## The requirement

A tool result must be produced in this order:

```
1. Retrieve
2. Semantically filter / narrow to the request
3. Sort or rank where the domain defines an order
4. Apply a bounded result limit
5. Expose completeness metadata
6. Never silently discard potentially relevant evidence
```

Steps 2 and 3 must precede step 4. Today step 4 happens first, which is what
makes the cap destructive rather than merely economical.

Step 5 means the envelope states what it did:

```json
{ "recordCount": 12, "returned": 8, "truncated": true, "records": [] }
```

Today it sends `recordCount: 12` beside 8 records with no statement that four
were removed. The model can infer a discrepancy from the two numbers but has no
way to know which records are missing or whether they mattered — and nothing
downstream can distinguish "this is the complete set" from "this is a slice".

## What this does not say

It does not say remove the cap. The cap exists for context and cost control and
the threat model relies on a bound existing (§3.7). The requirement is that
truncation be **last, ordered, and declared** — not that it be unlimited.

Whether the cap's *value* needs to change is an empirical question that state C
of the controlled experiment answers, not an assumption to build on.

## Why it is a capability requirement rather than a bug fix

Any architecture — the current agent, an LLM router over deterministic tools, a
parser feeding a deterministic engine — reads its evidence through this
boundary. A record removed here is unrecoverable by every one of them. That
makes evidence integrity prior to the architecture question rather than part
of it, and it is the one piece of general architecture work this measurement
programme has produced direct evidence for so far.
