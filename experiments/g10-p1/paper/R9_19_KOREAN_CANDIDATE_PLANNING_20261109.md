# KSGT G10-P1 R9.19 — Source-Bounded Multi-Plan Korean Prose Slate
**Date:** 2026-11-09. **State:** tested offline development candidate, **not** a new model-generation experiment.

## Development question
How can the same authored facts remain fixed while Korean prose generators can explore *multiple explicit ordering decisions* without violating source-declared temporal precedence or silently claiming that an entity/sentence structure score is human writing quality?

This follows the author's direct R9.14 blind reading: economical information organization, perceived human-like rhythm, event chronology, and the usefulness of a school notice diverged. The three exposed development tasks are reused only to test implementation contracts, **not** to make new claims of generalization or preference.

## Original paper evidence versus adaptation
- Barzilay and Lapata (2008), *Modeling Local Coherence: An Entity-Based Approach*: a learnable entity-grid transition representation and text ordering, summary and readability assessments. Our use of author entity labels is only a *candidate priority* heuristic, not the paper's learned entity-grid model. Drive original: https://drive.google.com/file/d/1R5-G5kk10Ox5Tr2EshQBmX_b8O7TKhjc/view .
- Roh and Lee (2003), *An Empirical Study for Generating Zero Pronoun in Korean based on Cost-based Centering Model*: omission depends on center transitions and inference cost, and is neither mandatory in all Continue transitions nor impossible in other transitions. **Our new code does not emit or certify zero pronouns.** Drive original: https://drive.google.com/file/d/1X_XR83Rhn9PC5uv5bPM593tHDGVZnEjd/view .
- Ham (2026), *Current Status and Issues of Korean Language Information Structure Research*: information structure depends on prior context and sentence-level realization, and two-level analysis is proposed. Annotation move priority in our code is only an engineering surrogate and cannot establish the paper's actual discourse-topic/focus analyses. Drive original: https://drive.google.com/file/d/1q_1MyyChyI4_h1ErQsNS1g4ttHiZuzaK/view .
- Lee (2024), *A Study on Discourse Relation Annotation Schema for Analysis of Connective Phenomena*: Korean connective relations require distinctions beyond a simple sequence. We distinguish **hard temporal edges** from background, contrast and other relations, not treating every relation as a precedence constraint. Drive original: https://drive.google.com/file/d/1AZ7SG3LmuLmlqqp1PnOIDbr7l-IpwV-V/view .
- Iida and Tokunaga (2014), *Building a Corpus of Manually Revised Texts from Discourse Perspective*: in 120 manually revised Japanese essays, the two tested coherence models did not outperform random baseline in a revision quality selection task. The result explicitly cautions against calling graph scores a reader preference judge. Drive original: https://drive.google.com/file/d/1iSlg7hhz2-i_KNJ8YT2XGernAqUwGtIC/view .
- Zhang et al. (2026), *Verbalized Sampling: How to Mitigate Mode Collapse and Unlock LLM Diversity*: preference-data typicality biases may diminish diversity; our structurally varied slate is **not** their verbalized-sampling method nor evidence of diversity improvements. Drive original: https://drive.google.com/file/d/1ugGf5KJdAbm7K2WJ6l_0k7zG05OHur6d/view .

## Implemented new component
- `r919_source_bounded_plan_slate_v01.cjs`: topological ordering of all author-declared `TEMPORAL_NEXT` edges. Three soft priorities: stable source tie-break, genre-aware annotated-move tie-break, recent author-entity label continuation tie-break. All use the same complete authoritative fact set, complete uncertainty list and original relation array. Cycle and self-edge stop. Each generated message includes source hash and re-verifies the plan identity and exact current task. Duplicate output orders are honestly recorded; never forced to differ.
- `r919_source_bounded_plan_slate_v01.test.cjs`: actual authored challenge fixture, structural tests, cycles, spoofed plan/drift and no invented gold.
- A read-only CI workflow runs R9.19 and R9.18 test suites and packages the actual Git checkout bytes. CI never pushes commits or uses a Groq secret.

This is not a full constrained semantic planner: `TEMPORAL_NEXT` comes from user-supplied task annotations; the implementation cannot infer time links, co-reference or human reading ease. Even a correct topological order does not guarantee the final text preserves facts once a language model realizes it. Automated surface or coherence scores are not human quality.

## Critically identified distinctions
1. An ORDERING is not a REALIZATION. The generated model must produce prose before it can be evaluated for naturalness or factual accuracy.
2. Distinct output SHA-256 values are not a lexical diversity score. Distinct fact orders are not a guarantee of varied, human-preferred writing.
3. Grouping by author-provided entity strings is not the linguistic Centering Theory of Roh & Lee.
4. A strongly written baseline can outperform a complex planner; R9.14 is direct evidence of this possibility on three *exposed* cases.
5. Prior R9.16 preference gate with two unanimous readers must retain dissent records to avoid turning a conservative admission rule into the only possible Korean style.

## Next checkpoint
1. Perform explicit plan-order/cost audit across source genres, then choose a **new** cohort of independent-length essays and informational documents.
2. Build true candidate realization from the stable, reader-oriented, and entity-continuity plans on licensed author materials only, with one *strong direct* control.
3. Obtain blinded reader scores for distinct dimensions (naturalness, rhythm, coherence, reader-fit) and separately adjudicate source accuracy. Only then make preference or causal claims.
4. Revisit multi-reference KoLLA with strict 1,410 dual-annotator block qualification, not as gold for long-form reader preference.

**G10-P1 OPEN. R9.19 adds ordering code and replayable tests; 0 model calls, 0 new reader ratings, 0 training updates.**
