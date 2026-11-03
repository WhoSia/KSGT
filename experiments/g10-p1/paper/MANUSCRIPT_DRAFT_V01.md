# Lightweight Discourse-Guided Korean Prose Generation with Existing Language Models

**KSGT Generation X G10-P1 — Manuscript Draft 0.1 (2026-11-03)**  
**RESEARCH DRAFT / NOT A RESULTS PAPER / NO HUMAN PREFERENCE EVIDENCE YET**  
Full program: [RESEARCH_PROGRAM.md](../RESEARCH_PROGRAM.md)

## Abstract — design-stage placeholder, not submission-ready

Contemporary large language models can produce fluent Korean sentences, yet passage-level writing must additionally maintain discourse coherence, appropriate information structure, referential continuity, genre-sensitive linguistic realization and fidelity to a source brief. We investigate a lightweight generation architecture that organizes source facts into an inspectable discourse plan and conditions an existing LLM on that plan, without updating the model weights. The primary question is whether this intervention improves **actual Korean prose** over strong direct-generation and instruction-rich prompting baselines when the base model, source evidence, output limits and resource use are controlled. We describe a reproducible three-arm generation protocol, a Korean-sensitive realization interface and a source-work-disjoint, independently judged evaluation design. **No new experimental quality results are reported in this draft.** The paper's empirical claims and final abstract must be written only after genuine model runs and blinded native-reader/source-fidelity assessments.

## 1. Introduction

Generating a grammatical Korean sentence and writing a coherent Korean paragraph are distinct tasks. The writer must decide which facts to introduce first, how subsequent sentences depend on that information, when to retain or omit explicit referential expressions, and how to distinguish observation from explanation. Surface fluency alone cannot guarantee that a text is persuasive, correctly grounded, or natural across a paragraph.

KSGT began as an effort to improve Korean writing beyond superficial inventories of repetitive phrases and AI-associated stylistic markers. Its earlier work progressed from context-sensitive style analysis to human rewrite variability and source-bound semantic and pragmatic contracts. These results are useful engineering inputs, but they do not demonstrate an end-to-end benefit to readers. The present work changes the primary object of evaluation: **the generated paragraph itself**.

A natural solution is to ask a larger model for a better paragraph. Such a baseline is not optional; it is the central competitor. The scientific question is whether an explicit, low-cost discourse-planning structure can provide additional value **beyond the information already available in the user's source, genre and writing instructions**.

Recent research has already demonstrated the promise of linguistic structure for long-form generation. Kim et al. (2026) inject discourse structures into reinforcement-learning signals, and Liu et al. (2026) construct discourse-aware planning blueprints for retrieval-augmented generation. Korean long-form collaborative writing pipelines have also incorporated structural and stylistic constraints (Kim et al., 2026). Therefore, neither discourse planning nor multi-stage generation is novel in itself. Our hypothesis concerns an identifiable interaction among **Korean contextual realization, source-conditioned planning and inference-time lightweight orchestration**, measured against strong same-model comparators.

**Provisional contributions to be tested, not yet demonstrated:**

1. A source-to-paragraph realization pipeline with an inspectable, low-cost Korean prose planning interface and explicit evidence-status limits.
2. A matched comparison protocol separating generic rich prompting from the contribution of an externally constructed discourse plan.
3. A source-work-disjoint evaluation of passage-level Korean naturalness, coherence, source fidelity and full generation cost.
4. If the results support it, a documented set of Korean linguistic phenomena where explicit discourse planning adds value; if they do not, an account of the failed mechanism rather than an inflated governance claim.

## 2. Related Work

### 2.1 Linguistically guided generation and discourse coherence

Kim et al. (2026), *Align to Structure*, train structural preferences into language-model generation, focusing on coherence and readability using discourse-informed rewards. Liu et al. (2026), *Disco-RAG*, integrate intra-passage and inter-passage rhetorical structures into a planning blueprint for knowledge-grounded generation without fine-tuning. These studies make it inappropriate to present 'discourse-aware generation' as a first-time innovation. Compared with these settings, the G10-P1 initial experiment targets paragraph-level **Korean prose** under tightly constrained source briefs, with a reusable external planning layer and direct comparison to same-model rich prompting.

Kim, Yang and Kim (2026) study a structure-and-style concurrent constraint pipeline for Korean long-form novel creation. Our work must therefore distinguish itself empirically by source fidelity, broader prose genres, explicit realization controls, cost accounting and an identifiable ablation rather than mere workflow decomposition.

### 2.2 Korean discourse realization and linguistic naturalness

Song and Cho (2026) observe that a GPT-family model can reflect Korean implicit consequentiality and topicality cues yet still differ from human patterns in particular combinations of verb semantics and discourse cues. Yu et al. (2025) introduce KoSEnd to examine sentence-ending naturalness. Such work motivates attention to topicality, referential forms and endings, but sentence-end labels or reference-choice tests cannot substitute for full-paragraph reader preference.

Kamp and Reyle (1993) provide a formal discourse representation foundation for reference accessibility and scope ambiguity. We use these insights as methodological antecedents, not as a claim to have solved full Korean formal semantics.

### 2.3 Candidate generation and precise editing

Zhang et al., *Verbalized Sampling*, provide a training-free route to diversified outputs. Zeng et al. (2025), *FineEdit*, address precise localized editing. Both are strong candidate mechanisms; neither demonstrates that an external Korean discourse planner improves full-paragraph reader outcomes. A diverse-candidate baseline should be introduced in later ablations, with matching generation budgets.

## 3. Task and Research Questions

A source task is a tuple

`z = (F, E, L, W, G, R)`

where `F` is the set of supplied factual propositions, `E` specifies known and uncertain evidential commitments, `L` specifies any license to add creative content, `W` is writer intent, `G` is genre, and `R` is intended readership. Given `z`, the system produces one or more Korean prose paragraphs `y`.

**RQ1:** Does an explicit discourse plan improve blinded Korean reader preference and coherence relative to rich prompting with the same base LLM?

**RQ2:** Does contextual Korean realization, especially topicality, reference/ellipsis, ending/register and information packaging, contribute independently of generic discourse ordering?

**RQ3:** Does planning improve source fidelity, or does it introduce new hallucination/rephrasing risks?

**RQ4:** At what latency/token/monetary cost, and under which genres and source densities, can improvements be obtained?

## 4. Architecture and Implementation

### 4.1 Inputs and constrained source semantics

The current engineering instrument accepts an explicit task identifier, genre, reader, writing purpose, an ordered list of fact strings and an ordered list of uncertainties. Each fact receives an identifier `F1 ... Fn`. In the initial deterministic planner, fact IDs remain inspectable, and a plan cannot itself synthesize additional facts.

The first implementation does **not** calculate a full semantic parse. It maps facts to discourse moves and attaches Korean realization guidance. The source brief's factual and uncertainty boundaries take priority over stylistic goals.

### 4.2 Three minimal experimental policies

**DIRECT:** a one-call request for natural Korean prose given the full brief.

**RICH_PROMPT:** a strong one-call prompt with explicit source fidelity, observational/causal separation, discourse connection, ending/register, sentence rhythm and noninvention instructions.

**DISCOURSE_GUIDED:** a locally constructed, inspectable discourse move plan included in a one-call realization prompt; no extra LLM planning call is required.

The initial plan contains a sequence of discourse moves, exact references to source fact IDs, unresolved uncertainties, and lightweight realization suggestions. This is deliberately a minimal engineering comparator; it is not proof that the particular three-move heuristic is optimal.

**Key implementation limitation:** prompt lengths differ, and the guided condition may consume more input tokens. We will record actual API usage and compare a length-matched rich-prompt control when testing efficiency or architectural advantage. A cheap plan computation does not make the total API invocation cheap by definition.

### 4.3 Further ablations (not yet implemented)

- Discourse plan without Korean-specific realization instructions.
- Korean realization instructions without an explicit plan.
- Diversified candidate generation with matched token budget.
- A trained low-cost planner or selector only if deterministic planning exhibits a real ceiling.
- Optional source-checking and local editing, assessed only if they improve the final prose.

## 5. Evaluation Protocol

### 5.1 Dataset and independence

Historical KSGT G9-P53 material contains twelve previously generated drafts from six source briefs and twenty-two paragraph hashes. The examples are **development and regression artifacts, not an unseen test set**. A confirmatory evaluation must register new document/source-work groups in advance. Every variant, paraphrase and candidate from one source work belongs in the same partition, including repeated appearances across model sizes.

### 5.2 Main outcomes

- **Blinded native-reader preference** and distinct assessments of coherence, register, readability and task satisfaction.
- **Independent source-fidelity review** by a different reviewer or adjudication role, including unsupported facts, false causal claims, quantifier drift and epistemic status changes.
- **End-to-end cost:** actual API prompt/completion token usage, elapsed time, number of calls, configured model and output limit; optionally local compute and memory when accessible.
- **Source-work-level uncertainty:** compute confidence intervals by clustered bootstrap or an appropriate hierarchical model; do not treat multiple candidates from one brief as independent samples.

Ratings by LLMs, grammar classifiers, editing distance or synthetic contracts are **diagnostics**, not replacements for actual Korean reader preference.

### 5.3 Reproducibility and fairness

All arms use the same source facts, genre and intended reader. Record model IDs, versions, decoding parameters, prompts, output length, run date and any failed outputs. The primary analysis uses the **entire assigned source-task population**, not just outputs surviving semantic filtering. Assess language improvement and source admissibility separately.

A practical confirmatory experiment should balance genres and source lengths and predeclare the smallest meaningful reader-preference effect. Sample size and power must be calculated after a small genuine pilot, not chosen for appearance.

## 6. Results — NOT AVAILABLE

**G10 model-output experiments:** NOT RUN as of the initial manuscript draft.  
**Independent Korean readers:** 0.  
**Demonstrated naturalness advantage:** NONE CLAIMED.  
**Source-fidelity comparative result:** NOT RUN.  
**Computational advantage:** NOT RUN.

No numbers should be entered here from the source-provenance courts, G8's post-reveal oracle, or API mocks. Tests that verify prompt generation or fact-ID coverage are engineering evidence only.

## 7. Discussion and Falsification

If the guided model improves actual reader preference, analyze whether the effect persists against length-matched rich prompting and across novel source works. If the outcome arises only from longer instructions, it is a prompting effect, not necessarily an independent discourse planning contribution.

If source fidelity worsens, determine whether the planner misassigns facts, whether the LLM overinterprets an inferred relation, or whether Korean realization instructions encourage unauthorized concretization.

If structured planning produces similar quality at higher cost, the lightweight architecture claim fails unless a different use case or operational constraint is demonstrated.

If these conditions do not yield an interpretable empirical contribution, the team should not publish an elaborate protocol as a substitute for a useful system.

## 8. Limitations of the Initial Design

The deterministic planner operates on author-supplied ordered fact strings, not arbitrary Korean documents. It may impose an unsuitable three-move pattern; its present organization does not infer real rhetorical relations or antecedent accessibility from text. Prompt-level Korean realization guidance does not prove that the LLM followed it. The first version lacks a genre-sensitive planning model, independent source-checking, actual generated samples, blinded human feedback and cost comparisons. These gaps must remain visible.

## References — verified primary bibliographic links

- Kim, Z. M., et al. (2026). *Align to Structure: Aligning Large Language Models with Structural Information*. AAAI 40(44), 37519–37528. https://doi.org/10.1609/aaai.v40i44.41085
- Liu, D., et al. (2026). *Disco-RAG: Discourse-Aware Retrieval-Augmented Generation*. ACL 2026, 4106–4136. https://aclanthology.org/2026.acl-long.189/
- Kim, S.-j., Yang, H.-h., & Kim, J.-w. (2026). *An Explorative Study on a Structure-Style Concurrent Constraint Pipeline for AI-Based Long-Form Novel Creation*. Journal of Internet Computing and Services, 27(3), 133–140. https://www.jics.or.kr/digital-library/107588
- Song, J., & Cho, J. (2026). *Implicit Consequentiality and Topicality in Korean: Evaluating Multiple Discourse-Cue Integration in a Large Language Model*. Linguistic Association of Korea Journal 34(2), 37–60. https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003350286
- Yu, et al. (2025). *Making Sense of Korean Sentences: A Comprehensive Evaluation of LLMs through KoSEnd Dataset*. ACL SRW. https://aclanthology.org/2025.acl-srw.29/
- Kamp, H., & Reyle, U. (1993). *From Discourse to Logic*. Springer/Kluwer. https://doi.org/10.1007/978-94-017-1616-1

Additional direct rival FineEdit and Verbalized Sampling canonical PDFs are in Research OS Drive; publication metadata must be verified at the final bibliography stage.
