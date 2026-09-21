# Campus identity/profile development acceptance — 2026-09-21

This checkpoint records implementation, verification and **local development** activation separately. No production deployment or shared-source release activation was performed. The configured source database was shared with production, so the development release was loaded into a dedicated local PostgreSQL database. The existing Student and Dev applications reach the local Brain on port 8000.

**Final result:** the actual running combined Brain `e05f461` passed all seven conversation cases / ten turns, plus both Student/Dev proxy checks. Its configuration and identity hashes matched before and after the complete suite. This descendant includes profile commit `4c2e603` and the separately authorized, concurrently completed menu-cleanup task. Earlier failed runs remain below; this is a successful final acceptance run, not a claim that model failures can never recur.

## Implemented

The existing identity map now compiles reviewed selectors into links to original release records. Persistent UUIDs survive supported renames and refreshed record IDs; each new publication resolves the selectors again, including new menu dates and schedule exceptions. Contradictory anchors, broken links and ambiguous matches remain unresolved. No entities table, duplicated full profiles, fuzzy identity joins or entity-specific Brain branches were added.

`lookup_profile` selectively assembles contact, faculty, undated courses, program, explicit conveners, campus/dining hours and date/meal-specific menus. Sources, collection timestamps, original IDs, conflicts and independent missing sections remain visible. Existing exact contact retrieval and broad searches remain available. Operating hours never establish telephone/staff availability; missing hours do not establish closure. Profile-listed courses never establish a semester assignment.

Menu summaries retrieve 12 complete items by default, retain meal hours, and expose accurate total/returned/omitted counts. Explicit full-menu requests can raise the limit to 100. This addressed an observed writer failure that enumerated many valid foods without attaching every required citation; review enforcement was not weakened.

## Linked and unresolved coverage

See [identity-coverage.json](identity-coverage.json) for every unresolved record and its reason.

| Coverage | Count |
| --- | ---: |
| Persistent identities | 402 |
| People / offices / facilities / dining venues / programs | 231 / 13 / 10 / 4 / 144 |
| Contact / faculty records | 245 / 226 |
| Campus / dining schedule rows | 77 / 70 |
| Menu / program rows | 887 / 144 |
| Explicit convener relationships | 111 across 105 programs |
| Explicit catalog course relationships | 53 across 9 faculty profiles |

There are 671 unresolved issue entries, not 671 missing identities: 626 undated course-title entries lack an explicit catalog code, and 45 program issue entries concern missing Convener-field links, obsolete target URLs or colliding original record keys. Specifically, 25 programs lack an explicit convener profile URL; 16 references use nine unavailable old profile URLs; two Nursing MSN programs share an original key and produce four issue entries. All unlinked original records remain searchable. Only CSI has enough evidence for directory contact plus campus hours; Birch has its own contact, dining hours and menu feed. Other partial profiles do not borrow nearby entities' fields.

The Computer Science convener answer is explicitly grounded in the captured catalog, whose assertion differs from the current public major page. The newer page was not silently imported or used to overwrite the captured record. The catalog's actual capture time is retained; export/publication times are not fact-verification times.

## Automated and deterministic verification

- Brain committed archives `5c7d4fc` and final `4c2e603`: full pytest **429 passed, 36 skipped** on each. Skips are optional database-backed accounting/phase-two tests without `BRAIN_TEST_DATABASE_URL`. Scoped mypy and Ruff passed; diff checks passed. The final change only clarifies generic follow-up subject selection in the tool description.
- Running combined Brain archive `e05f461`: full pytest **460 passed, 36 skipped**, with pytest cache disabled so the archived files remained unchanged. This was run independently here after the other task's activation.
- Data `fe11af9`: **101 passed, 4 skipped**, build and typecheck passed. The new opt-in PostgreSQL publisher test was then run separately and passed against an isolated staging database: repeat publishing preserved artifact hashes, a newly ingested schedule linked to the same UUID, and active-release mutation was rejected. Three other skipped integration tests were not run.
- Infra `4593860`: **19 tests passed**, covering isolated loader and immutable launcher guards.
- Evals runner HTTP/history/stream accounting checks: **11 passed**.
- Student and Dev lint/typecheck passed. Production builds passed in source copies without disrupting the running UIs. Student history/stream tests: **12 passed**.
- Deterministic profile tests cover ambiguous names, independently missing sections, conflicts, broken links, identity stability, reordered faculty arrays, campus dates/DST, split service, midnight and applicable schedule exceptions. Real database publishing tests cover refresh and repeated publication.
- [identity-audit.json](identity-audit.json) is an independent deterministic assembly audit, **not end-to-end chat**. All 402 identities assembled with no unexpected broken components; all 226 faculty keys and 70 dining windows matched. Original dining records corrected 37 legacy false-closure interpretations to unknown without rewriting the original rows.
- [clone-integrity.json](clone-integrity.json) verifies original IDs, values and timestamps across all 16 copied table sets, including original artifacts **at initial clone verification, before the separate task's local menu normalization**. It is not a claim of byte-for-byte equality after that cleanup. The shared active release remained `v2-20260921165836`; [the final source check](shared-source-final-check.json) reconfirmed it at 21:11 UTC. The local runtime role is read-only.

## Actual conversation evidence and failure history

These are real HTTP conversations using the development provider, budget ledger and normal Brain tool loop. Follow-ups contain the preceding real answer. They are not direct helper calls or scripted model responses. Machine checks alone do not certify semantics; separate semantic reviews compare claims and cited records.

- [csi-isolated.json](csi-isolated.json): the one-identity CSI pilot's three turns passed before full expansion: hours plus phone, email follow-up, and no inference about staff answering until closing.
- [full-9fbc058-failed.json](full-9fbc058-failed.json): eight successful turns and two safe abstentions. Dining's uncited enumeration was diagnosed and fixed with bounded retrieval. The initial music-clubs abstention did not reproduce; its original draft/reviewer detail was not retained, so no unsupported root-cause claim is made.
- [full-5c7d4fc.json](full-5c7d4fc.json): nine successful turns and one HTTP 502 on a program-email follow-up (`73a74efe-b10a-4bd1-b09d-6b479bf9e476`). The log reported `incomplete_draft` after a repeated program lookup/search and before any person-contact lookup or review. This is preserved as a failure, not counted as a pass.
- `4c2e603` clarifies that a follow-up asking for an already named person's contact should resolve that person directly; prior names are selectors, never factual evidence. It does not change model budgets, review rules, schemas or entity-specific routing. The provider's exact reason for the earlier incomplete response was not recorded, so it is not asserted here.
- [ui-acceptance-5c7d4fc.json](ui-acceptance-5c7d4fc.json): Student SSE request `4057ddb8-e930-43ee-ba37-a63d721c0786` returned Bonnie Blake's contact details and eight explicitly undated courses. Dev request `54a57158-46a2-4696-a4bd-8646f5e3fed7` used two profile calls: Music Minor → Gilad Cohen's persistent ID → `gcohen1@ramapo.edu`. Both answered with the expected data release; configuration hashes matched before and after.
- [full-4c2e603-transition.json](full-4c2e603-transition.json): the selective program-email follow-up passed after the instruction change. The suite still had one music-clubs safe abstention. The separate task activated `e05f461` while this suite was in progress, so the filename does not prove that every turn ran on `4c2e603`.
- [full-e05f461.json](full-e05f461.json): **7/7 cases, 10/10 turns passed**, with independent [source-grounding review](semantic-review-e05f461.json). The runner asserted configuration hash `c516442f…` before and after; both complete readiness responses are saved here. CSI email used valid legacy retrieval; its staff-availability follow-up was general reasoning without new campus claims. The professor and dining turns used profiles. The generic Computer Science name used program-search fallback, then the email follow-up selectively resolved the named person through `lookup_profile`.
- [ui-acceptance-e05f461.json](ui-acceptance-e05f461.json): **both final UI checks passed**. Student SSE `3a78e6c2-a3f0-422c-a8d0-38ee87087cd7` returned contact plus eight undated courses. Dev `f63235fc-1eb9-4a7e-962f-c4d8464e5ced` demonstrated actual Music Minor → Gilad Cohen identity → email traversal, with the second call using the returned persistent person ID. The combined hash was stable before/after.

Representative final request IDs:

| Conversation | Request | Observed behavior |
| --- | --- | --- |
| CSI hours + phone | `cfeffaff-2c05-498e-b19f-ddcb61b9d6df` | Midnight into Tuesday; `(201) 684-7593`; no staff-availability inference |
| CSI email follow-up | `b36e4cdd-46de-49ee-82ff-7de16189a81c` | `csi@ramapo.edu`, freshly retrieved |
| Professor contact + courses | `bc8cca50-e688-4ed8-bd3f-b7fd3db40cbf` | Scott Frees's contact and seven undated profile course entries |
| Convener email follow-up | `63aa5d07-49d3-470e-b3d7-60329157a4b0` | Selective person-profile contact; `sfrees@ramapo.edu` |
| Birch lunch on September 21 | `e484fddd-b25e-49b9-8b3c-cd9df4690963` | 11 AM–2 PM, cited food examples, explicit partial-menu scope |
| Broad music search | `3714cb65-f15c-48d5-a438-abc48798fb80` | Three correctly cited student organizations, stated sample scope |

The exact repeated music-clubs diagnostic on the combined code first encountered a provider review timeout (`f76ff19a…`), then passed (`899818f0…`) with the full candidate and reviewer verdict retained. Earlier `unsupported_claim` drafts were not captured, so their precise rejected claims remain unknown; no assertion is made that their underlying reliability issue was fixed. A temporary observer also initially refused a stale configuration pin after the concurrent activation; that setup failure is retained separately and was not an active-application failure. No budgets or evidence-review rules were relaxed, and all temporary observer servers were stopped.

The concurrent menu cleanup retains 887 linked original occurrences but filters 18 exact non-food messages during retrieval. Thus the final September 21 Lunch profile has **51 food offerings / 12 returned / 39 omitted**, versus 52 original source rows. The identity map and its hash did not change. This source-preserving normalization is documented in `rockygpt-brain/docs/record-cleanup-2026-09-21.md`.

The final client checks exercised actual Student and Dev HTTP proxies, Student SSE, and both rendered-page HTTP endpoints. Browser clicking/visual inspection was not verified because the available browser-control surface was unavailable. No new frontend layout or diagnostic display was introduced.

## Deployment and rollback

Active combined Brain revision: `e05f46110d1d5ed95f42c7e7c28437c7feedd730`, release `campus-profiles-development-2026-09-21`, configuration hash `c516442f408d5b3d86cea722a11cb90bb698e51fa9c4a43f0e61d08f620cc45d`. [activation-e05f461.json](activation-e05f461.json) records its startup verification, archive path and runtime PID. The independently captured [before](readiness-e05f461-before.json) and [after](readiness-e05f461-after.json) readiness responses confirm this exact running configuration throughout final acceptance.

[Final running verification](final-running-verification.json) repeats the code/data/402-identity checks after the acceptance work and reconfirms the shared source release with a read-only database query.

Data commit: `fe11af951c3aa139fc4be60bf69ff5b466624e04`. Active local data version: `dev-profiles-full-20260921`, original dataset ID `0c974dfa-5524-46a9-8e53-697863c5facd`. Runtime database: `rockygpt_profiles_dev_full_20260921` on loopback port 55434, user `brain_campus_reader`.

That commit identifies the identity compiler/artifact release. The separate task subsequently applied its authorized local menu normalization from Data `ef68dbfb0d796fa67677d7c2a0e887c9dba979a3`, preserving original occurrence IDs and identity links. This report distinguishes that later local transformation instead of attributing the entire final database state solely to `fe11af9`.

The compiled identity file SHA-256 is `a7f4e0a0db78c05694ed326d5fec662e587be6b4231b0afa819572409959094c`. The running Brain recomputes the compact sorted-JSON representation, whose SHA-256 is `dd67ec09fe3c94b917f125a3d1272265029ebe810725c59b46411721ac9063cf`. Different serialization explains the different hashes. The release contains matching coverage and raw-convener artifacts; [full-dev-release.json](full-dev-release.json) records all file hashes and source counts.

The immutable development launcher archives an explicit pushed commit, verifies its import path and integrity, pins its configuration hash, and requires matching `/readiness` data/code versions before recording activation. Concurrent unrelated changes remain untouched in the shared checkouts. The launcher preserves provider/accounting settings and restarts only the verified local Brain PID.

The preceding profile-only Brain is `4c2e603986f1daa492fa024b3adad9e977100e6b`; its manifest and [activation receipt](activation-4c2e603.json) are retained. A code rollback uses that SHA with the same full dev database/version; this also removes the other task's runtime normalization and meal-summary behavior, so coordinate its scope before using that rollback. The earlier `5c7d4fc` archive is retained but would also reintroduce the observed follow-up weakness. The data-only rollback candidate was verified read-only: `rockygpt_profiles_dev_csi2_20260921`, version `dev-profiles-csi-20260921`, one CSI identity. Relaunch a compatible Brain with that database and expected version to return to the pilot. The pre-feature ignored environment is backed up at `.local-logs/profile-feature/brain.env.before` with mode 0600. No database deletion, production pointer swap, branch switch or force push is required. Full commands and guards are in `rockygpt-infra/docs/campus-profile-dev.md`.

For example, from `rockygpt-infra`, the code-only rollback is:

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 4c2e603986f1daa492fa024b3adad9e977100e6b \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_full_20260921 \
  --expected-dataset dev-profiles-full-20260921
```

Then verify `/readiness` and real chats. Restore the final combined deployment by rerunning the same command with revision `e05f46110d1d5ed95f42c7e7c28437c7feedd730`. Rollback was documented and its database/archive prerequisites checked; it was not executed after final activation. Original-clone equality is not a rollback promise for the separately normalized local menu tables; use that task's backup procedure if reverting those mutations is also required.

Checkpoint commits pushed directly to service `dev` branches: Data `fe11af9`; Brain `71df6b9`, `9fbc058`, `5c7d4fc`, `4c2e603`; Infra `f182981`, `4593860`; Evals corpus `3fc2d1e`. Root remained on `main`; frontend repositories were not changed by this task. Concurrent menu-cleanup changes and pre-existing Next configuration edits were preserved.

The final active Brain `e05f461` and Data HEAD `ef68dbf` were created/pushed by the concurrent task and include this task's ancestors. Their integration was verified here; this task does not claim authorship of that separate cleanup.
