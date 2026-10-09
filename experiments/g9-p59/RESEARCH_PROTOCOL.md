# G9-P59 — Reader-State Reference Choice: Preregistered Design (v0.1)

Status: OPEN / STRUCTURAL STIMULI MATERIALIZED / HUMAN WORLD CONTACT HOLD.
Parent: G9-P58 CLOSED, type-guard only. This stage does not reopen its verdict.

## Explanandum and competing explanations
Human Korean writers may select concise partitive reference (그중), an explicit antecedent noun phrase, or sentence-level restructuring even when nominally conveying the same subset claim.

- H1 accessible single referent -> KEEP relative to ambiguous contexts.
- H2 multiple accessible possible groups -> increased overt disambiguation or RESTRUCTURE.
- H3 reader knowledge and writer/genre preferences moderate H1/H2.
- H4 mechanical explicitness is not always better than restructuring.
- Rivals: length preference, literal repetition aversion, annotator instruction priming, genre prompts, unequal context informativeness.

## Four cells currently authored
Two genres (report/narrative) x unique/competing antecedent. [reader_choice_probe.cjs](./reader_choice_probe.cjs) contains all four. These are deliberately small pre-pilot examples, **not** a validated factorial study. Competition necessarily adds discourse information; these four cannot isolate unique causes or reader common ground and must not support effect estimates.

## Actual human-contact protocol
1. Expert Korean reader checks *each candidate* for referent, number, coherent sentence meaning and natural Korean usage; record adjudicator + disagreement, never infer from regex.
2. Produce source-preserving matched contexts, with two counterbalanced target assignments and distractor order; additionally randomize how much context a reader has seen without changing the actual source facts.
3. Ask independent readers to identify the referent first, with 'ambiguous/unknown' response permitted. Capture both choice and confidence.
4. Ask writers to KEEP, EXPLICIT, or RESTRUCTURE freely. Preserve original free text, not only assigned category. Blind hypothesis and candidate identity as feasible; counterbalance versions and presentation.
5. Separate quality/naturalness ratings from correctness and source fidelity. Never make a composite 'human-likeness' target.
6. Record voluntary consent appropriate to the study, no unnecessary identifiers, participant-level clustering and item provenance. Do not publish private corpus excerpts without rights.

## Possible preregistered estimands
- Referent identification: Pr(correct | condition, presented choice). Correct refers to an independently certified anchor; uncertain/ambiguous is its own valid outcome.
- Writer preference: Pr(KEEP/EXPLICIT/RESTRUCTURE | assigned context, reader condition, genre). Distinguish produced edits from survey judgments.
- Comparisons should use participants and items as clustering units, and include uncertainty intervals. No numerical thresholds or samples falsely claimed as observed.

## Stop/repair rules
- Abort preference claims if referent ambiguity is unintentionally altered, source semantics shift, blind labels leak or validated human observations are absent.
- If free structural revisions are common, expand the action ontology before modeling only KEEP vs EXPLICIT.
- If reviewer agreement is poor, surface disagreement; do not manufacture a consensus gold.
- The code's four string guards are instrumentation, not Korean linguistic accuracy.
- Do not promote a synthetic test to human-world-contact PASS. Do not allow GitHub Actions to commit, push, tag or alter refs.

## P59 current ruling
BOUNDED IMPLEMENTATION PRESENT / EMPIRICAL IDENTIFICATION HOLD.
Only transition to HUMAN_CONTACT_PASS after traceable consented Korean reader/writer observations and source-licensed matched items exist.

## 2026-10-09 v0.2 counterbalanced fixture upgrade
[reader_state_v02.cjs](./reader_state_v02.cjs) adds eight authored cells = 2 source targets x 2 group orderings x 2 reader-knowledge briefings. Full group facts, numeric cardinalities and the target expression remain stable within each full/limited briefing pair. This removes the earlier unique-group versus two-group *source-facts* imbalance inside those pairs. It does **not** by itself causally identify a reader-knowledge mechanism: briefings differ lexically and the limited condition admits unresolved reference. Authored target IDs are not independently recovered gold. A future preregistration must control briefing length/lexical effects and distinguish source-grounded intended target from reader-inferred referent.

No training or server use authorized until after RITHM and owner availability, currently tentatively next week. Offline code development, synthetic tests and CI read-only computation are permitted. Borrowed host must not be touched beforehand; future host uses confirmed HDD-only work directory, not /home/sean/coding/oozoon, which was found to be on SSD.

## 2026-10-09 v0.5 — source-scene and reader-state comparisons
- [dataset_v05.cjs](./dataset_v05.cjs): **4 explicitly synthetic source-scene families**, 2 writer-intended group targets × 2 antecedent orders × 2 declared reader-accessibility scopes = 32 rows. Dev 16 (2 families), validation 8 (1 family), synthetic holdout 8 (1 family). A given family never crosses split boundaries. All families still share the same *two-group discrete subset* template, so template-level generalization is **not established**.
- **Matched manipulation**: within each scene × target × antecedent order, source sentence, writer intention and KEEP/EXPLICIT alternatives are *byte-identical*, while only the declarative `readerState.accessibleRefs` differs. This is a controlled machine-input intervention, **not** evidence of real readers' accessible referents. Varying target changes the writer intention; it does not preserve the target meaning.
- [leakage_audit_v05.py](./leakage_audit_v05.py): independently verify per-row SHA-256 across JavaScript/Python JSON, split by family/scene/source-fact fingerprint in SQLite, and reject renamed-family cross-split aliases. All source scenes are authored synthetic and no third-party native corpus is claimed.
- [model_compare_v05.cjs](./model_compare_v05.cjs): same packet IDs, declared writer meaning, declared reader state, data fingerprint, complete coverage, unique prediction IDs; accept separately supplied model outputs through `--compare-file`. The local policy fixtures always KEEP, always EXPLICIT and always ABSTAIN are **not trained models**. No baseline wins in linguistic naturalness or human preference without external evidence.
- The reader-state contrast is an **ablation interface** for a future model. Keeping a metadata field constant/altering it is not a valid human reader trial. A valid future model comparison must separately freeze model checkpoints, learning resources, tokenization, corpus custody and compute envelope, and test on independent native source families.
- Reject the misleading claim that 4 authored families are 4 native gold examples. Distinct synthetic scenes ≠ independent Korean author labels; structurally disjoint splits ≠ unbiased human naturalness estimation.
