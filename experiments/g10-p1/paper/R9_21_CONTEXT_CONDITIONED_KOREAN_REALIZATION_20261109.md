# KSGT G10-P1 — R9.21 Context-Conditioned Korean Boundary Realization
**Date:** 2026-11-09; **status:** author-written conditional realization, NO automatic fine-tuning or LLM generation.

## Motivation grounded in observed cases
The R9.14 author's human reading differentiated scientific information economy from smooth readability, scene event alignment from varied rhythm, and an actionable school notice from a defensive inventory of unknown facts. R9.20 demonstrated only a *sentence-per-fact* surface selector and deterministic concatenation. This does not ensure the surface chosen for fact F_j is appropriate after F_i. R9.21 introduces a small but concrete **conditional local choice** over an existing authored sentence and its predecessor context.

## Interface and mathematical factorization
- Let X be the complete immutable authored source work; O a topologically legal order of source fact IDs; S a surface form policy; B an adjacency-aware switch.
- R9.20 used y = join(surface(F_i,S)) for i in O.
- R9.21 computes y = join(surface(F_i,S) if B=BASE; otherwise authorApproved(F_{i-1},F_i,S) when an exact author-written rule exists).
- No fallback rewrite is hallucinated. At a non-matching boundary, the base sentence is unchanged.
- This is **not** automatic Korean sentence generation or semantic verification. The author provides complete replacement sentences, and source-to-text semantic equivalence remains unproved.

## Concrete implementation
- `r921_boundary_realizer_v01.cjs`: 3 order strategies × 3 sentence-form strategies × 2 boundary modes = 18 candidate slots per source work, with exact predecessor/current fact IDs, full-sentence author-confirmed override, immutable source hash, applied-rule trace and honest null semantic/human quality claims.
- `r921_boundary_realizer_v01.test.cjs`: run all three *new synthetic development works* under all combinations, preserve author source facts, temporal constraints, exact variant selection, no invented overrides and no unverified semantic-quality claims.
- `fixtures/r920_author_surface_microcohort_v01.json`: seven targeted author-written conditional alternatives added, addressing semantic reference after another salient human, explicit subject continuation, cautious limitation after observations, and topicality/reader action in notices.
- The original R9.20 fixture had **3 works, 4 facts each**, all authored for development; none is a real external Korean text corpus or independently rated naturalness gold.

## Source theory
- Roh & Lee 2003 Korean zero pronouns: omit arguments only where inference is contextually licensed, rather than mechanically on repeated entity mention. Our predecessor-aware whole-sentence choice is a design adaptation; it does not implement their Cost-based Centering algorithm.
- Ham 2026 information structure: prior discourse context changes topic/focus realizations. This is an explicit local comparison with author-provided alternatives, not a complete syntax/information-structure parser.
- Lee 2024 Korean discourse relation annotation: contextual relations must not be transformed into unsupported causes or contrasts. R9.21 only swaps fully authored exact adjacent surfaces; it does not infer new relations.
- Iida & Tokunaga 2014: even structural coherence heuristics may not predict human preference, so applied override count is an execution audit, never a naturalness grade.
Originals: https://drive.google.com/file/d/1X_XR83Rhn9PC5uv5bPM593tHDGVZnEjd/view, https://drive.google.com/file/d/1q_1MyyChyI4_h1ErQsNS1g4ttHiZuzaK/view, https://drive.google.com/file/d/1AZ7SG3LmuLmlqqp1PnOIDbr7l-IpwV-V/view, https://drive.google.com/file/d/1iSlg7hhz2-i_KNJ8YT2XGernAqUwGtIC/view.

## Important limitations
1. A prewritten string used in a different context can still be pragmatically odd, even when every fact ID is present; fine-grained Korean discourse is not reducible to exact-adjacency IDs.
2. The same explicit fact can be phrased at different information levels. Replacing a sentence can insert presupposition or remove focus without adding obvious named facts; R9.21 cannot check this.
3. An `authorConfirmed` boolean is not independent factual verification.
4. Neither the count of output strings nor the count of applied overrides measures *naturalness*, *comprehension*, *genre fit*, *text diversity*, or *fidelity*.
5. Running on authored synthetic development material after many previous development loops cannot support causal generalization. No new human preferences, actual model outputs, or updated model weights are claimed.
6. Future R9.22 should connect actual LLM-generated multiple Korean proposals or authenticated corpus variants to this interface and introduce source-level human verification, while preserving a rich direct baseline and held-out long-form tasks.

## Evidence
Source code, unit tests and fixtures are versioned in WhoSia/KSGT. The read-only workflow runs R9.21, R9.20, and R9.19 tests without producing bot commits. CI artifacts contain the full authored-development outputs and exact source byte manifest for independent replay.

**G10-P1 OPEN; no scientific quality-improvement claim.**
