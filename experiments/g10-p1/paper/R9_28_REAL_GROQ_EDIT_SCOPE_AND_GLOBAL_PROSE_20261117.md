# R9.28 — Selective edit scope and global Korean document generation

2026-11-17 KST · G10-P1 OPEN · Public authored development inputs

Run [44012504423](https://github.com/WhoSia/KSGT/actions/runs/44012504423) completed 21/21 Groq GPT-OSS 20B requests, using temperature 0 and the same input configuration as R9.27. The 21 attempt markers, response receipts and plan IDs match. The provider artifact is 36,449 bytes, SHA-256 7176ab698eca85c1c2b3870d24b4f67bd1495e5313ad54047b570f4dfc644272. Plan hash 1d5f83f6a91be17d31b94e72251e00c6a2b6b163e0597edbc039284a538676a0. The protocol and the two cohorts were committed before launch. The author-side assessment below used masked IDs. One run per input and no independent reader score.

## Selective editing

| Condition | Exact retention on three clean drafts | Target errors fixed on three faulty drafts | Other material facts kept | Tokens |
| --- | ---: | ---: | ---: | ---: |
| Copy | 3/3 | 0/3 | 6/6 | 0 |
| Whole rewrite, may return the draft | 1/3 | 3/3 | 6/6 | 3,909 |
| KEEP or bounded patch | 3/3 | 3/3 | 6/6 | 4,249 |

The patch arm chose KEEP in all clean cases. Each faulty case was fixed with a single replacement of exactly the planted sentence: eligibility scope, unobserved air temperature, and the giver of the paper bag. The workflow copies all other sentence bytes and delimiters when applying a patch. For the whole-rewrite arm, differences in clean documents included formatting and a particle choice; both arms passed the material fact checks. The strongest measured advantage is control over where editing occurs, plus unchanged correct inputs. Semantic superiority and lower cost did not materialize in these three works. Patch used 340 more tokens across six responses (+8.70%). The JSON interface and span restriction were applied together, so their effects are not separately identified.

**Counterpoint for a reader trial:** we have a tight nominal-particle contrast in the R928_WINDOW clean outputs. After trimming end-of-line spaces, the documents differ in one particle only. A single masked preference question is ready. No label has been recorded for it.

## Global prose

| Condition | Work-specific reader task satisfied in review | Clear unrelated factual additions | Tokens |
| --- | ---: | ---: | ---: |
| Rich direct | 0/3 | 3/3 | 1,985 |
| Author's linear outline | 2/3, one ambiguous | 3/3 | 2,013 |
| Same outline with reader-state cues | 2/3 | 2/3, one ambiguous | 2,122 |

These counts are an author-side interpretation of three deliberately selected reading goals. An otherwise useful structure cannot turn a new claim into an authorized fact.

- Trail notice: the outline condition preserved Friday 20:00 as the message receipt threshold, then added final procedures and a special briefing. The reader-state condition framed the notification as a state transition but introduced immediate travel and implied that all waitlisted participants would be contacted.
- Pond: the reader-state output clearly refers each number to the same day's difference between two spots and preserves the uncertainty of cause. Its expression for differently set environments can also read as deliberate experimental assignment. The direct output asserted a heating effect beyond the observation.
- Station: the reader-state condition kept the handoff and departure order but invented a bench, mutual glances, and hand contact. The direct sample sent the narrator back to the hall after following the sister. The instructive questions are whether the reader can follow who acted and what details a narrator was entitled to say.

The two added-plan conditions tie on strict task satisfaction in this set. This is a comparison of author-supplied planning information and its presentation, not automatic discovery of reader state. Higher comprehension, naturalness, third-party preference, and robust source-conformity remain open.

## Measurement and retention

The provider's response paragraph count was 1 for JSON patches. The applied documents all have three blank-line-delimited paragraphs, as do the nine generated documents. The follow-up code records applied document paragraph count separately, and local testing passed 37/37 after that change. At the actual experiment commit the remote test command covered 22 tests, all passing. Do not rewrite the original receipt to backfill a later field. Historical R9.23 replay remains unexecuted. No raw private historical text or new credentials were committed.
