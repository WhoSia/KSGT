# G10-P1 Cross-Family BFS Contact — Qwen 3.8 27B on Groq (2026-11-04)

**Study status:** actual independent MODEL FAMILY generated Korean prose; **one author-created science source** only. This is neither a blind human preference result nor cross-family generalization.

## Source and exact raw-byte provenance

- [GitHub Actions run 41786535413](https://github.com/WhoSia/KSGT/actions/runs/41786535413) — WhoSia authored triggering commit `57f59cde47a92d5aed791972dfbe580c11014bc8`.
- Groq model: `qwen/qwen3.8-27b` (preview / separate Qwen family), with explicit `reasoning_effort=none`, `include_reasoning=false` in the provider adapter, `temperature=0.2`, max_tokens 1100.
- One original author-synthetic science brief × 5 previously implemented arms; **5/5 GENERATED**, zero provider failures, all normal stop.
- Original raw ZIP artifact sha256: `e6f32693f804e386a3e70361e4255db1b3144b426eaad4e332ee68a3f687b745`. [Google Drive byte-preserved raw ZIP](https://drive.google.com/file/d/1BCbffTLyrtjBx4lWWq6rFadLfmL396xV/view).
- Current official model source: https://console.groq.com/docs/models and https://console.groq.com/docs/reasoning ; its Qwen preview status and substantially different model provider rates must not be ignored.

## Actual provider token use — one source

| Arm | Input tokens | Completion tokens | Total |
| --- | ---: | ---: | ---: |
| DIRECT | 367 | 106 | 473 |
| RICH_PROMPT | 456 | 123 | **579** |
| DISCOURSE_GUIDED | 991 | 124 | 1,115 |
| LICENSED_PLAN_V02 | 685 | 89 | 774 |
| KOREAN_REALIZATION_V03 | 1,037 | 71 | **1,108** |

The Qwen-family model independently produces readable, source-focused Korean prose without the KSGT plan. A strong RICH_PROMPT output is concise and includes the measured/unknown causal caution. V03 outputs short factual prose but consumes **~1.91×** the total provider tokens of RICH; it does not visibly demonstrate a distinctive prose-quality benefit in this one developmental passage.

**Do not infer** from this one story that GPT-OSS and Qwen have the same writer quality, that KSGT performance generalizes across model families, or that native readers prefer the rich-prompt output. We have no independent human comparison and have not performed a KSGT-v05 Qwen challenge experiment.

## Scientific implications for the main paper

- **DFS:** Factorial001/002 have established paired same-model execution, credible token-level matching (~0.45–1.33% prompt-token differences for the near-matched comparators), and source-bound architecture failure examples; no quality superiority has been identified.
- **BFS:** A third model family is accessible and can output Korean prose on Groq. It expands technical feasibility beyond GPT-OSS 20B/120B, but one source is not generalization evidence.
- **Main KSGT goal:** improve real, full-paragraph Korean writing with a lightweight, source-grounded, useful information-order plan. No return to a first-paper headline on 'whether editing is morally justified.'

## Next evidence gate

Run matched rich vs v05 on Qwen across multiple source-disjoint works **only after** evaluating the likely additional cost, model-specific decoding/format and stronger human-quality collection. A published improvement claim requires frozen real source-work-disjoint tasks, independent native Korean readers and separate source-fidelity assessment, including treatment/model interaction analysis and appropriate clustering.

G10-P1 remains OPEN. This is developer evidence and provider compatibility, not scientific proof of benefit.
