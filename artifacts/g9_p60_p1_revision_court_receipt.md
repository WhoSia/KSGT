# KSGT G9-P60 P1 — Provenance-Bound Revision Evidence Court

**Date:** 2026-10-09. **Stage:** G9-P60 officially OPEN. P1 is an internal engineering/research phase, not a separate generation, new P-stage or predecessor closure.

## Source authority: historical, not an unseen experiment
The upstream [P60 P0 source program](../experiments/g9-p60/RESEARCH_PROGRAM.md) and [historical P53 hash/paragraph registry](../experiments/g9-p60/revision_evaluation_v01.cjs) identify **three source ZIPs; 12 actual earlier Qwen3 generated drafts; six source briefs; 22 original generated paragraph hashes**. The original three source ZIP bytes were audited in the previous P60 pass, **not re-downloaded/rehashed in P1**. All six source components have historical exposure; `reserved_reaudit` is NOT a fresh holdout. Two assistant-derived candidate edits share **one** actual EX09/K_TYPED_PLAN paragraph; no actual independently validated successful revision or independent Korean human writing preference exists.

## New implementation
- [Node provenance/source graph and revision court](../experiments/g9-p60/revision_court_v02.cjs). Reads the actual checked-in P53 hash table and two provisional-edit records, validates parent paragraph hash/sourceWork/sourceComponent/split consistency and checks transitive cross-source links. A deliberately declared new cross-brief same-source edge from EX09 to EX10 invalidates the historical train/dev partition. **An unrecorded near duplicate cannot be assumed absent.**
- Independent [Python metadata audit](../experiments/g9-p60/revision_audit_v02.py). Rejects split escape, forged authorship, promoted human/semantic gold, unacknowledged epistemic attribution risk, and bad hash. Consumes `node revision_court_v02.cjs --emit-revisions` JSON in the read-only CI workflow.
- [Read-only GitHub Actions workflow](../.github/workflows/ksgt-g9-p60.yml) retains old P0 regression and adds the Node plus Python steps. **No workflow success receipt retrieved.**

## Evidence distinctions
- `SOURCE_LABEL_REMOVAL`: removes source labels, while its source-fact/epistemic status remains HOLD: removing an attribution can decrease epistemic correctness even when it feels stylistically smoother. **No documented measured improvement**.
- `SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT`: intentionally changes `두 상자` to `세 상자` relative to a previously generated draft. The difference is a **draft-relative mutation**, not a separately validated underlying source fact contradiction. Stylistic and truth axes cannot be collapsed.
- Any declared outside evidence identity is checked for *binding/schema* only; this does not itself authenticate reviewer identity or factual truth. Current schema does NOT promote arbitrary self-reported reviewer ID to PASS or human preference.

## Execution verification receipts
- **V8 reference regression:** fetched exact GitHub JS source bodies for P0 and P1 and checked-in provisional-edit JSON; executed both modules' exported tests in a JavaScript V8 harness with explicit Node-standard-library mocks. P0 test PASS (12 drafts / 22 paragraphs / six source components / two provisional edits); P1 test PASS (eight adversarial cases after source-work-ID forgery guard, transitive cross-brief contamination and source/human evidence promotion). This is NOT a native Node process or GitHub Actions receipt.
- **Python independently reproduced logic execution:** a matching Python audit over reconstructed P1 JSON from the original hash ledger yielded `audit PASS` and rejected **five** negative controls. This is a local logic test, not evidence that the exact checked-in Python file was executed on its genuine Node-produced JSON bytes.
- **New human writing preference scores:** zero. **Independent semantic acceptance of edits:** zero. **Unseen native Korean heldout source works:** zero. **Newly trained model comparisons:** zero. **Friend server access:** none.

## Formal comparability, omitted-data bound
Proposed future target for every genuinely independent source work is the joint event:
`semantic admissibility AND named-defect repair AND no collateral harm AND genuine blind Korean reader preference`. Do not condition only on approved text and omit failed texts. Among n fixed source works, if w independently verified joint wins, l independently verified losses, and n-w-l unresolved, only the finite-set interval `[w/n,(n-l)/n]` is warranted; it is **not** a confidence interval. With today's six exposed source components and no human data, the interval is vacuous `[0,1]`.

## Stop and next priority
Do not present the original draft alternatives B/U/K as human-edited before/after pairs. No group-level comparison with six retrospective, previously exposed sources can establish native Korean public preference. First collect source-rights-verified new documents *and a factual/epistemic witness*, then compare `NO_EDIT`, minimal source-aware edit, ordinary polish and P59 discourse-state guided edit with same source/compute constraints and blinded reader judgments. Measure source admissibility and conditional reader preference **separately**, including undecided outcomes and source-document cluster effects.

**Disposition:** P60 P1 IMPLEMENTATION + LOCAL LOGIC TEST PASS; GITHUB REMOTE CI/HUMAN CALIBRATION/REAL REPAIR SUCCESS HOLD. G9-P58 remains last formally closed research stage; G9-P59 is inherited without cosmetic closure.
