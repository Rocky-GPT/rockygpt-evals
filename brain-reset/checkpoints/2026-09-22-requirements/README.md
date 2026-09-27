# Program requirements checkpoint — September 22, 2026

Program requirements are now contextual records in the published graph. Each distinct catalog requirement section is one `requirement_group` record that keeps its nested all-of / any-of / choose-N rule tree, counts, credits and notes. Programs link to their groups (`requirement_group`), and groups link to catalog courses (`requirement_option`) with the option's exact position and and/or logic. An option is never turned into an unconditional requirement. The data repository now owns course IDs, and every existing course kept its ID.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `0a0a5c774e7e520f3217ca7b5b4aa9de179faf68`, release `campus-requirements-development-2026-09-22`, routing `campus-routing-2` |
| Brain configuration | `eca2a7d98ef19973fc2bbdd7bc7948d2b05ea4467d564c06714b402bdbc22127` |
| Data compiler | `e537d64` (with `0f54e6e`, `531bc1e`) |
| Dev release loader | `rockygpt-infra` `50535c6` |
| Dataset | `dev-profiles-requirements-20260922`, database `rockygpt_profiles_dev_requirements_20260922` |
| Identity hash | `2af0b39695a822498c6522ee2d932e15ec9e3e788e033bb692eeba315f76061d` (unchanged) |
| `catalog-course-identities` | `72bd893a28f3326e18f9ca608ce2bc3474713c1f947187af2475341eafe5bff1` |
| `program-requirement-groups` | `1344b289a271ac6e9052bb4b753e157d26be0619f238dcd99554f2dda3e57a55` |

Built from the unchanged `dev-profiles-organizers-20260922` source rows and the organizations release's snapshot. The four existing identity artifacts are byte-identical to the organizations release; only the two new artifacts are added. Inputs, artifacts and the clone report are in `.local-logs/requirements-20260922/`. No production data or deployment was involved.

## Coverage

- **Course IDs:** 3,344 published course identities. The course ID set and every alias match the previous export exactly: 0 IDs changed. All course nodes now report `identity_origin: published_catalog_course`. The data repository reproduces the Brain's original derivation byte for byte (golden-tested, including non-ASCII escapes). The dev loader recomputes each ID and refuses any difference.
- **Requirement groups:** 1,007 program sections become 389 groups: 370 rule trees, 9 course lists and 10 text-only sections. The 576 General Education sections are 9 shared groups, each listed by 64 programs, not 64 copies.
- **Edges:** 999 program→group links across 138 programs, each with its section order and exact `programs` artifact path. 3,292 group→course option edges, all of which resolve in the export.
- **Kept as published, not interpreted (22 reported issues):**
  - 31 of 415 rule nodes have a condition/count/credits combination with no unambiguous meaning, for example "any of" with a count of 2. They keep `choose: null`, and the Brain marks them uninterpreted.
  - 2 cited codes are opaque catalog IDs, not course codes, so they stay unlinked.
  - Nursing MSN appears twice under one program key, so it has no identity and its sections have no program link. Nothing is guessed from names.

## Verification

- **Graph paths** ([graph-paths.txt](graph-paths.txt)): **17 of 26 ready** (was 11). All 6 `requirements` cases are ready, including the published choose-N counts (7 of the CS electives, 2 math electives, 3 minor electives, 2 for Biology's math requirement, and 1 for General Education Quantitative Reasoning, which has exactly 10 options). 9 blocked on planned phases, 0 mismatched. `requirements` is now a shipped phase, so its cases gate future runs.
- **The checker now reads contextual records.** It matches a record label inside a hop's result, because many programs share labels like "Required Courses". A record can be narrowed to the program that lists it, and its published choice is checked. `graph-req-elective-count` now starts from the Computer Science BS's own Math Electives group, so its options can no longer be satisfied by another CS BS group.
- **One real question end to end, without the model** ([cmps-331-profile.json](cmps-331-profile.json)): "Is CMPS 331 Artificial Intelligence required for the Computer Science BS?"
  - `lookup_profile` with `include=['requirements']` resolves the program and returns its 13 groups in catalog order.
  - CMPS 331 appears only in "Computer Science Electives: Select Seven (7)", which requires at least 7 of 18 options. The record cites https://catalog.ramapo.edu/programs/TS-BS-CMPS and carries the caveat that an option is not a required course on its own.
  - It is not in "Computer Science Major Requirements".
  - A Brain unit test puts an equivalent fixture question through tool calling and generated-answer review, with a mocked model.
- **Test suites:**
  - Brain: 737 passed and 1 strict xfail, including the database tests. The 90 live-graph tests pass against both this release and the older organizers release, which has no published IDs and exercises the derivation fallback.
  - Data: 136 passed, 5 skipped. Infra: 25 passed. Eval harness: 21 passed.
  - CI is green for the Brain and Data.

## Live chat acceptance — blocked by provider quota

Every paid chat attempt stopped at the provider before any model work. Each returned HTTP 429 `model_quota_exhausted` with 0 input and 0 output tokens; the Brain recorded `costNusd: 0`.

| Case | Release | Request | Elapsed |
| --- | --- | --- | --- |
| `graph-org-events-week` (first of the 4 organization cases) | organizations | `8730ce54-6b21-433b-ba17-1f4cbce9d6b2` | 6.3 s |
| `graph-org-events-week` (retry) | organizations | `816f8815-a3fb-4c86-94c9-48e9ba6488ab` | 6.0 s |
| `graph-req-elective-not-required` | requirements | `1e4db274-142b-4318-b632-86b9430e163b` | 6.3 s |

The runner stops at the first 429, so the other organization cases were not sent. Correctness, citation, latency and cost results for the chat path remain unmeasured until the OpenAI quota is restored. Then run:

```sh
python3 brain-reset/run.py --corpus brain-reset/graph-conversations.json \
  --case graph-req-elective-not-required \
  --case graph-org-events-week --case graph-org-events-month \
  --case graph-event-organizer-and-location --case graph-organizer-is-not-venue \
  --interval 15 --output brain-reset/results/graph-step3-live.json
```

## Known gaps

- The requirements section is chosen by the model and is not routed. Routing evaluations do not cover it yet, as with `related`.
- Three General Education groups exceed the 2,000-character profile view and are marked truncated. `read_campus` returns them in full; the largest is about 6,000 characters.
- The dev inspector's record view does not resolve the new program-scoped requirement evidence IDs, and the dev UI has no Requirements tab. The existing `program_requirements` search collection is unchanged.

## Rollback

From `rockygpt-infra`, restore the organizations Brain and dataset (both databases are kept):

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 451157296003ae3d3353467e75aea92b0e998483 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_organizations2_20260922 \
  --expected-dataset dev-profiles-organizations2-20260922
```
