# G10-P2 R5g — Executable Discourse-Order Lattice and Korean Paragraph Realization

**Frozen at 2026-11-21 KST before any R5g provider inference.** Researcher-designed, source-exposed development; 8 NEW authored source briefs distinct from all R5a–R5f materials. This is an applied Korean paragraph-writing hypothesis, not a claimed new reader model, a trained generator or independently proven prose-quality improvement. Official G10-P2 remains OPEN.

## Research question

Can a **small executable constrained information-order solver** cause a strong GPT-OSS 120B generator to produce *more coherent and source-disciplined full Korean prose* than a single strong direct generation call, with the same six source propositions and exact source constraints, without a second LLM call or a compulsory downstream patch/reader gate?

The solver receives **human-authored rhetorical roles and dependency edges** from a source brief, enumerates all valid topological orders (six nodes maximum → ≤720 permutations), ranks the feasible orders via a predeclared genre-conditioned role preference + discourse-connection score, then passes its chosen **ordered fact IDs + epistemic obligations** to the same natural-language writer. This is a **real executable order selection** but not automatic annotation or a learned Korean semantic parser. It must not silently invent relations from fact co-occurrence.

## Re-grounded historical negative evidence

R5a generated 40 real 20B responses, with 2–3-call observed-state continuations frequently duplicating an initial prefix, inferring unmeasured temperature changes, inventing email notices and story actions. R5b 24 new responses found short style policies mixed, including unsupported notice deadlines and omitted uncertainty. R5c 16 new responses made all eight single-span edits mechanically valid yet introduced dangling "그때" and strengthened epistemic modality. R5d four coherent-span calls yielded only one deletion and three no-ops. R5f 16 live 120B calls tested style-example retrieval, +34.79% provider tokens with mixed Korean five-turn quality. The SmileStyle variant authorship is **not verified**: explicit erratum to original R5f. Current cumulative **308 actual calls**. Thus no more reader-state form-filling, post-hoc self-judgment or hand-selected exact-span editing is the new intervention.

## Eight genuinely new researcher-written source briefs, two per genre

Genres **science / school notice / team message / literary scene**, each with **6 source nodes** (48 facts in total) and predeclared directed dependency edges. Each node has: ID, source statement in Korean, discourse role, source-supported knowledge status, importance, topic(s). The status is one of **OBSERVED, REPORTED, UNMEASURED, PLANNED, UNDECIDED, LICENSED_SCENE**. These labels are **researcher stipulations**, not posterior model-inferred truth. Facts may be paired with negative restrictions (no invented schedule, no invented promises, no new character actions, no proven cause from unmeasured variable). The task and audience/genre are supplied verbatim in both arms.

Source IDs start `R5G_` and may not overlap the eight R5a parents, SmileStyle content or G10-P2 R4a briefs. Texts are new researcher-authored synthetic writing tasks, not organic source-disjoint human editorial materials. Scientific data are hypothetical, not verified empirical findings.

## Two live writer arms, one provider call each, frozen call count 16

- **DIRECT120B**: one GPT-OSS 120B response from exactly the same six structured source nodes, dependency edges, genre, task, author license, reading purpose, epistemic obligations and approximate length, without solver-computed order. Model freely chooses order, wording and sentence boundaries.
- **LATTICE120B**: identical writer model, temperature 0, maxTokens=1450 and source materials, PLUS the deterministic solver-computed **topological order / role adjacency and uncertainty display requirement**. It is explicitly allowed to combine sentences or use Korean zero pronouns without changing the ordering of key information. The final text should be readable prose without JSON/labels/rules. The planner produces **no additional provider calls** (algorithm-only overhead), but the added plan length may increase input tokens.
- Presentation/call order is alternated across 8 tasks. **Actual new model calls 8 + 8 =16**, not billed until raw receipts exist. Historical cumulative would become **324** after authentic execution.
- Strictly freeze original six fact texts and graph/roles/weights BEFORE model calls; source IDs are not test leakage from previous experiments. Both arms have access to the graph edges, so output differences are associated with the **solved explicit order cue**, not merely giving relations to only one arm. This is a pre-encoded prompt effect and not causal proof of a new architecture; direct vs lattice differs in sequence guidance and extra tokens.

## Executable graph constraint + objective

Before inference, mechanically validate six distinct IDs, six source facts, genre balanced 2×4, verified status vocabulary, topic list, DAG edges to existing nodes, no cycles, and no topological solution hidden by constraints. The solver enumerates valid orders and assigns a deterministic score equal to:
1. Weighted genre role preference for earlier information, with **source inclusion mandatory**;
2. Continuity reward for consecutive nodes sharing a declared topic;
3. Adjacent role-pair reward for such relations as METHOD→RESULT, RESULT→LIMIT, LIMIT→PLAN, CONTEXT→RESTRICTION, SCENE→ACTION, ACTION→OBSERVATION and OBSERVATION→OPEN_END.
Each coefficient and tie-break are frozen in code prior to experimental execution. This is a small hypothesis-driven rhetorical planner, **not** a linguistically learned scoring function, and must be evaluated against strong 120B direct generation rather than presented as an improvement a priori.

## Native Korean whole-prose development review

Archive each **complete final Korean text** together with original facts, all graph edges, computed plan and authentic provider token receipts. Do not collapse to source-quote matching, invented AI-flavored phrase detectors or toy HTML ratings. Specifically identify:
- Whether SOURCE→output satisfies temporal and epistemic scope; facts not measured cannot become “observed no change” or proven cause.
- If school notice invents time, venue, deadlines, staff contact, new eligibility, or unlicensed future update promises.
- If fiction adds character actions, dialogue or moralistic closure beyond licensed scene events; preserve literary tension instead of dumping all fact nodes as a checklist.
- Coherence and natural Korean topic/comment, modality, collocations, transitions, pronoun ellipsis, sentence cadence, diction and genre voice.
- Check how much token input overhead the executable plan adds. More order correctness may be offset by mechanical writing.
- Exact number of source facts and graph topological validity are necessary mechanical evidence, **not human aesthetic scores or semantic entailment gold**.

## Scientific stop and downstream role

This exact graph planning idea has strong prior art: Moryossef, Goldberg & Dagan (2019) *Step-by-Step: Separating Planning from Realization in Neural Data-to-Text Generation*, https://aclanthology.org/N19-1236/ (KSGT original PDF already on Drive); Puduppully & Lapata (2021) *Data-to-text Generation with Macro Planning*, https://doi.org/10.1162/tacl_a_00381; He et al. (2025) *Evaluating and Improving Graph to Text Generation with Large Language Models*, https://aclanthology.org/2025.naacl-long.513/; and 2026 *Discourse-grounded text generation* doctoral work https://universaar.uni-saarland.de/handle/20.500.11880/42004. Plan ordering in itself is **NOT KSGT novelty**, and Korean word order's topic/focus effects deserve a more genuinely language-specific implementation (Park & Yeon 2023, https://benjamins.com/online/prag/articles/prag.22023.par).

If the extra structure does not improve real complete Korean writing or source fidelity enough for its complexity, retire the planner as a mandatory step. If it does improve cases, the next experiment must separate **correct explicit order vs extra prompt salience** and test **external unexposed real-world Korean writer sources**; do not escalate an exposed eight-case pilot to G10-P3.

No independent native-human preference or semantic gold is to be invented; user can judge selected complete text examples as a named expert at their own convenience, without study recruitment or a reader HTML instrument.
