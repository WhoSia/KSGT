# KSGT G10-P1 R2 — Matched-Information Global Planning Comparison (2026-11-05)

**Authority:** DEVELOPMENT ENGINEERING ONLY. G10-P1 remains OPEN. No new independent human reader evidence, source fidelity gold, LLM-generated prose or superiority claims arose from this R2.

## Design and observable intervention

A five-arm compiler now holds the JSON source packet byte-identical for all policies: task ID, genre, audience, purpose, exact source fact IDs and text, and explicitly author-declared prerequisite edges.

| Arm | Deliberate intervention |
| --- | --- |
| STRONG_DIRECT | Strong source-faithful direct writer |
| GENERIC_OUTLINE | Adds generic contextual sequence |
| EXPLICIT_EDGE_PROMPT | Explicitly asks LLM to consider the same author edges, no computed order |
| GRAPH_PLAN | Adds stable topological fact order computed from those edges |
| GRAPH_PLAN_ABLATED | Adds original fact order instead of graph order; **edges remain visible** |

The ablation tests *external graph-order intervention*, NOT withholding information. An equal-information condition is necessary but not sufficient for a fair causal comparison: graph arms add instruction tokens and all arms differ in wording. We explicitly report `matchedTokenBudget:false`; later use a token/length-matched placebo plan.

## Implementation/receipts
- `matched_information_v01.cjs`: source-identity SHA-256, all five prompts and no-provider `compare()`.
- `matched_information_v01.test.cjs`: nine local Node 22 tests, 9/9 PASS after fixing a test-fixture error before commit; they check parity, a reversed edge, intact shared edge in baselines, the negative control and fail-closed input.
- `fixtures/r2_matched_information_dev_v01.json`: three author-synthetic exposed works: reversed-prerequisite school notice (2 edges), science explainer (3 edges), edge-free literary scene (0 edges). These are neither real-world samples nor a holdout.
- `r2_prompt_audit_v01.cjs`: deterministic 3 works × 5 policies = 15 *assigned prompt-only cells*, with source packet hash, source and full-prompt character lengths and explicit model/human zeros. Text characters are not tokenizer-equivalent.
- Existing read-only G10 GitHub workflow runs `node --test experiments/g10-p1/*.test.cjs` when commits touch the experiment path; no CI success receipt is claimed without observation.

## Mechanistic pitfalls revealed
1. A direct LLM sees exactly the same edges as the graph arm. If it can reconstruct the order internally, graph precomputation may add only cost.
2. No-edge literary sources make graph and ablated *orders* identical. This is an expected null intervention, not a test failure.
3. Prerequisite order over fact IDs is not yet a paragraph-level argument graph, discourse structure parser, writer-intent model, or true understanding of Korean semantic context.
4. Author-labeled edges can be mistaken or incompatible with narration's strategic suspense. More labels do not guarantee better writing.
5. Synthetic validation assertions establish contract correctness, not independent reader comprehension.

## Direct comparison with published work
- Sun et al. (2026), IS-CoT: dynamic Plan–Write–Reflect for long-form text. https://aclanthology.org/2026.acl-long.911/
- Liu et al. (2026), Disco-RAG: discourse trees + inter-passage rhetorical graphs in retrieval-conditioned generation, evaluated in QA/summarization. https://aclanthology.org/2026.acl-long.189/
- Kim et al. (2026), Align to Structure: structural reward alignment for discourse generation. https://doi.org/10.1609/aaai.v40i44.41085

These competitors preclude claiming novelty for structure-aware planning, graphs, or outlining per se. R2 specifically tests whether inexpensive, explicit author-witnessed reader prerequisites add value to complete Korean text under identical source information. Their reported outcomes cannot be imported as KSGT results.

## Next preregistration gate
- **Before an API run:** add token-length-matched placebo, record all sampling/model parameters, prompt/completion token counts and latency; freeze source families and five arms.
- **Before a superiority claim:** collect independent, source-disjoint Korean reader comprehension tasks and blind ratings, plus source-fidelity adjudication.
- **Primary hypothesis:** graph planning improves action/exception understanding on sources with genuine reader prerequisites at tolerable costs.
- **Null:** explicit-edge prompting or strong direct writing performs similarly; graph adds tokens and annotation labor.
- **Stop:** when no reader-level lift remains after equal-information, length/cost, model and source-work controls, retire this local mechanism and return to global KSGT goals.

**Evidence status:** 15 prompt cells prepared, 0 new provider generations, 0 human readers, 0 scientific superiority results.