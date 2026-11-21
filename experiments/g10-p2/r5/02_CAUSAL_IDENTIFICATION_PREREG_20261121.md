# R5 research unit B · Causal identification before new generation

Status: prospective protocol; NO new source items enrolled, NO provider calls claimed.

## Hypothesis
An executable, source-witnessed reader-state transition, updated only after realized Korean sentences, may improve *complete Korean texts* relative to both (i) strong direct generation and (ii) the same model supplied the same reader state as literal prompt text. The theory is falsified for practical value if there is no independently measured gain commensurate with the extra cost.

## Unit of randomization / leakage boundary
One independently sourced writing task / source work is the unit. Multiple candidate texts and raters for the same source work remain clustered. Match or quarantine common source parents, near-duplicate fact packets and prompt paraphrases BEFORE evaluation. Exposed R1/R2/R2b/R3/R4a/R4b source works are *development* and cannot be rebranded as held-out. Do not infer work disjointness from filename uniqueness.

## Competing arms (same genre, audience, source and model)
A. STRONG_DIRECT: one complete strong-model generation.
B. RICH_PROMPT: capable generic, task-appropriate instructions, no state engine.
C. STATE_AS_TEXT: complete explicit state summary supplied to identical model.
D. EXECUTABLE_STATE: same representation, same model and candidate inventory as C; the only intended difference is an externally enforced transition / bounded edit decision.
E. EQUAL_COST_ITERATIVE: same total measured model/annotator budget as D spent in simple model self-revision.
F. NO_OP_KEEP: preserve the most suitable existing source-compliant candidate, no gratuitous edit.
G. SHAM_STATE: wrong, stale or planned-but-not-realized state; negative control for causal sensitivity.

C versus D must be information matched, not merely named similarly. For any candidate state, record its source spans, actual realization spans, extraction strategy, uncertainty and token budget; the state plaintext and executable arm must receive **identical facts**. Compare one-call and equal-cost budgets separately.

## Outcomes and stop rules
Primary, jointly considered: independent reader task-usefulness and independent source-auditor fidelity. Secondary: first-edit burden, genre-specific texture, token counts, measured latency, memory and human annotator minutes. Report paired cluster-level uncertainty across source works. Don't pool repeat evaluations as independent tasks.

R5 exploratory development ends without a quality claim if source-work split is compromised, one arm receives unique factual hints, or independent outcomes remain zero. A *positive* result must survive direct and same-state-text rivals, rather than only a weak bare prompt. A *negative* result is a publishable and preservable boundary.

## Pre-registration status
The above freezes comparison logic, not an actual withheld corpus, sample size adequacy, or power. Before outcome data exist, freeze the sampling frame, exclusion rationale, source fingerprints, cost thresholds and blind-form randomization seed; public commit must precede new holdout calls.

See official G10-P2 RESEARCH_PROGRAM and R4b posthoc failure account. No AI evaluator is given human-rating authority.
