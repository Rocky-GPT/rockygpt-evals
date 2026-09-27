# Projection checkpoint — September 23, 2026

Step 6 finishes the graph projection. The development explorer now shows every entity through projection v2, which covers every collection an identity can link. The legacy properties view and its endpoint are retired, and the graph's current numbers are generated from the export. This checkpoint also records the Aliases page added the same day.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `54e84cf063e3463b89c7b42a0ea1a6aa9e2ca15d`, release `campus-aliases-development-2026-09-23` (no chat change) |
| Brain configuration | `9e5fcb9cda09dd3d95391f84f3add88d7c91f6e81724ec2fd52f53ef5f4af8f0` |
| Data compiler | `36b5642` (alias sources); docs generator `c6e6786` |
| Dev UI | `c5064f4` |
| Dataset | `dev-profiles-alias-sources-20260923`, database `rockygpt_profiles_dev_alias_sources_20260923` |
| Identity hash | `cc57d4dfd5c13dff35b98fa67065f2ac81062b04edafb6cb7bd486ace2d69ea7` (file hash `f749b2e7…`, unchanged since the reviews release) |

The dataset is built from the same inputs as `dev-profiles-reviews-20260923`. Only `campus-identity-coverage` changed; it gained `alias_sources`. Inputs and the clone report are in `.local-logs/alias-sources-20260923/`.

## Aliases page

Data → Aliases in the dev UI (`/data/aliases`) lists every alias, with what a lookup by it finds and why it exists.
- **Compiler.** It records each alias's rule and evidence. An alias no rule recorded fails the compile.
- **Brain.** `GET /v1/dev/identities/aliases` groups aliases by the name a lookup compares, using chat lookup's own matching.
- **This release:** 625 aliases under 463 names.
  - 394 names find one entity, 37 ask which one, and 32 ask which date.
  - "Birch" → Birch Tree Inn is marked human-reviewed.
  - "Dining Services" → Birch Tree Inn comes from the department on its directory entry.

## Projection v2

- **One source list.** A response lists each original record once, in `sources`. That entry carries freshness, validity, the artifact path, and record caveats such as staleness, the allergy note and schedule applicability. Each value names its source and field, and keeps only its own caveats.
- **Every collection mapped.** As properties: contacts, faculty, programs, clubs, events, buildings, schools and courses. As record groups: menu, dining hours and operating hours. Nested values are checked against key allowlists. A test fails if the link vocabulary gains a collection without a mapping.
- **One query per page.** A page reads its records in one query plus a count, not one query per row.
- **Per-release cache.** The validated registry, identity hash and graph index are built once per release. The cache key is the database, the release and every artifact hash. Freshness is never cached, and the export still builds its own graph inside its database snapshot.
- **Retired:** `/v1/dev/graph/projection/v1`, `/v1/dev/graph/properties`, the explorer's legacy view, the opt-in flag and `?projection=` switch.

### Measurements

Same entities, same release, warm Brain, over HTTP ([before](projection-v1.json), [after](projection-v2.json); `python3 measure_projection.py OUTPUT.json v2` reproduces them):

| Request | v1 | v2 |
| --- | --- | --- |
| Birch Tree Inn, 100 menu offerings | 837 KB, 1.34 s | 399 KB, 0.043 s |
| Birch Tree Inn, default view | 911 KB, 1.41 s | 447 KB, 0.043 s |
| Registrar | 5 KB, 0.21 s | 6 KB, 0.010 s |
| Scott Frees | 21 KB, 0.24 s, faculty not shown | 25 KB, 0.030 s, faculty shown |
| Computer Science BS | 7 KB, 0.24 s, program not shown | 12 KB, 0.008 s, program shown |

The first request after a release changes builds the cache, about 0.3 s. The knowledge index (1.27 MB) takes 0.27 s, almost all of it serialization.

## Generated numbers

`rockygpt-data/docs/campus-graph.md` is generated from the graph export by `npm run docs:graph -- EXPORT_JSON`. It lists:
- entities by kind, and how many have a relationship;
- relationships by type;
- linked records by collection;
- aliases, and why they exist;
- requirement groups;
- the most common coverage patterns.

`campus-identities.md` now names its counts as examples from a named snapshot and points to the generated file for current numbers.

On this release:
- 4,326 entities, of which 652 (15%) have a relationship. Excluding the 3,344 catalog courses, 599 of 982 (61%).
- 1,470 relationships, none unresolved.

## Verification

- **Graph paths:** 28 of 28 ready, 0 mismatched (`check_graph_paths.py`, no model calls).
- **Brain:**
  - 741 passed, 41 skipped locally. CI passed on `54e84cf`, including the database tests.
  - The opt-in live projection test passes against this release. It pages through all 887 Birch menu offerings. For one entity of each of the eleven kinds, properties are complete and every value equals its original record, read through `/v1/dev/graph/record`. Relationships match the knowledge index.
- **Data:** 155 passed, 5 skipped; typecheck, lint and build pass.
- **Dev UI:** typecheck and lint pass; 26 identity and alias tests and 12 graph tests pass.
- **Browser:**
  - The explorer opens Birch Tree Inn directly in the projection, with all 887 menu and 21 hours records and no withheld values.
  - Scott Frees shows faculty profile fields with their artifact path.
  - The Aliases page search finds "Birch" and "Dining Services".

## Rollback

From `rockygpt-infra`, restore the previous Brain on the same database (projection v1 and the legacy view come back with the dev UI's `07c8a77`):

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision f16c1bbf5189744ca66ffd73dc741beca69029e0 \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_alias_sources_20260923 \
  --expected-dataset dev-profiles-alias-sources-20260923
```
