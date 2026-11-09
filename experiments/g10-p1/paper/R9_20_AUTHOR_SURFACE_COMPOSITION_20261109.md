# KSGT G10-P1 — R9.20 Actual Korean Surface Composition (Author-Written Development)
**Date:** 2026-11-09. **Status:** deterministic prose-composer development and source-accurate CI; **no model fine-tuning or new Groq calls**.

## Why an actual realization layer matters
The prior R9.19 work could output fact orders and LLM instructions, but did **not** compose Korean sentences by itself. The R9.14 human pilot exposed differences between compactness and comfort, event continuity and rhythm, and checklist-like versus reader-useful announcements. The present R9.20 answers a deliberately smaller engineering question: can the model-independent harness assemble actual Korean text with separate controllable ordering and surface-style decisions, without silently adding source facts?

This is an **author-controlled micro-realizer**, **not** a learned Korean language generator. It makes *no* claim that forms labelled `READER_DIRECT` or `RHYTHM_VARIED` are objectively better, more humanlike or factually equivalent. The labels identify source-author proposals and are a hypothesis. The manually written sentences are not training data from any outside corpus and should not be used as quality gold.

## New code, assets, outputs
- `r920_author_surface_composer_v01.cjs`: accepts complete author-prewritten Korean sentence forms per source fact; invokes real R9.19 time-safe source plan selection; cross-composes exactly three independent fact-order strategies by three complete-sentence realization styles (`NEUTRAL`, `READER_DIRECT`, `RHYTHM_VARIED`). Tracks fact-to-sentence alignment and source/surface SHA-256, exact text characters, distinct output hashes, and explicitly **null** human preference and fidelity judgments. A source author must confirm every licensed form; the code checks confirmation fields but **cannot verify semantic equivalence by itself**.
- `fixtures/r920_author_surface_microcohort_v01.json`: three **new development works** (community science notice, potted-plant comparison, exhibition entrance scene) each with exactly 4 numbered source facts and 3 variants per fact. Each is a wholly authored synthetic test fixture; no NIKL or KoLLA text is included.
- `r920_author_surface_composer_v01.test.cjs`: checks the cross-product's 27 deterministic actual text compositions, full fact ID coverage, temporal precedence, aligned surface-source indices, invalid/unsupported forms, silent drift, and distinct axes of variation. New and historical R9.19 tests remain separate.
- CI is configured **read-only**, makes no API calls, never writes commits or captures sensitive external corpus text, and preserves actual checkout bytes in the artifact.

### Important author-level correction
During fixture review, an early narrative surface form suggested an unsupported intention (“the two people's destination”). The sentence was replaced with an observation strictly about entering the exhibition. This is an instance of a **human-authored surface still being wrong**; authorConfirmed does not prove fidelity. Human/semantic review is still necessary.

## Foundation from Drive originals
1. Barzilay & Lapata (2008): local discourse coherence relies on tracking entities, not simply preserving every piece of source data. Our entity heuristic is **not** a learned entity-grid.
2. Roh & Lee (2003): Korean null-argument choice depends on context and inference cost. Our fixture's explicitly source-approved omitted subject in `READER_DIRECT` is *one contrast*, not a general license for automated omission.
3. Ham (2026): information focus varies with preceding context and sentence-level framing. Different word orders per fact are **provided by the author**, not inferred topic/focus labels.
4. Lee (2024): discourse connection functions must be differentiated. Only source-declared `TEMPORAL_NEXT` constrains R9.20 order; `LIMITATION` remains available for semantic reading and human review.
5. Iida & Tokunaga (2014): a structural coherence indicator need not predict improved human revisions, so temporal correctness is not quality.
6. KoSEnd (2025): sentence-ending contextual choice is not a complete measure of document quality; its predominantly model-mediated labels prohibit assuming independent human gold.

## Why the 3×3 design
A single special “reader-focused” arm combining order and phrasing would confound improvements. Crossing `orderMethod` with `surfaceStyle` is an engineering method to **isolate knobs**, not evidence that their interaction causally improves writing. The labels, order and source alignment must be blinded in later actual-reader experiments.

### Explicit limits
- All 27 output candidates are combinations of manually authored forms, so the number of candidates does **not** measure LLM skill or automatic stylistic generality.
- Candidate count and distinct hashes do **not** imply diversity as a human would experience it.
- No direct semantic verifier, morphological generator, discourse parser or automatic grammaticality model is implemented.
- Some local forms span multiple sentences, making comma/period rhythm a genuine controlled author-level difference; this is not measured against natural Korean reference text.
- All three works are development-only, not independent held-out experiments. No new reader ratings, model calls, LoRA/SFT/DPO updates, or permitted external writing corpus ingestion.
- Repeated experiments on previous three R9.14 tasks would be overfitting; this version uses new synthetic works but still requires genuine third-party text and independent blind readers before a quality claim.

## Next architecture step
1. Add semantic source–realization validation on authored development examples using independent human adjudication or separately authorized data, not hash equivalence.
2. Replace hand-authored surface alternatives with a model-based candidate generator or trained local reranker only after licensed candidate data and appropriate evaluation, keeping the strong-rich baseline.
3. Introduce paragraph-level revision operations (sentence merging, connective adjustment, reference maintenance) with explicit source-content tracing and reader-facing evidence.
4. Reserve longer texts across genres and native readers; evaluate information flow, rhythm, reader fit, semantics and fact fidelity separately.
5. Prioritize useful Korean generation over further abstract permissions gates. **G10-P1 OPEN.**
