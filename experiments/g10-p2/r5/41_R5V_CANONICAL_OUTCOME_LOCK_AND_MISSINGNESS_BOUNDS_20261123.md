# KSGT G10-P2 R5v — Canonical blinded outcome custody & source-error missingness bounds

2026-11-23 KST. Stage: **G10-P2 OPEN / QUALITY_HOLD**. This is a methodological/synthetic regression, not a human evaluation or validation of a new Korean text generation model.

## Revisited source genealogy

- [R1: R5u work-level experiment and synthetic outcome lock](https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/r5/r5u_worklevel_analysis.py) grouped repeated judgments by original source work and explicitly refrained from human quality claims. Its `outcome_lock` hashed the input array as-is; permuting identical records changes the digest despite unchanged substantive evidence.
- [R2: R5s security erratum](https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/r5/38_R5S_BLIND_COMMITMENT_LEAKAGE_REPAIR_20261123.md) prohibited unkeyed public 7-arm mapping commitments; no private mapping or study key is included here.
- [R3: R5u prereg report](https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/r5/40_R5U_WORKLEVEL_PAIRED_EVALUATION_AND_OUTCOME_LOCK_20261123.md) specified UNKNOWN/UNCERTAIN is missing, not NO, and protected work-level cluster accounting.
- [R4: R5q corpus application record](https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/r5/36_R5Q_NIKL24_APPLICATION_AND_RIGHTS_SAFE_INTAKE_20261123.md) confirms the user-reported NIKL 2024 application but not actual raw archive, rights fulltext, source-work lineage or expert-edited source rewrites.

## Identified defects and fixes

**Defect 1 — accidental order dependence:** The old synthetic lock digest was computed from raw JSON row ordering. R5v canonicalizes strict, permitted assessment records by `(work_token, blind_label, role, assessor_token)` and hashes domain-separated, canonical UTF-8. Same records under permutation now share a digest; modifying a score changes it. Duplicate assessments, unacceptable fields, false real-study claims, unsupported roles, same-work reader/auditor overlap, and missing YES spans produce explicit errors.

**Defect 2 — insufficient missingness transparency:** A reported source-error difference based only on paired observed auditor labels omits uncertain works. R5v also calculates deterministic conservative bounds when each `UNCERTAIN` could be error=0 or 1. For each work and arm, 
`lower_error = YES_count / N`, `upper_error = (YES_count + UNCERTAIN_count)/N`; for target-minus-baseline, `lower_delta = target_lower - baseline_upper`, `upper_delta = target_upper - baseline_lower`. Per-work bounds are averaged with equal weight. This is an **identification/sensitivity envelope**, not a confidence interval or causal estimate. It does not recover absent entire arms; those cause HOLD.

## Executed synthetic-only tests and illustrative arithmetic

19 new tests PASS, and the 28 R5u tests PASS separately (47 total). A four-work illustration with one uncertain **target** auditor produces error difference bound `[0, +0.25]`; one uncertain **baseline** produces `[-0.25, 0]`; 4/4 works with both uncertain produces `[-1,+1]`. The structure supports missingness auditing but its data are invented. No reader evaluation has been obtained, and no statistical claim about Korean writing quality is licensed.

## LIRA/JEV director decision

The 10/10 new judgment lines each have evidence E and execution priority P, with exact source identifiers R1–R4. These are subjective audit indices rather than measured truth probabilities, and the earlier R5t seven utility axes/four evidence axes remain the canonical multi-axis policy. Rank work-level outcome integrity and non-response sensitivity as immediately actionable; NIKL corpus access and independently qualified sources are strategic joint P0, not presumed complete. Historical model provider calls=340; new calls=0; independent Korean human ratings=0; additional trained models=0. G10-P2 stays OPEN/QUALITY_HOLD.

## Next gate

A real lock would additionally need independent signed receipt/custody with an append-only trail, privilege separation, real rater identity and timestamp auditing, right-to-use proof, confirmed blinded mapping, and prespecified primary family/cluster confidence intervals. No design or mock data here authorizes unblinding or promotion to G10-P3.
