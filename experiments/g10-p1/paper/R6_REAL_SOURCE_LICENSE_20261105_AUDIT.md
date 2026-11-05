# KSGT Generation X G10-P1 — R6: Real Source-License × Genre-Realization Pilot (2026-11-05)

**Verdict:** PROVIDER 18/18 PASS; REMOTE NODE 192/192 PASS; ORIGINAL-BYTES PRESERVED; AUTHOR-PROTECTED SOURCE LICENSE **NOT SUFFICIENT TO GUARANTEE SEMANTIC FIDELITY**; COMPUTE ADVANTAGE NOT OBSERVED; INDEPENDENT KOREAN WRITING SUPERIORITY HOLD; STAGE G10-P1 OPEN.

## 1. Exact experimental custody and precommit

The hypothesis, 3-policy design, 6 authored tasks and cost/failure gates were committed **before** live execution as [R6 Source License Preregistration](R6_SOURCE_LICENSE_PREREG_20261105.md), [generator](../r6_source_license_v01.cjs), [runner](../r6_runner_v01.cjs), [six-source cohort](../fixtures/r6_cohort_v01.json), and [18-call trigger](../fixtures/r6_launch_v01.json).

- [GitHub Actions real run 41975371632](https://github.com/WhoSia/KSGT/actions/runs/41975371632), job 127072862184, trigger commit cd7b930f8ce55f80c29a4250b8f329b0cb1e69a5: completed SUCCESS. All G10 Node 22 regression tests **192 PASS, 0 FAIL**. 18 assigned calls, 18 real Groq GPT-OSS 20B completions, 0 failures, all finishReason "stop".
- [GitHub artifact 13391312328](https://github.com/WhoSia/KSGT/actions/runs/41975371632/artifacts/13391312328) ZIP: **8,763 bytes**, SHA256 `80695e18ae9c48b08b8a0e9c3564992c65222dc3bbb1905c84f8c7ddcbdb5e44`; embedded r6_output.json: **38,840 bytes**, SHA256 `196ac39766bef2eb5d66a4ceb4d927974dbb8de3fc5a30fab4146c08ffe52442`; 18 real output records read directly and inspected in the working container.
- [Drive canonical raw ZIP](https://drive.google.com/file/d/1G8tqpBj-HUgV3YLn4-uedRkNdIvUt80C/view), ID `1G8tqpBj-HUgV3YLn4-uedRkNdIvUt80C`. After upload, metadata confirmed 8,763 bytes, MIME ZIP, KSGT root folder. **Independent post-upload Drive download and cold raw-byte replay: PASS** — the Drive ZIP was downloaded again and compared byte-for-byte with the original Actions ZIP; both 8,763 bytes and SHA256 `80695e18ae9c48b08b8a0e9c3564992c65222dc3bbb1905c84f8c7ddcbdb5e44`. Reader packet (10,045 bytes, SHA256 `941647abb736d87a5bd21637f30849ed94b935f881e54b024499b9e6b57398ca`) and separate private key ZIP (1,371 bytes, SHA256 `3a5eaffeb6e837c9ff5871fb866dadeb0de5bf9708141c75013e4d1509353d2d`) were also independently re-downloaded from Drive and byte-compared with originals: PASS.
- [Blinded reader development packet](https://drive.google.com/file/d/1TXJwBD5i-kRnrgtBysYga_QXuBG1ANaf/view): 6 A/B/C booklets (18 original texts), no model labels, blank answer template; ZIP SHA256 `941647abb736d87a5bd21637f30849ed94b935f881e54b024499b9e6b57398ca`. [Separate private decode key](https://drive.google.com/file/d/1I3FwUfMcmZGQPOjXfWlfFDt6HTMa5H4o/view) (DO NOT SHARE WITH READERS), ZIP SHA256 `3a5eaffeb6e837c9ff5871fb866dadeb0de5bf9708141c75013e4d1509353d2d`.
- GitHub Actions contents:read; no GitHub Actions bot-authored commit or push. Source original user/Groq credentials never printed or preserved in artifacts.

## 2. Source and experimental arms

Six authored synthetic development sources, not natural independent Korean human-origin documents: three R5-exposed tasks NOTICE_CONDITION_A, SCIENCE_LIMIT_A, SCENE_UNORDERED_A; three new authored *transfer development* tasks PUBLIC_NOTICE_B, SCIENCE_CALIB_B, SCENE_CORRIDOR_B.

Every model prompt receives exactly the **same source JSON**, including all F1–F6 sentences, reader purpose, author-declared prerequisite edges, protected fact/negation/unknown/noncausal/no-new-event markers, and creativeLicense. Intervention:
- **STRONG_DIRECT** — strong fixed source-grounded writing instruction.
- **GENERIC_CONTRACT** — strong instruction + a general checklist against unsupported source changes.
- **KSGT_GENRE_LICENSE** — strong instruction + repeated, explicit source protection witnesses and genre-conditioned three-paragraph role advice.

No arm gained exclusive source metadata; KSGT had *higher emphasis and much more prompt text*. A gain would not identify a novel linguistic mechanism because of salience/compute confounding. Run order was hash-rotated before generation; not a full randomized/Latin-square design. Model: Groq `openai/gpt-oss-20b`, temperature 0, maxTokens 900, reasoning_effort low, one attempt per source-arm.

## 3. Observed provider costs and format

| Policy | Real outputs | Prompt tokens | Completion tokens | Total tokens | Three-paragraph compliance |
|---|---:|---:|---:|---:|---:|
| STRONG_DIRECT | 6 | 3,514 | 1,453 | **4,967** | 5/6 |
| GENERIC_CONTRACT | 6 | 3,796 | 1,496 | **5,292** | 6/6 |
| KSGT_GENRE_LICENSE | 6 | 4,730 | 1,633 | **6,363** | 6/6 |

- KSGT vs Strong: +34.60% provider input tokens, +28.11% total.
- KSGT vs Generic: +20.24% total tokens.
- No measured monetary price, annotation labour or reader value; cannot claim dollar-cost-effectiveness. Strong's only two-paragraph case was SCENE_UNORDERED_A. Format compliance is distinct from prose quality.
- KSGT total tokens were larger for each of the six source works, not just in the aggregate.

## 4. Actual prose: researcher-only adversarial observations

A first-party investigator read all 18 original outputs and recorded **13 exact text spans**, each directly matched against the original output and a source-fact ID, in [R6 nonexhaustive candidate source flags](R6_RESEARCHER_CANDIDATE_FLAGS_20261105.json). These are **examples, not 13 of N errors**, and cannot support an error-rate ranking.

| Source/arm | Exact observed phrase | Grounding concern |
|---|---|---|
| NOTICE_CONDITION_A / Strong, Generic | “매주 금요일” | Source only says Friday 15:00; does not establish weekly recurrence |
| PUBLIC_NOTICE_B / Generic | “매주 토요일”; “입장료가 부과되지” | Source does not say weekly or free admission |
| PUBLIC_NOTICE_B / Strong | “변동이 없으니” | Source does not guarantee that exhibition time cannot change |
| SCIENCE_CALIB_B / Generic | “일반적인 센서 오차 범위” | No accuracy specification or independent calibration measurements exist |
| SCIENCE_CALIB_B / Strong | “오차 범위에 기인할 가능성이 높” | Elevates an unsupported explanation above alternative uncertainties |
| SCENE_CORRIDOR_B / Strong and Generic | “정각을 알리는 종소리” | A hanging wall clock does not entail an audible chime |
| SCENE_CORRIDOR_B / KSGT | “그 컵은 아직 비어 있었으며”; “컵을 들고 복도 끝으로 걸어갔다” | Invents object state and an unobserved action despite NO_NEW_EVENTS license |
| SCENE_UNORDERED_A / KSGT | “지현의 조용한 독서” | Source says she sat and inserted a bookmark, not that she read |
| SCENE_UNORDERED_A / Strong | “조용히 페이지를 넘겼다” | Another invented reading action |

The KSGT arm **does not generate the unsupported weekly recurrence** on the two notice sources, while Strong and Generic each still generated the phrase on NOTICE_CONDITION_A. That observation is compatible with extra prompt salience of an already-visible author constraint; it does **not** establish superior global semantic fidelity. On SCENE_CORRIDOR_B the KSGT arm violates a declared NO_NEW_EVENTS license despite referencing it, which is a direct counterexample to sufficiency of long source-protection instructions.

The science source uses author-permitted BOUNDED_EXPLANATORY_INFERENCE, so hypothetical measurement error causes must not be automatically judged as factual hallucinations; the difference between qualified hypotheses and unjustified certainty is the actual analytic target.

## 5. Findings that survive critical review

1. **Infrastructure:** 18/18 remote real provider generations, 192/192 tests, raw byte preservation and readable Korean outputs are verified.
2. **Mechanism falsification:** A source schema plus repeated prohibitions **does not guarantee** protected-event non-invention in literary scenes; KSGT-generated SCENE_CORRIDOR_B directly falsifies that strong version of the claim.
3. **Computational burden:** KSGT uses 28.11% more total tokens than strong direct in this six-work pilot, not even controlling for annotation labour. A claimed efficiency breakthrough is not identified.
4. **Potential narrow gain:** Original-source recurrence phrases were avoided in some KSGT notice outputs, but independent per-claim source-grounded annotation and external reader judgments are absent. The result cannot be transported to external human Korean writing.
5. **Comparison design limitations:** Exactly 6 original authored works, 3 previously exposed, 3 newly authored by the same investigator, 1 model, 1 run per arm, no matched prompt tokens, no external heldout, no independent human naturalness or comprehension. Statements about sample mean uncertainty/p-values would be misleading.

## 6. PI decision: return to Korean writing, not another validator

The isolated graph branch did not earn continued expansion (R3 1/3 intervention on exposed tasks, R5 higher tokens). R6 demonstrates that explicit genre/source licenses are also insufficient and expensive **as prompt-only interventions**. The next genuine problem is not more source metadata but **how a Korean writer makes each proposition in a fluent document accountable while preserving genre-specific expressive freedom**. Possible mechanisms should distinguish entailed source commitments, allowed but explicitly qualified interpretation, and mere rhetorical transitions. Strong multi-step direct baselines (not only single-call direct) and cost-matched rivals are mandatory. Evaluate **complete Korean documents** with independent human readers and source-meaning adjudicators at source-work cluster level, not a collection of perfect metadata gates.

**Terminal scientific status:** G10-P1 OPEN; R6 real execution PASS; protected semantic fidelity FAIL as guaranteed property (constructive counterexample); human-quality advantage NOT MEASURED; no new generation/paper promotion.