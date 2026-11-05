# G10-P1 R1 — Global Dependency Identifiability & First Adversarial Test (2026-11-05)

**Decision:** G10-P1 remains OPEN. This is a bounded algorithmic proof-of-concept, not evidence of prose improvement or independent novelty.

## Audit of existing implementation
`global_document_map_v01.cjs` classifies fact sentences using lexical cues; `global_genre_purpose_v02.cjs` adds genre-specific rhetorical instructions. Neither represents an explicitly witnessed prerequisite edge between two source propositions. Three-paragraph format compliance cannot establish reader understanding.

## Minimal falsifiable mechanism
For source fact IDs F and **author-declared** prerequisite edges E, a proposed document order pi satisfies the contract iff pi(u)<pi(v) for every (u,v) in E. The code checks exact ID coverage, edge witnessing, cycle exclusion, violations and stable topological ordering. It does NOT infer dependency edges from Korean text, adjudicate their truth, or rate generated Korean prose.

In an intentionally authored action-notice example, F2 must precede F1; raw order [F1,F2,F3,F4] violates one prerequisite. A valid topological ordering satisfies both declared edges. Deleting all edges makes the same bad raw order structurally admissible. This establishes *representation sensitivity*, not reading-quality gain.

## Research competitors and historical controls
- G8 H/M/Q/K/I separately governs provenance, meaning, quality, Korean-specific realization and edit isolability. They must not be merged into one PASS.
- G9-P60 prohibits treating several outputs based on the same source as independently sampled topics.
- G10 GLOBAL DOCUMENT 001: 36 complete outputs on 3 author-synthetic source works, zero independent Korean reader ratings; GLOBAL_MAP used substantially more input tokens than STRONG_ONE_SHOT. This R1 does not improve that historical result.
- Existing work IS-CoT (ACL 2026), LOOM (ESWA 2026), Align to Structure (AAAI 2026), Korean structure/style long-form creation (2026) and LongGenBench (ICLR 2025) limits the novelty of an ordinary plan. Topological sorting itself is established, not new science.

## Precise competing hypotheses
H1: An explicit-edge graph compiler increases reader task correctness relative to a strong one-shot model **when both receive the same facts and the same edges**.
H0a: A strong direct prompt with the exact same edges has equivalent reader correctness and lower engineering overhead.
H0b: Authorial edge annotation costs exceed gains; no low-overhead advantage.
H0c: In narrative and literary genres, prerequisite-first ordering damages rhetorical effect.

## Next prospectively controlled experiment (not executed)
1. Freeze new, source-work-disjoint authorial briefs with independent eligibility/action conditions, exceptions and evidence for edges. Measure annotation labor and edge-label agreement.
2. Within each fixed model compare strong direct, generic outline, explicit-edge rich prompt, graph-order prompt and an edge-ablated control. Keep accessible facts/edges identical and measure token/latency differences.
3. Primary: blinded reader task correctness about action, timing, eligibility and exceptions. Secondary: semantic source fidelity, human writing preference, paragraph coherence and computation/annotation costs.
4. Run negative controls: no prerequisite edges, source already sorted, ambiguous edges, invalid cycles and literary disclosure where withholding information is legitimate.
5. Analyze by independent source-work clusters. Do not pool repeated runs as independent source works.

## Verification and scientific ceiling
Local Node 22-compatible contract tests: 7/7 PASS on the initial version, covering the source-order counterexample, stable correction, edge ablation, unwitnessed edge rejection, cycles, invalid permutations and empty-edge identity. The checked-in test suite is the reproducible oracle; *remote CI has not been observed for these new commits*. Source-edge semantic validity, natural Korean prose quality and independent human gains: NOT MEASURED.

## BFS/DFS stop condition
Stop scaling this graph planner if an equal-information direct prompt matches it. First demonstrate a robust gain over strong baseline in a concrete reader task, then revisit scope and novelty; do not create a new generation or declare publication-grade results.
