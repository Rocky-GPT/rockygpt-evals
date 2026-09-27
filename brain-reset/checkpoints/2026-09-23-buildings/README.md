# Buildings checkpoint — September 23, 2026

People and offices now link to the campus buildings their published room numbers are in. A room like `D-224` places the Registrar in Academic Building D because `D` is that building's prefix in the reviewed room-prefix table of the committed campus map (`data/map/campus-map-data.json`, approved September 22). People get `office_at`; offices, facilities and venues get `located_at`. A building is a location, not a school, a host or an owner, and the Brain says so with every link.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `1c4a04dcd04470055e9963d43916f826cac2c709`, release `campus-buildings-development-2026-09-23`, routing `campus-routing-2` |
| Brain configuration | `88c71dd493a43c7873e3911631f91068d06a6d7be31e1c56bf50746ab0237ba3` |
| Data compiler | `2cd9796` |
| Dev release loader | `rockygpt-infra` `d1db8dc` |
| Dev UI | `2012a1f` |
| Dataset | `dev-profiles-buildings-20260923`, database `rockygpt_profiles_dev_buildings_20260923` |
| Identity hash | `918d34bbd58f27db680d4f0c330ae500aef10626c1c5eb93ef84cf06a65697b7` |

Built from the unchanged `dev-profiles-organizers-20260922` source rows and the same snapshot as the program faculty release. `catalog-conveners`, `catalog-course-identities`, `program-requirement-groups` and `event-organizers` are byte-identical to that release; `campus-buildings` is new. Inputs, the map file, artifacts and the clone report are in `.local-logs/buildings-20260923/`.

## A new static source

The campus map is now a published source, `campus-map` ("Ramapo Campus Map", `https://map.ramapo.edu/`, official primary). It is repository-static like the checked-in shuttle timetable: its truth is versioned by the Git revision, so it passes the provenance gates without a scrape.
- **Collection time.** Building records carry the map's own collection time (August 27, 2026), which the `campus-buildings` artifact keeps next to the Concept3D source URL.
- **Older releases.** A source release published before the source existed has no `campus-map` row. The dev loader creates it from the artifact, with a static run that keeps the map's collection time. The data publisher creates it normally for every new release.

## Coverage

- **14 building identities.** They are the map entries with room prefixes and a Concept3D location of their own. Each ID is a UUIDv5 over that location ID, so a rename keeps it.
- **Left out on purpose:** map entries without room prefixes, such as residence halls, fields and Havemeyer. Several of these also share one map location among several entries (the College Park Apartments, The Village, the two Laurel Hall buildings), which would block an identity even with prefixes.
- **201 `office_at` relationships for 200 people and 9 `located_at` relationships for offices.** One person has rooms in two buildings (`G-203B / ASB-431D`).
- **Three rooms place no one:** "Learning Commons 204A", "The Lodge" (Housing & Residence Life) and "SS-106" (no reviewed `SS` prefix). They are reported, and nothing is guessed from names.
- **Shared name, no merge.** The Berrie Center building shares its name with the Archway organization "Berrie Center". Both identities are kept, and a name lookup asks which is meant. The map's aliases ("d wing", "library", "gym") are not identity aliases yet; step 5 reviews aliases.
- **Nothing else changed.** Every other identity, relationship and artifact is identical to the program faculty release. There are now 979 identities.

## Verification

- **Graph paths** ([graph-paths.txt](graph-paths.txt)): **21 of 26 ready** (was 19). Both `places` cases are ready, including their Concept3D IDs, which the checker now confirms against each building's published map location. 5 are blocked on planned phases; 0 are mismatched. `places` is now a shipped phase.
- **Both conversations, without the model** ([places-verification.json](places-verification.json)):
  - The Finance BS convener is Timothy Haase; his own contact record gives room ASB-511. His `office_at` places it in the Anisfield School of Business (ASB) building, whose map record links to `https://map.ramapo.edu/?id=2292#!m/1133424?sbc/`.
  - The Registrar's D-224 places it in Academic Building D. The offices listed under that building are exactly the Center for Student Success (Academic Advising) D-207, the Counseling Center D-216, Health Services D-216C and the Registrar.
- **Rechecked at answer time.** The cited contact's room must still be `PREFIX-NUMBER` rooms whose prefix belongs to that building, or the link is not returned. Academic Building G has 76 occupants: a lookup returns 20 and reports the other 56 as unexamined.
- **Test suites:**
  - Brain: 744 passed and 1 strict xfail, including the database tests. The 90 live-graph tests pass against this release.
  - Data: 144 passed, 5 skipped; both opt-in PostgreSQL identity tests pass; typecheck, lint, the contract check and the build pass.
  - Infra: 28 passed. Dev UI: typecheck, lint, 22 identity tests and 15 graph tests. Eval harness: 22 passed.
  - CI is green for the Brain and Data.
- **Live chat:** `graph-office-colocated` stopped at the provider with HTTP 429 `model_quota_exhausted`: request `f0572d8b-2dc5-4c94-b1a7-98066f498ef1`, 0 tokens, `costNusd: 0`.

## Deploy order

As before, deploy the Brain before a release with a new kind or relationship type. A Brain that does not know `building`, `office_at` or `located_at` rejects the whole identity map, which makes every profile unavailable.

## Rollback

From `rockygpt-infra`, restore the program faculty release (all databases are kept):

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 1c6b67c2cbd3b36cd875f07a9ec6e8b12b5d6b11 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_faculty_20260922 \
  --expected-dataset dev-profiles-faculty-20260922
```
