# TypeScript discourse implementation — audit

Written before the discourse corpus ran, so the reading is not shaped by the
result. Behaviour is only recommended for porting where the corpus reproduces
the failure it was built to prevent.

## What Python has today

Nothing server-side. `ChatRequest.history` is a client-supplied list capped at
10 turns (`schemas/chat.py`), appended verbatim to the model's message array in
`brain/orchestrator.py`. There is no conversation-state module, no record of
what Rocky said as distinct from what it retrieved, and no notion of the order
a tool returned its results in.

The system prompt tells the model to preserve continuity and re-verify facts
(`brain/prompts.py`), which is policy, not mechanism. Whether "the one after
that" lands on the right row is left entirely to the model reading a raw
transcript.

## What TypeScript built, and why

### `discourse.ts` — a record of what was said

Two structures, deliberately separate from the evidence ledger:

- `SpokenTurn` — question, the answer trimmed to 220 characters, the ids it
  cited, and a `withheld` flag so a reply that was held back cannot later be
  recapped as though it were given.
- `ResultSet` — the ids one tool call produced, **in the order it produced
  them**, with the arguments used.

`renderDiscourse()` injects this into the prompt under an explicit heading —
"What you have already told this student" — with the instruction that the
evidence section "includes rows you looked up but never mentioned, and a row is
not proof that you said it."

Recorded motivation: asked which departure it had first mentioned, Rocky named a
time that was in the rows but had never been spoken aloud, "every time".

### `relation.ts` — the split that defines the architecture

A model call classifies *how* the message relates to the list —
`same | next | previous | ordinal | none` — and deterministic code walks the
list to the row. Recorded motivation: given the ordered list and the selected
row, the model picked the row the student had asked to move *past*, four times
out of four, unchanged across three prompt rewrites.

This is the clearest existing instance of "AI understands, code solves", and it
is narrow: the interpreter never picks a row, counts, or answers anything.

### `conversation-state.ts` — scoping and bounds

Ledger and discourse record keyed by **visitor and conversation together**,
because a conversation id is only a value the client sends and keying on it
alone would hand one visitor's history to anyone who repeated the id. Bounded at
200 conversations, 40 rows, 8 spoken turns. Held in process memory, deliberately
not Redis or Postgres: losing it costs citations on a reuse, nothing more.

## One recorded negative result worth keeping

`renderDiscourse()` carries a comment that naming the neighbouring ids outright
— spelling out "the one after is e2" — made the model **more** likely to repeat
the row being moved past, not less. The ordered list stayed; the explicit step
was removed.

That is a warning against the obvious fix, and it should be tested before being
re-adopted rather than assumed.

## What the corpus tests, mapped to these behaviours

| Scenario | Behaviour it probes | TS mechanism |
| --- | --- | --- |
| `dsc-immediate-recall` | repeat what was just said | `SpokenTurn` |
| `dsc-topic-shift-recall` | survive five intervening topics | `SpokenTurn` (MAX_SPOKEN=8) |
| `dsc-conversation-truth` | said-time vs current-time when they differ | `SpokenTurn` + separation from ledger |
| `dsc-ordinal-first` | "the first one you listed" | `ResultSet` ordering |
| `dsc-ordinal-previous` | step forward then back | `ResultSet` + `relation.ts` |
| `dsc-entity-focus` | resolve "that" across domains | prompt-level in both |
| `dsc-false-claim-recall` | deny having said something real but unspoken | `SpokenTurn` vs ledger — the exact motivating failure |

## Position before the numbers

Discourse is the one category where an upstream contract repair has no
plausible mechanism. There is no data-service change that makes a system
remember what it said; the record either exists or it does not, and in Python it
does not.

That makes this the strongest a priori candidate for new BRAIN code so far. It
is still only a candidate: the admission rule requires the failure to be
reproduced first, and `dsc-conversation-truth` is the case that would settle it,
because passing it requires information that exists nowhere except a record of
the conversation.

Two cautions against porting wholesale:

1. `ChatRequest.history` already carries the raw transcript, so Python may pass
   the recall scenarios without any new structure — the model can read what it
   said. If it does, only the cases needing *ordering* (`ResultSet`) or the
   said-versus-true distinction would justify code.
2. `relation.ts` exists because ordinal traversal failed. In this corpus ordinal
   traversal went 50% to 100% under a data-contract repair, with no brain
   change — the list being mis-ordered was the problem, not the traversal. A
   `relation.ts` port should not be assumed from the TypeScript record alone.
