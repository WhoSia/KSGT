# G10-P1 DFS/BFS — Cross-Family Two-Seed Stability Audit (2026-11-05)

**Data:** 2 independently triggered real Groq runs on the SAME 3 already-exposed author-created development source works, 3 models × 3 arms. No hidden source-work split, human preference or gold semantic adjudication.

## Reproducible raw evidence
- [Seed 1, Actions 41936930175](https://github.com/WhoSia/KSGT/actions/runs/41936930175) — 27/27 generated. [ZIP on Drive](https://drive.google.com/file/d/1M0eU1BVLrPk4mE5jTkKepU6WjHAn5CxB/view).
- [Seed 2, Actions 41937219229](https://github.com/WhoSia/KSGT/actions/runs/41937219229) — 27/27 generated. [ZIP on Drive](https://drive.google.com/file/d/1qsl1H_rOSx5Y5Phb2twDw4nmplmLa5M_/view).
- Both runs use `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b` with `RICH_PROMPT`, `RICH_MEANINGFUL`, `ROLE_AWARE_PLAN_V05`. Every policy uses the same author-written source facts, uncertainties and annotations per work. Reasoning flags differ by supported model family, so model-family comparison is descriptive, not tightly controlled causal attribution.

## Provider token counts, three source works per method per seed
| Model | Method | Seed 1 total | Seed 2 total | Seed 1 input | Seed 2 input |
| --- | --- | ---: | ---: | ---: | ---: |
| GPT-OSS 20B | RICH_PROMPT | 2,545 | 2,496 | 1,990 | 1,990 |
| GPT-OSS 20B | RICH_MEANINGFUL | 2,920 | 2,935 | 2,425 | 2,425 |
| GPT-OSS 20B | ROLE_AWARE_PLAN_V05 | 2,987 | 2,991 | 2,366 | 2,366 |
| GPT-OSS 120B | RICH_PROMPT | 2,641 | 2,638 | 1,990 | 1,990 |
| GPT-OSS 120B | RICH_MEANINGFUL | 2,921 | 2,950 | 2,425 | 2,425 |
| GPT-OSS 120B | ROLE_AWARE_PLAN_V05 | 2,948 | 2,939 | 2,366 | 2,366 |
| Qwen 3.8 27B | RICH_PROMPT | 2,180 | 2,174 | 1,697 | 1,697 |
| Qwen 3.8 27B | RICH_MEANINGFUL | 2,483 | 2,491 | 2,081 | 2,081 |
| Qwen 3.8 27B | ROLE_AWARE_PLAN_V05 | 2,469 | 2,453 | 2,046 | 2,046 |

**Implication:** Substantive rich prompting and KSGT v05 have closely matched but not identical prompt usage (GPT-OSS input gap 59 tokens/three tasks; Qwen input gap 35). Across both runs the total token usage is similar but does not itself indicate a preference win. A smaller KSGT completion count is not necessarily better writing.

## Repeated source-prose observations — NOT independent evaluation

**Narrative acceptance contradiction:** In Seed 1 GPT-OSS 120B, both the substantive rich prompt and v05 include a clause implying Yunseo *accepted* the umbrella immediately before saying she did *not* accept it. In Seed 2 both omit that contradictory acceptance claim. The error is thus **not persistent across two stochastic draws**, and it is **not KSGT-specific**. On the same two runs, Qwen v05 maintains the offered-and-refused interpretation. This is a real source-fidelity failure mode, but not a validated model rank.

**Notice preparation inference:** Both seeds of GPT-OSS 20B in the substantive rich prompt and in v05 infer that no separate supplies are needed because the school provides electronic components. The original source explicitly says only those components are provided and separately says notebook needs are unknown. Thus the unsupported implication repeats across model/conditions; this is a promising target for independent source-error coding, not a proven causal effect of the planner.

**Information order:** All models produce broadly readable science setup → day-7 → day-14 sequences with several competing prompts. KSGT v05 therefore does not yet have a demonstrated human-reader advantage over competent instructions, despite its structured mechanism.

## Main strategic consequence

The claim `KSGT makes Korean prose better than an already strong LLM` is not yet established. The appropriate scientific focus is what automatic, low-labor macro-information planning adds beyond a meaningful rich prompt. Relying on expensive hand-authored relation annotations makes lightweight deployment questionable. Hence the next engineering track introduces `raw_chronology_plan_v06.cjs`: a conservative **annotation-free** lexical/chronological planner, limited to source-expressed observations and abstaining from unsupported chronology in narrative/notice.

A future publishable study requires: (i) non-exposed source-work-disjoint tasks, (ii) blind independent native Korean reader judgments, (iii) separate independently adjudicated semantic/source correctness, (iv) balanced models and repeated random seeds, and (v) cost including annotation labor. Under current experiments **all results remain developmental and hypothesis-generating**.
