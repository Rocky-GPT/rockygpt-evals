# Program faculty checkpoint — September 22, 2026

Programs now link to the people their catalog **Program Faculty** field lists, as `listed_faculty` relationships. Only that explicit field (`customFields.xiQxl`) is evidence. The published `faculty` array mixes it with the Convener field, name matches and, for 22 programs, a scraper fallback, so it is never used. A listing is not a convenership, an appointment or a current teaching assignment, and the Brain says so with every one.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `1c6b67c2cbd3b36cd875f07a9ec6e8b12b5d6b11`, release `campus-program-faculty-development-2026-09-22`, routing `campus-routing-2` |
| Brain configuration | `be6cc8c691e8f12527036e53e203d05a6490a7baeaf911668cf1df208f94cf08` |
| Data compiler | `5d8d9fe` |
| Dev release loader | `rockygpt-infra` `10b9e81` |
| Dev UI | `e5dc4fa` |
| Dataset | `dev-profiles-faculty-20260922`, database `rockygpt_profiles_dev_faculty_20260922` |
| Identity hash | `a7415ca4744d068a032609951fd3bf60070f76462a2424ca794fb6eff6b5ce8e` |

Built from the unchanged `dev-profiles-organizers-20260922` source rows and the same snapshot as the requirements release. `catalog-course-identities`, `program-requirement-groups` and `event-organizers` are byte-identical to that release. `catalog-conveners` now also keeps the verbatim Program Faculty field; its Convener values are unchanged. Inputs, artifacts and the clone report are in `.local-logs/faculty-20260922/`.

## Coverage

- **585 `listed_faculty` relationships across 107 programs.** Exact profile URLs give 310. The other 275 resolve through 77 new redirect aliases in `src/reference/campus-identity-url-aliases.json`.
- **How the redirects were checked.** Each alias was checked hop by hop on September 23 (UTC). Every hop that changed the URL was issued without `X-Redirect-By: WordPress`, like the server rules for the `/ca/` → `/ahe/` school move. A WordPress hop is accepted only when it adds or removes a trailing slash; any other WordPress redirect is a slug guess, which is name matching.
- **Two guesses rejected.** `fariba-nosrati/)` → `fariba-nosrati/` and `cathy-hajo` → `cathy-moran-hajo`.
- **One existing alias needs a second review.** The earlier convener alias for `ca/faculty/yolanda-del-amo-ozaeta` ends in a WordPress guess (`yolanda-del-amo-ozaeta` → `yolanda-del-amo`). It is kept as reviewed.
- **98 listings over 35 URLs stay unresolved and reported:**
  - 30 URLs return 404.
  - 3 profiles belong to people without a person identity.
  - 2 redirects are WordPress guesses.
- **32 programs publish no Program Faculty field.**
- **Nothing else changed.** Every other identity, relationship and alias is identical to the requirements release, still 965 identities.

## Verification

- **Graph paths** ([graph-paths.txt](graph-paths.txt)): **19 of 26 ready** (was 17). Both `program-faculty` cases are ready; 7 are blocked on planned phases; 0 are mismatched. `program-faculty` is now a shipped phase.
- **Both questions, without the model** ([accounting-listed-faculty.json](accounting-listed-faculty.json)):
  - The Accounting BS lists exactly the six expected people, each email from that person's own contact record: Constance Crawford, Yongbum Kim, Changhee Lee, Edward Pettit, Wilson Rose, Kathryn G. Yeaton.
  - The listing cites https://catalog.ramapo.edu/programs/SB-BS-ACCT.
  - The conveners section reports no supported convener, so Constance Crawford is listed faculty, not the convener.
- **The profile sections are unchanged.** The Program Faculty evidence record is used only to recheck listings. The `program` and `conveners` sections and program search return exactly what they did before. A listing must cite the Program Faculty field, or the Brain rejects the identity map.
- **Test suites:**
  - Brain: 739 passed and 1 strict xfail, including the database tests. The 90 live-graph tests pass against this release.
  - Data: 139 passed, 5 skipped, plus typecheck, lint and the contract check.
  - Infra: 26 passed. Dev UI: typecheck, lint, 21 identity tests and 15 graph tests.
- **Live chat:** `graph-program-listed-faculty` stopped at the provider with HTTP 429 `model_quota_exhausted`: request `c4531e08-2e6f-42ea-bc25-496dd6d63c4f`, 0 tokens, `costNusd: 0`.

## Deploy order

The Brain validates the whole identity map. A release with a relationship type the Brain does not know, such as `listed_faculty` with an older Brain, makes every profile unavailable. Deploy the Brain first, as this local activation did.

## Rollback

From `rockygpt-infra`, restore the requirements release (all databases are kept):

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 0a0a5c774e7e520f3217ca7b5b4aa9de179faf68 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_requirements_20260922 \
  --expected-dataset dev-profiles-requirements-20260922
```
