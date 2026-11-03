# KSGT G10-P1 v0.3 — Contextual Korean Realization & Actual-Output Audit

**2026-11-03 / Engineering and scientific design only / Human preference and performance gain unmeasured.**

## What changed from v0.2

v0.2 encoded author-given discourse move labels, source-licensed rhetorical relations, epistemic status and conservative fact ordering. It did not propose any Korean realization decisions.

v0.3 adds a **fifth generation arm**, `KOREAN_REALIZATION_V03`, which combines the v0.2 plan with a cautious Korean realization hint stream:
- topic continuity candidate given a repeated **author-labeled referent**;
- possible zero argument/ellipsis only when the same referent appears consecutively and there is one author-labeled referent in local history;
- withholding the omission suggestion if multiple locally active labeled referents exist;
- retaining author-supplied relations rather than inventing temporal/causal/contrastive edges;
- warning that hints are uncertain and are **not** linguistic ground truth or semantic-validity labels.

The implementation uses literal referent labels and shallow history. It cannot resolve coreference, understand focus or claim grammatical/natural Korean correctness. These heuristics may produce overly explicit, stiff or unnatural prose; that negative result would be informative.

### Comparison arms (identical source and author-supplied annotations)

| Arm | Purpose |
| --- | --- |
| DIRECT | Minimal generation, input facts and same author annotation payload |
| RICH_PROMPT | Strong Korean/discourse instruction, same source facts and annotations |
| DISCOURSE_GUIDED | Coarse three-part fact planning (v0.1) |
| LICENSED_PLAN_V02 | Author-provided rhetorical and epistemic plan |
| KOREAN_REALIZATION_V03 | v0.2 + conservative author-label-based Korean topicality/ellipsis hints |

The v0.3 condition can be **longer** and may be more computationally expensive; without prompt-length and quality matching, no causal claims about lightweight benefit are licensed. All five arms run in a seeded per-source order; results are grouped by source work. The three author-created source briefs form 15 assigned *development* conditions, not 15 actual generated outputs. Source-work-disjoint confirmatory sources are absent.

### Newly implemented tools

- [Korean realization v0.3](../korean_realization_v03.cjs) and [five-arm paired runner](../paired_runner_v02.cjs).
- [Numeric surface anomaly diagnostic](../source_surface_audit_v01.cjs): finds literal unsupported numeric forms but cannot certify or refute Korean semantics; misses spelled-out numerals and recognizes harmless reformatting as anomalies.
- [Output inspection worklist](../output_inspection_v01.cjs): maps all condition outputs to the source work, including errors or missing generations; emits only hashes and flags, **not raw generated paragraphs**.
- [Cost audit](../cost_audit_v01.cjs): needs **user-supplied** token prices and actual provider usage; no invented default cost or zero-imputation of missing usage.
- [Local report CLI](../summarize_run_v03.cjs): merges source-surface diagnostic and cost data and never publishes raw prose. All source/output bytes remain private.

### Execution sequence

```bash
# Unit tests, with no network or model calls:
node --test experiments/g10-p1/*.test.cjs

# Five-arm prompt dry run on three authored synthetic development briefs:
node experiments/g10-p1/paired_runner_v02.cjs --dry-run \
  --input experiments/g10-p1/fixtures/cohort_v02.json > /dev/null

# Actual generation: explicitly authorized API service/account and live model required.
# Pass API credentials only through secure environment variables; never commit them.
node experiments/g10-p1/paired_runner_v02.cjs --run \
  --input LOCAL_PRIVATE_COHORT.json --model PROVIDER_MODEL_ID \
  --output LOCAL_PRIVATE_GENERATIONS.json

# Actual-output analysis once results exist:
node experiments/g10-p1/summarize_run_v03.cjs \
  --cohort LOCAL_PRIVATE_COHORT.json \
  --generation LOCAL_PRIVATE_GENERATIONS.json \
  --output LOCAL_PRIVATE_UNRATED_DIAGNOSTIC.json
```

Actual generation is not run in read-only CI and requires explicit authorization and provider credentials. No external computational charges were initiated during this development.

## Research questions now directly testable

**R1: Added discourse structure.** Does v0.2 add genuine Korean passage coherence beyond rich prompting that receives the same author-provided source annotation? Without superior blind-reader outcomes there is no positive claim.

**R2: Korean realization mechanics.** Does v0.3's explicit context-dependent topicality and ellipsis help, hurt or have no effect relative to v0.2? Check natural Korean referential continuity, overly explicit topic markers, repetitive syntax, unnatural ellipsis and ambiguous antecedents *in actual prose*.

**R3: Source evidence boundary.** Do the hinted structures spuriously add causation, numbers, epistemic certainty or reader-insulting overexplanation? The numeric surface diagnostic prioritizes inspection, not automatic semantic judgment.

**R4: Efficiency.** Is observed reader quality higher at a comparable total model-call/token budget? A longer planning prompt may invalidate a lightweight cost hypothesis. Include annotation labor as a future operational cost.

## Abandon/revise criteria

- If direct and rich prompts are equally good and cheaper, **remove** the extra plan, don't write an elaborate selection-policy theory to reframe failure.
- If human readers dislike the stilted language suggested by explicit structure, test weaker or implicit planning and document the failure.
- If model/provider outputs are not available, report only engineering progress and do not insert synthetic results into a journal draft.
- Do not claim that lexical number flags or human correction distance measure actual semantic integrity or reader naturalness.

## Scientific status

G10-P1 remains **OPEN**. Historical G9 and G8 assets are background and regression sources, not prospective human preferences or an unseen holdout. **No newly measured superior Korean prose, no independent Korean human ratings, and no measured lower inference cost** as of this protocol.