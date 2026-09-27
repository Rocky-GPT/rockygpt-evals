# Library name alias check, 2026-09-25

The [hours scope check](../2026-09-24-library-hours-scope/README.md) found that "Where is the library?" failed on a name claim. The shared fact reader marked the Library's name conflicting: its directory entry says "Library" and its Archway page says "Potter Library". Every record then carried "Linked records disagree on name", and a draft claimed the directory calls the Library "Potter Library".

Brain `eff6a84` counts those as one name. For an entity's own name only, and only when a source publishes the entity's registry name, another source's name that is one of its aliases, apart from whitespace, is the same name. The assertion keeps its published text with a caveat. An alias counts only if a person wrote it or the entity's directory entry publishes it as the department; "Potter Library" is the Library's directory department. An alias copied from a linked record's own name can't settle a disagreement, and a name no source disputes stays as published. Two review rounds shaped the rule: the first version also rewrote 13 programs' single published names to older registry names, and that was fixed before commit. This run asks the same seven turns again.

**Result:** the name conflict is gone, but "Where is the library?" still fails. Every Library lookup now reports its name as known, and no record says the names disagree. 5 of 7 turns passed on the first try and 6 of 7 overall. "Where is the library?" failed all three tries: two never looked the Library up, and two said the directory calls the Library "Potter Library", which the reviewer rejected. The verdicts are an agent review; human review is pending.

## What ran

| | |
| --- | --- |
| Brain | `eff6a84`, configuration hash `f6720975…`, deployed at 00:28. It also carries `1030e4f` and `467ee3b`, which other sessions committed meanwhile |
| Dataset | `dev-profiles-offices-20260924-r3` on the local Postgres, port 55434, the same as the last three runs |
| Dev UI | `rockygpt-dev` at `32e328b`, Ask & Inspect on :3100. Questions were typed and sent through the page's own text box and buttons from in-page JavaScript |
| Model | `gpt-5.4-2026-03-05`, draft plus review, real OpenAI calls |

Each case started from "Clear turns". The follow-ups in case 2 carried the earlier turns. [turns.json](turns.json) has every try: the answer, the reviewer's reasons for any rejection, citations with any disagreement notes, tool arguments, resolution, the name fact's status, placements and evidence IDs. [run.json](run.json) has the run details.

## Results

The ground truth is the same as before. Library (Main Building) is open Friday 7:45am–6:00pm, Saturday 10:00am–6:00pm and Sunday 12:00pm–12:00am this fall. The Research Help Desk has no verified hours. The Library is in the Peter P. Mercer Learning Commons. Its directory entry is named "Library" with department "Potter Library", and its Archway page is titled "Potter Library". Financial Aid is (201) 684-7549, finaid@ramapo.edu, E-210 in Academic Building E.

| Case | Turn | Tools | Name fact | Verdict |
| --- | --- | --- | --- | --- |
| library-hours-and-contact | 1 | `lookup_profile("Ramapo library", contact, hours)` both tries | known | fail, then pass: the first draft implied when staff answer email |
| library-pronoun-then-topic-switch | 1 | two `search_campus(campus_hours)` calls, exact records | not read | pass |
| library-pronoun-then-topic-switch | 2 ("And Sunday?") | `lookup_profile("Library", hours)` | not read | pass |
| library-pronoun-then-topic-switch | 3 (Financial Aid) | `lookup_contact("Financial Aid")`: placed in Academic Building E | known | pass |
| outdated-hours-claim | 1 | `lookup_profile("Library", hours)` | not read | pass |
| where-is-the-library | try 1 | critical-facts and contacts searches only | not read | **fail**: said the department makes the Library "Potter Library", and that the contact is the reference desk's |
| where-is-the-library | try 2 | critical-facts and contacts searches only | not read | **fail**: partial, "couldn't verify a more specific building", no building |
| where-is-the-library | try 3 | contacts search, then `lookup_contact("Library")`: placed in the Peter P. Mercer Learning Commons | known | **fail**: `contradicted_evidence`, said the directory lists the Library's name as Potter Library |
| research-help-desk-tomorrow | 1 | `search_campus(campus_hours, "Research Help Desk")`, exact records | not read | pass: "Hours unavailable" for Saturday |

## Findings

1. **The name fix works.** Offline, 8 of 15,157 facts changed, all of them the four offices' names on the two lookup paths. In the run, every Library contact lookup reported the name as known, and no cited record carried a disagreement note.
2. **The Potter Library claim didn't come from the conflict flag.** Tries 1 and 3 still attribute "Potter Library" to the directory as the Library's name, with no disagreement note in sight. The only record whose name is Potter Library is the Archway page. The reviewer rejects the claim correctly each time.
3. **Location questions still often skip the lookup.** Two of three tries searched critical facts and contacts and then answered without calling `lookup_contact` or `lookup_profile`, so they never saw the placement. The search results point at the Library's entity ID, but only a contact lookup returns its building.
4. **One hours answer overreached on staff.** Case 1's first draft implied when staff answer email; the retry stated the building hours and said they don't establish staff availability.

These results are noisier than the last two runs on the same question (1 of 1, then 2 of 3). A handful of tries can't separate a regression from variance, and nothing in this change touches the search path that tries 1 and 2 took.
