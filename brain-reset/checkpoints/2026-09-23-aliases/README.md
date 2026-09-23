# Aliases and status checkpoint — September 23, 2026

Step 5 makes lookup find entities by the names people use, and marks people who are published as retired. Every alias comes from the identity's own name or linked records; no rule matches one entity's name against another's. An alias several identities share stays on each of them, so a lookup asks which one is meant.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `774ae6d8153f455a148c6e38fb82e13e16040d5f`, release `campus-aliases-development-2026-09-23`, routing `campus-routing-2` (test-only follow-up `d1038bc`) |
| Brain configuration | `3ccea5d6b0bae194d137ff3463dc4cd3e0c0698f78f52571f4b179377f850db0` |
| Data compiler | `49d749a` |
| Dataset | `dev-profiles-aliases-20260923`, database `rockygpt_profiles_dev_aliases_20260923` |
| Identity hash | `0aa6903807ef5f5e7c84197b4c37d70322d137eda3f76ef55c67abf98bfda713` |

Built from the unchanged source rows and the same snapshot as the schools release. Only `campus-identities` changed; the other seven artifacts, including the coverage report, are byte-identical. Inputs and the clone report are in `.local-logs/aliases-20260923/`.

## Aliases (152 added)

| Rule | Evidence | Examples | Added |
| --- | --- | --- | --- |
| Department | An office, facility or venue's own directory entry publishes it; the contact lookup already treated it as an alternative name. A person's department never names the person. | "Potter Library" (Library), "Public Safety" (both Public Safety entries), "Office of the Registrar", "Residence Life" | 9 |
| Abbreviation | A name ending in an uppercase abbreviation in parentheses | "SC" and "Student Center", "CPA" and "The Lodge", "EDIC", "XAE", "RCDC", "ASB" | 12 |
| Program family | A catalog program name ending in a degree designation (BA, BS, BSN, BSW, MA, MS, MSN, MBA, MFA, MPP, MSW, DNP, Minor, 4+1, -Graduate Certificate); every program sharing the name gets it | "Computer Science" (BS, MS, Minor, 4+1), "Social Work" (BSW, MSW), "History" (BA, Minor) | 131 |

- **Deliberately ambiguous.** "Computer Science" asks among four programs, and "Public Safety" returns both entries.
- **"Anisfield School of Business" names three entities:** the directory office, the school and the building. "ASB" names the school and the building.
- **Not added: "Birch".** No Ramapo source calls the Birch Tree Inn "Birch". The map also lists Birch Mansion (the President's and Provost's offices) as a separate building, so the bare name would be a guess. It needs a reviewed alias entry.

## Status

21 people whose own contact record publishes status `retired` carry `status: {state: "retired", evidence}`, citing that field. The Brain includes the status wherever the person is named:
- the matched entity and the candidate list;
- related entities, such as a program's convener;
- graph nodes and the export.

An unknown status invalidates the identity map, like any unknown field. Absence of a status publishes nothing about a person.

## Verification

- **Graph paths** ([graph-paths.txt](graph-paths.txt)): **26 of 27 ready** (was 22 of 26), 0 mismatched.
  - `aliases`: 3 of 4 ready, so it stays planned. `graph-alias-short-name` waits for a reviewed "Birch" alias.
  - `status`: a new shipped phase. Its case checks that Robert Becklen's node is published as retired; the checker now verifies a `status` on an entity expectation.
- **All four conversations, without the model** ([aliases-verification.json](aliases-verification.json)):
  - **"Computer Science":** asks among the BS, MS, Minor and 4+1. The catalog lists Scott Frees as convener of all four.
  - **"Public Safety":** returns both entries, emergency (201) 684-6666 and non-emergency (201) 684-7432.
  - **"Potter Library":** resolves to the Library, refdesk@ramapo.edu and (201) 684-7578.
  - **"Birch":** no match.
  - **Robert Becklen:** resolves with status `retired`.
- **Test suites:**
  - Brain: 750 passed and 1 strict xfail, including the database tests. The 90 live-graph tests pass against this release, after fixing a test that compared export nodes without their new status field.
  - Data: 148 passed, 5 skipped; both opt-in PostgreSQL identity tests pass; typecheck, lint, the contract check and the build pass.
  - Eval harness: 23 passed.
- **Live chat:** `graph-alias-two-entries` stopped at the provider with HTTP 429 `model_quota_exhausted`: request `b75b9b80-c449-48f0-9a7c-d43b05dd3f5f`, $0.

## Subjects: not built

Course subjects were proposed for this step, but building them now would make lookup worse without a measured need:
- **More ambiguity.** Subject names equal the program family names ("Computer Science", "History", "Accounting"), so dozens of program lookups would gain an extra candidate.
- **Registry bloat.** Linking the 3,344 catalog courses would roughly triple the relationships the Brain validates on every profile lookup.
- **No test needs it.** No graph case needs subjects, and course search already finds courses by code.

Revisit once caching lands (step 6) and a subject question fails.

## Update: "Birch" is deliberately not an alias

Decision of September 23: "Birch" is not added. `graph-alias-short-name` now expects the name to resolve to nothing: an unsupported match is the failure, and the chat turn must ask which place is meant rather than assume the Birch Tree Inn. The checker accepts an empty expectation for a name, and any match is a mismatch. `aliases` is now a shipped phase, and the corpus is **27 of 27 ready**.

## Rollback

From `rockygpt-infra`, restore the schools release:

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 44dce848c3c771fe793684fe1803e477cd1faecd \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_schools_20260923 \
  --expected-dataset dev-profiles-schools-20260923
```
