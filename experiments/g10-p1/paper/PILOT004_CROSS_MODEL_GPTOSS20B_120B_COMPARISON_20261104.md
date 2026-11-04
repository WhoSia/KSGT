# G10-P1 Pilot 004 — Two-Model Korean Prose Comparison (2026-11-04)

**Actual generation evidence, limited author-created development sources, NOT blinded human quality evaluation.**

## Artifact and run custody
- 120B development cohort: [GitHub Actions #41778442098](https://github.com/WhoSia/KSGT/actions/runs/41778442098), 3 works × 5 arms, 15/15 actual paragraphs; [Drive original ZIP](https://drive.google.com/file/d/1qcCK-AY9iAzbfn7wKhWSv0rZBDaMfjqE/view).
- 20B comparison: [GitHub Actions #41778804312](https://github.com/WhoSia/KSGT/actions/runs/41778804312), same 3 works × 5 arms with model `openai/gpt-oss-20b`, 15/15 actual paragraphs, 0 failed requests, all finishReason=stop; ZIP artifact SHA256 `19404e97ada38a8d8dca6b10ffc3dc079b083c391a8eb7b184ea194a713ae3c1`, [Drive original ZIP](https://drive.google.com/file/d/13ibap_BW4FKYAYO0a1B00ONWQPsogRt4/view).
- Model configurations: temperature 0.2, max completion 1500, GPT-OSS low reasoning effort and suppressed reasoning traces; identical source input, prompt policies and per-work seeded arm ordering.
- These are **3 original source-work groups** repeated across 2 models, not 30 statistically independent tasks. Output count = 30.

## Provider-reported tokens by arm (each arm over 3 source works)

| Arm | 120B input | 120B output | 120B total | 20B input | 20B output | 20B total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DIRECT | 1,375 | 644 | 2,019 | 1,375 | 518 | 1,893 |
| RICH_PROMPT | 1,672 | 400 | **2,072** | 1,672 | 398 | **2,070** |
| DISCOURSE_GUIDED | 3,138 | 439 | 3,577 | 3,138 | 393 | 3,531 |
| LICENSED_PLAN_V02 | 2,386 | 421 | 2,807 | 2,386 | 367 | 2,753 |
| KOREAN_REALIZATION_V03 | 3,472 | 433 | **3,905** | 3,472 | 353 | **3,825** |

Both models spend ~1.85–1.89× RICH_PROMPT **total tokens** under the v0.3 formal planning prompt. This is not automatically the same cost ratio because provider prices vary by model and prompt/completion token; latency depends on separate system conditions.

## Qualitative source/prose observations — author/researcher inspection, not panel ratings

### Scientific explanation
- The 120B DIRECT output contains literal source tags `(F1)` etc. despite being requested to write prose. In both model sizes, direct output spends more words explaining generic observation/causation methodology than the source requires.
- RICH_PROMPT, v0.2 and v0.3 all preserve the observed higher sprouting count and explicitly limit unsupported illumination/temperature explanations. The v0.3 heuristic does not create an obvious qualitative leap.
- The 20B v0.3 response explicitly enumerates unknown counts and soil/environment equivalence, which is grounded in the uncertainty list but reads like a checklist; it is not clearly more natural.

### Narrative scene
- In 20B, V03 adds `그 모습이 한눈에 보였다` (unprovided visibility) and `그 순간` (unprovided simultaneity). In 120B, V03 adds `바로 그 앞에서` (specific proximity not given).
- Even with entity labels, many outputs repeatedly say `그 사람`. The claimed benefit of explicit Korean referent guidance remains unobserved.
- RICH_PROMPT produces a concise sequence without some of the added specificity; however no blinded reader has established a preference.

### School notice
- 20B v0.2 and v0.3 **produce identical final notice text** despite different input token costs; v0.3 adds tokens but no observable change in this example.
- The author brief says discussion book titles will be announced on site, but DIRECT 20B infers that readers do not need to consult a list beforehand; this might be pragmatic, but it was **not expressly licensed**.
- 120B v0.2/v0.3 specify participant classes `교직원 및 학생`, although the brief supplies only the school-community audience. Strong prompts can also fill in a preparation assumption. Report as source-extrapolation flags, not judicially proven errors.

## Current falsification direction

The same-model rich-prompt control already generates grammatically reasonable, readable Korean in the three visible tasks. A very long external plan has **not yet earned additional prose quality relative to its input token cost**. This is a concrete design warning, not proof that discourse planning never works.

**Revise G10 as prose-first engineering:** introduce a compact plan with Korean information flow (topic/contrast/ellipsis only when relevant), reduce duplicate annotation text and formality, and compare it against the SAME strong rich-prompt baseline. Treat any gain from supplying more task information separately from a gain from planning.

## Limits / status
No independent Korean reader ratings; no source-disjoint novel evaluation; no publication-level superiority or statistical confidence interval. The 30 model outputs are a development cohort only. Generation X G10-P1 remains OPEN.
