# G9-P60 — Literature Rival Audit and Prospective Falsification Design (2026-11-03)

**Status:** RESEARCH DESIGN ONLY / NO NEW RUN / NO HUMAN JUDGMENTS / NO PROMOTION.  
**Official stage remains:** G9-P60 OPEN. This document supplements, and does not supersede, `RESEARCH_PROGRAM.md`, P59, or P64-P9. No new G9 stage or claims of end-to-end Korean-writing advantage.

## 1. Original-source custody and reading scope

Reviewed readable source contents directly from the Research OS shared Google Drive. These are source papers, not independent Korean editor/reader annotations. The following are claim-specific reading notes, not a declared exhaustive page-by-page reproduction:

1. **Zeng et al. (2025), FineEdit**, *Bridging the Editing Gap in LLMs: FineEdit for Precise and Targeted Text Modifications*. [Canonical PDF](https://drive.google.com/file/d/12MrDx-4inoPw50qN_96Hw3OHWf6UHpLC/view). InstrEditBench (>30k tasks), DiffEval structure/semantic filtering, targeted supervised finetuning. Mainly Wiki/LaTeX/code/DSL; controlled-context and comparator limitations acknowledged by authors. **Preempts:** novelty claim based solely on precise edit-localization, diff control, structural preservation or small fine-tuned editor.
2. **Zhang et al. (2025 arXiv; file carries v4 of 2026-07-15), Verbalized Sampling**, *How to Mitigate Mode Collapse and Unlock LLM Diversity*. [Canonical PDF](https://drive.google.com/file/d/1ugGf5KJdAbm7K2WJ6l_0k7zG05OHur6d/view). Training-free multi-candidate, probability-verbalizing prompting; paper reports improved creative-task diversity. Its creativity quality uses an LLM judge and its diversity proxies are not Korean pragmatic admissibility nor independent Korean reader preference. **Preempts:** novelty claim based on diversified candidates through prompting alone. Bibliographic date in canonical filename requires final-publication audit before formal citation.
3. **Kamp & Reyle (1993)**, *From Discourse to Logic*. [Canonical readable book](https://drive.google.com/file/d/1w3Fzz43N1OkSJaKMQmzx0j6GJmYAS7MA/view). Consulted Chapter 1 pronouns, DRS verification/truth/accessibility (§1.4), and §3.7 scope ambiguity in extracted text. The work provides formal ancestors for discourse referents and alternative readings. **Preempts:** presenting a set of plausible referents, accessibility or underspecification as novel formal semantics.
4. **Dwivedi-Yu et al. (2024), EditEval**. [Canonical PDF](https://drive.google.com/file/d/1A2NcyWeUo8BAMqp8FWATIBz-QxSECTN0/view). Task-dependent editing metrics, English-heavy and Wikipedia-centered coverage; an exact target match is not an automatic whole-document or Korean reader-quality measure.
5. **Geifman & El-Yaniv (2017)** [PDF](https://drive.google.com/file/d/1nrnUI6NsACYS0t1--0GYg-FO9WRCCPXM/view), **Xin et al. (2021)** [PDF](https://drive.google.com/file/d/1UirfkSMgTFmoTKrv1WWLWgiz01i05Vlf/view). Established selective classification/abstention and risk-coverage evaluation. **Preempts:** claiming abstention, thresholding or risk-coverage as original mathematics.
6. **KLUE (2021)** [PDF](https://drive.google.com/file/d/15wzPJ_tnq7gvA2mC3Beh0cYv1fTqdn7g/view). Korean STS and NLI are useful baselines, but entailment/semantic similarity alone do not certify pragmatic felicity, authorial intention, or natural writing preference.

**Excluded:** Asher & Lascarides, *Logics of Conversation*, available only as a large Peking University Press edition image scan with zero text extraction in sampled pages; preserved as edition/text-extraction HOLD. No claim that its actual chapters have been read or OCR-verified.

## 2. What KSGT already found and what it did not find

- **G8 S7:** frozen six StyleKQC query groups; 52/54 strict admitted anchors; source nCED 0.576659, oracle best-of-four 0.415014. This is *retrospective candidate coverage* after reveal, **not prospective reader-selected quality**. [S7 Court](https://docs.google.com/document/d/1xXfxSa2SSrJbZ0dClsvmYQa-KKt-wbm-TaWSrIV87T4/edit)
- **G8 S9:** four groups; 28/36 strict anchors; forced-edit3 0.480643 vs source 0.526259, identity-protected4 0.451793; forced edits all worse than identity for 9/28 anchors. **Identity preservation is useful as an available choice**, not proof that a live policy can identify KEEP cases. [S9 Court](https://docs.google.com/document/d/1XlBDlcNPSqHOwQT4uqtAJdqUGT0a1Yq78-gfo6PyN0w/edit)
- **G8 S10:** source-only KEEP/EDIT/ABSTAIN predictions correct 2/9 under frozen court definitions; 73 strict anchors after 8 exclusions. The source-only predictor failed and must not be repackaged as a successful abstention policy. [S10 Court](https://docs.google.com/document/d/1Lk8GS1rF98OcA6cSbVc6j3N-1yOp6pW4ixNcidVnHKg/edit)
- **G8 KoLLA R2at:** 1,418 sentence blocks, 440 string-identical across two human editors, but actual editor behavior (PANEL-C) is not the same as independent semantic/pragmatic admissibility (PANEL-V) or whole-reader preference (PANEL-Q is a different scale). No 'single corrected sentence as unique gold' shortcut.
- **G9-P60:** original P53 artifacts contain 12 model drafts linked to 6 source-brief components and 22 hashed paragraphs. Two P60 provisional edits share one exposed EX09 work; zero newly independently adjudicated human repair outcomes, zero new human reader preference, and no genuinely fresh holdout. [Official P60 program](https://github.com/WhoSia/KSGT/blob/main/experiments/g9-p60/RESEARCH_PROGRAM.md).
- **G9-P42/RIGC:** bounded synthetic controls for unwanted collateral modification, not evidence that the proposed new system is globally better than a contemporary strong LLM.

## 3. Distinct candidate scientific contribution

**Hypothesis, not result:** On a *predeclared common source-task universe*, a Korean-specific source-anchored intervention decision (including KEEP and ABSTAIN), with admissible candidate generation and independent validation, may improve **qualified revision utility** at matched compute, compared with strong direct-edit and precise-edit baselines.

**Novelty cannot rest on:** fine-grained editing, multi-candidate generation, semantic similarity, risk-coverage, DRT accessibility, or selective rewrite as an isolated technique.

**Potentially distinguishable interaction to test:** risk of introducing a new unsupported commitment (factual, referential, or epistemic), cost of failing to repair a named defect, and preservation of licensed local variation. KSGT must demonstrate incremental advantage empirically over existing techniques rather than assert novelty by combining them.

The important distinction is between:
- `ORACLE_PORTFOLIO`: closest candidate under a known human reference **after** reveal (upper bound, not deployable performance).
- `PROSPECTIVE_POLICY`: chosen candidate or abstention from only information available **before** outcome reveal.
- `HUMAN_PREFERENCE`: independent human judgments, not model self-evaluation or surface-distance proxies.
- `ELIGIBLE_VALID_OUTPUT`: candidate judged source-admissible; conditioning only on survivors risks selection bias.

## 4. Predeclared rivals, policies and axes

Rivals at comparable source context, instruction, generation budget and hardware:
1. `NO_EDIT` identity baseline.
2. `DIRECT` direct matched LLM rewrite.
3. `CONSTRAINED` matched LLM with explicit semantic/collateral preservation instruction.
4. `PRECISE_EDIT` strong fine-grained editing baseline (FineEdit if language, availability and licensing make a meaningful Korean trial possible; otherwise honest same-model precise patch implementation, not a claim to reproduce FineEdit).
5. `DIVERSE_VS` Verbalized Sampling / budget-matched diversified candidates; no claim the paper's reported gains transport to Korean.
6. `KSGT_GATED` same generation candidates where feasible + source-grounded evidence gate + prospective selector + KEEP + ABSTAIN.
7. `KSGT_MINUS_GATE` and `KSGT_MINUS_KEEP` ablations.

Evaluate on identical source-task IDs, retaining all failures:
- Source factual/pragmatic admissibility: PASS/FAIL/UNCERTAIN with independent witness, separately broken down by factual, quantifier, referent, negation, discourse, attribution, stance.
- Named-defect repair: independently adjudicated, including cases with **no defect needing repair**.
- Collateral harm: non-target changes of protected claims and licensed form/function.
- Blinded native-reader preference/comprehension: only if actual human raters are recruited, not fabricated or inferred.
- Cost: end-to-end wall time, generated/verifier tokens, number/model size of calls, peak memory and monetary estimate; include retry/abstention and selection costs.
- Two denominators: admissible-only quality for diagnosis **and** source-task-wide qualified success/utility. Never delete failed outputs from the primary denominator.
- Source-work/document cluster uncertainty; candidate texts and multiple raters are not independent source observations.

## 5. Formal decision target for research (NOT a new theorem)

For source task `i` and action `a` in {KEEP, EDIT(candidate), ABSTAIN} define a vector of **measured** outcomes (when available):
- `H_i(a)`: source/pragmatic violation loss;
- `D_i(a)`: unmet named-defect loss;
- `C_i(a)`: collateral loss;
- `T_i(a)`: compute cost;
- `U_i(a)`: observed native-reader utility.

Do **not** collapse these by invented scalar weights. First compare policies on their empirical Pareto frontier and prespecified constrained objectives. An editorial abstention is not equivalent to KEEP and does not constitute a rewritten output. A bounded DRT-like representation of possible readings is a source-contract *instrument*, not an independently certified full formal semantics for Korean.

## 6. Necessary empirical gates before an article can claim superiority

- Rights/attribution inventory and exact source-brief SHA, document-group/similarity contamination graph.
- New truly unexposed source tasks frozen before method tuning; historical P53 and G8 evaluation groups remain retrospective/pilot only.
- Candidate generation with fixed seeds/decoding configs, blind locked outputs and compute accounting; common-candidate comparison alongside full independent system comparison.
- Distinct blinded human source-admissibility reviewers and reader-preference reviewers; documented adjudication disagreement and abstention; external independence cannot be replaced by 'multiple AI personas'.
- Predeclared primary metric(s), coverage and risk definitions; report interval estimates grouped by source work and per-genre error audit.
- Explicit negative controls: fact/number drift, negation scope shift, unsupported antecedent expansion, epistemic attribution deletion, acceptable irregularity flattened, harmless no-op target.
- A genuinely hard baseline: prompting/VS/FineEdit-style precise edits using similar or greater token budgets and current models, not an intentionally weak one.
- If no qualified human labels are available: scientific conclusion limited to implementation and bounded canary behavior; **HUMAN QUALITY and NOVELTY SUPERIORITY remain HOLD**.

## 7. Two decisive falsification tests

**F1: Oracle-to-policy gap.** If a diversified portfolio covers human anchors but the prospectively chosen candidate yields no improvement over NO_EDIT/DIRECT under source-level human evaluation, the 'candidate diversity -> quality' inference fails. A larger oracle coverage score is not a rescue.

**F2: Value of the gate.** With candidate generator held fixed, if source-grounded gating fails to improve *task-wide* admissibility/repair/collateral outcomes at a comparable budget, or costs exceed benefit relative to a strong constrained prompt, the lightweight KSGT advantage hypothesis fails.

## 8. Research continuation

Within G9-P60 (without a new formal stage):
1. Check the new competitor files against existing official P60 experiments and ensure no unearned rebranding.
2. Construct frozen **source-work-grouped** source/candidate manifest, separate retrospective, development and prospective splits; do not include copyrighted full text in GitHub by default.
3. Implement a no-data-fabrication policy-evaluation harness with explicit missingness and source-linked numerator/denominator invariants.
4. Run baseline pilot on accessible legitimate data; do not call the pilot a prospective human test.
5. Only then recruit adjudicators and collect actual independent Korean assessments.

**Custody:** Original papers/books in shared Research OS Drive; semantic reasoning/Harvest relations in Notion; public methods and hash-only audits in human-authored GitHub commits. GitHub Actions tests may run but may not commit/push/author/merge/tag. No bot contribution, no forced Git-history rewrite.
