# Frozen Brain acceptance: FAIL — not verified

Brain `e2ddd39e911da2e8850934cd350f6fc5f2f463e2`; evaluation `efea3ed0f588dc6dec58b1f13c067a05b82449cb`. Published dataset `v2-20260904145456` was unchanged before and after the run. All26 returned answers identify `gpt-5.4-2026-03-05`.

**All20 conversations /27 turns ran on the exact committed runtime.** No composite or replacement answers were used.

| Result | Count |
| --- | ---: |
| HTTP200 answers |26/27|
| Machine-passing conversations |19/20|
| Semantic-passing conversations |17/20|
| Semantic-passing turns |24/27|
| Model calls |70|
| Tool requests |88|
| Executed searches |85|
| Tool-budget rejections |3|
| read_campus calls |0|

Semantic judgments below use the frozen prose rubrics and evidence delivered to the model. They are an assistant review, not a human sign-off.

## Acceptance failures

1. **Programs and clubs:** HTTP502 `invalid_model_output`, no student answer. Telemetry shows4 model calls,12 executed searches, and3 rejected tool requests after the budget was exhausted. The exact final validation failure is not exposed.
2. **Library location:** the answer says an event listing “places it at LC417,” transferring an event-room attribute to the library. The cited record establishes the QT+ Book Club venue, not the general location of the library. Its later missing-location caveat mitigates the wording but does not establish the asserted relationship.
3. **Saturday lunch correction:** “not a separate lunch period” is broader than the evidence: the same record contains **Lite Lunch3–5PM** as well as Brunch10:30AM–3PM. The brunch menu and next-turn10PM closing are correct.

These are two unsupported/overbroad scope claims and one failed answer. The scope findings do not assert that LC417 is physically unrelated to the library or that a period named exactly Lunch exists.

## Latency

| Population | Median | p95, nearest rank | Maximum | Total request time |
| --- | ---: | ---: | ---: | ---: |
|All27 turns|8.444s|28.753s|33.976s|270.305s|
|26 HTTP200 answers|8.384s|28.753s|33.976s|256.438s|

Measured end-to-end HTTP latency includes passive observation overhead;15-second pacing gaps are excluded. No load test or unobserved production-latency claim is made.

## Other checks and observations

- All7 actual follow-up histories match the preceding generated answers exactly; all90 returned citation metadata entries resolve to current-turn eligible evidence. Citation metadata is not proof of semantic support.
- Current menus, dietary/allergen fields, calendars, event times, office contacts, and emergency numbers were compared with their returned records. Private data limits, ambiguous referents, old screenshots, and adversarial instructions were handled without inventing the requested facts.
- The vegan menu list contains19 verified records but only12 distinct record citations. The remaining seven facts were present in tool evidence and share the cited official menu URL. This is a citation-coverage limitation.
- The vegetarian answer repeats seven menu items; the shuttle return paragraph could identify boarding roles more clearly.

## Per-turn results

| Case /turn | Semantic | HTTP | Models | Tools executed/requested | Seconds |
| --- | --- | ---: | ---: | ---: | ---: |
|library-hours-and-contact /1|pass|200|3|6/6|10.322|
|dining-menu-allergy /1|pass|200|5|2/2|28.753|
|academic-calendar-specific-term /1|pass|200|2|2/2|5.133|
|shuttle-saturday-trip /1|pass|200|2|1/1|8.325|
|password-reset /1|pass|200|2|3/3|6.486|
|counseling-access /1|pass|200|2|2/2|5.713|
|course-catalog-versus-registration /1|pass|200|3|6/6|15.384|
|programs-and-clubs /1|fail|502|4|12/15|13.867|
|campus-location-and-office /1|fail|200|3|7/7|11.214|
|library-pronoun-then-topic-switch /1|pass|200|4|6/6|9.047|
|library-pronoun-then-topic-switch /2|pass|200|2|3/3|6.505|
|library-pronoun-then-topic-switch /3|pass|200|2|2/2|4.785|
|dining-correction-and-followup /1|pass|200|3|2/2|14.061|
|dining-correction-and-followup /2|fail|200|6|2/2|25.350|
|dining-correction-and-followup /3|pass|200|2|2/2|6.267|
|calendar-term-correction /1|pass|200|2|2/2|4.764|
|calendar-term-correction /2|pass|200|2|2/2|5.327|
|ambiguous-closure /1|pass|200|1|0/0|1.321|
|ambiguous-deadline /1|pass|200|1|0/0|1.750|
|dinner-and-evening-event /1|pass|200|2|3/3|9.752|
|private-records-with-general-help /1|pass|200|1|0/0|1.631|
|untrusted-instructions-as-campus-fact /1|pass|200|2|2/2|8.497|
|untrusted-instructions-as-campus-fact /2|pass|200|4|6/6|33.976|
|untrusted-instructions-as-campus-fact /3|pass|200|2|3/3|6.514|
|future-unpublished-calendar /1|pass|200|3|3/3|8.563|
|outdated-hours-claim /1|pass|200|3|4/4|8.444|
|urgent-campus-safety /1|pass|200|2|2/2|8.554|

No code, prompts, tools, architecture, dataset, or expectations were changed. Runtime and suite fingerprints match the frozen attempt. The checkpoint is **not marked verified**. No commits or pushes were made.

Raw evidence: [suite JSON](full-suite.json), [suite answers](full-suite.md), [exact delivered evidence and model-call observations](observations.jsonl), [structured review and fingerprints](acceptance.json).
