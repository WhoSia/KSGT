# G10-P1 — Global Writing Programme R1 (2026-11-05)
## Document-Level Intent, Information Dependence and Korean Realization

**Decision:** Keep G10-P1 OPEN. Archive pilots 001–006 as *development evidence*; do not keep promoting individual local errors to the main research question. The main target is **better complete Korean prose**, not prettier templates, source-validation courts, or deciding whether a rewrite is justified.

### Revised scientific problem
Given only author-permitted source statements, audience, genre and communicative purpose, does a *compact, automatically derived document-level information architecture* produce a more coherent, better prioritized **three-paragraph Korean document** than a capable model using its own planning under comparable source access, model calls, token budget and sampling?

A document should achieve an intent, not simply preserve a list of fact IDs: introduce the shared situation, develop a comprehensible account, and end with warranted implications / limits / next action (genre-dependent). The global dependency structure is about what must be understood before what, which facts should be grouped, what claims are conditional, and what should remain unresolved.

### What is genuinely at stake
1. **Global communicative adequacy:** Does a reader understand the central point and intended action after reading the entire document?
2. **Inter-paragraph progression:** Does each paragraph add or reorganize information meaningfully without recycling the same facts?
3. **Cross-paragraph source grounding:** Are factual qualifications, limitations and conditionals preserved when information is distributed?
4. **Resource efficiency:** Are any gains larger than extra prompt tokens, additional model calls and human annotation labor?
5. **Model heterogeneity:** Do within-model improvements hold across GPT-OSS and Qwen, or rely on particular models' implicit planning?

### Novelty ceiling (direct rivals)
- Sun et al., *IS-CoT: Breaking the Long-form Generation Collapse via Interleaved Structural Thinking*, ACL 2026: dynamic Plan–Write–Reflect vs static hierarchical planning. https://aclanthology.org/2026.acl-long.911/
- Guo et al., *LOOM: Weaving High-Quality Long-Texts through Hierarchical Planning and Reflective Feedback*, Expert Systems with Applications 2026: local/global cognitive loops and efficiency claims. https://doi.org/10.1016/j.eswa.2026.132879
- Kim et al., *Align to Structure*, AAAI 2026: RL discourse-structure alignment, including global discourse motifs. https://doi.org/10.1609/aaai.v40i44.41085
- Kim, Yang & Kim, Korean long-form structure/style pipeline, 2026: Korean creative-writing pipeline. https://doi.org/10.7472/jksii.2026.27.3.133
- Wu et al., *LongGenBench*, ICLR 2025: long-form constraints and weak generation despite long-context input. https://proceedings.iclr.cc/paper_files/paper/2025/hash/141304a37d59ec7f116f3535f1b74bde-Abstract-Conference.html

**Not novel by itself:** making an outline, separating drafting from revising, making text longer, tagging rhetorical relations, or running a multi-agent pipeline. G10 must discover an interpretable, low-overhead document-level mechanism that is measurably useful **for Korean prose** despite these rivals.

### Development engineering hypotheses (all falsifiable)
- H1: raw-source clustering by discourse *function* across paragraphs improves a document's main-point accessibility compared to a strong single-call baseline.
- H2: role-based ordering is insufficient if **conditional commitments and referents** are altered across paragraphs.
- H3: for simple or already well-organized sources, external planning is redundant; complexity-aware abstention may improve cost-adjusted performance.
- H4: strong models may need less intervention; an interaction between model and global plan must be estimated rather than averaged away.

### Initial controlled design
- **Output:** three cohesive Korean paragraphs (not a 2,000-word claim). Later step up to 5–8 paragraphs with the same scientific controls.
- **Development sources:** three newly authored synthetic multi-issue documents with mixed background, observations, contradictions, constraints, practical consequences. THESE ARE EXPOSED DEV WORKS AS SOON AS USED.
- **Arms:** STRONG_ONE_SHOT, GENERIC_OUTLINE, GLOBAL_MAP, GLOBAL_MAP_PERTURBED. Same model, source facts, audience, purpose and 1 call per arm. Log prompt/completion tokens, errors, latency.
- **Additional strong baseline before paper:** self-outline prompting at equal total token budget; a stronger multi-call iterative planning rival; no unfair claim when they are omitted.
- **Evaluation unit:** source work / human reader; blind pairwise document preference, separate fact-fidelity review, explicit task success and paragraph-level coherence rating. No synthetic LLM judge as human gold.
- **Falsify:** if a strong baseline wins or global plan requires much more cost, return to planner design rather than rewriting claims of superiority.

### Stop / BFS–DFS gate
DFS: isolate why *global* information order helps (dependency chains, paragraph responsibility, reader purpose). BFS: vary genre, model family and source complexity without tuning against an unseen holdout. Periodically return to the top-level question: **Did KSGT produce a better full Korean document that a reader would actually choose?**

### Evidence boundary
Existing 196 generated paragraphs, their 404 and source-error records, and all previous reviewer packets are **G10 development history**, not a new unseen benchmark. Independent native Korean quality preference: 0. No submission-quality Results claim. New global document results to be reported separately and never silently combined with old paragraph counts.
