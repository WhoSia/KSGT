# KSGT G10-P1 — R5 Real GPT-OSS Korean Document Pilot (2026-11-05)

**Decision:** REAL_PROVIDER_EXECUTION_PASS / REMOTE_NODE_169_OF_169_PASS / WRITING_SUPERIORITY_NOT_IDENTIFIED / INDEPENDENT_READERS_ZERO / G10-P1_OPEN.

## Exact provenance
- [GitHub Actions run 41968783130](https://github.com/WhoSia/KSGT/actions/runs/41968783130), job 127051879955, head commit aef30f40fd9e3d3650c44964476ee743137e50e4: completed SUCCESS.
- Actual Groq GPT-OSS 20B API generations: **9 of 9** assigned; provider failures **0**. CI Node 22 pure test suite **169 PASS, 0 FAIL**.
- GitHub artifact 13389280791: [artifact link](https://github.com/WhoSia/KSGT/actions/runs/41968783130/artifacts/13389280791). Original ZIP **5,438 bytes**, SHA-256 **6545b0bbc6de471323e7f90eee712a977d015fbbf739cac3c934ebaf51d2cf9a**. The inner r5_output.json has 20,923 bytes and nine complete provenance/usage/text records. Both ZIP bytes and SHA were independently inspected in the current container.
- Raw artifact uploaded to [canonical KSGT Drive](https://drive.google.com/file/d/1Cek0jY60mxJyIZI_z9Ow3lNdZACyHCWO/view), ID 1Cek0jY60mxJyIZI_z9Ow3lNdZACyHCWO; Drive metadata readback confirms size 5,438, MIME application/zip, parent KSGT root 1T3NsDscZzkVFs66ValvPWKbvhwVppcnc. Post-upload Drive byte hash was not independently re-downloaded and replayed.
- Provider: Groq openai/gpt-oss-20b, temperature 0, maximum completion tokens 900, reasoning effort low. Source works: NOTICE_CONDITION_A, SCIENCE_LIMIT_A, SCENE_UNORDERED_A (all **exposed researcher-authored development fixtures**). Arms: STRONG_DIRECT / EXPLICIT_EDGE / GRAPH_ORDER. All arms see identical source facts, author-declared edges, audience and purpose. Arm instruction lengths and wording differ, hence **not equal-token causal isolation**. Fixed run arm order, single sample per work-arm.

## Provider-observed token ledger

| Work | Arm | Prompt tokens | Completion tokens | Total |
| --- | --- | ---: | ---: | ---: |
| Notice | Strong | 460 | 248 | 708 |
| Notice | Explicit | 499 | 222 | 721 |
| Notice | Graph | 530 | 217 | 747 |
| Science | Strong | 479 | 374 | 853 |
| Science | Explicit | 518 | 382 | 900 |
| Science | Graph | 549 | 298 | 847 |
| Narrative | Strong | 380 | 243 | 623 |
| Narrative | Explicit | 419 | 273 | 692 |
| Narrative | Graph | 450 | 305 | 755 |
| **3-work sum** | **Strong** | **1319** | **865** | **2184** |
| **3-work sum** | **Explicit** | **1436** | **877** | **2313** |
| **3-work sum** | **Graph** | **1529** | **820** | **2349** |

The Graph arm consumed **7.55% more total provider tokens** and **15.92% more input tokens** than Strong on these three works. Explicit consumed **5.91% more total tokens** than Strong. Monetary pricing/annotation labor was not measured, so no dollar-cost claim. All nine texts comprise three blank-line-separated paragraphs, which is a format result, not reader quality.

## Illustrative researcher source-fidelity inspection (NOT independent gold)

- Notice: Strong introduces unsupported recurrence **“매주 금요일”** although source only states Friday at 3 pm. Graph places the required Wednesday application deadline before the Friday event, consistent with the author-declared F2→F1 edge. Graph also implies a future notification workflow not licensed by the source; Explicit makes a more categorical post-deadline closure claim than the source itself. Source fidelity cannot be reduced to ordering.
- Science: All three include observed 8 vs 11 taxa and explicitly caution against causal certainty. Strong inserts numbered bold section labels; Explicit begins with metadiscourse about how to explain to high school readers rather than simply producing the explanation. Graph produces a shorter document but has no independently established quality advantage.
- Narrative: Strong invents intensifying rain, additional reading actions and an unrecorded backward glance; Explicit asserts without support that rain did not affect the characters; Graph invents a sigh, soft lighting, and a hurried exit. These are actual new propositions/actions beyond source, although their acceptability would depend on explicitly permitted creative license not established in this development brief.
- These observations identify *candidate* source drift for blinded adjudication, not measured semantic error prevalence or reader preference.

## Interpretation
The **real-model contact gap is now closed for an initial 3-work development pilot**. The superiority gap remains open: one model, only three exposed works, one generation per cell, no calibrated source fidelity gold, zero independently blinded Korean readers, unmatched prompt tokens and fixed arm ordering. Therefore no effect size, statistical test, model ranking or paper-level claim is licensed.

R3's prior 1/3 change-eligible finding applies only to the order-only reference-plan intervention. R5 Graph changes instruction wording even when source fact order is unchanged, so R5 science and narrative comparisons are **not null interventions**.

## Research decision
Given all three arms exhibit some source-drift concerns and Graph consumes greater aggregate token budget, **do not deepen graph infrastructure without an independently observed gain**. Next use source-work-disjoint Korean writing briefs, strong direct and explicit-edge baselines, an order-only comparison with matched instructions, counterbalanced execution order, actual provider usage and independent human reader comprehension and naturalness plus separate source-fidelity ratings.

Stop the graph-only branch if a strong direct or explicit-edge baseline delivers equivalent reader task outcomes with lower total cost. This is an R5 development result, not a new generation, not a paper-grade effect and not a validation of the human gold conditions.