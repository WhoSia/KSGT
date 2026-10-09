# G9-P59 internal §v0.9 — Evidence-Bounded Korean Writing Benchmark Receipt

Date: 2026-10-09 Asia/Seoul. **Not a new P-stage.** Current authority: **LOCAL_SYNTHETIC_CONTRACT_PASS / KOREAN_HUMAN_WRITING_PREFERENCE_UNOBSERVED / REMOTE_CI_UNCONFIRMED**.

## Research objective restored
The final KSGT target is high-quality Korean writing (source-faithful meaning, reader comprehensibility, discourse organization, naturalness, register and useful edits), **not AI-detection evasion**, next-token prediction for its own sake, or an abstract memory contest. P59 internal §§v0.7–v0.8 remain necessary-capacity/invariance probes only; no Transformer/SSM superiority follows.

## Reproduced exact repository sources
- [dataset_v05.cjs](../experiments/g9-p59/dataset_v05.cjs): Git blob SHA-1 `baca36a026fd47cfacc9bb2059520acd45c17d14`.
- [writing_benchmark_v09.cjs](../experiments/g9-p59/writing_benchmark_v09.cjs): Git blob SHA-1 `c9b06bec09958600228edaf1745ee4426ec45088`.
- Each local file's `git hash-object` matched the GitHub connector's readback SHA exactly.
- Node.js v22.16.0; no server, GPU, model training, external dataset downloads, package installs or external judge calls.

## Actual local execution
```
node experiments/g9-p59/dataset_v05.cjs
PASS 32 authored rows across 4 synthetic scene families (dev 16, validation 8, synthetic_holdout 8)
node experiments/g9-p59/writing_benchmark_v09.cjs
PASS 32 tasks x 4 candidates = 128 closed-subset probes:
  STRUCTURAL_PASS = 48
  HOLD            = 48
  REJECT          = 32
  independent Korean-human quality scores = 0
```

The regression initially **FAILED** because a Korean subset regex incorrectly required a blank before `명`; all 32 intentionally altered quantities went to HOLD instead of REJECT. This defect was corrected in commit `9cd398d3d02fd6c4203fd8e47dcf1c816437343d`, then the exact committed code was reproduced and passed. The failure and repair are part of the audit, not erased.

## Critical distinction
A closed-template structural pass is not evidence of independently verified semantic entailment, idiomatic Korean, human preference or model improvement. `KEEP` in a competing reader-state case is HOLD; freely restructured sentences remain HOLD; known subset-count mutation is rejected in the exact defined template; unknown surface forms are not automatically considered wrong.

Never assign a quality winner on the basis of these 128 outcomes. The benchmark deliberately returns `NO_HUMAN_QUALITY_RANK` for structurally comparable texts and rejects ungrounded declarations of `claimedHumanGold`. Candidate scope is limited to authored Korean partitive cases. **The other three proposed writing task families have not yet been built or human-validated.**

## Literature and evidence ledger
The cumulative [THEORY_V06.md §v0.9](../experiments/g9-p59/THEORY_V06.md) indexes source-backed WritingBench, SummEval, ACES, EditEval, RARR, G-Eval, KoSEnd, KoGEM, GOLEMcoref and KLUE. It gives each a task/language/rights/annotation authority ceiling. No external raw data or original human annotations were imported; their contents/labels have **not** been used to validate this benchmark.

## Future falsification
1. Test actual Korean human-evaluated ending naturalness against critic behavior without conflating sentence form and whole-passage preference, after license review.
2. Establish native source-disjoint paragraph and revision pairs, blinded/paired where possible, preserving provenance and unresolved disagreement.
3. Measure axes independently and use Pareto/partial identification; no global 'humanlike' scalar based on template accuracy.
4. For any neural claim, compare truly trained, information-matched Transformer, selective SSM, hybrid and entity-memory policies and measure all real memory/compute side channels.

**P59 OPEN. P58 latest CLOSED. GitHub Actions read-only workflow committed; remotely successful run not confirmed by status endpoint.**

## Independent quality-order guard (2026-10-09)
- [evidence_order_v09.cjs](../experiments/g9-p59/evidence_order_v09.cjs), exact Git blob SHA-1 `47ec9f4b0248be427c09dde42ff83a2f297e195c`, locally reproduced in Node.js 22.16.0.
- Real local output: `PASS`, interval examples=5, judge-order canaries=2. Robust coordinatewise partial dominance and demonstrable tradeoffs are distinguished from overlapping/missing evidence; reversing judge candidate order exposes a positional choice flip, but even a stable LLM judge is **NOT_IDENTIFIED** as human preference.
- The first tradeoff example failed due to equality at a strict interval boundary. The fixture was repaired (`[0.5,1.5]` rather than `[1,2]`) and re-executed. No actual human score intervals were collected; test data are **mathematical canaries only**, not measurements.
