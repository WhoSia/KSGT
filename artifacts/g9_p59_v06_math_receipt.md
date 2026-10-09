# G9-P59 v0.6 — Mathematical Intervention Verification

Date: 2026-10-09. Classification: LOCAL_TOY_ORACLE_PASS / NATIVE_KOREAN_HUMAN_MODEL_CI_HOLD.

## Theory
Freeze source S, intended meaning M and candidate surfaces. Intervene on a **model-estimated** referent distribution B, not on actual reader mental state. Idealized losses L(KEEP)=-log B(target), L(EXPLICIT)=c, c>=0, imply EXPLICIT iff B(target)<exp(-c). For c=0.4, boundary 0.6703200460356393.

The equal-entropy mirror example B1=(.8,.2), B2=(.2,.8) has identical entropy but, for fixed target=first group, the ideal toy prefers KEEP under B1 and EXPLICIT under B2. This refutes scalar entropy as sufficient for this *toy target-aligned choice*, not any general Transformer competence.

## Verified execution
- [Standalone Node v0.6 oracle](../experiments/g9-p59/intervention_v06.cjs).
- Actual local Node v22.16.0 `test: PASS`, checks normalized belief, target membership, threshold switch, equal-entropy witness, source/message invariant, referent rename invariance, null-distractor invariance and invalid-input failures.
- Local Git blob SHA-1 of the final revised file: `9ef18febe1d595b9ec0aa519dc2f8e1fddf3a50b`; GitHub blob SHA verified equal.
- [Bridge](../experiments/g9-p59/intervention_bridge_v06.cjs) attached to 32 previously constructed v0.5 rows, but **bridge runtime/remote CI result NOT independently verified** at receipt time.
- [Read-only CI workflow](../.github/workflows/ksgt-g9-p59-v03.yml) invokes both tests; do not conflate workflow presence with an actual successful run.

## Authority and future discriminator
These are authored thought-experiment probabilities and costs. No independent true reader belief, observed writer choice, natural-language general semantic entailment, trained neural architecture, model optimization or causal performance benefit was measured.

Fair prospective architecture study: matched source/evidence access, equal compute/data budget, same writer meaning and frozen output options, evaluate input sensitivity plus actual reader comprehension and writer KEEP/EXPLICIT/RESTRUCTURE preferences. Holding out four synthetic scenes within a single construction template does not constitute an independent native Korean evaluation.

G9-P59 remains OPEN, G9-P58 latest CLOSED. No friend server used. No Actions author commits.
