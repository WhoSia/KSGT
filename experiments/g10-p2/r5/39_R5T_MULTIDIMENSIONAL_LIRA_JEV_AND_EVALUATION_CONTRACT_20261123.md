# G10-P2 R5t — LIRA/JEV multidimensional evidence court and evaluator separation

**2026-11-23 KST — UNFROZEN RESEARCH DECISION.** The project's official state remains `G10-P2 OPEN / QUALITY_HOLD`. The NIKL 2024 application was user-reported as submitted, but actual original corpus bytes and complete rights agreement have **not** been inspected. Prior measured provider completions remain 340, with **0 new model calls and 0 independent human outcomes** in R5t.

## Source genealogy restored

- R5p: original 5-axis weighted utility, scored-line provenance, 243 weight-perturbation combinations; the 0–1 scores were subjective, not measured outcome chances.
- R5p.1: 120 one-coordinate ±0.10/±0.20 input challenges, 10 priority reversals in the original scoring court; D1 and D2 maintained as joint P0.
- R5q: user's submitted NIKL 2024 access request (2026-11-23; agreement period displayed through 2075-12-31), but no corpus bytes, complete license terms or authenticated before/after full-prose pair evidence. Expert-edited evaluation feedback must never be treated as an expert rewrite of the input essay.
- R5r: independent source work as the analytical cluster, seven complete-text comparison arms, separate blind reader usefulness and source-auditor fidelity, 20 synthetic tests; the prospective trial is not frozen or powered.
- R5s: discovered low-entropy public SHA256 commitment revealing the seven-arm assignment in 2/2 **synthetic** examples; repaired the current generator and deprecated the old packet. No actual human participant was exposed.

## New LIRA/JEV rubric (0–1, non-probabilistic)

Decision **utility** dimensions and weights: `bottleneck_relief` .22; `causal_information` .19; `language_quality_relevance` .17; `execution_readiness` .13; `reversibility` .09; `risk_reduction` .10; `cost_efficiency` .10. The first three assess experimental value, the next two deployment and option value, and the last two harm/cost externalities. These weights are an explicitly *normative* design choice and have not been optimized on human outcomes.

**Evidence support** is **not multiplied into utility**. It has four separate, equal-weight dimensions: `source_directness`, `reproducibility`, `independence`, `completeness`. A step's evidence score refers to availability/authority of its inputs, not the probability its proposed scientific hypothesis will prove true. A recorded uncertainty half-width for each utility dimension yields a **judgment envelope** rather than statistical confidence intervals. Overlapping envelopes mean fine-grained numerical ranking is not defensible.

**Hard execution gates**: `READY`, `PREPARE`, `BLOCKED`. A blocked action is never a valid immediate recommendation, regardless of the scalar score. `PREPARE` can still be important and pursued for prerequisite discovery without claiming a completed gate. In particular, raw NIKL corpus rights, native source provenance, and independent blinded Korean reader outcomes cannot be substituted with LIRA scores or synthetic tests.

## Executed calculations (synthetic/director-assessed scores)

| Decision | 7-axis priority | 4-axis evidence support | Execution | Interpretation |
|---|---:|---:|---|---|
| D2 independent blind evaluation preregistration | 0.9445 | 0.7850 | READY | Immediate implementation P0 |
| D7 blind security review | 0.8815 | 0.9550 | READY | Maintain and audit remaining side channels |
| D1 NIKL 2024 official corpus intake | 0.8798 | 0.5600 | PREPARE | Joint strategic P0, blocked from **raw use** until actual archive/rights |
| D3 source-work lineage | 0.8612 | 0.7000 | PREPARE | Authenticate real work IDs and exposed parents |
| D5 CP5 full gzip hash | 0.5795 | 0.6425 | PREPARE | Infrastructure support, not prose quality |
| D6 new state-controller training | 0.3210 | 0.4550 | BLOCKED | Defer until human evidence |

The 168 one-factor ±0.10/±0.20 utility-input counterfactuals retained D2 as top **READY** in every specified perturbation (0 changes). This does **not** prove D2 is truly optimal: the estimated multi-axis *judgment envelopes overlap*, and input dependencies, shared biases and unexplored alternative dimensions remain. D1 and D2 stay **strategic joint P0**; D1 is a preparation/acquisition effort, not an executable real-data experiment. Neither 0.9445 nor 0.785 should be interpreted as 94.45% success odds or 78.5% certainty.

## Actual development

`r5t_lira_multiaxis.py` validates **all 14 lines** of `R5T_LIRA_LINES.md`, each with `E`, `P`, FACT/INFER/PLAN/HOLD, source IDs and byte hashes; computes 7 utility and 4 support dimensions, intervals, hard gates and 168 counterfactuals. It fails closed on forged human outcomes/raw acquisition, unregistered references, missing scores or unverifiable precision.

`r5t_evaluation_contract.py` independently validates *shape only*: reader scores require separate usefulness/naturalness 1–5; source auditors require YES/NO/UNCERTAIN and source/output span witnesses for positive errors; same assessor cannot serve both roles for the same work; masked X1–X7 identity cannot include arm names or private source text. The resulting record always says `independently_verified_human_outcomes=false`. **It is not proof of randomization, independent human status, complete information parity, or fidelity truth.**

`test_r5t_multiaxis.py`: **24/24 synthetic contract tests PASS**. `R5T_AUDIT_RECEIPT.json`: actual local outputs of the multi-axis calculator and adversarial sensitivity. No generated model prose, unredacted learner source text, real NIKL data or secret blind keys are contained in this artifact.

## Future scientific decisions

1. Finish a real, reproducible blind reader and separate source auditor form; prior R5r/R5s secrecy fix must not be confused with randomized controlled study authorization.
2. Once NIKL 2024 official bytes are legitimately accessible: preserve original archive privately, inspect actual schema and license restrictions, separate expert-edited **feedback** from source-text rewrite, map work/author exposure, and accept only authenticated independent source works.
3. Before actual holdout evaluation, freeze model version, equal cost budgets, independent pilot variance, minimum meaningful effect, actual sample size, multiplicity policy and private assignment audit.
4. Judge replicated real full Korean prose against STRONG_DIRECT, STATE_AS_TEXT and EQUAL_COST_ITERATIVE. Positive/mixed/null/invalid branches remain as originally defined. **No automatic promotion to G10-P3.**

### Storage and reproducibility

Target canonical GitHub branch: `WhoSia/KSGT` / `research/g10-p2-reader-state-coupled`. Commit exclusively as `WhoSia`; never use `github-actions[bot]` as contributor. Preserve code/tests/metadata and ZIP in Drive and the decision rationale in Notion. File integrity from local ZIP is separate from independent remote-cold-download SHA. All new judgment-bearing statements in the score ledger are scored; the narrative here is an explanatory synthesis of the ledger and executed tool receipts, not a claim that every line of every historical repository file was re-scored.
