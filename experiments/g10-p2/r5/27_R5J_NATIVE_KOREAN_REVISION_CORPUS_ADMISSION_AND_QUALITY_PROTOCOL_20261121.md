# KSGT G10-P2 R5j — Native Korean revision corpus admission and whole-prose experiment gate

2026-11-21 KST. **Prospective research protocol, not an executed generation experiment.** Stage remains G10-P2 OPEN / QUALITY_HOLD; cumulative actual P2 model calls **340**, new calls 0, independent native reader preferences 0, independent source-fidelity gold 0.

## Why the experiment must change

R5g showed that a legal topological source-fact order still transferred a folded paper from its actual owner to the other actor, while R5h/R5i showed that author-pretyped actor-preserving realization still produced clumsy collocations and repetitive literary scenes at high or hidden annotation cost. Strong GPT-OSS 120B direct full-text writing remains the quality baseline. Source-ID conservation is not a reader-quality metric. Another small author-authored template benchmark would not establish a general writing advantage.

## External authoritative source discovery (public catalogue only; NO BYTES ACQUIRED)

1. **National Institute of Korean Language (NIKL), "글쓰기 첨삭 지원을 위한 지시문 기반 생성(인스트럭션) 말뭉치 2024", version 1.1.** Official catalogue https://kli.korean.go.kr/request/corpusRegist.do describes source documents/paragraphs/sentences sampled from "글쓰기 원시 자료 말뭉치 2023", annotated by content, organization and expression revision criteria. Official 2026-06-30 release notice https://kli.korean.go.kr/m/boards/noticeView.do?recordId=1733 confirms this dataset was among seven corrected releases. **Priority A for true native writing revisions**; requires application/download entitlement and inspection of schema, source-revision pairing, editor authenticity, composition and re-use agreement. A correction/annotation instruction is not automatically a professionally validated best possible style target. Current holdings: name-search in connected Drive returned no verified local raw payload; NOT HELD/NOT CHECKSUMMED.
2. **NIKL "무형 대용어 복원 말뭉치 2024".** Same official catalogue describes contextual restoration of omitted expressions. **Priority B** for referent licensing, *not* a full-prose aesthetic target. Corpus applicability, access and permissions unverified.
3. **NIKL "글쓰기 원시 자료 말뭉치 2023/2024" and "글쓰기 채점 자료 말뭉치 2024".** Official catalogue describes human essays and two-expert scoring for the latter. **Priority B/C**: natural Korean source corpus and task-specific score labels, but scores do not identify localized paragraph edits; corpus and evaluator agreement details must be checked.
4. **NIKL "지시문 기반 첨삭 지원 말뭉치 2025"** announced in 2026-09-30 release notice, https://kli.korean.go.kr/boards/noticeView.do?lang=ko&recordId=1779 . **Priority A follow-up**; exact schema/availability and relation to 2024 series NOT INSPECTED.
5. **AI Hub "자연어 분석 후처리용 과교정 검증 데이터"** https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&dataSetSn=71477 . **Priority C** for minimizing unjustified changes (KEEP), not evidence of best literary style.
6. **KoLLA v2** https://kaist-mlplab.github.io/korean-learner-corpus/ . Already researched in G10-P1; L2 learner grammar correction with independent essay boundary limitations and licensing audit; cannot substitute for polished native Korean literary writing.
7. **Korean Wikipedia historical revisions** may be attributable with CC BY-SA obligations, but earlier KSGT audits found markup, category and infobox changes; no automatic ranking of later revisions as stylistically better. Lower priority.

## Mandatory intake checks (must pass before model training/release)

- Exact file ID, acquisition time, raw SHA-256, format, split, number of unique works and *authors*, independent annotators, original-versus-edited mapping, paragraph boundaries, revision intent, accepted license, NC/share-alike terms, quotation/redistribution constraints and accessibility.
- Same underlying essay must not span train/dev/test even when many sentence edits come from it. If essay or author IDs absent, **HOLD author-disjoint claim** and report descriptive only.
- Show editor changes with actual BEFORE/AFTER source snippets, classify semantic drift vs valid repair, and independently sample evidence at the **complete paragraph/document** level. Never treat a later version or a human-written reference as unconditional quality gold.
- Rights for model use, sharing prompt extracts, and re-publishing output to GitHub must be separately checked. Raw restricted datasets stay out of public repo.

## Preregistered end-to-end R5k comparison after data admission

- Source-disjoint Korean prose tasks; fixed audience/genre, human revision instruction, and exact initial paragraph(s). Freeze the task list and evaluation protocol before generating.
- Arms: **A** strong direct GPT-OSS 120B one-shot edit; **B** strong direct model with explicit source+reference guidance; **C** same model with the identical typed reader-state serialized as plain Korean instructions; **D** execution-based narrow reference/role guard with unchanged strong writer; **E** an equal-total-provider-token budget best-of-N direct generation and selection; **F** KEEP original.
- Isolate the control mechanism: the base writer, prompts, candidate input, randomization and inference settings must be matched or openly recorded as unmatched. Count hidden calls, prompt+completion tokens, reference annotation labor, latency, memory and cost per usable **complete text**.
- Separate **blind reader** utility/naturalness+first edit location from **source-visible independent fact auditor** (actor, ownership, condition, modality, negation, new events). Agree on permitted edits and literary creative license *before* scoring.
- Fail the proposed new mechanism if it improves internal role-conservation checks but not end-to-end quality or if native source cost increases enough to be Pareto-dominated by direct baselines. Keep sham state and no-change controls.
- No unsolicited human recruitment. Prepared study forms are not completed human ratings.

## R5j red-team warning

Current `r5j_reference_guard.cjs` enforces exact candidate strings registered in a caller-supplied license, but does **not** verify who approved that license or prove that the elliptical phrase preserves scope, polarity, time or modality. Even same actor+object can be under 'if', 'not', reported speech or contrast. A forged/carelessly chosen license can authorize semantic drift. **Implementation tests must not be described as real semantic safety certification.** A hard semantic safety claim remains HOLD, even after the 9 locally executed assertions pass.

## Execution / ledger

On 2026-11-21 Node.js 22.16.0 locally replayed the preceding 9 source-file test assertions: 9/9 PASS. No native external corpus bytes acquired, no new model calls, no blind reader observations; corpus catalogue and release notice were independently queried. Connected Drive keyword search for corpus terms did not identify a verifiable original copy (a broader archive-level audit remains pending). Do not modify CURRENT_STAGE.json's 340-call figure. GitHub human-identity commits only; GitHub Actions never writes or pushes.
