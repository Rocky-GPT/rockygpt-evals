# Schools checkpoint — September 23, 2026

School identities are Ramapo's four current schools, as its official schools page (https://www.ramapo.edu/academics/schools/) lists them: Anisfield School of Business (ASB), School of Social Sciences and Social Work (SSSW), School of Science, Nursing, and Health (SNH) and School of Arts, Humanities, and Education (AHE). The former names that the catalog and Archway still publish are reviewed legacy names. This follows the decision of September 23, 2026: current official pages are canonical, and old catalog names are reviewed legacy aliases and source mappings.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `44dce848c3c771fe793684fe1803e477cd1faecd`, release `campus-schools-development-2026-09-23`, routing `campus-routing-2` |
| Brain configuration | `99ba538a425365261f0a462220583dfa6ec8f9736986ff1d86d437168dba60fd` |
| Data compiler | `3eefca6` |
| Dev release loader | `rockygpt-infra` `4cfba30` |
| Dev UI | `fc4b41a` |
| Dataset | `dev-profiles-schools-20260923`, database `rockygpt_profiles_dev_schools_20260923` |
| Identity hash | `18072c5314d46e2227340eb77308c1e07ae134832e8040ea85d3d16cabfc629f` |

Built from the unchanged `dev-profiles-organizers-20260922` source rows and the same snapshot as the buildings release. The inputs, the reviewed schools file, the captured schools page, the artifacts and the clone report are in `.local-logs/schools-20260923/`.

## Reviewed schools and legacy names

`rockygpt-data/src/reference/campus-schools.json` holds, for each school:
- a persistent ID;
- its official page and the abbreviation that page publishes;
- its former names, each with evidence observed on September 23:

| Former name (catalog / Archway) | Current school | Evidence |
| --- | --- | --- |
| School of Theoretical and Applied Science | SNH | `/tas/` redirects to `/snh/` |
| School of Contemporary Arts | AHE | `/ca/` redirects to `/ahe/` |
| School of Humanities and Global Studies | AHE | `/hgs/` redirects to `/ahe/` |
| School of Social Science and Human Services | SSSW **and** AHE | `/sshs/` redirects to `/sssw/`; the AHE page lists the education programs the catalog still files under this school |

The capture is a new repository-static source, `ramapo-schools` ("Ramapo Schools"), published the same way as the campus map.

## Coverage

- **4 school identities.** Each is named as its official page names it. Its aliases are its abbreviation and its former names, so a lookup for a former name resolves to the current school. "School of Social Science and Human Services" asks between SSSW and AHE, because that school was split.
- **301 `part_of` relationships:**
  - **Programs (113):** placed through their catalog school name only when it names exactly one current school. SNH has 42, AHE 48 and ASB 23.
  - **People (188):** placed through the current school their own faculty profile publishes. SNH has 54, AHE 63, SSSW 37 and ASB 34. A profile's "(Adjunct)" marker is kept.
- **Not placed, and reported:**
  - The 28 programs under the split former school, so SSSW has people but no placed programs.
  - 21 profiles marked "(Retired)".
  - 17 "Library Faculty & Staff" profiles, which name no school.
  - 3 "Interdisciplinary" programs.
- **Archway groups.** The groups publishing "School of Contemporary Arts" and "School of Humanities and Global Studies" are linked to AHE by reviewed record key, and the Anisfield group to ASB. The two former-name groups are no longer separate organization identities (58 organizations, was 60). No relationship pointed to them.
- **Shared name.** The ASB school shares its name with the directory office "Anisfield School of Business"; both are kept, and a name lookup asks which is meant. "ASB" resolves to the school.
- **Nothing else changed.** No other identity, relationship or artifact changed. There are now 981 identities.

## Verification

- **Graph paths** ([graph-paths.txt](graph-paths.txt)): **22 of 26 ready** (was 21). `graph-school-name-conflict` walks Computer Science BS → `part_of` → SNH → `part_of` (incoming) → includes both the program and Scott Frees. 4 are blocked on aliases; 0 are mismatched. `schools` is now a shipped phase.
  - The case changed with the decision. It used to expect no claim of sameness without a reviewed mapping. It now expects the answer that both are in SNH, citing the program's former name and the reviewed mapping.
- **Without the model** ([schools-verification.json](schools-verification.json)):
  - The Computer Science BS is placed in SNH through its catalog school "School of Theoretical and Applied Science". Scott Frees is placed there through his profile's "School of Science, Nursing, and Health".
  - SNH's record links to `https://www.ramapo.edu/snh/` and lists its former name with evidence. SNH has 96 members; a lookup returns 20 and reports 76 unexamined.
- **Rechecked at answer time.** A program's catalog school must still be the school's name or a reviewed former name. A profile's school must still be its current name, and never retired. A placement must cite a published school field.
- **Test suites:**
  - Brain: 749 passed and 1 strict xfail, including the database tests. The 90 live-graph tests pass against this release.
  - Data: 146 passed, 5 skipped; both opt-in PostgreSQL identity tests pass; typecheck, lint, the contract check and the build pass.
  - Infra: 29 passed. Dev UI: typecheck, lint, 23 identity tests and 15 graph tests. Eval harness: 22 passed.
- **Live chat:** `graph-school-name-conflict` stopped at the provider with HTTP 429 `model_quota_exhausted`: request `96440e74-b078-4bc1-8d67-3adaa46e0956`, $0.

## Open

- **The split school.** Placing its 28 programs needs a reviewed program-level list: which went to AHE (the education programs) and which to SSSW.
- **Deploy order.** Deploy the Brain before a release with the `school` kind or `part_of`, as before.

## Rollback

From `rockygpt-infra`, restore the buildings release:

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 1c4a04dcd04470055e9963d43916f826cac2c709 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_buildings_20260923 \
  --expected-dataset dev-profiles-buildings-20260923
```
