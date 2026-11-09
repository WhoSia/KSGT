# KSGT G10-P1 R9.13 — Recenter Korean Prose Generation

**2026-11-09 — scientific decision:** Rebalance the program away from repeated source-boundary and selective-repair tooling, and toward **discourse planning × Korean realization × strong baseline generation × reader outcomes**. G10-P1 OPEN: no claimed reader-quality superiority.

## Why this change is warranted
R9.7–R9.12 produced verifiable artifact custody, 246-source KoLLA–UD SHA-linked matches, constrained essay-partition identification, source contract checks, and selective-edit preflight. None of those alone measures whether the resulting paragraphs are easier to read, more coherent, or more naturally Korean. The last several rounds allocated too many research units to validation tools, and too few to the originally committed generative question. This is a scope-drift correction, not a repudiation of those integrity findings.

## Existing positive foundation (do not restart research from scratch)
1. `factorial_runner_v02.cjs`: **existing** 2-model × 6-arm crossed architecture experiment, comparing GPT-OSS 20B and 120B and including compact order, deliberately perturbed order, role-aware order, rich baseline and character-length-matched prompts. The workflow is present. Its run-specific completion and reader judgments were **not independently cold-replayed in R9.13**; do not state a new confirmed number of real calls on this basis alone.
2. Existing private/Drive `KSGT_G10-P1_Factorial002_Blinded_Reader_Packet_6pairs_20261105.md`: actual GPT-OSS 20B/120B text pairs from three synthetic development source tasks, not six independent source works. This evidence should be used for **exploratory reader inspection**, with blinded identity and independent source-fidelity annotation. Its existence does not mean readers have judged it.
3. `korean_realization_v03.cjs`: Korean focus, topicality, referential continuity and ellipsis heuristics, but entangles realization advice with licensed discourse plan. `role_aware_plan_v05.cjs`: structural plan and role-order heuristic. New science should **separate these factors**.

## Four interdependent axes (not four separate paper ambitions)
- A — **discourse composition:** input ordering, author-declared temporal/contrast/background relations, macro-moves, and coherence.
- B — **Korean realization:** continuity of topics and referents; optional zero arguments; particle and sentence-ending naturalness; connectives, paragraph cadence, and reader accessibility.
- C — **generation strategy and capacity:** strong direct one-call and rich-prompt baseline, structured plan, order perturbation, diverse candidates, and multi-model scaling. Compare both latency and actual provider usage and annotate model size as moderator; character padding does not equate to token matching.
- D — **human-oriented evaluation and source authority:** independent blind reader judgments of naturalness and comprehension, separate gold source fidelity, source-work clustered uncertainty. KoLLA provenance and machine-checkable text integrity remain supported infrastructure and should not consume the core research schedule.

## R9.13 implemented factorial isolation
New self-contained deterministic prompt-construction module `g10_axis_factorial_v01.cjs` produces five conditions for each **author-provided developmental** source work, all sharing the same literal author information packet (including declared relations, uncertainty and annotations):

| Condition | Discourse plan P | Korean realization K |
|---|---:|---:|
| STRONG_DIRECT | standalone minimal comparator | — |
| RICH_BASELINE | 0 | 0 |
| ORDER_ONLY | 1 | 0 |
| KOREAN_ONLY | 0 | 1 |
| ORDER_PLUS_KOREAN | 1 | 1 |

Within four rich-baseline cells, prospectively measure the interaction `theta = E[(U11 - U10) - (U01 - U00)]`, where U is **a prespecified independent native Korean reader outcome**, and report each component main effect separately. Sign and existence of theta are currently unknown. Prompt character lengths must be recorded but cannot be substituted for real token counts. The full source information is constant; additional hints are computed representations, not extra source facts. Repeating a fact ID in a suggested order is not evidence that the plan is linguistically correct. The `KOREAN_ONLY` hints are heuristic and may hurt; ablation makes a falsifiable prediction.

**Engineering:** 13/13 synthetic Node tests PASS after correcting one test fixture's stale author relation (not a model failure). No provider calls made by this module; not yet a human-rated experiment. The best next experimental block is **three author synthetic development works × five conditions × two Groq models = 30 real completions**, before any holdout. This is a proposed budget, not an executed API bill. The existing two-model six-arm cohort should be reviewed as prior developmental evidence to reduce duplication.

## Evaluation standard and risk of overclaim
Predeclare a reader task measuring source comprehension (short questions with independently established answer keys), pairwise naturalness judgments and referential tracking; do not let one unblinded researcher judge both prose aesthetics and semantic entailment. Evaluate all failed/truncated outputs. Actual source-work is the inference unit; repeated model, prompt and reader labels are dependent observations. Add genre-disjoint, source-disjoint heldout and a new writer-authored cohort to test generalization after developmental prompt tuning stops.

**Decision gates:** prioritize generation evidence; branch D continues with bounded maintenance. An additional KoLLA boundary lemma or edit-check test has lower marginal value than one well-formed Korean-realization ablation. If rich prompt/strong direct perform equally well or better under comparable computation, report the negative result instead of relabeling gate policy as novel generation theory.

## Adjacent research (verified papers, distinct claims)
- Kim et al., *Align to Structure*, AAAI 2026 DOI `10.1609/aaai.v40i44.41085`: structural rewards and long-form generation; stronger rival than an untrained list-of-facts plan.
- Liu et al., *Disco-RAG*, ACL 2026 DOI `10.18653/v1/2026.acl-long.189`: graph- and blueprint-conditioned generation in retrieval/summarization; related architecture, different task.
- Yu et al., *Making Sense of Korean Sentences*, ACL SRW 2025 DOI `10.18653/v1/2025.acl-srw.29`: Korean sentence endings naturalness annotation, not proof of entire document quality.
- Song and Cho, *Implicit Consequentiality and Topicality in Korean*, 2026 DOI `10.24303/lakdoi.2026.34.2.37`: discourse cues, topicality, referential forms; informs possible ablation, not ready-made sentence realization oracle.

**Custody:** GitHub = source/tests and decision record; Google Drive = exact original code/receipt ZIP; Notion = semantic ledger. No credentials or private original learner passages in public code. No bot-authored commits. Original KoLLA essay boundaries still uncertified. No independent human ratings as of this decision. **G10-P1 OPEN.**
