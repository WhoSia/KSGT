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
