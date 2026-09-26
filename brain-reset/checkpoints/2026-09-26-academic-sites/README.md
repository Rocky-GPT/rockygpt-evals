# School, program and center sites, 2026-09-26

The dev release `dev-profiles-academic-sites-20260926` adds Ramapo's school, program and center sites. It also includes the week's clean-ups of crawled pages. The dev Brain runs it.

## What ran

| | |
| --- | --- |
| Data | `rockygpt-data` `402d531` (dev) |
| Dataset | `dev-profiles-academic-sites-20260926`, database `rockygpt_profiles_dev_academic_sites_20260926`, copied from `rockygpt_profiles_dev_dining_hall_20260925` |
| Brain | `rockygpt-brain` `4b761cd` (dev, the revision now in production), 948 tests passed on the committed tree |
| Publish | 22,921 document passages (21,230 before); dining and Archway events refreshed first |

## What changed in the data

- `59f5953`: the office sites collector is now shared (`ingestion/folder-sites.ts`). WordPress image and password pages are left out by their captured HTML.
- `6d047c2`: the new `academic-sites` source covers 25 school, program and center sites, with 314 pages and 2,779 passages. A reviewed list skips 232 pages and cuts 5 sections: pages about individual students and alumni, test copies, past events that read as current, and faculty lists the faculty source keeps.
- `75733bb`: the office list skips 19 WordPress test copies and 12 pages about named students and alumni. It cuts 9 sections: testimonials, winner lists and the ambassador roster. The office documents now have 12,885 passages.
- `9163f74`: the program-link source stops publishing 254 Success Stories profiles and 5 redirected faculty profiles, leaving 818 passages.
- `89948db`: page contacts drop mailto links that show one address and send to another, and tel links on page ranges. That removes a wrong contact from 11 pages.
- `402d531`: dates from The Events Calendar carry their year ("Date: Tue, November 10, 2026") on all 34 event pages.

## Search check (no model calls)

`search_check.py` calls the Brain's own `CampusData.search` (4b761cd) and checks that the expected site's page is in the top 4. It ran on the previous release and on this one.

| | Before | After |
| --- | ---: | ---: |
| School, program and center questions (26) | 12 | 25 |
| Office questions from the 2026-09-24 checkpoint (28) | 24 | 23 |
| Program-pages benchmark, required page in top k (10) | 9 | 9 |
| Median search | 74 ms | 89 ms |

- The one school miss, "data science master's program", is answered by the program pages (`/majors-minors/majors/data-science-msds/`), which is the right source.
- The office change is "scholarships students can apply for". Its top 4 are now three passages of the DMC's NSF S-STEM scholarship page and a Financial Aid FAQ. That's a real scholarship students can apply for, but it pushes out the Scholarships office's FAQ.

Chat answers were not tested: they cost model money.

Files: `search-check-before.json`, `search-check-after.json`.
