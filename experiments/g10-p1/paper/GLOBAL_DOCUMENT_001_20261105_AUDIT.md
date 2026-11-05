# KSGT G10-P1 Global Document 001 — Real 36-Output Development Pilot (2026-11-05)

**Engineering SUCCESS, scientific superiority NOT IDENTIFIED.** This is newly authored **development material**. The source works were created for this test, then exposed during analysis; they are not an independent confirmatory or natural-user dataset.

## 1. Evidence
- Trigger commit `940300b97fbe7f52dae2694226860c90b5c3c531`, [GitHub Actions #41951615788](https://github.com/WhoSia/KSGT/actions/runs/41951615788): **36/36** outputs generated, no API failures, all exactly 3 paragraph blocks by blank-line splitting.
- Models: Groq `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`.
- Three author-synthetic source works: science watershed, two-event school notice, two-person library narrative.
- Four same-source one-call arms: STRONG_ONE_SHOT, GENERIC_OUTLINE, GLOBAL_MAP, GLOBAL_MAP_ABLATED.
- Raw original GitHub artifact ID `13380997974`, sha256 `b79b3ba55de7f5e4702b4e956c1a3917a893f3481f1616ebe0e0cf18e6b0f87e`. [Research OS Drive ZIP](https://drive.google.com/file/d/1EWDXm30FMMcZgQ9g108jDBrbhuvMD9jw/view). Source facts, prompts, real Korean outputs and provider usage are preserved.
- A one-call API design isolates *extra model calls*, **not** token-length equivalence.

## 2. Provider-reported token counts (three work documents per policy)

| Model | Policy | Prompt tokens | Completion tokens | Total |
| --- | --- | ---: | ---: | ---: |
| GPT-OSS 20B | STRONG_ONE_SHOT | 1,507 | 1,105 | 2,612 |
| GPT-OSS 20B | GENERIC_OUTLINE | 1,630 | 1,200 | 2,830 |
| GPT-OSS 20B | GLOBAL_MAP | 2,045 | 976 | 3,021 |
| GPT-OSS 20B | GLOBAL_MAP_ABLATED | 2,045 | 1,091 | 3,136 |
| GPT-OSS 120B | STRONG_ONE_SHOT | 1,507 | 1,063 | 2,570 |
| GPT-OSS 120B | GENERIC_OUTLINE | 1,630 | 1,253 | 2,883 |
| GPT-OSS 120B | GLOBAL_MAP | 2,045 | 994 | 3,039 |
| GPT-OSS 120B | GLOBAL_MAP_ABLATED | 2,045 | 1,078 | 3,123 |
| Qwen 3.8 27B | STRONG_ONE_SHOT | 1,240 | 874 | 2,114 |
| Qwen 3.8 27B | GENERIC_OUTLINE | 1,342 | 876 | 2,218 |
| Qwen 3.8 27B | GLOBAL_MAP | 1,724 | 598 | 2,322 |
| Qwen 3.8 27B | GLOBAL_MAP_ABLATED | 1,724 | 661 | 2,385 |

The GLOBAL_MAP **prompt** is 36% longer than STRONG_ONE_SHOT for GPT-OSS (2045/1507) and 39% longer for Qwen (1724/1240) on the same work set. Its output is shorter (mean 488 characters vs 617 overall) but its TOTAL provider token usage is higher for every model. Thus **no lightweight computational advantage in this pilot**. The study is not prompt-token matched, so no isolated plan effect follows.

## 3. Source/prose inspections (researcher observations only)

**Watershed explainer:** All four policies in each model can produce a 3-paragraph explanation of pre/post species counts and uncertain causal attribution. GLOBAL_MAP produces a clear purpose→observations→limitations structure, but STRONG_ONE_SHOT and GENERIC_OUTLINE often do too. The 120B STRONG output introduces 'science club members collected and interpreted data at the site' though the source says investigation was conducted; this is a source-role embellishment. GLOBAL_MAP suggests 'an opportunity for students to connect field data with citizen science', similarly external rhetorical decoration. No evidence yet that global planning adds unique reader benefit.

**School notice:** GPT-OSS 20B STRONG_ONE_SHOT states that BOTH events need portal application although source permits unregistered attendance at orientation. GPT-OSS 20B GLOBAL_MAP correctly distinguishes orientation registration but claims notebook information will be announced via the portal, not stated. This juxtaposition demonstrates the core challenge: good global structure does not guarantee correct **action conditions**. Qwen GLOBAL_MAP is shorter, clearly distinguishes required lab application and optional orientation, but omits some unresolved application/preparation details. Human preferences and information-completeness judgments are unmeasured.

**Library scene:** Strong baseline as well as global planner frequently add unlicensed atmosphere; both can write three coherent paragraphs. Some outputs end with meta-explanations such as 'the relationship is not known' or 'there is insufficient evidence to interpret the scene', turning a narrative into a fact audit. A global document map must not mechanically impose a scientific limitations paragraph on creative prose. This is a **genre-function design flaw** not solved by paragraph-count compliance.

## 4. Strong novelty competition (verified links)
- [IS-CoT, ACL 2026](https://aclanthology.org/2026.acl-long.911/): dynamic plan–write–reflect and structural long-form coherence.
- [LOOM, Expert Systems with Applications 2026](https://doi.org/10.1016/j.eswa.2026.132879): local/global planning and reflective feedback.
- [Align to Structure, AAAI 2026](https://doi.org/10.1609/aaai.v40i44.41085): structure rewards via RL.
- [Korean three-stage narrative structure/style pipeline, 2026](https://doi.org/10.7472/jksii.2026.27.3.133).
- [LongGenBench, ICLR 2025](https://proceedings.iclr.cc/paper_files/paper/2025/hash/141304a37d59ec7f116f3535f1b74bde-Abstract-Conference.html).

A generic 'global plan improves Korean writing' claim lacks obvious novelty. The only plausible path is a **compact, task-dependent source-to-reader global discourse policy** with a demonstrated gain over strong one-shot and generic-outline baselines, independent human readers, and reasonable cost.

## 5. Next design correction
- Replace fixed paragraph formula with **genre-conditioned document purpose**: science = explain observation/uncertainty, public notice = decision/action conditions, narrative = witnessed scene and non-metalinguistic ending.
- Evaluate **global information dependency and reader task completion**, not just correct paragraph count.
- Compress plan prompt, then add a substantive length-matched control; run a source-work-disjoint set after freezing the architecture.
- Separate independent native reader preference from source-fidelity adjudication. No model-as-judge "human quality" claim.
- Keep Pilot001–RawSource001 as historical development, not publishable superiority.

**G10-P1 remains OPEN.** As of this pilot 196 previous real paragraph outputs + 36 new complete documents = **232 recorded outputs** with different output grains, NOT a homogeneous corpus of 232 independent pieces. Independent human preference = 0.
