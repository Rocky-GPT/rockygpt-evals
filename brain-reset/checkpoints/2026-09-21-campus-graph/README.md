# Campus Graph development checkpoint — September 21, 2026

The existing identity/profile system now includes stable club identities, separate event-occurrence identities, and explicit organizer traversal in both directions. Dev UI adds a bounded Campus Graph browser rooted at Ramapo College. Root and category edges organize browsing; they do not assert organizational membership or source authority. Chat still resolves the requested entity directly and keeps broad original-record searches.

## Coverage and preservation

- 905 identities: the prior 402 objects are unchanged, plus 187 clubs and 316 event occurrences.
- 2,152 original record references and 165 evidenced relationships: 111 program conveners, 53 undated profile-course links, and one new event-to-club organizer relationship.
- New organizer link: TCG Club General Meeting (October 1, 2026) → Trading Card Game Club. The official event page explicitly supplies the organizer group ID, linked URL, and matching byline. The separate club record supplies its contact details.
- 1,053 unresolved issue entries: 671 pre-existing, 67 club-directory mappings, and 315 event organizer connections. Of the 67 club mappings, 66 directory entries are outside the approved club categories and one lacks the necessary website/source-ID bridge. Names or shared phone numbers alone do not approve a relationship. All original records remain searchable.
- 56 captured organizer assertions remain available with their genuine source timestamps; 55 target organizations lack an approved identity bridge. Illustrative school, building, room, and organizer paths are not fabricated.
- Club and event UUIDs derive from official Archway group/RSVP identifiers. Refresh/publishing rebuilds links to current original row IDs, including five colliding legacy event keys, without renaming the original keys or converting event dates into identity IDs.
- The read-only integrity audit verified all 5,357 original rows across 16 copied tables, all 402 prior identities, all 503 new exact record links, all captured organizer assertions, and all four compiled release artifacts. See [clubs-events-integrity.json](clubs-events-integrity.json).

## Implementation and automated checks

- Data `9c5fd7b438ee1dc5a2fa34aaf8a7622f9919115e`: 114 tests passed, four optional database tests skipped; a separate real PostgreSQL publishing integration test passed. Build, lint, and TypeScript checks passed. Publishing integration covers repetition, renames/reschedules/replaced row UUIDs, new applicable records, collisions, and active-release mutation refusal.
- Brain club/event implementation `d91dbbfd08a94dbb2f79cc443ba1851e83e63bb2`: full pytest 519 passed, 36 skipped; 23 club/event tests included. Real-data helper replay covered all 187 clubs and 316 events, with zero broken links. Scoped lint/typechecking passed; three pre-existing line-length findings and one pre-existing tuple/get type finding in `processing.py` remain unchanged.
- Infra `0d50628944562aea5fdc36ce93341175e2556660`: 23 loader unit tests passed, including optional organizer artifact/source capture validation.
- Dev UI `11140259dfd2980c7e30d6dda087e920a53e4c4d`: 19 helper tests, lint, TypeScript check, and isolated Next production build passed. Actual browser checks verified root/category search, both relationship directions, evidence inspection, source-owner navigation, date filtering, bounded expansion, keyboard operation, and narrow node/edge fallback. See [browser verification](campus-graph-browser-verification.json) and [build log](dev-ui-build.txt).
- Evaluation runner: 11 tests passed. Student UI code was unchanged; actual Student SSE and Dev JSON chat proxies were exercised.

## Initial live conversations and follow-up correction

The first real model run exercised eight club/event conversations (11 turns), five original profile/regression conversations (eight turns), and two UI proxy turns. Independent semantic review passed 19/21 turns, with no unsupported final campus claims found. The two failures were unhelpful abstentions: a repeated-title event needed date clarification, and a program-to-person email follow-up had available contact evidence. Original failed results are retained in [club-event-chat.json](club-event-chat.json), [profile-regression-chat.json](profile-regression-chat.json), and [semantic-review-d91.json](semantic-review-d91.json).

A temporary observer replayed the exact original requests/history and retained candidate/reviewer evidence under [diagnostic-d91](diagnostic-d91/). The event replay clarified correctly. The email replay instead re-queried the earlier program and never requested the person's contact. This exposed conflicting follow-up instructions: the latest referent must select the current lookup, and the reviewer should require a relationship only when the current request or answer asserts it. Resolver metadata can support a clarification question but cannot establish campus facts. Original rejected drafts were not recorded, so their precise rejected wording is unknown. No evidence thresholds or budgets were relaxed.

Correction `85bd83938c9f51bb4c55d4f63fb207ac871d3422` passed the full Brain suite: **522 passed, 36 skipped**. Three additional tests verify fresh contact-only subject retrieval with conversation retained for review, ambiguity metadata without fabricated evidence, and continued rejection of unsupported campus claims. Scoped Ruff and diff checks passed.

**Final live-model acceptance is blocked, not passed.** Both post-activation suites stopped on their first request with HTTP 429 `model_quota_exhausted` (`retryable: false`), before tool calls or answers. In this gateway that code is specific to provider `insufficient_quota` / `credit_balance_exhausted`, distinct from temporary `rate_limited` and the application `budget_exhausted`. No repeated retries, quota changes, model changes, or budget increases were attempted. Request IDs: `d4292a6f-fe5d-437f-bcc4-986f861b0fe3` and `2266d4d5-a77f-4f94-a09e-18f3ed49a9e9`. See [program run](final-program-followup-chat.json) and [club/ambiguity run](final-club-ambiguity-chat.json).

Restore the configured model provider's quota, then rerun the unchanged selected corpus cases with new output filenames. The earlier 19 semantic passes establish the club/event/profile behavior tested on `d91dbbf`; they do not establish acceptance of the final prompt correction.

## Development activation and rollback

Data was loaded into a new isolated localhost database `rockygpt_profiles_dev_clubs_events_20260921`, with active version `dev-profiles-clubs-events-20260921`. Its immutable data commit is `9c5fd7b438ee1dc5a2fa34aaf8a7622f9919115e`. Source database reads were read-only; production was not changed. The runtime `brain_campus_reader` cannot insert source records.

The matching identity artifact's runtime canonical JSON hash is `d89a6a6f70a8fcbc340028654b40d43e34b3cf17dfd887a4e98ce8f0218ad53c`. The loader receipt reports file-byte hashes, which intentionally differ from canonical runtime hashes. See [release receipt](clubs-events-release.json).

Active local development versions, confirmed through the immutable activation receipt and the Brain/Student/Dev readiness routes:

| Component | Active version |
| --- | --- |
| Brain | `85bd83938c9f51bb4c55d4f63fb207ac871d3422` |
| Brain configuration | `929e0b27de7ee35faa6b06141681c7316831c4ec2a33ddfa9a954eb36cbc89fd` |
| Data | `dev-profiles-clubs-events-20260921` |
| Dev UI | `11140259dfd2980c7e30d6dda087e920a53e4c4d` |
| Data compiler | `9c5fd7b438ee1dc5a2fa34aaf8a7622f9919115e` |
| Infra loader | `0d50628944562aea5fdc36ce93341175e2556660` |

All affected service code is pushed to `dev`. Student UI remains `6e85f78752b524d4bbead340690cee906a1d83a1`; unrelated `next.config.ts` edits in both UI repositories were preserved. This is the established isolated **local dev** deployment, not production. Readiness confirms the active code/data pairing; it does not prove provider credit availability. See [final activation](activation-final.json) and [running verification](final-running-verification.json).

Full feature rollback from `rockygpt-infra` uses the established immutable launcher and preserves both databases:

```sh
../rockygpt-brain/.venv/bin/python scripts/deploy-profile-brain-dev.py \
  --revision 0c0af09d87b016966c91519357a9468adb743a9d \
  --database postgresql://brain_campus_reader@127.0.0.1:55434/rockygpt_profiles_dev_full_20260921 \
  --expected-dataset dev-profiles-full-20260921
```

Then verify `/readiness` reports that prior data version, configuration hash `f342c0342adc25cc83fd9a47977d09e1630f46e3f48930f601818a887027e72b`, 402 identities, and identity hash `dd67ec09fe3c94b917f125a3d1272265029ebe810725c59b46411721ac9063cf`. The previous activation receipt is preserved locally. Dev UI graph rollback can use new revert commits for `1114025` and `dbaebc7`, restoring the earlier explorer `2b6a532`; do not reset or force-push. Reverting a UI commit does not require deleting any data.

## Representative real tool traces

| Conversation | Observed trace/result on d91 | Request |
| --- | --- | --- |
| event-organizer-club-email | Event profile → evidenced organizer → club page | `5c3f6db8-abb6-489b-8709-56a89cd4137f` |
| event-organizer-club-email | Fresh club contact → tcg@ramapo.edu | `41f6a9b6-1852-4737-b957-81b68714db21` |
| club-event-and-contact | Club profile → incoming organizer link → dated event + club email | `bb17d6ba-e3d3-48b6-ac54-4d6bcaabda4b` |
| profile-csi-followups | Fresh hours/contact evidence; did not infer phone staffing through closing | `27a8dd8f-f461-426c-afc6-3cba11f912ca` |
| profile-professor-courses | Contact + faculty course list; no current-semester teaching claim | `20f7db41-95c9-4cbd-827f-a9eab5b4c4ca` |
| profile-dining-date-meal | Date-specific Birch lunch menu; missing meal hours kept distinct | `4fd42964-6d01-400e-8e69-e4bbce44fe88` |
