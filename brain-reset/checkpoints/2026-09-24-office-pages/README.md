# Student office pages, 2026-09-24

Every page of Ramapo's student office sites is now captured, published as cited documents, and searchable. Before this, the six service crawls held 106 pages in total, and offices such as Financial Aid, Student Accounts, Scholarships, OSS, ITS, Testing and Title IX had none.

**Result:** in a search-only check with no model calls, 24 of 28 office questions now reach the office's own pages in the top 4, up from 3 of 28. The four remaining cases are covered in the search check section: three are answered correctly by another office's site, and one is a real miss. The required benchmark cases stay at 9 of 10. Document search is about three times slower. The dev Brain now serves this release. Human review is pending. The verdicts are the agent's.

## What ran

| | |
| --- | --- |
| Data | `rockygpt-data` `653f01c` (dev): `60604b0` paced crawling, compressed source HTML and the challenge check fix, `1a0b454` and `867832f` repeated blocks written once, `ccff1e4` the office source, `4ee2d90` browser user agent by default, `653f01c` redirect duplicates left out |
| Dataset | `dev-profiles-offices-20260924-r3` in `rockygpt_profiles_dev_offices_20260924` (port 55434), copied from `dev-profiles-library-hours-20260924` |
| Search check | [search_check.py](search_check.py) with the Brain's own `CampusData.search`, Brain `f8f85fd`, run in-process. Before: `dev-profiles-links-20260924`, the release the dev Brain serves. After: r3 |
| Dev Brain | switched on the user's approval: `f8f85fd`, the revision already running, now serves r3 (103 documents, 21,230 passages) |

## Scope ([crawl-summary.json](crawl-summary.json))

`src/reference/office-sites.json` names 86 student office and service sites by folder. They were chosen from the home page title of every folder in the site-wide sitemap (12,693 URLs). School, department, program, research, employee and administrative sites were left out, along with news, the magazine, alumni, giving, events and old catalogs.

Each office is its own WordPress site. 80 were listed from their own `wp-sitemap.xml`, and 6 from the site-wide sitemap. Skipped from those lists (4,461 pages):

| Post type | Pages | Why |
| --- | ---: | --- |
| recipient | 3,983 | one page per scholarship recipient, a named student |
| post | 247 | dated news posts, most of them CSI weekend event lists from 2013 to 2019, plus each site's WordPress sample post |
| success-story | 113 | individual students' study abroad stories |
| peers | 105 | individual peer facilitator profiles |
| tribe_venue, tribe_organizer | 13 | the event calendar's venue and organizer listings |

The reviewed `skippedPages` list adds one page: the commencement program, which lists every graduate by name with their honors. Pages another collector already keeps (the directory, housing, safety, counseling, health, transportation, program link, faculty and hours crawls) are not collected again.

## Crawl

- One request at a time, about one a second (0.96/s measured), with a browser user agent. Every response came back as a real page. There were no rate limits and no challenges.
- 1,905 listed pages, all fetched. 194 more office pages were reached from their links: 116 fetched, 78 failed. The failures are dead links on the office sites, such as `/finaid/chat/`, `/registrar/chat/` and old COVID pages, plus mailto addresses written as page links.
- The first attempt stopped after 1,057 pages. The Use of AI in the Workplace policy asks for "careful human verification", and the challenge check read that as a bot challenge page. The check now looks only at a page's title and top headings, or at small pages (`60604b0`).
- Source HTML is kept gzip-compressed: `office-pages-sources.raw.json` is 138 MB, and `office-pages.raw.json` is 17 MB.

## Documents

85 office documents hold 1,870 pages and 13,421 passages. Visit Our Campus has none, because its only page comes from the program link source. Each document is titled with the office's name, so every passage's heading path starts with its office. A sidebar block or document list shown on at least half of an office's pages is written once under "Site-wide sections".

Of the 2,021 fetched pages, 151 were left out:

- 69 had nothing of their own once site-wide blocks were written once. 37 of them are image attachment pages. The other 32 hold only a form, a search box, a photo gallery, an embed or a WordPress test page, such as the library's staff contact forms. These were checked in the source HTML, and no text was lost.
- 65 redirected to a page already written.
- 7 redirected to a page another collector keeps.
- 4 redirected off the office sites.
- 4 had no text at all.
- The peer facilitator listing and the commencement program were skipped.

## Publish

The first attempt (`dev-profiles-offices-20260924`, now marked failed) stopped at the quality gate: dining and Archway events were 25.7h old, over their 24h limit. After `fetch:menu`, `fetch:dining-hours` and `fetch:events:live`, r2 published. r3 republished after leaving out the redirect duplicates. It has 21,230 document passages, up from 7,810, and 304 events.

## Search check ([search-check.json](search-check.json))

| | Before | After |
| --- | ---: | ---: |
| Office questions with the office's own pages in the top 4 | 3 of 28 | 24 of 28 |
| Required benchmark cases found | 9 of 10 | 9 of 10 |
| Benchmark queries whose results changed | | 90 of 97 |
| Search time, median / p90 / max | 128 / 198 / 401 ms | 416 / 607 / 1,065 ms |

Of the four office cases counted as misses, three return correct pages from another office's site. The FAFSA priority deadline comes from Admissions & Aid's "Financial Aid & Deadlines". EOF eligibility comes from Undergraduate Admissions' "EOF Financial Eligibility Requirements". SGA elections come from the Dean of Students' election pages. The real miss is "writing tutor appointment", which ranks the STEM Center's tutoring schedule above the Center for Reading & Writing.

Two required cases moved down but stay in their top 12. "Meal plan requirements Village College Park Apartments" went from 3 to 8, below the Guide to Community Living's own meal plan section. "Paper transcript request fee processing" went from 2 to 3.

Timings were taken on a machine using 9 GB of swap, so they are loose. The slowdown is still real: each search builds a text vector for every passage's heading path and counts word rarities across all 21,230 passages.

## Open

- **Search time.** Storing each passage's heading vector at publish time would remove the per-query work. That needs a Brain change and a data schema change.
- **Chat acceptance.** No paid chat turns were run. The development budget is nearly spent.
- **Entity links.** Office pages are documents only. They are not linked to office entities, so a profile lookup of an office does not return its pages.
- **Disk.** Free space fell to about 500 MB during the run. With the user's approval, 21 old local dev databases were dropped (~630 MB). They are listed in `.local-logs/office-pages-20260924/dropped-dev-databases.log`.
