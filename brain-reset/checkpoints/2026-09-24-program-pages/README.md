# Program pages and the pages they link to, 2026-09-24

Steps 4 and 5 of the plan: publish Ramapo's program pages (ramapo.edu/majors-minors) and then the Ramapo pages those pages link to, and check in the dev UI that chat can use them and cites them correctly.

**Result:** the program pages and 322 linked pages are published and searchable. The acceptance question's third attempt produced a reviewed, correctly attributed answer. It is still **partial**: it missed the page's Contact section. Human review is pending; the verdicts below are the agent's.

## What ran

| | |
| --- | --- |
| Brain | `d6aab94`, `dc9be88`, then `3a67134` (`rockygpt-brain` dev) |
| Data | `rockygpt-data` `7415a26` (linked pages source), program pages from `d38cb26`/`a351f6c` |
| Datasets | `dev-profiles-majors-20260924-r5` (program pages), then `dev-profiles-links-20260924` (plus linked pages) on the local Postgres (port 55434) |
| Dev UI | `rockygpt-dev` Ask & Inspect on :3100, fresh conversation per attempt |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Question: "what does ramapo's computer science major page say about careers after graduating, and who does it say to contact with questions?"

The CS page itself says careers are "wide-ranging and bright" (About section) and lists outcomes under Careers & Outcomes. Its Contact section says to email Victor Miller, "Convener of Computer Science", or Scott Frees. The catalog names Scott Frees as the convener, so a full answer should show both sources.

## Attempts ([turns.json](turns.json))

| # | Brain | What happened | Verdict |
| ---: | --- | --- | --- |
| before | `98375da` | searched programs, read a record, looked up conveners; never searched documents. Review: `unsupported_claim`, fallback | fail |
| 1 | `d6aab94` | documents described as holding program page passages; model still used only `lookup_profile` (no page record was returned by any profile section). Fallback | fail |
| 2 | `dc9be88` | program section returns the page record; coverage-first document ranking. Model searched programs and documents; the draft ran out of output tokens (`incomplete_draft`, HTTP 502) | fail |
| diag | `dc9be88` | same question run in-process: one mixed documents query found the Contact section but not Careers; the draft credited the catalog's career text to "the major page"; review rejected it (`wrong_context`) | fail, review correct |
| 3 | `3a67134` | [dev-ui-final-turn.json](dev-ui-final-turn.json): careers quoted from the page's About section and cited to it; the catalog's career list attributed to the catalog; the page's 4+1 contact (Scott Frees) and the catalog convener given; says it found no general contact line on the page | **partial pass** |

Attempt 3 missed the Contact section (Victor Miller) because the model again sent one mixed query, "computer science careers contact questions major". Its top four were Interdisciplinary Studies "Map Your Major", a 4+1 MSAC page, Engineering Physics job titles and the CS About section. The Brain then set `contextLimitedTools` (input bound reached), so no second search was possible. A focused "computer science contact" ranks the Contact section first.

## Retrieval changes and their benchmark ([retrieval-benchmark.json](retrieval-benchmark.json))

Document passages used to rank by `ts_rank_cd` alone, so passages repeating "computer science" outranked the section asked for ("computer science contact" put the CS Contact section 59th). They now rank first by how many of the query's words (with synonyms) the passage and its heading path contain, then by heading matches, then by the old score (`dc9be88`).

Measured on `r5` over 97 document queries (the five phase-2 retrieval cases, five program page questions, and 87 real queries from evals and past runs):

- The phase-2 cases still find every required phrase in their top 12 (the first version, weighted like structured search, lost the meal-plan case, 5/5 to 0/5, and was dropped).
- 4 of 5 program page questions now reach the page's own section in the top 4; none did before. The miss, "computer science jobs after graduation", ranks an Engineering Physics "Some Jobs for Graduates" section first.
- Clearly better: library hours, safety escorts, emergency procedures, withdrawal deadlines, Counseling D-216. Worse: "Potter Library location" wordings, where events held at "George T. Potter Library" outrank the library's own page.
- Search latency: median 63 ms end to end (the old query alone: 59 ms).

## Linked pages ([linked-pages-retrieval.json](linked-pages-retrieval.json))

Besides the catalog, the application portal and each other, the program pages link 330 distinct Ramapo pages: 255 success stories and 75 others (DMC and 4+1 pages, graduate program sites, Career Center, STEM Center, study abroad, clubs, school pages, news). Those excluded links, documents and external sites are not collected. One linked page, the Registrar's declare-a-major page, is also in the campus directory crawl. 328 were fetched; 2 are dead links on the program pages: `/hgs/history/?projects=open` redirects to a 404 at `/ahe/history/?projects=open/`, and `/study-abroad/program-options/academic-search/computer-science/` is a 404. After redirects, 322 distinct pages became 1,353 passages.

A search-only check (no model) finds the linked page at rank 1 for 4+1 enrollment, McNair Scholars, Handshake and nursing success stories, and rank 2 for the Computer Science Club. Program page sections keep their places: CS Contact still ranks 1 and CS Careers & Outcomes 2. "study abroad computer science" misses because that page is one of the dead links.

## Open

- Mixed-need queries reach only one need, and the input bound can then block a second search. Candidate fixes (a per-page documents filter, or query guidance on the tool parameter) each need paid turns to verify.
- Budget: after these runs about $0.25 of the $30 development cap remains, and 33 unsettled holds ($7.86, from 2026-09-16 to 09-24) still count against it. Releasing holds or raising the cap is the user's call.
- Repeated page furniture in the linked pages: the study abroad "Additional Resources" sidebar appears on 13 pages, "Follow Cahill Center" on 4.
