# G10-P2 R5h — 16 true 120B calls, 24 Korean scenes: typed actor binding is executable, but selector cost and literary cadence fail

**2026-11-21, KST.** Historical, **source-exposed 8-scene developmental comparison**, not independent native-Korean human preference, general semantics proof, automatic Korean source parsing, or new neural generator. Official project **G10-P2 OPEN / QUALITY_HOLD**.

## 1. Original executed design and receipts

- [Pre-inference preregistration](22_R5H_ROLE_BOUND_KOREAN_MICROREALIZER_PREREG_20261121.md), [eight source-licensed researcher-written literary scenes (48 factual frames, actor A/B per work)](fixtures/r5h_eight_native_korean_actor_bound_scenes_v01.json), [actual surface compiler](r5h_korean_role_bound_micro_realizer.cjs) and [native tests](r5h_korean_role_bound_micro_realizer.test.cjs).
- [Actual GitHub Actions R5h #44909195424](https://github.com/WhoSia/KSGT/actions/runs/44909195424) **SUCCESS**, strong Groq `openai/gpt-oss-120b`, temperature 0, 16/16 original provider completions, **62/62 R5 tests and 80/80 previous G10-P2 native tests PASS**. The workflow did not write code or make a GitHub Actions bot contributor.
- [Raw original 16-call ZIP and complete 24 Korean works](https://drive.google.com/file/d/1ygI87GYkV_EXaSIf7HIoFpcI3H31vx8a/view); [Drive evidence folder](https://drive.google.com/drive/folders/1wjMpey1QzJMAecNjH0RBNKyQ5ZStCTwC). Original ZIP = **52,344 bytes**, SHA-256 `d8fb6a733accde7cd2a8c4dabc2f559f39881efdb13e2c1be8860546927cbfd1`, GitHub Actions artifact #14708508335. **Cold Drive downloaded, byte SHA matched and ZIP CRC 38/38 entries passed**. The immutable source JSON `r5h-live/final-score.json` is 81,417 bytes, SHA-256 `ed62b1f3a8f1772dad92eb4c14d38b1c6f710f16c577f8c9020cbd294a7b9216`.

### Actual one-call strong full-text comparator against genuinely executable constrained realization

| Korean output route | Truly new original provider calls | Complete original Korean works | Actual provider prompt + completion tokens | Source-visible mechanical outcome |
|---|---:|---:|---:|---|
| **DIRECT120B** | **8** | **8** | **5,338** | Free natural whole-scene writing; source faithfulness/lexical polish mixed |
| **ROLE_COMPILED120B** | **8** | **8** | **14,811** | GPT-OSS returns *only legal sentence-candidate indices*; executable Node program builds Korean with fixed A/B subject particle and predicate |
| **COMPILED_DEFAULT** | **0** | **8** | **0** | Same finite source-aware compiler, no LLM choice; less varied and repetitive |

**16 authentic new provider calls, 24 full Korean texts, 20,149 provider tokens total.** Role-selected model path uses **9,473 more provider tokens (+177.46%, 2.7746×)** than free strong 120B. All **8/8** selector responses were legal machine-parseable option choices. The model chose **27/48** frame options different from conservative source-default choices, and the compiler emitted **14 safely licensed omitted subjects** over the eight selected output scenes. These are executable structural/format properties, **not native aesthetic scores or certified world semantics**.

## 2. Exactly what was guaranteed by source-aware execution

The source creation phase wrote *two trusted Korean predicate alternatives per source frame*, with an explicit `subjectEntityID` for each event (A for frames S2 and S3; B for S4 and S5), six original fact IDs and two named characters for each scene. The strong model had **no right to generate lexical prose** in the constrained arm; it could output only a `{choices:[{id:"S1",option:n},...,{id:"S6",option:n}]}` object. The compiler then selected the actual **preauthored** clause, filled the subject as `유나는/서진은` or `유나가/서진이` according to Korean coda/particle logic, or omitted a subject **only** if the immediately previous frame had the *same* actor. It also included the setting S1 and unresolved end S6, with immutable 6-frame source trace.

A free LLM cannot move a map held by source actor A into actor B's clause through this finite-selection output channel, because those clauses are not candidate options. **This is a conditional structural identity property**, contingent on accurate **human-authored source frames** and **human-authored phrase alternatives**. It is not evidence of an automatic Korean semantic-role parser, a general entailment auditor, or correctness of the handauthored clause options. The system does not generate arbitrary new literary language on its own; **the expensive model mostly selects a sequence of already-written sentences**.

## 3. Directly inspected Korean completed-prose examples, warts included

The following are source-visible investigator readings, **not independent votes**, and the full 8×3 texts are in the original ZIP.

| Scene | 120B direct complete prose | 120B finite-choice compiled Korean | Specific status |
|---|---|---|---|
| RECORD_ROOM | Fluent concise 4-sentence passage, but adds **`희미한 불빛이 깜박인다`**, an unlicensed flickering event, and closes with the odd `종이도, 말도 흐르지 않는다` | Correctly keeps **유나** holding the folded map and **서진** watching the closed drawer, but repeats `유나는 ... 있었다. [zero] ... 있었다` / `서진은 ... 있었다. [zero] ... 않았다` as six discrete clauses | **Source-actor fidelity for trusted compiler; weaker narrative rhythm** |
| NIGHT_LIBRARY | Invents internal mental state `서로의 시선과 책갈피 사이에 남은 빈틈을 느낀다` and unsupported relative placement `반대편 창가` | Preserves explicit book mark and rain, but chooses `도서관의 밤 창문에는`, an **unnatural lexical collocation**, and does not omit either repeated actor | Correct actor identity does not ensure lexical idiomaticity |
| MUSEUM_GALLERY | Adds that 다연 **looks at** the guide although source only says she holds it, and writes the unidiomatic `조용히 시선을 머문다` | Includes all licensed facts but uses six repetitive short declaratives | Both paths have clearly different types of linguistic failure |
| REHEARSAL_ROOM | Readable compactness but adds decorative `조용한 숨결만 남는다` not independently licensed by the source | Safe person/instrument boundaries, yet sounds like checklist notes | Content protection and artistic pacing pull in different directions |
| GREENHOUSE_WALK | Generally fluent and source-consistent within the supplied frame | Faithful but repetitive `유리창을 바라보고 있었다. 유리창에는 손을 대지 않았다` | A good direct one-call baseline is hard to beat |
| SEASIDE_OBSERVATORY | Quite natural, preserves who holds the picture and who looks at the sea | Correct but overly explicit event list | No obvious quality benefit worth 2.77× token cost |
| OLD_BOOKSHOP | Uses AI-style `말 없는 침묵만이 흐른다` cliché | Author-supplied candidate also concludes with `침묵만 있었다` and repeats actor/body-state formula | Neither guarantees rich novelistic voice |
| RESTORATION_ROOM | Uses vague `서로의 시선만을 남긴다`; avoids falsifying object owners | Author-supplied sentence `아침빛이 ... 작은 창을 통과해 들어왔다` is literal and wooden | The compiler inherits source author lexical shortcomings |

**Human author/source coverage limitations:** Every scene is newly researcher-written and has the exact same S1 background, S2/A possession, S3/A posture, S4/B gaze, S5/B non-action, S6 negative closure structure. Eight rows are therefore **not eight independent literary narrative phenomena**. Two hand-written clause variants per fact and scene-specific restrictions remain a large hidden source labor cost; model token savings or semantic novelty cannot be claimed by ignoring this.

## 4. Technical conclusion and next actual action

Compared with previous R5g prompt-only DAG order, R5h introduced a **real executable semantic-control path**; selected source predicate clauses and character roles cannot be rewritten by model. That limited control worked **mechanically**. However, a writer that must load and pick every fully written candidate is a **very poor cost and expressive trade-off**. It produces less fluid Korean than the best strong direct writing in the exposed examples. Strong DIRECT remains the production baseline.

The immediate engineering experiment R5i reuses **exactly the original R5h score JSON SHA** with **zero new model calls** to aggregate adjacent same-actor predicate frames before final prose emission, rather than post-hoc string patching the LLM's prior free text. It investigates whether doing actual clause aggregation can reduce choppy source-bound writing without losing source actor ownership. This is [R5i already frozen development plan](23_R5I_POSTHOC_ROLE_SAME_SUBJECT_CLAUSE_AGGREGATION_PLAN_20261121.md); its readback and separate report must preserve the zero-call identity.

Known prior art: Roh & Lee (2003), [zero pronoun generation in Korean with cost-based centering](https://aclanthology.org/U03-1.pdf), and Hwang (2023), [Korean interclausal continuity and referential form choice](https://doi.org/10.1037/xlm0001166). Neither topic omission nor source-role grammatical realization is a KSGT invention. Constrained text assembly only guarantees what is explicitly modeled. **No independent Korean aesthetic vote, verified automatic semantic entailment, external native author revision gold or new neural model was produced.**

**Stage accounting:** verified G10-P2 historical actual provider calls through R5g **324**, plus R5h **16** = **340**. R5i has **0 new model calls**. Official **G10-P2 OPEN / QUALITY_HOLD**.
