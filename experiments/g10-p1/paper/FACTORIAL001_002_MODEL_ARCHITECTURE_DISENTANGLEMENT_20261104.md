# G10-P1 DFS/BFS Pilot — Model × Architecture Disentanglement, Factorial 001/002 (2026-11-04)

**Scientific status: real model output and measured tokens, no independent native Korean preference, no source-disjoint confirmatory result.**

## Why these pilots exist

KSGT must demonstrate that a discourse architecture adds value **within a fixed LLM**, not take credit for a base model's Korean fluency. The primary control is same source brief × same LLM × comparable prompt budget. Tests with two GPT-OSS sizes identify within-family interactions, NOT cross-family generality.

## Factorial 001 — model × first compact plan

- [GitHub run 41785252058](https://github.com/WhoSia/KSGT/actions/runs/41785252058), human `WhoSia` trigger SHA `7fdc0e308ab58ce94915a24b2a033974a45456f5`.
- GPT-OSS 20B and 120B × 3 author-created shuffled/discourse challenge source works × 4 policies = **24/24 generated**, zero reported failures.
- Policies: RICH_PROMPT, RICH_CHAR_MATCH, COMPACT_PLAN_V04, ORDER_PERTURBED_V04. The "matched" comparator controls **character count**, not exact API tokens or discourse information distribution; do not describe it as full compute matching.
- Original immutable GitHub Actions artifact ZIP sha256: `dd54be6e6fd207b526934b57aaffb9d911b6a9ebcff3ca09129c3e246d697f9e`. [Original ZIP Research OS Drive](https://drive.google.com/file/d/1jCCjAyNp8R3IBZ2QWvBJKfaZERamyIts/view).

### Factorial 001 actual provider input tokens, per policy over three works

| Policy | GPT-OSS 20B | GPT-OSS 120B |
| --- | ---: | ---: |
| RICH_PROMPT | 1,990 | 1,990 |
| RICH_CHAR_MATCH | 2,466 | 2,466 |
| COMPACT_PLAN_V04 | **2,477** | **2,477** |
| ORDER_PERTURBED_V04 | **2,477** | **2,477** |

RICH_CHAR_MATCH vs COMPACT_PLAN_V04 differ by only 11 input tokens over all three works (~0.45%). This reduces a major prompt-length confound, but the artificially padded rich prompt might itself be an inferior textual instruction; a substantive same-budget rival remains required.

**Key observed failure:** COMPACT_PLAN_V04 correctly obeys F3→F4→F1 (sowing→day7→day14) but begins SCI_SHUFFLED_02 with the measurement-limit fact F2 (e.g. `조도와 토양 수분은 측정되지 않았습니다`). Correct topological order alone does NOT establish a good reader-facing information order. ORDER_PERTURBED follows an intentionally distorted ordering in some generated passages, demonstrating prompt-order sensitivity but NOT proving naturalness.

## Factorial 002 — v05 role-aware repair, tested prospectively after identifying the v04 error

- [GitHub run 41786019896](https://github.com/WhoSia/KSGT/actions/runs/41786019896), human trigger SHA `80f66c5b1e946dfafdd9c74e168d7b28bd2042c6`.
- 2 models × 3 **same author-written development works** × 6 arms = **36/36 actual Korean paragraphs**, zero reported failures, complete workflow success.
- Added ROLE_AWARE_PLAN_V05, which combines author-given setup/event/observation/limitation roles with explicit temporal/background and limitation edges; separately added RICH_CHAR_MATCH_V05 matching the v05 user-prompt length in characters. Kept historical v04 arms unchanged for audit.
- Original ZIP SHA256 `ee04fd29d9e0f81e03c7ab1544eb018a5fda86fbf156821397063cacfbafb568`; [Original ZIP Research OS Drive](https://drive.google.com/file/d/1KJyT3hSRcbtgXL3NpUcFC5Kh1X6I_nKz/view).

### Factorial 002 provider-reported tokens, three works per condition

| Policy | 20B prompt | 20B completion | 120B prompt | 120B completion |
| --- | ---: | ---: | ---: | ---: |
| RICH_PROMPT | 1,990 | 525 | 1,990 | 664 |
| RICH_CHAR_MATCH_V05 | **2,335** | 534 | **2,335** | 699 |
| ROLE_AWARE_PLAN_V05 | **2,366** | 615 | **2,366** | 591 |
| COMPACT_PLAN_V04 | 2,477 | 502 | 2,477 | 493 |
| ORDER_PERTURBED_V04 | 2,477 | 869 | 2,477 | 590 |

RICH_CHAR_MATCH_V05 and ROLE_AWARE_PLAN_V05 differ by 31 prompt tokens across three works (~1.33%). Their total provider token sums are respectively 2,869 vs 2,981 (20B) and 3,034 vs 2,957 (120B). This is not a model-agnostic price/cost estimate, and the counts are samples from one stochastic run.

### Reader-facing observations that do and do not support improvement

- **Science:** v05 fixes the worst v04 ordering defect: both sizes begin with planting/location/watering before observations and end with the measurement caveat, instead of placing the caveat first. However both RICH_CHAR_MATCH_V05 and v05 produce comprehensible paragraphs. GPT-OSS 120B v05 still adds an unsupported first-observation assertion (`관찰이 시작된 일주일 차`), illustrating that prose planning cannot certify source fidelity.
- **Narrative:** GPT-OSS 20B v05 invents `그로 인해 주변은 젖어 있었다` from rain, and moves the poster's event-time content to the final sentence; this may be less natural or source-limited than the matched rich comparator. Another KSGT variant's referent annotations do not solve coreference by themselves.
- **Notice:** Both sizes' v05 outputs preserve the deadline-to-participation dependency in the sampled generations, unlike the earlier v0.3 reversal. But 20B v05 infers `별도의 준비물이 필요하지 않습니다` merely because the school provides electronics parts. That is not licensed for other supplies. Similar extrapolation also appears in rich prompts; source fidelity is NOT a one-system-only problem.

**Interpretation:** v05 corrects one preidentified ordering bug without establishing a general human-quality improvement. The relative contribution and reader preference of planning remain **UNIDENTIFIED**, especially since the same exposed works were reused for iterative repair. Results must not be submitted as an independent holdout.

## DFS inference vs BFS scope

**DFS:** The structural mechanism is **macro-information order on disorderly source input**, not a universal rewrite-value doctrine. Factorial 001 and 002 controlled the base model and near-matched prompt length, and an intentionally perturbed order supplied a negative control. However a repeated-source, one-sample-per-cell development study cannot estimate reliable model–architecture causal interaction with human preference.

**BFS:** Science, two-person narrative and dual-event notice expose different error types. GPT-OSS 20B vs 120B tests model capacity, but these models are in the SAME family and hosted at the SAME provider. Cross-family validation is still required; Groq presently lists `qwen/qwen3.8-27b` as a preview model. Its reasoning mode, pricing and availability are not interchangeable with GPT-OSS. https://console.groq.com/docs/models and https://console.groq.com/docs/reasoning

## Paper-worthy research question and falsification

**Main:** Do lightweight, source-conditioned information-order plans improve *actual Korean paragraphs* when base-model capability, source task, information access and prompt/completion budgets are controlled?

**Strong rivals:** well-written rich prompting, substantial length-matched rich prompting, plan-order perturbation, and source/genre-specific direct generation; plus third model family and multiple seeds.

**Falsification:** if v05 outputs are not reliably preferred over matched rich prompts, or source commitment errors increase, no KSGT quality superiority is claimed; if model family determines all observed gains, no model-independent architecture claim is made.

**Next experiment:** third-family Qwen developmental contact (small scope and provider constraints), then independent Korean readers and separate source-faithfulness adjudicators on **new source-work-disjoint** tasks. Avoid repeated prompt tuning against a supposedly unseen set.

## Provenance / ethics

All raw Korean texts and provider usage remain in private Research OS Drive ZIPs, GitHub has only human-committed code and authored scientific reports. No github-actions[bot] commits, pushes or tags. Notion is the canonical research judgment record. Generation X G10-P1 remains OPEN; model superiority, genuine readership gains and paper novelty are HOLD.
