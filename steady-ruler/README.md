# The steady ruler (started 2026-11-18)

One fixed bank of about 300 keyed questions, kept for months, used to compare two Brain versions
**on the same questions**. Built on Dan's yes (11-18) to the "one ruler" step of the rethink report
(`/mnt/project-files/rethink-2026-11-18/why-fresh-tests-keep-dropping.md`, section 6).

Why: every blind score so far (41, 44, 39, 38, 41 of 60) sits inside the luck band of one 60-question
set. Two different 60-question sets cannot show a change smaller than about 17 points. Running old
and new on the same 300 questions shows a real change of about 6 points.

## The two halves

| Half | Questions | Where | Who may read it |
| --- | --- | --- | --- |
| Open | 154 | `open/open-half.json` (frozen, sha256 in `open/open-half.sha256`) | Anyone, including threads that fix the bot. Misses here may be studied. |
| Sealed | 150 | `sealed/sealed-half.json.enc` (encrypted; see `sealed/README.md`) | Only a thread that **runs and grades** the ruler. Never a thread that builds or tunes the bot. |

**Open half** = the two blind sets of 2026-11-18 (`blind-2026-11-18`, `blind-2026-11-18b`, 77 each),
with their keys checked on live ramapo.edu that day. Ids are `o18-…` and `o18b-…`. Both sets have
been run once and their misses read, so they are practice questions now.

**Sealed half** = 150 new questions written 2026-11-18 by ten blind writers (no web, no bot code,
data, fix plans or results), student texting style, keyed on live ramapo.edu by checker agents.
Mix: people, events and clubs, academics, how-to (30 each) and 30 not about campus (general
knowledge, life advice, mixed, nonsense, can't-know). In each campus area 18 are everyday topics
("common") and 12 are rare corners. Every new question was compared with about 7,000 older test
questions in this repo: near copies and repeats of the three earlier blind sets were rewritten.
Everyday facts that some older practice question already asked, in new words, were kept on
purpose (that is how real students ask); `seen_fact` marks them (24) so a run can report them apart.

Sealed key status: found 69, partial 36, general 19, decline 17, not_on_site 9. 11 are `run_day`,
the rest `term` or `stable`. 5 keys still have one detail no checker could read (catalog.ramapo.edu
and Archway need JavaScript, and one section of the residence hall guide never loaded); they carry
`key_unverified: true` and the word UNVERIFIED in the note. Graders accept a plausible real fact
for that detail.

### Sealed-half rules

1. A thread that builds, fixes or tunes the bot never decrypts the sealed file, never reads a
   sealed question, key, answer or verdict, and is never told which sealed question missed.
2. The run thread reports for the sealed half only: totals, per area, per kind, the paired table,
   and per-stage counts. No ids, no question text, no examples.
3. When a sealed slice is opened to study, its questions move to the open half (new version of
   both files, a line in the log below) and a new slice is written to replace it.
4. The passphrase is not in any repo. Where it is kept is in `sealed/README.md`.

## Fields (both halves)

`id, question, clean_wording, area, topic, kind (common|rare), freshness, season, checked_on,
expected, must_not, source, status (found|partial|not_on_site|decline|general), note`.
The sealed half adds `time_bound` and `seen_fact`.

**freshness** says how long the key stays true:
- `stable`: rarely changes (a policy, a program, an office phone).
- `term`: changes each semester or year (deadlines, schedules, role holders). Re-check each term.
- `run_day`: depends on the day asked ("tonight", "this weekend", "next home game"). The key is
  rebuilt on the day of every run, from the page named in its note, before grading.
- `seasonal` (open half only): only makes sense near one time of year (`season` says when).
  Left out of the core score outside that season.

## How to run it

1. Pick the two versions (old = what is live, new = the candidate). Same graph file for both
   unless the change is in the data.
2. Rebuild the `run_day` keys for the day (open: `python3 steady-ruler/ruler.py rekey-list open`;
   sealed: the run thread does it after unsealing). Skip `seasonal` items out of season.
3. Ask every question once per version (the cloud workflow pattern used for the 11-17 and 11-18
   runs: Brain checked out at each ref, live graph from R2 read only, 2 to 3 questions at once).
   Keep what each step was shown, for per-stage counts. Cost: about $0.0012 an answer, so about
   $0.75 for 300 questions on two versions.
4. Grade with two independent graders per area, answers shuffled so graders cannot tell which
   version wrote them. The worse verdict counts. Verdicts and severity as in the 11-18 sets.
5. `python3 steady-ruler/ruler.py compare old.json new.json` (add `--sealed` for the sealed half)
   prints the good counts, the paired table, and how likely the gap is to be luck.

A ready runner exists (built in the tools-review thread): `compare/` in this repo and the manual
job `compare-brains.yml` in rockygpt-data (old main vs new dev, same live graph, spending cap).
Its default set is the open half. Two gaps against the rules above: it grades with one Luna grader,
not two independent graders, and it does not rebuild `run_day` keys. Close both before trusting a
small difference.

## Bars (from the rethink report)

- Safety, a hard gate: at most 2 misleading answers per 100, none serious to both graders.
- Helpful: 90% on common questions. Rare questions are tracked with their own goal.

## Log

- 2026-11-18: v1.1. Third key pass on the sealed half: 15 of the 20 unread details read and fixed (new hash).
- 2026-11-18: v1. Open 154 (95 common, 59 rare), sealed 150 (102 common, 48 rare). Not run yet.
