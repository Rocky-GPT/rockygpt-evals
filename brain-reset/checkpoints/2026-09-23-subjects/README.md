# Course subjects checkpoint — September 23, 2026

A course subject is the code in front of a catalog course: CMPS in CMPS 147. Before this step the Brain knew no subjects. Course search matched words anywhere in a course's text, so "CS courses" returned accounting and art history courses.

## Active local development

| Component | Version |
| --- | --- |
| Brain | `589ed56054637d0b3fc0ac5662b7fdfbad48cf0c`, release `campus-subjects-development-2026-09-23` |
| Brain configuration | `64c07b7318f87a5ff234c0fbc338546798e22357ab58835a41b3f929647403c5` |
| Data compiler | `bce92b1` |
| Infra | `7be08e3` |
| Dev UI | `cced635` |
| Dataset | `dev-profiles-subjects-20260923`, database `rockygpt_profiles_dev_subjects_20260923` |
| Identity hash | `4201f5980475b898067aa7868bb52085973d92d04d0d21c0454a7bf5055b5b0b` (1,086 identities) |

Built from the same inputs as `dev-profiles-alias-sources-20260923`, plus the committed subject list. Inputs and the clone report are in `.local-logs/subjects-20260923/`.

## What was built

- **Subjects.** Each code with a course in the release's catalog is a subject identity: 104 subjects, with IDs derived from the code.
  - 65 are named by the catalog's department list in its display form, such as "Computer Science (CMPS)".
  - 39 keep their code as their name, because no department names them. They cover 478 courses, led by LITR (158), THEA (86) and LIBS (59).
  - 16 department codes have no course, such as CYBR and DSCI. They are reported, not built.
- **Courses.** 3,344 `includes_course` relationships, one per course. Each cites the course's own `code` field, and the Brain rechecks it.
- **Lookup (your decision, September 23).** A subject answers to its code only. "CMPS" finds Computer Science (CMPS). "Computer Science" still asks among the four programs; `graph-alias-ambiguous-program` guards that.
- **Course search.** It resolves a named subject against the release's `course-subjects` artifact:
  - codes only as written in capitals;
  - catalog names and your curated short forms (`course-subject-aliases.json`) in any case, longest first;
  - other words only rank that subject's courses.

  `coverage.subject_resolution` says how the question was read.

## Course search, before and after

Tool level, no model ([before](course-search-before.json), [after](course-search-after.json); `probe_course_search.py DATABASE_URL OUTPUT.json`). "Before" gives the total matches and the subjects among the first twelve results:

| Question | Before | After |
| --- | --- | --- |
| CS courses | 125: ACCT, AIID, ARHT, ARTS | 63 CMPS |
| psych classes | 208: ACCT, AMER, ANTH | 104 PSYC |
| history courses | 521: nine subjects, HIST among them | 120 HIST |
| computer science courses | 528: CMPS and DATA | 63 CMPS |
| Comp Sci | 7: six subjects | 63 CMPS |
| art history courses | 657: ARHT with ARTS, AMER, CNTP | 41 ARHT |
| literature courses | 312: nine subjects, LITR among them | 158 LITR |
| READ courses | 233 matches for the word "read" | 12 READ |
| courses to read | 2,756 | unchanged: the lowercase word is not a code |
| bio courses about genetics | 430: eight subjects | 91 BIOL; a topics course and BIOL 331 Genetics rank first |
| business courses | 309: ACCT, ARTS, BADM, HNRS, INFO, MKTG | 48 BADM only |

"business courses" is the one that narrows. The short form "Business" maps only to BADM, so it drops accounting, finance, management and marketing. It is for review in `course-subject-aliases.json`.

## Cost

The registry grows from 817 KB to 1.65 MB of compact JSON. Validating it takes 23 ms per profile lookup, up from 10 ms. That is small against a chat turn, so the chat path does not cache it.

## Verification

- **Graph paths:** 31 of 31 ready, 0 mismatched. The new shipped `subjects` phase has 3 cases:
  - CMPS includes 63 courses, among them CMPS 147;
  - CMPS 147 is in Computer Science (CMPS);
  - LITR includes 158 courses.

  The corpus size bound moved from 30 to 35.
- **Brain:**
  - 794 passed and 1 xfail, with the database tests.
  - The live projection test passes for all 12 kinds, subjects included.
- **Data:** 161 passed with both database tests; typecheck, lint, the contract check and the build pass.
- **Infra:** 30 passed. **Dev UI:** typecheck and lint pass; 26 identity and 12 graph tests pass.
- **Generated numbers** ([campus-graph.md](../../../../rockygpt-data/docs/campus-graph.md)): 4,430 entities and 4,814 relationships. 91% of entities now have a relationship, up from 15%, because every course is in a subject.
- **Live chat** was not run; the model provider's quota is still exhausted.

## Rollback

From `rockygpt-infra`, restore the projection release:

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 54e84cf063e3463b89c7b42a0ea1a6aa9e2ca15d \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_alias_sources_20260923 \
  --expected-dataset dev-profiles-alias-sources-20260923
```
