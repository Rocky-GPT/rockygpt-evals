# Document search speed, 2026-09-25

The office pages release (checkpoint 2026-09-24-office-pages) raised the release's document passages from 7,810 to 21,230, and document search slowed from about 128 ms to about 416 ms median. This change makes it faster than it was before the office pages, with the same results.

**Result:** on 133 queries through the Brain's own `CampusData.search`, every result matched between the old and new query. The median search went from 330 to 70 ms on the dev database and from 315 to 85 ms on a copy holding 37 releases, which is what production's retention keeps. The dev Brain runs it.

## What ran

| | |
| --- | --- |
| Brain | `rockygpt-brain` `e2284f7` (dev), deployed to the dev Brain on `dev-profiles-offices-20260924-r3` |
| Data | `rockygpt-data` `4447b45` (dev): migration `025_document_heading_path_index.sql` |
| Dev database | `rockygpt_profiles_dev_offices_20260924`: the index was created by hand with the migration's statement. Its next publish records 025 (and 024). |

## Why it was slow

EXPLAIN ANALYZE of the old query for "FAFSA priority deadline" (269 ms):

- About 180 ms went to building a text-search vector for all 21,230 heading paths on every query. The rows spilled to temp files.
- About 60 ms went to counting word rarity by rescanning that list once per word.
- The chunk table scan read every retained release, not only the active one.

## The change

- Migration 025 adds a GIN index on `to_tsvector('english', metadata->>'headingPath')`. It is a numbered migration because `schema.sql` runs as one transaction whose `ALTER TABLE` statements lock `programs` and `shuttle_routes`. Building the index there would block the Brain's reads of those tables for the whole build.
- When the index exists, the Brain:
  - finds matching passages through the text and heading indexes, narrowed to the release's documents before any row is read;
  - counts rarity among the matches;
  - computes `ts_rank_cd` only for passages weighing at least the limit-th weight.
- The ranking rule is unchanged. The lookup that loads the release reports whether the index exists. Without it, the previous query runs, so the change is safe whichever repo reaches production first.

## How it was chosen

Six query designs were compared against the old query. A harness checked 159 queries for identical rows, order and totals, and timed each. B2 is the design that shipped.

| Design | Identical | Result |
| --- | --- | --- |
| A: find matches through the indexes | yes | median 426 → 90 ms, but queries with common words ("Ramapo", 15-18K matches) stayed at 500-1,000 ms |
| C: per-word match sets through the indexes | yes | 2x slower than the old query |
| E: per-word heading matches plus per-passage word levels | yes | slower than the old query |
| A2: A, with tie-break scores only for possible top results | yes | median 487 → 73 ms on 12 releases |
| A3: A2 with a stored heading vector column | yes | a little better tail, but a table rewrite under an exclusive lock and a column check in the Brain; not taken |
| B2: A2 narrowed to the release's documents before rows are read | yes | shipped (below) |

## Review

Four independent reviewers covered equivalence, performance, rollout and code, and skeptics then tried to refute each finding. Confirmed and fixed before shipping:

- **High:** A2 read index matches from every retained release before narrowing to the active one. Production keeps about 35 releases (weekly retention: the 10 newest retired plus 30 days of daily publishes). At that size A2 was 3x slower than the old query overall, up to 12x for common words, and a 52-word query hit the 8 s statement timeout. B2 narrows the index matches by document id first, through the `document_id` index. At 35 releases a common word reads about 2,900 heap blocks instead of about 98,000.
- **Medium:** the index was first in `schema.sql`, where its build would lock `programs` and `shuttle_routes`; moved to migration 025.
- **Low:** the equivalence test missed a dropped trust-tier filter, a title fallback applied to every passage, and synonym queries. The check cost a round trip per request. The test was half the suite's runtime. All three were fixed.

B2 against the old query, same results everywhere. Totals are over the harness's heavy-weighted timing sample, fastest of 2:

| Releases in the database | Old | B2 |
| ---: | ---: | ---: |
| 1 | 6.2 s | 3.1 s |
| 10 | 9.3 s | 3.2 s |
| 37 | 9.4 s | 4.4 s |

End to end through `CampusData.search`, 133 queries, fastest of 2:

| Database | Median | p90 | Max | Total |
| --- | --- | --- | --- | --- |
| dev (12 releases) | 330 → 70 ms | 463 → 257 ms | 924 → 582 ms | 46.2 → 14.4 s |
| 37 releases | 315 → 85 ms | 450 → 327 ms | 906 → 787 ms | 44.5 → 18.7 s |

The machine was swapping, so treat the timings as relative.

## Tests

`test_documents_rank_the_same_with_and_without_the_heading_path_index` compares both paths for 17 queries at limits 1, 6 and 40. It runs once on the snapshot and once after edits the snapshot lacks: passages without heading paths, heading paths that omit the title, a community-tier document, and a retired copy of the release. Eight faults were injected into the new query. It fails on seven:

- rarity ignoring the path
- passage count over all releases
- no title fallback
- the title fallback applied to every passage
- threshold dropping ties
- trust-tier filter dropped
- `plainto_tsquery` for the parts

The eighth, dropping the release filter, only changes speed, so no result test can catch it. Brain suite: 940 passed with the database, 899 passed without it. Data suite: 306 passed.

## Open

- The heaviest queries (a common word plus many others, 13-18K matches) still take 300-800 ms, because every match gets a heading vector and a weight.
- Production gets the index only when migration 025 runs there. As of 2026-09-24, production had migrations 020-022 pending, and 020 fails on non-numeric calories, so 025 waits behind it. Until then the Brain uses the old query.
