# G10-P2 R5a — 40 actual model calls, realized-prefix sensitivity and whole-prose failures

Date: 2026-11-21 KST. STATUS: EXPLORATORY AUTHOR-EXPOSED DEVELOPMENT COMPLETE; reader-state improvement and source-fidelity superiority **NOT ESTABLISHED**.
Historical prereg: [R5a pre-execution protocol](07_R5A_REALIZED_PREFIX_CAUSAL_PILOT_PREREG_20261121.md) (commit d9e60ac1), [8 independently named investigator-authored briefs](fixtures/r5a_eight_prefix_source_works_v01.json) (commit a83dd3eb, final language typo corrected pre-inference), [runner](r5a_realized_prefix_prose.cjs).
Live: [GitHub Actions #44897700620](https://github.com/WhoSia/KSGT/actions/runs/44897700620), run HEAD a6f2126c9b1cc2645397a293400414841cb6e27f, first attempt, success, human actor WhoSia, contents:read and credentials not persisted.
R5a raw: [Google Drive ZIP](https://drive.google.com/file/d/1SJsUyVnGlviJH69PB-o85XLeCGAIBW5e/view), under [R5a Drive evidence folder](https://drive.google.com/drive/folders/1fa04DNt0O49xhJX-RmBtED8U0DZpgFqR). Original Actions artifact #14704822152. ZIP 83,269 bytes, SHA-256 \`8ca75a538ceb7d592f65f387d8e3cf46e70975870f4c23af261c38dc86476ab7\`. The ZIP was downloaded, uploaded from its connector reference, cold-downloaded from Drive, and checked with SHA-256; original GitHub digest and cold Drive checksum match.

## 1. Executed design and real receipts

- 8 *researcher-created* development source works, 2 each chat/science/notice/scene, 5 fact clauses each. Their distinct parent IDs are investigator declarations, not verified naturally occurring human disjointness.
- 8 one-call strong DIRECT_FULL texts; 8 generated common prefixes; 8 same-model, source-vs-surface fact status extractions; 16 additional continuations (PLAN_ONLY versus OBSERVED_STATE) assembled with those 8 unchanged prefixes: **40/40 actual requests completed**, **24 complete texts**. Both continuation arms receive identical actual prefix, all source clauses, writing goal, model and continuation instruction; they differ in their state note values.
- Actual original model: Groq \`openai/gpt-oss-20b\` at temperature 0 and native provider usage receipts. 17/17 R5 tests PASS and 80/80 prior P2 tests PASS in the live job; raw receipt and prompt SHA verified again by read-only \`--score\` step.
- Valid *JSON/quote-anchored* extractor reports 8/8. This is NOT eight independent comprehension judgments, because the extractor is the same fallible model, output quote identity is syntactic, and proposed status STATED is not a semantic proof.
- PLAN versus OBSERVED state differed for 8/8 works. The planned F1 was declared STATED, while the extractor marked it STATED in 6/8 cases. All eight statuses diverge in some way because extractor marked many other source clauses STATED while PLAN assumes they were not said; this is sensitivity of prompts, **not** evidence of a reader-state causal quality gain.
- 0/8 continuation pairs had identical final text. Two continuations for CHAT_SOURCE both repeated the original prefix, demonstrating that supplying a state did not prevent duplication.

## 2. Actual provider token costs (whole 8-work cohort)

| Arm / measurement | Total provider tokens | Ratio to DIRECT |
|---|---:|---:|
| DIRECT_FULL 8 independent one-call texts | 4,995 | 1.00× |
| PLAN_ONLY if independently deployed: prefix + continuation | 9,306 | 1.86× |
| OBSERVED_STATE if independently deployed: prefix + extractor + continuation | 17,501 | 3.50× |
| Actual 40-call research experiment, shared stages counted once | **27,778** | not a deployable-arm comparison |

The three arm totals are **not additive** because the two continuations share prefix generation, and the actual experiment executes extractor once per work. These are total prompt+completion model tokens; not charges, milliseconds, annotator labor or equivalent-quality throughput. No cost-matched iterative baseline ran, and the intervention is not a genuinely executable state/controller.

## 3. Researcher source-visible post-hoc adversarial readings

These are author-side development objections with explicit source contradictions, NOT blinded reader votes or independent source-semantic gold. They support negative-case debugging, not statistical quality preference.

| Work / arm | Observed output fragment and source violation |
|---|---|
| SCI_CLOCK / PLAN_ONLY | Output: \`온도 변동이 관찰되지 않았으므로 온도는 실험 결과에 큰 영향을 미치지 않았다고 판단할 수 있다\`. Source fact 4: \`두 조건의 온도는 별도로 기록하지 않았다\`. This is a clear change from **UNMEASURED** to **OBSERVED-NO-CHANGE**, then an unsupported inference. OBSERVED_STATE removed this specific fabricated premise, but that alone cannot establish overall superiority. |
| SCENE_PAPER / OBSERVED_STATE | Output: \`나는 손을 뻗어 그 종이를 살짝 들어 올렸다\`. Source fact 5 requires the scene to end **before** picking up the paper. This is a direct event-constraint violation under apparently valid model-extracted state; PLAN_ONLY continuation did not perform the lift. |
| NOTICE_SHOW / DIRECT_FULL | Output invented \`설치 시간은 오후 2시부터 5시까지\`. Source fact 2 says only **next Tuesday afternoon**, not exact hours. |
| NOTICE_SHOW / PLAN_ONLY | Invented \`담당자가 설치 장소를 정해 이메일로 안내\` although source has no mail channel. OBSERVED_STATE invented \`개별 연락을 드릴 예정\` instead. Both condition values can hallucinate a promised communication. |
| NOTICE_BOOK / DIRECT_FULL | Output supplied particular class clock times \`오전 10시~11시\` and \`오후 1시~2시\` without a school bell schedule in source. This is not a warranted expansion from merely saying periods 4 and 5. |
| CHAT_ARCHIVE / DIRECT_FULL | Output promised \`제출 여부가 확정되면 바로 알려드리겠습니다\`; no follow-up notification promise appears in the provided source. |
| SCENE_GARDEN / PLAN_ONLY | Output added \`손끝으로 화분의 표면을 살짝 두드려\`; source forbids new story actions. Both styles also exhibit overwrought imagery and explanatory moralizing; aesthetic labels would require external reader evidence. |
| CHAT_SOURCE / BOTH CONTINUATIONS | Both continuation raw texts begin by repeating the original common prefix in full. Neither writer-state note prevented duplication, even though the prompt explicitly instructed not to repeat the prefix. |

The original ZIP contains complete texts, not just these fragments. Decisions about ambiguity, atmospheric permission, reader quality and error severity need independent adjudication before scientific claim promotion.

## 4. The decisive bottleneck

The extractor succeeds at producing a well-formed **label and exact quote** yet does not bind the *next writer's event decisions* to the source. SCENE_PAPER is the strongest negative example: a surface-anchored state report can coexist with a future action that the source unambiguously forbids. Meanwhile SCI_CLOCK PLAN_ONLY demonstrates that a false state premise may induce a false causal inference. Both mechanisms are important; neither establishes that richer state always helps.

This exposes three separable tasks:
1. Infer what the realized prefix licenses the reader to believe (currently model-author self report only).
2. Select/realize the next sentences to optimize rhetorical quality (not proven).
3. Enforce source-restricted entailment and event constraints on the *new continuation* (not achieved, including when a state is valid).

Do not collapse the three tasks into a single label of 'reader-state success'. The true hypothesis remains that a sufficiently small, calibrated **post-realization** state and an executable continuation policy might help Korean writers at acceptable full marginal cost. Current data put a direct 1-call baseline in a much stronger efficiency position (3.50× less than observed-state arm under present accounting). The null/negative cases demand simplification, not more unsupported machinery.

## 5. Identification limits and next test

R5a uses the same model for generation and extraction, fake planned statuses, no independent reader observations, and only eight new researcher-authored prompts. It has no random representative source population or blind human preference. It is not source-work-disjoint independent validation even though those briefs are different from R4a. The continuation is constrained to 2–3 sentences and thus may generate unnatural extra discourse compared with free one-call completion. Output lengths and prompt budgets differ; PLAN_ONLY vs OBSERVED_STATE also differ in quotation evidence content, not only a Boolean label. Therefore no direct controller-value, general Korean writing-quality, or causal cognitive inference can be promoted.

Next scientifically necessary experiments, in priority order: (i) genuine full-text source-fidelity adjudication of the three concrete failure families without model self-certification; (ii) construct a **same-state-as-text versus executable continuation intervention** under exact fact/candidate/cost matching and a strong equal-cost iterative baseline; (iii) use real human-source provenance and independent readers before claiming linguistic quality; (iv) test whether dropping the state extractor entirely is cheaper and not worse.

No newly trained models, no independent human preference, no demonstrated literary-quality gain. OFFICIAL STAGE REMAINS G10-P2 OPEN.
