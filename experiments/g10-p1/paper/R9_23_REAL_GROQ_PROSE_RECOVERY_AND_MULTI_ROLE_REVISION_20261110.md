# KSGT G10-P1 — R9.23: Original Groq Prose Cold Replay and Real Shared-Draft Multi-Role Revision
**Research date:** 2026-11-10 KST. **Classification:** exposed author-written development work; actual Groq outputs; **no independent human preference or semantic gold**. Stage remains **G10-P1 OPEN**.

## The two parts of R9.23
1. **Historical original-byte replay (locally executed):** six original archived raw ZIPs were opened and SHA-256 calculated directly, not inferred from reports. R5, R6, R7, R8, original 36-document global pilot, and R9.14 original actual-Groq cohort. New code `r923_replay_real_outputs.py` plus five Python tests produced a private no-raw-prose diagnostic receipt. The 36 global-doc rows are precisely 3 source works × 3 LLMs × 4 arms, with 36 nonempty three-paragraph actual responses.
2. **New real role-separated Groq generation:** `r923_actual_role_pipeline_v01.cjs` produces for each of the 3 *already exposed* global-dev source works: (a) RICH_DRAFT, (b) GENERIC_REVISION of the exact draft, (c) unverified CONTEXT_DIAGNOSIS by the LLM, (d) CONTEXT_REVISION of that exact original draft with the critic's suggestions as optional hints. Both final editors see the same complete source and original draft. This is not autonomous GPT fine-tuning, and the critic is NOT an independent semantic adjudicator.

## Precise historical count reconstruction
The existing [CURRENT_STAGE.json](https://github.com/WhoSia/KSGT/blob/main/CURRENT_STAGE.json) records **295 historical model-produced texts** partitioned as **196 single-paragraph output occurrences + 63 R5–R8 multi-paragraph final development texts + 36 global-document completions**. This is an inherited tally, **not 295 independent works**. In R9.23, the six ZIPs were freshly read: R5 top-level 9 records; R6 18; R7 18 final rows but **30 provider calls**; R8 six shared-draft source records and **18 provider calls**; global 36 output rows; R9.14 15 real completions. Thus the four R5–R8 rounds recorded 75 model calls and 63 final texts. The individual original 196 single-paragraph output bytes were **not** fully reconstructed in this turn, though the current state records the count. R9.14's 15 completions and R9.23's new completions are tracked separately; no additive independent-N claim.

Original verified ZIP SHA-256:
- Global 36: `b79b3ba55de7f5e4702b4e956c1a3917a893f3481f1616ebe0e0cf18e6b0f87e`
- R5: `6545b0bbc6de471323e7f90eee712a977d015fbbf739cac3c934ebaf51d2cf9a`
- R6: `80695e18ae9c48b08b8a0e9c3564992c65222dc3bbb1905c84f8c7ddcbdb5e44`
- R7: `d96f511be037f4b9e0b0d39a835b8a5943776980baffe5427d070e385e38d5c2`
- R8: `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9`
- R9.14: `1f7101780a804743d341fe373b63dceb4664eff9176d423de3b48dcc49d2f940`

## Global36 exact descriptive diagnostics, NOT a quality judge
All four policies were used for three source works and three models. Over 9 actual documents per policy:
| Policy | Total provider tokens | Mean text characters | Documents containing narrow formulaic reader-direction phrases |
|---|---:|---:|---:|
| STRONG_ONE_SHOT | 7,296 | 616.7 | 3 |
| GENERIC_OUTLINE | 7,931 | 669.6 | 2 |
| GLOBAL_MAP | 8,382 | 488.4 | 1 |
| GLOBAL_MAP_ABLATED | 8,644 | 523.1 | 4 |

Surface matches include `염두에 두어야`, `권장합니다`, and `확인해 주시기 바랍니다`. A phrase hit can be perfectly appropriate in a particular genre; neither hits nor lengths establish relative Korean prose quality. In the global school-notice source, original STRONG_ONE_SHOT (20B) incorrectly implied both activities require advance registration, whereas the source expressly permits observing the orientation without prior application. In the global scene, some variants close with a reader-visible argument about unknown feelings instead of an actual scene ending. This is a specific source-vs-output development observation, not a general hallucination prevalence rate.

## R9.23 actual Groq experiment: 13 attempts for 12 completed stage slots
Provider: Groq `openai/gpt-oss-20b`, `temperature=0`, original author-exposed `global_document_dev_v01.json` as source. First [read-only GitHub Actions 42715376704](https://github.com/WhoSia/KSGT/actions/runs/42715376704) passed **9/9** model-role tests but the water explanatory *critic* response hit `finish_reason=length`: **11 provider attempts, 10 generated responses, one incomplete and one dependent stage skipped**. The raw failed-run artifact remains preserved. An independently tested (`14/14` combined tests) cold-resume module `r923_resume_failed_stages_v01.cjs` read the immutable failed artifact, SHA-verified every source and completed draft, and reran **ONLY the missing critic and blocked contextual edit**. [Final read-only Actions 42715847103](https://github.com/WhoSia/KSGT/actions/runs/42715847103) **SUCCESS**. It preserved the first incomplete attempt, reporting **13 actual calls in total, 12 successfully completed stage slots**. No successful stage was rerun.

Cumulative provider-reported token usage including the failed/truncated attempt: **17,164 tokens**; of these **1,885** were spent on the incomplete critic response. The 3 source works each have one draft, one generic revision, one model critic, and one context-conditioned revision. There are **9 prose outputs and 3 model critiques**, not 12 independent full Korean prose works. Independent readers 0; semantic gold 0; new parameter updates 0.

| Source work | Draft chars | Generic revised chars | Critic-conditioned revised chars | Generic edit tokens | Critic + contextual edit tokens |
|---|---:|---:|---:|---:|---:|
| DEV_WATER_01 | 720 | 656 | 712 | 1,281 | 4,173 |
| DEV_NOTICE_01 | 492 | 404 | 496 | 930 | 2,677 |
| DEV_SCENE_01 | 519 | 403 | 312 | 1,015 | 2,905 |

The critic-conditioned pipeline consumes ~2.9–3.3× the edit-stage total tokens of generic editing in these three cases, **excluding the common original draft and the water retry's wasted 1,885 tokens**. The model-only analysis typically left the science and notice draft almost unchanged, but radically compressed the scene. No independent preference evidence justifies this cost. One model critic incorrectly characterized the original `비가 오는 오후` versus draft `비가 내리는 오후` as an unsupported continuous-rain inference, even though the author source itself explicitly says rain continued outside; the critic must not be treated as a semantic oracle.

### Strong concrete failure
In scene prose, the rich initial draft introduced `책 냄새`, an unsupplied atmospheric cue, as well as subjective imagery. Generic editing shortened the passage while retaining many atmospheric additions; contextual editing removed much of the embellishment but reduced 519 characters to 312, potentially flattening the narrative. This is precisely the **source fidelity vs sentence rhythm tradeoff** observed in the author's earlier R9.14 blind reading, but here human preference is entirely unmeasured.

## Why this architecture is not yet a good Korean generator
A costlier LLM critic often repeats the source rather than building a useful compact discourse state, and can issue wrong micro-claims. It is also trained on the same model family and cannot serve as independent quality gold. The editor receives unstructured critique prose and no compact memory of which entities, action obligations or uncertainty clauses are reader-salient. Fixing those defects requires actual error-specific mechanism changes, not another generic 'verify source' instruction.

## Immediate development roadmap
- Replace verbose model critique with a small **structured claim/reader-need/transition diff** that can be rejected if not grounded, and selectively condition the editor only on identified issues. Include a no-critique/no-change possibility.
- Make cost-adjusted control explicit: rich initial draft alone, generic one-call revision, same-call-budget compact context revision, and two-call critic→revision. Record prompt and completion tokens and errors.
- Preserve different genre endings (scene close, action-oriented notice, evidence-limited science) and prevent generic compliance language from appearing in reader prose.
- Preserve original 196 single-paragraph archive search as a separate ancestry task. Do not silently assert source-work independence.
- Use the R9.23 actual passages for internal diagnosis, not newly frozen holdout or synthetic human preferences. Eventually recruit independent readers and separate actual source support from fluency preference.

## Canonical artifacts and limits
- [Role-separated actual Groq runner](https://github.com/WhoSia/KSGT/blob/main/experiments/g10-p1/r923_actual_role_pipeline_v01.cjs)
- [Exact resume tool](https://github.com/WhoSia/KSGT/blob/main/experiments/g10-p1/r923_resume_failed_stages_v01.cjs)
- 9 + 5 = 14 Node tests (first workflow + resume workflow), Python archival audit 5/5 local PASS.
- Original and recovered raw responses are archived privately through GitHub Actions, not committed as a public data corpus.
- **G10-P1 OPEN. No quality superiority claim, no LoRA/DPO/SFT.**
