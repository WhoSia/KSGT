# KSGT G10-P1 — R4 Model/Reader Readiness Audit, 2026-11-05

**Scientific status: OPEN / READINESS-PARTIAL / NO GENERATION OR HUMAN SUPERIORITY CLAIM.**

## 1. Current repository and remote verification
- Prior R3 exact HEAD recorded as ead59c1237539492c59d00c4be77f87059d20047 before this R4.
- GitHub combined commit statuses returned an empty status list, and the commit-to-workflow lookup returned no runs. These endpoints are not sufficient to conclude the push-triggered Actions workflow failed or succeeded. **R3 remote CI remains NOT VERIFIED.**
- Existing G10 workflow is read-only (contents:read), executes node --test experiments/g10-p1/*.test.cjs, no commits or automated pushes.
- R4 new files were compiled and executed locally in **Node v22.16.0**. Ten test cases all passed (10/10); both local Git blob SHA-1 values were read back as exact matches to GitHub blobs:
  - r4_evaluation_gate_v01.cjs: 21389d27818261be4db46169d8dc07bee0ffc1ef
  - r4_evaluation_gate_v01.test.cjs: 85161425c32f88f98398dc2d039b82019e9c1617
- The test suite uses explicitly fabricated ballot inputs to inspect error handling; **no actual human observations** were collected.

## 2. Development materials and referential integrity
- [R4 evaluation code](../r4_evaluation_gate_v01.cjs) and [ten Node tests](../r4_evaluation_gate_v01.test.cjs).
- [R4 source-work manifest](../fixtures/r4_exposed_development_manifest_v01.json) freezes exactly 3 prior author-synthetic development works, one order-eligible and two no-intervention works. It expressly marks external source disjointness false.
- [R4 reader question development fixture](../fixtures/r4_reader_tasks_dev_v01.json) contains 10 Korean reader-task questions: school participation/eligibility (4), scientific data and inference (3), narrative facts/explicitness (3). All source-work IDs and nine explicit fact-ID anchors were independently checked against GitHub's committed source facts. The tenth, L3, is a whole-source absence question; its status depends on a complete source packet rather than a single fact ID.
- **All ten questions are author-authored, development-exposed and NOT independently validated comprehension gold.** Answer keys must never be shown to blind readers before they answer; source-fidelity adjudication is a separate lane.

## 3. Fundamental identification: application coverage and overall effect
Let E_i denote whether an order-only graph proposal changes the source-order prompt for source-work i *before observing a model output*. Let Y_i(1),Y_i(0) denote a normalized independent reader outcome under graph order and source order. For an identical input prompt in E_i=0 works, assignment does not change the outcome distribution, assuming both experimental arms share the model, decoding and environmental process. Hence the all-work average causal effect obeys

  Delta_all = Pr(E=1) * E[ Y(1)-Y(0) | E=1 ]

under these assumptions. This statement refers to the **order-only proposal intervention**; it is not a claim about richer graph reasoning. If Y lies within [0,1], the absolute all-work effect cannot exceed Pr(E=1). Within these **three exposed authored development works**, Pr(E=1) as an empirical work fraction is 1/3. That 1/3 is not a population estimate, a general Korean-document bound or evidence of reader benefit.

A treated-only evaluation might estimate conditional-on-eligibility performance but misrepresent application scope. Primary reporting must include unconditional work-level effects, eligible subset effects and eligibility coverage. If an output is simply forced by a plan, output quality can worsen even if formal edges are obeyed.

## 4. Blind reader and source-fidelity separation
Reader evaluation: randomly assign anonymous A/B documents within same independent source work; ask task questions and separate holistic naturalness preference. The reader sees purpose/audience and document, **not original fact key or policy identity**. Record ties and nonresponse; don't treat one reader seeing many models of the same source as many independent sources.

Source-fidelity: independently inspect explicit contradiction, fabricated eligibility condition, important omission, inference strengthening, acceptable elaboration and uncertainty; require grounding to the source facts. A mechanistic order pass does NOT equal semantic pass.

R4 ballot validator enforces source membership, allowed arms, blinded indicator, a declaration of independent reader, no duplicate (reader, source-work, unordered comparison pair), and preserves ties. Its reader independence marker is **self-reported metadata, not identity or independence certification**; independent reviewer recruitment and blinding execution require real process controls.

## 5. Strong baseline and matched-budget gate
Before attributing an improvement to external planning, compare:
1. Strong direct one-call (same full facts/edges).
2. Direct prompt that explicitly reasons about the same edges.
3. Graph order with exactly matched source/instruction where only fact-ID proposal order changes.
4. A length/token placebo where possible, alongside exact provider prompt+completion token and latency receipts.
5. No-edge and already-preordered negative controls, plus narrative examples in which rigid chronological order may hurt.

The R3 two-arm order-only test is not a replacement for strong direct and explicit-edge policy baselines. Identical characters do not guarantee identical provider tokenizer tokens. Do not claim matched compute until tokenizer/provider measurements.

## 6. Novelty and go/no-go
Graph planning and document structure are prior art (IS-CoT, Disco-RAG, Align to Structure); a Korean-language graph preflight alone has no demonstrated scientific novelty. G8-P2.6 teaches that safe abstention can coexist with failure of standalone writing utility. The responsible next move is **actual Korean model outputs** with transparent provider receipt and source-disjoint reader-task evaluation, not more layered contract-building.

**R4 gate verdict:**
- Engineering/Node integrity: PASS for new 10 tests, exact byte readback.
- Source-work coverage and question-fixture referential integrity: PASS for exposed development material only.
- R3 push-triggered remote CI: UNVERIFIED.
- New model outputs: ZERO.
- Independent Korean human preference and task-comprehension outcome: ZERO.
- Statistical effect / causal superiority / new paper claim: HOLD.
- Stage: G10-P1 OPEN.

**Next:** First verify a real provider execution pathway and obtain budget-matched 3-arm/2-arm paired outputs; then freeze genuinely independent source works and collect independently blinded Korean reader answers. Stop expanding the graph mechanism if strong direct prompting has comparable task accuracy and lower cost.
