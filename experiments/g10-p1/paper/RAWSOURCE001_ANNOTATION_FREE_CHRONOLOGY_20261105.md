# G10-P1 Raw Source Pilot 001 — Annotation-Free Korean Chronology (2026-11-05)

## Experimental claim boundary
**Actual Groq outputs 27/27, no independent preference/gold, same three exposed author-created development briefs.** The purpose is to test *annotation-labor-free* planning, not to claim a new universally accurate discourse parser.

### Reproducible proof
- [GitHub Actions run 41937937429](https://github.com/WhoSia/KSGT/actions/runs/41937937429), WhoSia-linked request commit `66fc5aaa2aa1c7f0434d83f25c819e08812a10d7`, artifact SHA256 `d8b29efab648bb27c0faf7f64d609ac82ada576c552a470d628f314977f59090`.
- Raw source/response [Google Drive ZIP](https://drive.google.com/file/d/1240kjvohhX68TDx42HrRrzrrTCnbChpk/view).
- 3 already-seen author-created source-work groups × 3 Groq models (GPT-OSS 20B, GPT-OSS 120B, Qwen 3.8 27B) × 3 methods (RICH_PROMPT, RICH_MEANINGFUL, RAW_CHRONOLOGY_V06). **27 of 27 generations**, no API failures.
- All three methods received only `facts`, `uncertainties`, `genre`, `audience`, `purpose`. Explicit human `factAnnotations` and `relations` were stripped before prompt creation. Model/provider and source remain matched within each work.

### What v06 actually calculates
`raw_chronology_plan_v06.cjs` uses high-precision surface cues to recognize science setup, explicit day-indexed observations (e.g., `7일째`, `14일째`) and measurement limitations, then proposes a setup → observation-by-day → limitation paragraph plan. In narrative and notice genres without enough explicit dated observation cues, **it abstains from reordering**. The result is a lightweight string-level planner, not semantic parsing or automatic coreference resolution.

### Provider tokens over 3 works
| Model | RICH_PROMPT total | RICH_MEANINGFUL total | RAW_CHRONOLOGY_V06 total |
| --- | ---: | ---: | ---: |
| GPT-OSS 20B | 2,042 | 2,479 | **2,750** |
| GPT-OSS 120B | 2,087 | 2,431 | **2,736** |
| Qwen 3.8 27B | 1,704 | 2,046 | **2,331** |

Relative to meaningful RICH, v06 uses +271 tokens/3 works (20B, +10.9%), +305 tokens (120B, +12.5%), and +285 tokens (Qwen, +13.9%). These are actual **input+output provider tokens** but not necessarily monetary costs, since input and output have different prices.

### Researcher observations (not reader preference)
- **Science:** v06 produces experiment setup, day-7 shoots, day-14 leaves and an unmeasured illumination/soil moisture caveat in all three models. This proves a working annotation-free chronology mechanism on this one source. However meaningful RICH also often achieves an appropriate information order, so superior reader quality is **unmeasured**.
- **Narrative:** v06 abstains from fabricated temporal ordering. This does not magically repair the base LLM. In the Qwen v06 result the protagonist walks toward the student center before a sentence beginning `그때 윤서는 강당 입구에서 파란 포스터를 읽고 있었는데`, inviting an awkward temporal return. One output is not a systematic inference error rate.
- **Notice:** The v06 20B and 120B paragraphs preserve application deadlines and both event places/times, but may omit some explicitly uncertain laptop/material details; omission is not necessarily factual fabrication but is an information completeness tradeoff.
- **Baseline lesson:** source order of author-written briefs, even when deliberately shuffled, is often reorganized by strong LLMs. Therefore chronological planning alone is likely not sufficient to establish an independent technical contribution.

### Next direction
A future KSGT architecture should focus on **minimal, valid discourse intervention when complexity warrants it**, not a philosophical doctrine of 'whether editing is legitimate.' Test source-complexity gradients and source-work-disjoint input; collect real human reader preferences and separate source-fidelity coding; compare equal source information, matched decoding and actual costs. Optional planning that abstains should be evaluated by the final *Korean prose*, not by how elegantly abstention was defined.

**Stage:** G10-P1 OPEN. Report actual generated outputs but hold all superior-human-prose, cross-family generalization and novelty claims.
