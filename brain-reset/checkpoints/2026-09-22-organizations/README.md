# Campus organizations checkpoint — September 22, 2026

Non-club Archway directory groups (departments, residence halls, teams, schools, seminars) are now `organization` identities. Explicit event-page organizers link to them, and chat can follow published relationships in either direction through `lookup_profile`'s new `related` section.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `451157296003ae3d3353467e75aea92b0e998483`, release `campus-organizations-development-2026-09-22`, routing `campus-routing-2` |
| Brain configuration | `08df09d602539e96dfc67df3984503de197cbd187bf7b55312cf65420eb31777` |
| Data compiler | `75fe0ff` |
| Dataset | `dev-profiles-organizations2-20260922`, database `rockygpt_profiles_dev_organizations2_20260922` |
| Identity hash | `2af0b39695a822498c6522ee2d932e15ec9e3e788e033bb692eeba315f76061d` |

Built from the unchanged `dev-profiles-organizers-20260922` source rows and the same organizer captures (`.local-logs/organizer-capture-20260922`), recompiled with the new compiler. Inputs, artifacts and the clone report are in `.local-logs/organizations-20260922/`. No production data, deployment or model calls were involved.

## Coverage

- 965 identities: all 905 previous IDs kept with no kind changes, plus 60 organizations.
- `organized_by`: 42 → 210 of 316 events. 105 events still have no captured explicit organizer. One is organized by the Archway Center for Student Involvement group, which needs a reviewed link to the CSI office.
- Six Archway groups are not duplicated as organizations because a reviewed identity already answers to their name, or publishes it as its contact department: Center for Student Involvement, Anisfield School of Business, Public Safety, Potter Library, Counseling Services, Center for Student Success. A first build without the department rule let "Public Safety" and "Potter Library" resolve to Archway group pages; `75fe0ff` fixed that. The unused first database, `rockygpt_profiles_dev_organizations_20260922`, can be dropped.

## Verification

- Graph paths ([graph-paths.txt](graph-paths.txt)): 11 of 26 ready (all `now` and `organizations` cases), 15 blocked on planned phases, 0 mismatched. `organizations` is now a shipped phase, so its cases gate future runs.
- Dev profile API (no model calls): the Women's Center event section links 30 events and examines the 20 soonest upcoming, reporting 10 as unexamined. A September 23 date returns exactly its 2 occurrences. Mackin Hall returns all 16. Emma C. Rainforth's related section returns her 5 convened programs (incoming) and 6 profile courses, all evidence-verified.
- Brain: 730 passed, 1 strict xfail, with the database tests; 88 live-graph tests pass against the real release. Data: 135 tests. Dev UI: typecheck, lint, 15 graph and 20 identity tests. CI is green for the Brain and Data.

**Live chat acceptance has not run.** It needs paid model calls against the development budget, and the last attempt stopped on provider quota. Run the graph corpus with `run.py` once that is approved.

## Rollback

From `rockygpt-infra`, restore the previous Brain and dataset (both databases are kept):

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 7b645a88aca1e5a983f0adea411d6fa7f4c89041 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_organizers_20260922 \
  --expected-dataset dev-profiles-organizers-20260922
```
