# KSGT G10-P2 R5r — Prospective human evaluation preflight (NOT a registered powered experiment)

**Stage:** `G10-P2 OPEN / QUALITY_HOLD`; no new model generations, no reader ratings, no independent source-work test items, no new model trained. R5q user-attested 2024 NIKL corpus application is not a corpus download or license grant.

## 1. Source-faithful program basis

Existing GitHub `02_CAUSAL_IDENTIFICATION_PREREG_20261121.md` already fixes the main hypothesis, seven arms, information parity, original source-work as independent unit, two primary outcomes, and no unearned quality conclusion. R5q records the user-reported application (2026-11-23; stated period through 2075-12-31). The historical KoLLA human revisions are sentence-level L2 corrections, not a substitute for blinded native-prose reader ratings. The 2024 NIKL resource may feature expert-edited LLM feedback, not actual source-prose rewrites. All those boundaries are preserved.

## 2. Independent task & exclusion

The candidate independent unit is the **verified original source work**, not an individual response, edit, prompt paraphrase, reader, paragraph, or candidate arm. Only genuinely independently audited, usage-authorized work identities may enter a future study. Exclude/quarantine any unknown rights; missing work or author provenance; existing R1-R5 exposed materials; shared parent source across partitions; untraced 2023 source-work derivations; improperly attributed expert-feedback-as-rewrite pairs. The R5n.1 `independence_claim=false` flag cannot authorize a true holdout.

## 3. Seven arms, no informational privilege

1. `STRONG_DIRECT`: strong model generates a whole Korean prose answer with ordinary relevant source packet.
2. `RICH_PROMPT`: same model with strong genre/audience/purpose prompting, not intentionally weakened.
3. `STATE_AS_TEXT`: same state representation and source information displayed literally to the model.
4. `EXECUTABLE_STATE`: identical source evidence, state representation, candidate inventory and underlying model to `STATE_AS_TEXT`, differing in external state transitions after realized text.
5. `EQUAL_COST_ITERATIVE`: conventional whole-text iteration under D's *measured* all-in budget.
6. `NO_OP_KEEP`: retains the best existing valid text without gratuitous rewriting.
7. `SHAM_STATE`: falsifiable, stale or planned-but-unrealized state for sensitivity, never deliberately fed false facts to real readers without appropriate context/verification.

All comparison packets must record model checksum/version, temperature, prompt, source hash, source and completion tokens, actual provider cost, latency, human setup/annotation minutes, and state extraction cost. Separate one-call and equal-total-cost comparisons. Hold `STATE_AS_TEXT` and `EXECUTABLE_STATE` exactly information-matched; if the extra executable arm sees a unique factual clue, invalidate that comparison. No new model calls in this phase.

## 4. Independent judges & blinding

**Reader panel:** rate complete Korean output with task usefulness (1–5 anchored: 1 unusable, 2 major gaps, 3 usable with substantial revision, 4 useful with minor revisions, 5 useful as-is); separately rate naturalness (same 1–5). Mark earliest passage requiring revision and categorize organization, referent clarity, unnatural collocation, tone, redundancy and other, with unknown allowed. Readers do not see model/arm identities or the original intended key. Reader form includes the full expected task, genre and intended audience but **not** private NIKL raw text or privileged factual auditor notes.

**Source-faithfulness auditors:** separately see authorized source facts and each complete output (the output's model/arm identity masked); classify unsupported new claims, changed negation, wrong subject/agent, attribution/quotation drift, uncertainty escalation, missing source-critical facts. Each finding needs a private source-span anchor, output-span anchor, severity and an uncertainty marker; no forced binary call on insufficient evidence.

Reader and source auditor assignments must be disjoint at the assessor level for the same work when feasible; record overlap if not. Both rater pools remain independent of original drafting and of experiment planning. Any hypothetical AI-judge outputs are development proxies, **not human outcomes**.

## 5. Blind key and anti-leak guard

`r5r_blind_packet.py` creates only an anonymous metadata preflight. Its `blind_packet` contains opaque tokens, display labels `X1..X7`, no arm-to-label mapping, no raw Korean text and no original work ID. `private_key()` separately returns the mapping to be held in a private restricted environment **only** when an actual authorized experiment is designed. The key must never be committed, attached to reader packets, or put in a public report. This synthetic seed and task are illustrative only; the program **refuses live-study approval** and falsely claimed human outcomes. Permuted display order alone does not constitute evaluator-independent randomized allocation or treatment-effect identification.

## 6. Outcome and analysis registration work remaining

Primary outcomes are **reader task usefulness** and **independent source fidelity**. Primary confirmatory contrast families: EXECUTABLE_STATE vs STRONG_DIRECT, vs STATE_AS_TEXT, and vs EQUAL_COST_ITERATIVE, with the richness baseline as a further meaningful check. Interpret costs separately and report effect with cluster-level uncertainty; do not pool 7 outputs × readers × works as independent works. An analysis plan must specify a cluster bootstrap or a mixed-effects approach with the original work as a random cluster, ordinal rating treatment, per-genre heterogeneity, missingness and multiplicity adjustment (such as Holm) **before** actual holdout evaluation. This preflight does not pick sample size or a minimum worthwhile improvement because development-pilot variance and costs have not been measured. Prospective meaningful-effect thresholds, exclusions, actual sampling frame and power analysis are therefore **unfrozen**.

Every future quality claim must report both primary axes; source harms can veto an apparent reader preference gain. If no source-disjoint authorized works, no actual blind independent readers, mismatched information/cost, or unfrozen analysis choices, the correct outcome is `INVALID_OR_HOLD`, not a positive or negative result.

## 7. Scientific branches after independent data

- **POSITIVE:** independently replicated benefit on both primary axes against strong direct, same-state text and equal cost; only then consider simpler state representation and cheaper models.
- **MIXED:** attribution/fidelity gain with cost/naturalness damage; restrict to risky sentences as a voluntary source audit, not required full prose control.
- **NULL:** no defensible gain over competent direct or iterative baselines; retire obligatory controller and preserve a transparent null result.
- **INVALID:** compromised source-work split, blinded rating or rights; quarantine and repeat preregistration without opportunistic metric redefinition.

## 8. Current deliverables and limits

- `r5r_blind_packet.py`: synthetic, fail-closed, metadata-only 7-arm packet, secret key kept separate, 1–5 *shape* check for future reader ratings. **Shape-check PASS is not external reader verification.**
- `test_r5r_blind_packet.py`: 17 tests on synthetic fixtures, including duplicate works, rights, exposure, lineage, false gold, key redaction and invalid ratings.
- `R5R_LIRA_LINES.md`: every substantive research judgment line explicitly scored for evidence `E` and action priority `P`, citing exact already inspected authoritative GitHub source IDs. Scores are director heuristics, not truth probabilities.
- `R5R_DIRECTOR_DECISIONS.json`: explicit decision ranking and hard gates; cannot promote quality on subjective score alone.
- Actual NIKL raw 2024 archive not retrieved; no private user application data beyond its coarse submitted status and dates are included in synthetic packet files.

**Next substantive step:** evaluate an authorized, real source-work corpus's schema and work-group boundaries after arrival, while separately drafting the unbiased Korean reader and fidelity-auditor forms and arranging independent human evaluation. Freeze a powered design only after a source-disjoint development pilot and verification of rights.
