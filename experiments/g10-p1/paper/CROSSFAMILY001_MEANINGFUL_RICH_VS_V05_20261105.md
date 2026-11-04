# G10-P1 Cross-Family 001 — Three Models × Three Korean Discourse Policies (2026-11-05)

**Real generation audit, not native-reader quality gold or held-out inference.**

## Evidence and operational reproduction
- [GitHub Actions run 41936930175](https://github.com/WhoSia/KSGT/actions/runs/41936930175), WhoSia trigger SHA `1ee78af7495e2693c528ea464d18acb770dc94a0`. Real 27/27 model responses, zero API failures, all sourced from the same 3 already-exposed author-created discourse challenge briefs (not fresh human tasks).
- Models: Groq-hosted `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`. Provider adapters use GPT-OSS low reasoning vs Qwen non-thinking; thus "model family" also bundles different instruction tuning and decoding differences.
- Policies: `RICH_PROMPT` (usual existing strong baseline), `RICH_MEANINGFUL` (coherent additional Korean writing advice, no externally computed order), `ROLE_AWARE_PLAN_V05` (author-relations-based, explicit ordering).
- [Raw ZIP Drive](https://drive.google.com/file/d/1M0eU1BVLrPk4mE5jTkKepU6WjHAn5CxB/view), GitHub artifact #13373802935, ZIP sha256 `72c3b65950aeca15526a02ae7248500e6a63b03e9c387dca2c5d83db511c3c87`. Save exact original Korean outputs and provider usage; GitHub stores only brief excerpts, technical files and this analysis.

## Provider-reported tokens per policy across three source works

| Model | Policy | Input | Output | Total |
| --- | --- | ---: | ---: | ---: |
| GPT-OSS 20B | RICH_PROMPT | 1,990 | 555 | 2,545 |
| GPT-OSS 20B | RICH_MEANINGFUL | 2,425 | 495 | 2,920 |
| GPT-OSS 20B | ROLE_AWARE_PLAN_V05 | 2,366 | 621 | 2,987 |
| GPT-OSS 120B | RICH_PROMPT | 1,990 | 651 | 2,641 |
| GPT-OSS 120B | RICH_MEANINGFUL | 2,425 | 496 | 2,921 |
| GPT-OSS 120B | ROLE_AWARE_PLAN_V05 | 2,366 | 582 | 2,948 |
| Qwen 3.8 27B | RICH_PROMPT | 1,697 | 483 | 2,180 |
| Qwen 3.8 27B | RICH_MEANINGFUL | 2,081 | 402 | 2,483 |
| Qwen 3.8 27B | ROLE_AWARE_PLAN_V05 | 2,046 | 423 | 2,469 |

The substantive rich baseline and v05 differ by **59 input tokens over three works on GPT-OSS (2.43% of meaningful-rich)** and **35 tokens on Qwen (1.68%)**. The comparison is more credible than earlier repeated-padding baselines, though not exact token matching. Total cost also depends on output length and different model prices; token count alone cannot establish a dollar-cost or runtime advantage.

## Source/prose inspection findings (researcher, NOT a blinded human panel)

**Science:** All three models can produce logical setup → day-7 shoots → day-14 leaves → measurement limits even using RICH_PROMPT or substantive RICH alone. V05 also writes an intelligible chronological narrative, but this **does not demonstrate an incremental planning advantage**. GPT-OSS 120B sometimes invents that the first observation started on day 7 (a source-unlicensed claim) under several policies.

**Narrative (model×policy interaction candidate):** Source describes Minjae offering a folded umbrella, Yunseo *not accepting* it, and Minjae taking the offered umbrella back. In this exact single 120B run:
- v05 produces both `우산을 받은 윤서는` and `우산을 받지 않은 채` in one sentence — directly conflicting on whether the umbrella was accepted.
- RICH_MEANINGFUL also produces `우산을 받은 뒤` immediately preceding `우산을 받지 않은 채`, so **this is not an error exclusive to KSGT**.
- Qwen's v05 describes the offer and refusal without explicitly claiming Yunseo accepted it.
- The GPT-OSS 20B v05 adds a redundant/unlicensed rain description (`그 비는 교문 앞에서도 이어졌다`), demonstrating a different form of discourse over-lexicalization.

This is concrete evidence that base model characteristics can change how the same input and general generation setup behave; it is **not a quantitative estimate of a model-family interaction**, which would require many source-work clusters, multiple seeds and adjudication.

**Notice:** A substantive rich prompt can still add unlicensed 'no separate supplies required' merely because the school supplies electronic components (20B). In 120B, v05 narrows applicants to 'students' although the source says only the school community. Qwen's v05 preserves missing information about laptop and handouts while maintaining deadlines. None of these single examples supports a broad method ranking.

## Current decision

The project MUST avoid citing native speaker proficiency of GPT-OSS as a KSGT achievement. We have advanced from uncontrolled long prompts to same-model source-matched and nearly input-budget-matched *actual prose*. Yet no independently validated preference effect has been observed. Deep research should prioritize (1) repeated-seed reliability for source commitment failures, (2) substantive strong rich baseline as the primary comparator, (3) independent human judgment of naturalness and a separate source fidelity adjudication, (4) genuinely new source-work-disjoint writing tasks.

**Current scientific status:** G10-P1 OPEN. The new 27 genuine outputs increase verified cumulative total from 115 to 142, but no human quality scores, cross-work causal confidence interval or accepted paper claim.
