# KSGT G10-P1 R7 — Real Claim-Planning / Korean Realization Development Audit (2026-11-05)

**Disposition:** REAL_API_30_CALLS_SUCCESS / 18_FINAL_TEXTS / TYPE_GATE_6_OF_6_PARSE_PASS / CLAIM_FIDELITY_NOT_ENFORCED / SOURCE_DRIFT_OBSERVED_IN_PLAN_AND_REALIZATION / QUALITY_GAIN_NOT_PROVEN / G10-P1_OPEN.

## 1. Evidence and preregistration chronology

- R7 hypothesis and rival design was frozen in [R7_CLAIM_REALIZATION_PREREG_20261105.md](R7_CLAIM_REALIZATION_PREREG_20261105.md), source parser [r7_commitment_pipeline_v01.cjs](../r7_commitment_pipeline_v01.cjs), model execution [r7_execution_v01.cjs](../r7_execution_v01.cjs), and fixed six-work R6 cohort [r6_cohort_v01.json](../fixtures/r6_cohort_v01.json). The preregistration predates the actual live launch commit `af3da3b2bd872ada328aac1d4bf216b52290baf6`.
- [GitHub Actions real run #41983746559](https://github.com/WhoSia/KSGT/actions/runs/41983746559), job 127099556570, completed SUCCESS. Pre-call Node 22 tests **213/213 PASS**. Exactly **30/30 Groq GPT-OSS 20B API stages attempted**, 18/18 final documents generated, zero failed cells. Model temperature 0, 900 max tokens per call; actual input and completion token usage preserved per stage.
- [Original GitHub artifact 13394772430](https://github.com/WhoSia/KSGT/actions/runs/41983746559/artifacts/13394772430), ZIP 9,766 bytes, SHA-256 `d96f511be037f4b9e0b0d39a835b8a5943776980baffe5427d070e385e38d5c2`; contains `r7_output.json` 50,731 bytes, SHA-256 `0f573f68e7bdd446cf80c04e140224848ecac335263735b794b52f06c81883eb`.
- [Google Drive original raw ZIP](https://drive.google.com/file/d/1b4LFDBopZ_Z08TxV2egdRshdtu0pAEzW/view), Drive ID `1b4LFDBopZ_Z08TxV2egdRshdtu0pAEzW`. **Cold re-download byte-for-byte compare PASS:** downloaded Drive ZIP exactly matches original GitHub Actions 9,766-byte ZIP and SHA-256.
- [R7 semantic gap regression tests](../r7_semantic_gap_v01.test.cjs), added *after* real output analysis and treated as follow-up, not preregistered. Read-only GitHub Actions run [#41984063395](https://github.com/WhoSia/KSGT/actions/runs/41984063395), complete SUCCESS, **217/217 Node tests PASS**. These four tests demonstrate intentionally unclosed holes, not fixes.
- Work units are only SIX investigator-authored, previously exposed R6 development sources. Each arm gets the same exact source, facts, protected conditions and creativeLicense. R7 has no untouched external source-work corpus and no independent Korean readers or expert semantic gold.

## 2. Actual competitors and provider compute

| Policy | Final outputs | Actual provider stages | Prompt tokens | Completion tokens | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| STRONG_DIRECT | 6 | 6 | 3,262 | 1,580 | **4,842** |
| GENERIC_DRAFT_REVISE | 6 | 12 | 7,982 | 2,867 | **10,849** |
| KSGT_CLAIM_PLAN | 6 | 12 | 9,832 | 2,814 | **12,646** |

- KSGT vs **two-call generic** = `12646/10849 - 1 = +16.56%` total tokens; KSGT vs one-call strong = **+161.17%** total tokens. For two-call comparison call count matches but token budget does NOT.
- Blank-line-separated three-paragraph form compliance: **STRONG_DIRECT 6/6**, **GENERIC_DRAFT_REVISE 6/6**, **KSGT_CLAIM_PLAN 4/6**. Science LIMIT A and corridor scene KSGT final were rendered as **one** paragraph.
- The R7 typed planner generated **31 typed units** across six source works (13 SOURCE_CLAIM, 9 QUALIFIED_INTERPRETATION, 9 RHETORICAL_BRIDGE). All six plans passed reference/schema checks. That is an *operational format result*, not content correctness.

## 3. Stage-specific observed semantic and writing failures

**A. Correct plan to final prose drift.** On `NOTICE_CONDITION_A`, the KSGT plan explicitly states only `공학 실습은 금요일 오후 3시에 시작된다` and never mentions a weekly recurrence. Final prose changes it to **`공학 실습은 매주 금요일 오후 3시에 시작됩니다.`** That is a literal counterexample to preservation of planned commitments during surface realization. It also asserts a future notification process for unknown laptop requirements though the original source states only that the requirement was not yet announced.

**B. Plan labels can degrade certainty.** In `SCENE_CORRIDOR_B`, original author fact F2 states definitively that Yuna placed an umbrella by the window; the planner labels the same event as `QUALIFIED_INTERPRETATION` and says `유나는 창가에 우산을 세워 두었을 가능성이 있다.` Original author fact F5 affirmatively states Yuna picked up a paper cup; plan likewise turns this into `가능성이 있다`. This is **unlicensed weakening of asserted evidence**, not necessarily hallucination, and a key new error axis.

**C. Fact addition disguised as nonassertive bridge.** Same corridor R7 plan labels `RHETORICAL_BRIDGE` with `addsWorldFact:false` but states `태호는 게시판 앞에 서서 무언가를 확인하고 있었다.` The source says that he stood at the bulletin board and later looked at it; it does not establish that he *verified* some information. The final version repeats the unauthorized commitment. The *label* is not an entailment check.

**D. Inferences promoted into definite narrated events.** In `SCENE_UNORDERED_A`, the KSGT plan qualifies a guess that Jihyeon aimed to read as possible. The final prose asserts that she wanted to concentrate on reading and describes page-by-page reading and full immersion. None of this is a protected original observation.

**E. Coverage and prose quality.** On `SCIENCE_LIMIT_A`, R7 KSGT final includes 8/11 observed taxa and a caveat but drops important separate context including seasonal confounding; also collapses requested three paragraphs into one. Same issue with corridor scene. A formal plan may be valid yet incomplete, repetitive or poor Korean prose.

These are researcher-identified candidate source-grounding failures from direct original text read; no independently adjudicated per-sentence error frequency, independent blind reader preference or p-value is licensed. No ranking of final human writing quality follows.

## 4. Precise scientific conclusion

- The formal plan checker establishes reference membership and type-shape validity **only**. It does not test `source entails SOURCE_CLAIM`, `QUALIFIED_INTERPRETATION preserves the source's epistemic strength`, `RHETORICAL_BRIDGE adds zero propositions`, or `final document entails no claims beyond approved plan`.
- Real R7 tests show failure can occur in **both** the intermediate claim plan and the subsequent Korean realization. Therefore simply introducing a semantic-looking JSON schema does not solve the meaning/fluency generation problem.
- More elaborate schema is not automatically the answer. Strong ordinary two-pass drafting remains a real comparator at the same number of model calls and **lower observed tokens** on all six authored source works in this pilot.
- The critical mechanistic question becomes whether a *source-grounded semantic accountability method* can enforce those four cross-stage relations without merely outsourcing semantic checking to another expensive LLM call, and whether any such method improves naturally read Korean prose rather than producing literal sentence inventories.

## 5. Decision and next gates

G10-P1 remains OPEN; R7 development hypothesis **strong guarantee REJECTED by constructive counterexamples**. Do not increase G10 cumulatives as though 18 model completions were independent human documents; report provider stages separately. Collect independent Korean source-work-disjoint materials and blinded native readers; compare quality and cost against ordinary draft/revise (not only one-call direct). Source-meaning adjudicators must rate incorrect weakening, strengthening, invention, omission and permissible rhetorical elaboration separately. Retire claim-token schema complexity if no reader-level gain survives a compute-aware comparison. No write privileges for GitHub Actions, no github-actions[bot] commits.

**Evidence status:** Real provider generation and source-accountable plan pipeline PASS; **semantic proposition and Korean quality claims HOLD**, observed local counterexamples; human preference = 0.