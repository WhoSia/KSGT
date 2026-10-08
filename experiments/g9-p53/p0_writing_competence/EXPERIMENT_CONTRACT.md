# G9-P53 · P0 — Capable-Model Korean Writer Comparison

**Status: PRE-RUN INSTRUMENT / NO MODEL OUTPUTS / NO HUMAN RATINGS.** This is a companion experiment charter, not a P54 stage or a claim that typed plans outperform plain plans.

## Scientific target
Test whether a lightweight KSGT discourse/realization intervention improves complete Korean writing over an *adequate frozen* pretrained model, under unchanged source facts, rather than optimizing an internally constructed grammar benchmark.

## Arm contract
- B: original Korean task + identical source facts, without added planning scaffold; confirm the model can write coherent, task-faithful prose before any other claim.
- U: same facts and planning information, supplied as untyped Korean prose.
- K: same facts and planning information, supplied as a typed KSGT discourse/reference/meaning plan.
- Same model checkpoint, backend revision, decoding budget and source snapshot across arms. U and K are **representation/prompt compound differences**, not an isolated formal-theory causal effect. Document-level unit; counterbalance presentation order and blind reader labels when a reader study is actually authorized.

## Gates and failure conditions
1. Pin checkpoint blob SHA, model license, inference backend commit, decoding settings, run order, per-prompt hashes and cost accounting before outputs. Failing to pin is INSTRUMENT_HOLD.
2. Inspect B for source fidelity, coherent Korean paragraphs, genre alignment, formatting and epistemic limits. Inadequate B is MODEL_FLOOR_HOLD; do not attribute the result to KSGT.
3. Only after the model clears the competence gate, compare U/K over source-matched documents. Mechanical string matches are diagnostics, **not** independent semantic verification.
4. Meaning preservation is a hard non-compensatory gate; separately report naturalness, repetition, register, productive diversity, reader revision actions and compute/token cost. An LLM judge does not substitute for independent writing evidence.
5. Current six synthetic source briefs and 18 B/U/K prompts developed offline are DEVELOPMENT ONLY, never pristine confirmatory holdouts. No restricted NIKL raw text, owner writing, or private source bytes go into public CI.

## Lightweight design and research administration
Keep one repository main branch with logically separated source directories. Add only read-only GitHub Actions. Prioritize targeted source slices rather than creating large new datasets. No github-actions[bot] authored or committer commits. Preserve prior KRC v0.6 terminal claims and keep G9-P53 OPEN.
