# KSGT G10-P1 R9.15 — Reader-first Korean prose harness and corpus intake

**Date:** 2026-11-09. **Stage:** offline implementation and source reconnaissance, not model fine-tuning, not a new generation experiment.

## Why change
The R9.14 exposed-development Groq pilot yielded 15 genuine Korean paragraphs, three reader-facing blinded contrasts, and one reader's mixed judgments: a strong rich baseline was preferred for reading naturalness in science and strongly favored for the notice, while the plan-plus-realization arm better preserved an event sequence in the scene. This does not identify a population-level effect. In one scene, a condensed study-facing source summary omitted facts present in the true input; exclude such false mismatch annotations.

The study must stop conflating instruction compliance with reader-quality. Instead of adding more audit rules or claiming a newly trained model, we now develop several alternate generation *behaviors* that retain the full authoritative source but differ in reader salience, internal discourse planning, and contextual rhythm. Their prospective results remain unknown.

## Actual implementation
- `r915_reader_first_harness.cjs`: four prompt profiles, shared authoritative source, source/prompt SHA-256 receipts, genre-reader-purpose awareness, explicit no-internal-checking-language boundary, diagnostic-only marker patterns, no network calls.
- `r915_data_custody.cjs`: local NDJSON adapter requiring an independently verified use-rights receipt before intake; blocks source-work leakage across development/calibration/heldout partitions, disallows training when only research permission is verified, and emits hashed metadata without raw paragraphs. The `AUTHORIZED_*` fields are **local researcher assertions**, not verified licenses by this code. Operate only after checking actual terms and recording receipts; no bypass of provider authorization.
- `R915_READER_SIGNALS_20261109.json`: anonymized, research-exposed qualitative feedback; no invented numerical reader scores, no personally identifying reader details, no claim of improvement.
- `R915_DATA_CANDIDATES_20261109.json`: public metadata-only candidate census; no external dataset bytes have been downloaded or ingested.

## New corpus leads
The National Institute of Korean Language lists 2025 writing raw corpus and writing-scoring corpus, each about 1,000-character argumentative writing from universities/general adults; the scored release indicates **two expert raters**. Official 2026 writing scoring evaluation separates **Content, Organization, Expression** and generates explanations for 1–5 scores. Priority for longer-form Korean prose modeling is therefore these corpora, subject to access/terms verification, rather than treating KoLLA learner sentence corrections as authentic fluent paragraphs. Its newly published 2025 instruction-based revision corpus is an interesting additional axis; exact schema requires inspection.

Other leads: ACL SRW KoSEnd (3,000 sentences, 15 ending-form judgments; sentence-local not document gold); synthetic 28,978-row Hugging Face style-instruction data (Apache-2.0 indicated on card, but synthetic and not human naturalness gold); AI-Hub general knowledge sentence evaluation (four attributes, sentence-only, requires application).

**No training licenses, corpus downloads, actual parameter updates, or efficacy claims have been obtained in R9.15.** API costs zero new calls. R9.14 remains one-reader exploratory evidence.

## Research next step
1. Retain hidden R9.14 source/prompt/response-hash links and improve only *development* prompts, not test on the same three exposed works until a new cohort is identified.
2. Obtain licensed 2025 NIKL writing corpus samples and documentation. Inspect genre, unit granularity, score rubrics and expert agreement, then isolate source works into disjoint splits. Do not public-commit text.
3. Build a local-only contrastive preference set from appropriately permitted examples; ratings should cover naturalness, fidelity, reader purpose, rhythm and coherence, with real adjudicators.
4. Run four strategies on a new legal source-work-development cohort and compare against a strong rich baseline at measured cost; preserve errors, not just hits. Test at 800–1,500 Korean characters for rhythm.
5. Only then consider LoRA/SFT or preference tuning, **if** license permits parameter training, with held-out work-level validation and strong no-tuning comparator. No claim of finetuning simply because the harness exists.

## Public sources
- NIKL corpus catalogue: https://kli.korean.go.kr/main/requestMain.do?lang=ko
- NIKL 2026 writing-scoring challenge: https://kli.korean.go.kr/benchmark/taskOrdtm/taskList.do?taskOrdtmId=205
- 2026-Q3 releases: https://kli.korean.go.kr/taskOrdtm/taskList.do?clCd=END_TASK&subMenuId=sub01&taskOrdtmId=103
- KoSEnd: https://aclanthology.org/2025.acl-srw.29/
- HF synthetic style: https://huggingface.co/datasets/coastral/korean-writing-style-instruct
- AI-Hub: https://aihub.or.kr/aihubdata/data/view.do?aihubDataSe=&currMenu=&dataSetSn=71311&topMenu=

**G10-P1 OPEN; R9.15 engineering advancement, reader-quality improvement unproven.**
