# G10-P1 Pilot 003 — Real Korean Prose, Three Genres × Five Arms (2026-11-04)

**Status: ACTUAL NEURAL GENERATION VERIFIED; NOT INDEPENDENT HUMAN QUALITY EVIDENCE.**
This is a development pilot using three **author-created synthetic** source works, not an unseen confirmatory test.

## Reproducible evidence

- Human-linked commit: [55ae06c40b00d9d8410e9eb7c096fa0535c5189e](https://github.com/WhoSia/KSGT/commit/55ae06c40b00d9d8410e9eb7c096fa0535c5189e)
- [GitHub Actions 41778442098](https://github.com/WhoSia/KSGT/actions/runs/41778442098) — completed SUCCESS.
- Model: Groq `openai/gpt-oss-120b`; `temperature=0.2`, max_tokens 1500, `reasoning_effort=low` and `include_reasoning=false` at adapter layer.
- 3 source-work groups: SCI_DEMO_01, NARR_DEMO_01, INFO_DEMO_01; 5 conditions each; **15/15 generated, 0 API failures, all finishReason=stop**.
- Original GitHub artifact: id 13298530281, ZIP archive SHA-256 `f36acfd09ef5dc3aa71e6225bbd8e2b754146ee672a7246f278b788c3a7ab35a`.
- Immutable raw ZIP copy: [Research OS Drive — KSGT PILOT003](https://drive.google.com/file/d/1qcCK-AY9iAzbfn7wKhWSv0rZBDaMfjqE/view); metadata checked, 4,266 bytes, in KSGT research folder. Store the raw JSON + full prompts only there / inside the original artifact, not here as misleading Results prose.

## Observed model/token usage — three source works per method

| Arm | Generated/Assigned | Prompt tokens | Completion tokens | Total tokens | Sum client latency (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| DIRECT | 3/3 | 1,375 | 644 | **2,019** | 1,664 |
| RICH_PROMPT | 3/3 | 1,672 | 400 | **2,072** | 1,229 |
| DISCOURSE_GUIDED | 3/3 | 3,138 | 439 | **3,577** | 1,452 |
| LICENSED_PLAN_V02 | 3/3 | 2,386 | 421 | **2,807** | 1,200 |
| KOREAN_REALIZATION_V03 | 3/3 | 3,472 | 433 | **3,905** | 1,379 |

**Fact:** v0.3 consumes **3,905 vs 2,072 total tokens (about 1.88×)** compared with the same-model rich-prompt control on these three developmental source works. Token counts are actual provider-reported fields. Client latency was measured at call sites and is noisy/nonrandom with this tiny sequential run; do not claim a latency advantage.

## Researcher-side prose inspection, not blinded ratings

### Science explainer
All five outputs convey the observed sprouting difference without confidently attributing its cause to illumination. The DIRECT arm copied source identifiers such as `(F1)` and generated a substantially longer explanatory passage; this is an actual visible surface artifact. RICH_PROMPT, v0.2 and v0.3 all produce concise, intelligible paragraphs. A clear added human-quality benefit from the v0.3 referent hints cannot be established by this inspection.

### Street scene
All conditions follow the same scene facts, but some generated unlicensed immediacy or spatial proximity, including `바로 그 앞에서` and `바로 그때`, although the brief did not explicitly specify those relationships. The resulting prose often repeats the character expression `그 사람`. The v0.3 notes did not obviously resolve that awkwardness. These are **qualitative source/prose inspection flags**, not independent validity failures.

### School notice
The strongest prompts generally package time, place, application deadline and lack of participation fee clearly. However the source does **not** state that participants need no advance materials; DIRECT and RICH_PROMPT add that implication. DISCOURSE_GUIDED introduces an unsupported plan to check a `추후 공지`. LICENSED_PLAN_V02 and v0.3 introduce `교직원 및 학생` as eligible applicants despite the brief merely specifying a school-community audience. These are illustrative cases of **source-based extrapolation**. Whether they materially hurt a human reader requires separate assessment.

## First comparative insight and its limits

The first measured success is **reliable actual output collection** after retiring a 404-producing model. The strongest *visible* competitor is ordinary rich prompting: it produces suitable short Korean prose while using fewer provider tokens than either explicit v0.2/v0.3 source-licensed plan. We have **not** demonstrated superior human preference, automatic source fidelity, genre generalization or architectural novelty.

The weak v0.3 result is scientifically useful: giving the LLM elaborate formal information-structure hints does not automatically yield better Korean writing. Next engineering work should **simplify** and selectively lexicalize discourse flow, not continue to add annotation checks for their own sake.

## Required next tests

1. Run the identical 3-work × 5-arm structure using `openai/gpt-oss-20b` with the same seed/temperature, to assess whether the relative value of explicit plans differs by base model capability (dev comparison only).
2. Design and run a **compact Korean rhetoric/realization plan** whose prompt length is near the rich-prompt baseline, then compare source-grounded prose and user-reader preferences.
3. Pre-register new **source-work-disjoint** Korean writing tasks, collect independent native-reader judgments and separate source-fidelity reviews before claiming a scientific contribution.
4. Account for human source annotation labor and all model input/output tokens when testing the project's 'lightweight' premise.

## Custody rule

[Original failed 5×404 Pilot001](https://drive.google.com/file/d/15MQbSqliDuvGfnMH1oiWMGsCzzaeak-V/view) and [original successful one-work Pilot002](https://drive.google.com/file/d/1vFxLvw0RZZ6Ig-kTHC83_BK4RNsLwmAH/view) are separately preserved in Drive. The official status remains G10-P1 OPEN; no fake retrospective G9 or G10 human preference result.
