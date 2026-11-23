# KSGT G10-P2 R5u — Source-work paired analysis, missingness, and outcome-lock preflight

**Date:** 2026-11-23. **Stage:** `G10-P2 OPEN / QUALITY_HOLD`. **Kind:** synthetic instrumentation only, NOT a prospectively frozen actual experiment or human evaluation.

## Exact previous sources revisited

- R5 `02_CAUSAL_IDENTIFICATION_PREREG_20261121.md`: source work, not rating or paragraph, as unit; separate reader usefulness and source fidelity, seven arms and strong `STRONG_DIRECT`, `STATE_AS_TEXT`, `EQUAL_COST_ITERATIVE` rivals; contrast information equality and complete cost accounting.
- R5t `39_R5T_MULTIDIMENSIONAL_LIRA_JEV_AND_EVALUATION_CONTRACT_20261123.md`: 7 utility axes, four evidence axes, hard gates, 24 synthetic contract tests; no human outcomes.
- R5s `38_R5S_BLIND_COMMITMENT_LEAKAGE_REPAIR_20261123.md`: synthetic low-entropy public assignment digest inverted 2/2; old packets deprecated; new public packets omit the SHA mapping commitment.
- R5q `36_R5Q_NIKL24_APPLICATION_AND_RIGHTS_SAFE_INTAKE_20261123.md`: NIKL 2024 user-attested 2026-11-23 application, actual downloaded bytes and rights unverified.

## New executable research contribution

`r5u_worklevel_analysis.py` validates a strictly synthetic blinded assessment input (mapping supplied ONLY to local in-process analysis). It rejects accidental promotion to real research, access to source prose through assessment fields, invalid 1–5 ratings, same-work reader/auditor role crossover, duplicated ratings, unknown mappings, and source-auditor positive errors without span witnesses. `UNCERTAIN` is always *missing*, never a negative error. For each independent work `w`, arm `a` and outcome `m`, calculate the rater-averaged outcome `Y[w,a,m]`. For each competitor `b`, compare `D[w,b,m]=Y[w,EXECUTABLE_STATE,m]-Y[w,b,m]` only if **both** work-arm results exist. Report `n_work_paired`, `n_work_missing`, and the equally work-weighted mean `sum(D)/n_work_paired` separately for usefulness, naturalness and source-error occurrence. Lower source-error difference is favorable; higher reader usefulness is favorable. Do not treat counts of raters or arms as additional independent work samples.

For *synthetic diagnostics only* and between two and 16 paired works, code enumerates all `2^n` work-level sign reversals, reports a two-sided `signflip_reference_only`; this **is not a valid confirmatory p-value without exchangeability or randomized assignment and pre-registered null**. No real reader/inferential claims, Holm correction or CI are made; 7-arm primary comparison family and multiplicity must be prospective. The source-error `YES/NO/UNCERTAIN` is only an auditor's annotation shape, not a verified source inference. Multiple auditors can disagree and that disagreement is not currently resolved by a frozen adjudication protocol.

`outcome_lock` provides only SHA-256 over synthetic outcome rows with `real_study_unblinding_permitted=false`. It cannot certify a real custody lock, independent rater identity, time of lock, prevent dataset substitution by a custodian, nor authorize the actual private 7-arm key reveal. R5s confidentiality rules remain binding. For real evaluations, independently verified custody, immutable signed outcomes, locked exclusion and loss rules, access logs and a separate authorized unblinding approval are needed.

### Executed synthetic example (deliberately favorable for executable arm)

Four **invented** works × seven arms × two assessor roles = **56 rows**, NOT 56 independent works. The invented reader assigns usefulness 4 to EXECUTABLE_STATE and 3 to all other arms. The program reports a work-weighted usefulness difference of **+1.00** against each of the three competitors; fidelity auditors assign all NO, so source error is **0.00** difference. The four same-sign paired differences yield two-sided `signflip_reference_only = 0.125` (16 sign patterns); this **cannot** demonstrate any KSGT benefit, and the example was purposely constructed to make the executable arm seem better. Additional tests mark `UNCERTAIN` as missing and reject 22 kinds of structural and evidence invalidity; two extra tests verify four works remain four despite additional raters and that exact enumeration matches the fixture. **24/24 test cases PASS**.

### LIRA/JEV director decision (scores are subjective audit indexes)

| Decision | Utility P (0..1) | Evidence support E (0..1) | Gate | Rationale |
|---|---:|---:|---|---|
| D2 work-level analysis protocol preflight | 0.95 | 0.91 | READY | Corrects pseudoreplication, separates two primary axes |
| D7 blind lock/custody split | 0.93 | 0.92 | READY | Guards access and post hoc rerandomization; not actual lock |
| D1 obtain official NIKL 2024 raw corpus/rights | 0.93 | 0.56 | PREPARE | Joint P0 strategically, real files absent |
| D3 certify 2023 parent works | 0.90 | 0.70 | PREPARE | Real source-work lineage unavailable |
| D6 new reader-state training | 0.32 | 0.46 | BLOCKED | No independent human prose outcomes |

See `R5U_LIRA_LINES.md` for **14/14 scored research-judgment lines**; E is evidential audit support, not a truth probability. P is research priority, not a calibrated success rate. Prior R5t multi-axis policy remains authoritative; the table records a cycle-specific implementation decision, not a replacement of prior 7-axis weights.

### Real experiment gate

Before any legitimate holdout use, acquire and privately inspect source corpus bytes and complete rights, attest parent work/author/previous exposure, freeze the original work census, independent pilot variance, minimum effect, sample size, cost budget, 3 primary contrasts × 2 primary outcomes and multiplicity plan, independent human recruitment and evaluator roles, blinded allocation, confirmed-source fact packet, immutable ratings lock and independent mapping reveal. None of those completed by the synthetic program. Current provider calls: historical 340, new 0. Actual reader ratings: 0. **No automatic promotion to G10-P3.**
