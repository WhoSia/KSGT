# KSGT Generation X G10-P1 R9.8 — Groq R5–R8 Cold Replay, Token Decomposition, and KoLLA Surface Multiplicity (2026-11-06)

**Research verdict:** FOUR ORIGINAL RAW ZIPS VERIFIED / 75 REAL GROQ PROVIDER CALLS IN HISTORICAL R5–R8 / 63 FINAL DEVELOPMENT DOCUMENTS / R8 COUNTERFACTUAL VALUE NOT IDENTIFIED / ORIGINAL ESSAY PARTITION NOT VERIFIED / INDEPENDENT READER RATINGS 0 / G10-P1 OPEN.

## 1. Original artifacts and completed GitHub Actions
The four original Drive ZIP files were independently cold-read and hashed again in a local runtime, with exact SHA-256 concordance with previously preserved receipts.

| Round | ZIP SHA-256 | Provider calls | Final documents | workflow |
| --- | --- | ---: | ---: | --- |
| R5 | `6545b0bbc6de471323e7f90eee712a977d015fbbf739cac3c934ebaf51d2cf9a` | 9 | 9 | 41968783130 |
| R6 | `80695e18ae9c48b08b8a0e9c3564992c65222dc3bbb1905c84f8c7ddcbdb5e44` | 18 | 18 | 41975371632 |
| R7 | `d96f511be037f4b9e0b0d39a835b8a5943776980baffe5427d070e385e38d5c2` | 30 | 18 | 41983746559 |
| R8 | `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9` | 18 | 18 | 41987543928 |

The four listed workflow jobs were fetched again through GitHub; all currently report `completed / success`. The original outputs are real Groq GPT-OSS 20B results, **not** mock CI outputs. All original source works were investigator-authored and exposed for development. R5–R8 together reuse works; 63 final texts do not represent 63 independent sources. New Groq calls in R9.8: zero.

## 2. Recomputed usage: distinguish prompt, reasoning, and other completion tokens
Actual per-step Groq `usage` objects were summed, requiring prompt+completion=total and reasoning<=completion on every call. The reproduced round-level totals agree with prior source reports.

| Round | Policy | Prompt | Completion incl. reasoning | Reasoning | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| R5 | STRONG_DIRECT | 1319 | 865 | 37 | 2184 |
| R5 | EXPLICIT_EDGE | 1436 | 877 | 41 | 2313 |
| R5 | GRAPH_ORDER | 1529 | 820 | 37 | 2349 |
| R6 | STRONG_DIRECT | 3514 | 1453 | 76 | 4967 |
| R6 | GENERIC_CONTRACT | 3796 | 1496 | 81 | 5292 |
| R6 | KSGT_GENRE_LICENSE | 4730 | 1633 | 61 | 6363 |
| R7 | STRONG_DIRECT | 3262 | 1580 | 105 | 4842 |
| R7 | GENERIC_DRAFT_REVISE | 7982 | 2867 | 316 | 10849 |
| R7 | KSGT_CLAIM_PLAN | 9832 | 2814 | 298 | 12646 |
| R8 | BASE_DRAFT | 3286 | 1750 | 60 | 5036 |
| R8 | GENERIC_REVISION | 5264 | 2150 | 485 | 7414 |
| R8 | SOURCE_ACCOUNTABLE_REVISION | 5780 | 1585 | 137 | 7365 |

**R8 paired difference:** every KSGT revision prompt consumed exactly **86 more input tokens** than its same-draft generic counterpart (+516 in aggregate). KSGT emitted 565 fewer *completion* tokens, of which **348 fewer were reported reasoning tokens** and 217 fewer were non-reasoning completion tokens. This yields only 49 fewer *total* tokens despite the extra instructions. Non-reasoning completion tokens should not be equated to text-only cost without checking provider accounting rules, and aggregate provider token savings are NOT a quality gain.

## 3. R8 pairwise final output audit
Two of six matched source-work pairs (`NOTICE_CONDITION_A`, `SCIENCE_LIMIT_A`) produce **byte-identical final text** under generic and KSGT revisions; four are different. Generic retains a three-paragraph structure in 6/6, KSGT in 5/6. On `SCENE_CORRIDOR_B`, KSGT generated 181 characters vs generic 397 and dropped one required paragraph. This is an observable format/length failure, not a human prose preference judgment.

**New methodological discovery:** in the actual `NOTICE_CONDITION_A` shared draft, a claim that the session occurs *every Friday* appears early in the draft, while a later sentence says that weekly recurrence was not established. Both revision arms remove the unjustified opening recurrence, producing an identical final text. This is an instructive example of how a self-auditing or internally contradictory starting draft can allow a generic revision to perform the same repair as the specialized arm. It does not identify whether KSGT has incremental value when the shared draft lacks such self-diagnostic information.

## 4. KoLLA source-surface census, separate from essay identity
The verified KoLLA v2 ZIP has SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`; the M2 has SHA-256 `d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`. On 1,418 source sentence blocks, Unicode NFC plus whitespace removal yields **1,398 distinct strings**. Nine repeated normalized string types occur in 29 blocks, yielding 20 extra occurrences and 56 colliding source-block pairs; maximum multiplicity 8. Three repeated types contain raw variants differing before normalization.

This makes `unique SHA-256 normalized digest` a source-string authenticity cue, NOT automatically a unique corpus position. A digest with two or more matching positions must remain ambiguous. This census does not reconstruct the 100 original KoLLA essays and is not independent Korean reader evaluation.

## 5. Research decision — next design
Do not endlessly add validators as an alternative to generating good Korean prose. Introduce a **2×2 shared-draft factorial contrast**:
- Draft D0: source-only Korean prose draft, *without explicit source self-audit commentary*.
- Draft D1: source-conditioned draft with explicit protected constraints.
- Revision R0: strong generic draft/revise.
- Revision R1: selective KSGT source-accountable revise.

Add a one-call STRONG_DIRECT comparator. For each work and replicate, generate D0 and D1 once, then feed each exact shared draft into both revisers (two-stage comparisons). Counterbalance revision order and disclose actual prompt/total/reasoning usage, latency, new facts, unjustified weakening, omissions, and format. The primary interaction question is whether KSGT's incremental effect differs between D0 and D1. Holdout works must be disjoint from all six exposed originals. Obtain independent blind native Korean reader preference and independent source-fidelity adjudication before claiming quality gain.

Model form to estimate with real rated outcomes: `Y = alpha_sourceWork + beta_draftTreatment + gamma_revisionPolicy + delta_interaction + error`. Units and uncertainty should be at source-work level; model calls within a work are NOT independent documents. The design manifest plans seven calls per source-work replicate (1 direct + 2 drafts + 4 revisions), requiring explicit cost authorizations and a fixed frozen cohort before any live execution.

**Engineering:** [four-round audit script](../r98_groq_lineage_audit_v01.py), [tests](../r98_groq_lineage_audit_v01.test.py), [KoLLA surface census](../r98_kolla_surface_census_v01.cjs), [factorial manifest](../r99_groq_factorial_manifest_v01.cjs). Local R9.8 cold audit Python tests: 10/10; KoLLA Python tests: 5/5. Repository Node regression files were committed but are not asserted to have completed remote CI.

**Authority:** scientific writing-quality superiority remains unmeasured. Neither identity-matched outputs nor successful CI authenticate original essay boundaries or human reader quality. G10-P1 OPEN; no G10-P2 promotion.
