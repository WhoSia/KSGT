# KSGT G10-P2 R5n — Evidence closure to causal writing-quality research

Date: 2026-11-23 KST · Status: PROSPECTIVE RESEARCH DIRECTIVE / NOT AN EXECUTED HUMAN STUDY

## 0. Research decision

The project objective is **demonstrably better Korean complete-text writing under source fidelity, reader usefulness, and all-in cost constraints**, not verification activity or commit volume. The mandatory strong GPT-OSS 120B direct-writing rival remains the reference. G10-P2 is OPEN / QUALITY_HOLD; verified historical model calls 340; no independent human preference or native editorial superiority yet. Maintain zero invented evidence. No claims of neural-model novelty or advancement to G10-P3 based solely on implementation pass rates.

Provenance: `experiments/g10-p2/RESEARCH_PROGRAM.md`, `r5/02_CAUSAL_IDENTIFICATION_PREREG_20261121.md`, `r5/05_READER_BELIEF_SUFFICIENCY_HYPOTHESIS_20261121.md`, `r5/27_R5J_NATIVE_KOREAN_REVISION_CORPUS_ADMISSION_AND_QUALITY_PROTOCOL_20261121.md`, R5g/R5i negative empirical results, R5l/R5m.1 receipts, and 2026-11-22 server-side audit summary supplied by user. This document does not claim to have opened the five Windows C: reports. Separate source identity, derivative metrics, inference and independent reader outcomes.

## 1. Gates to close before final evaluation

| Gate | What counts as evidence of closure | Current state and blocker | Owner | Action if blocked |
| --- | --- | --- | --- | --- |
| G0-CUSTODY | artifact-by-artifact ID, local digest, Drive ID, cold readback hash for each result needing full-byte authority, Git source fingerprint | R5m/R5m.1 Drive 13/13 metadata presence; full cold SHA not claimed | Research OS | Retain size-only flag; do not claim archived-byte verified |
| G1-CP5 | hash each 10 frozen compressed parts, verify whole joined SHA and optional JSONL row count, identify sampling/representation grain | 10 Drive fragments metadata verified; 0 rows freshly parsed | Corpus/Server | Keep aggregate features historical and excluded from primary quality scoring |
| G2-P36 | actual 2020 and 2025 raw schema sample, versioned native adapter, exact source anchors and semantic case taxonomy, 2020-vs-2025 difference tested | Historical official 556,164 slots, adapter path 404; earlier similarly named reviewer-response adapter is unrelated | Corpus/Server | Construct a clean adapter only from authenticated schema; do not auto-join/version-flatten |
| G3-P62 | source-work identity and exposure graph, disjointness certification, previously exposed R6 proposals quarantined from gold | R6 12 machine proposals/0 human judgments | Corpus/Server | Use development only; exclude ambiguous identity components from held-out |
| G4-EDITORIAL | rights-cleared original→edited Korean works, stable work/author IDs, paired before/after, genre/audience, editing provenance | No independently validated native Korean editorial pairs available | Research director | Public results restricted to mechanism/dev data; no quality superiority experiment |
| G5-EVAL | frozen sampling frame, leakage/exposure rules, independent blind reader and independent source-auditor scoring plan, compute and annotation budget | Prereg outlined; 0 independent reader judgments | Research director | Hold G10-P2 QUALITY; no forced generation expansion |
| G6-CODE | CI and local reproducibility of actual corpus adapter + end-to-end writer, regression for polarity/actor/modality, full corpus access permissions | Synthetic interface 6/6 server-reported, R5m.1 synthetic 13/13; no real end-to-end integration | Engineering | Build bounded integration, keep untrusted-input provenance separate |

**Critical dependency:** CP5 is descriptive EDF sufficient statistics with `raw_text_present=false`; even a complete G1 does not unlock G4 or semantic G2. G4 and G5 are the decisive gates for a quality claim. G1 may be deferred when it would consume resources without changing the forthcoming R3/R4 outcome; document the deferral rather than conflating closure with universal total data processing. Do not waste months rehashing 20.27GB ZIPs with no reason; shard 9/9 sample is not full integrity certification.

## 2. Phase A — Before experimentation, freeze identification and falsification (high priority)

- Align the corpus source IDs to an evidence ontology: `work_id`, `document_id`, `raw_digest`, `origin_license`, `span_coordinate`, `predicate`, typed argument candidate set (not arbitrary one pick), temporal/modal/negation scope, edition-specific annotation semantics, prior-exposure family. No unverified semantic or independent human authority from keyword equality.
- Assemble actual source-work-disjoint, author- and near-duplicate-aware development / validation / held-out **components**, keeping all variants, quotations, annotations and rewrites of one underlying work in one component. Treat independent work as the statistical cluster. Human annotation metadata are required when claiming author independence.
- Establish matched input and writer conditions. Distinguish information vs computation vs state representation vs timing of feedback vs selection. A state-only prompt comparison is not a novel reader-state mechanism.
- Freeze scoring schema and assignment process **before** reading held-out outcomes. No invented labels or retroactive thresholds.
- Sanity-check with prior exposed negative examples (folded paper changes owner, planned notice becomes completed, negation inversion, homonymous windows, unlicensed future promise). These are dev-only counterexamples.

**Stop:** if source-work independence, protected provenance, or real original→revision pairs are impossible, do not pretend the ensuing experiment is a prospective quality test. Instead publish a limited source-provenance/annotation-method study.

## 3. Phase B — Real full Korean text rival trial (priority P0 once G4/G5 pass)

Same capable provider model, same task, same underlying source, same audience, matched sampling and logged tokens:

A. `STRONG_DIRECT`: strong direct full-text generation or full edit, one call.
B. `RICH`: full genre/task instruction, no state engine.
C. `STATE_AS_TEXT`: **identical verified state** explicitly passed in Korean prose after same observed prefix.
D. `STATE_CONTROLLER`: same candidate inventory and state, executable source-realization constraint/abstention only; text is not revised by unsafe string deletion.
E. `EQUAL_COST_ITERATIVE`: spend total measured model calls/tokens and selection/human effort available to D on a normal revise/select procedure.
F. `KEEP`: retain already adequate original, avoid overediting.
G. `SHAM_STATE`: stale/planned-but-not-realized state as sensitivity negative control; not presented to end users as authoritative.

For full generation and editing, predefine the task conditions separately; do not mix free fiction expansion with fidelity-bound notices in one unexplained average. Randomize display order and blind condition names. After independently sourced full texts are written, have readers rate task-usefulness, clarity, and Korean idiomaticity / indicate first edit. A separate source-visible auditor evaluates actor/object ownership, proposition truth, uncertainty, condition, polarity, quotation, obligations, chronology, and forbidden inventions. Audit both false positives and false negatives. Pair outcomes at source-work level; uncertainty intervals should be source-work-clustered, not computed by treating multiple judgments as new works. Record full model usage, latency, human minutes, retries, and setup effort. Never use LLM self-score as human gold.

Pilot sizing: start with a modest genuinely independent **feasibility pilot** to estimate event rates, variance, disagreement and processing overhead; choose confirmatory sample size with a recorded power/precision calculation **after** pilot and before independent evaluation, without pretending 24 source works are pre-proven adequate. Freeze a held-out segment untouched by pilot. The previous project suggestion of >=24 works is a planning heuristic only. Abort or reduce scope if real corpus rights disallow sharing model inputs.

## 4. Phase C — After gate closure and first human outcome

### Decision branch POSITIVE (not yet established)

Preconditions: no critical source fidelity degradation; independently measured whole-text reader utility improves over **both** `STRONG_DIRECT` and `STATE_AS_TEXT`, and the improvement survives the `EQUAL_COST_ITERATIVE` rival after full cost accounting, with confidence/credible interval and multiplicity strategy fixed in the confirmatory analysis plan. Check that effects are not confined to one familiar genre/source/editor. Replicate using new source-work components and another topic/register distribution. Then investigate a minimal reader-state statistic `Z_t` sufficient for task-specific reader behavior; compare ablated features, memory footprint and selection costs, and only later train/evaluate a **small** model against matching baseline architecture/parameter/tokenizer/training data budgets. G10-P3 is **not automatic**: require separate stage review and tangible replicable effect.

### Decision branch MIXED / SUBGROUP

If source fidelity improves but prose naturalness or total budget loses, prefer a narrow **risk-aware intervention router**: preserve strong direct writer ordinarily, invoke the verified bounded controller only on demonstrably high-risk source types (polarity, named entity ownership, unfulfilled promise) with measured calibration and abstention. Estimate out-of-distribution risk and false interventions. Publish the Pareto frontier; avoid presenting a feature-specific win as universal writing quality.

### Decision branch NULL / NEGATIVE

If `STATE_AS_TEXT`, direct, or equal-cost ordinary revision matches or beats the controller, **retire mandatory executable reader state**, retain corpus provenance/source diagnostics and human audit as independently valuable infrastructure. Study simpler pragmatic editing/genre modeling or compact inferential control without source-specific brittle templates. A rigorous null result is a credible scientific contribution, not grounds for quietly shifting the goalposts.

### Decision branch INVALID / UNDERPOWERED

If held-out leakage, role imbalance, unreliable rubric, unmatched compute or low agreement undermines the trial, report non-identification/feasibility evidence, repair the design **prospectively** and do not promote any arm. Do not reinterpret invalid observations as support for a new architecture.

## 5. Research portfolio after verification: avoid DFS into one gate

| Track | Share of strategic attention (planning only) | Expected product | Scientific hazard |
| --- | --- | --- | --- |
| Full-text quality + causal writer comparisons | 40% | source-disjoint paired completed-text evidence | self-selected lucky examples; unblinded preference |
| Human reader-state measurement | 25% | task-specific uncertainty set and calibration | model-predicted reader state mistaken for actual human comprehension |
| Source/linguistic evidence infrastructure | 20% | verified P36/P62 adapters + CP5 descriptive control | treating aggregate distributions as meaning gold |
| Theory/novelty and negative controls | 15% | bounded sufficient-state hypothesis, ablation and falsifiers | merely renaming classic planning/centering as novel |

Percentages are **resource planning**, not empirically derived optimum. Prioritize R3/R4 outcomes over archival maximalism: CP5 and NIKL 20GB are valuable, but only a causal reader/text improvement justifies expanding the writer architecture.

## 6. Operational cadence and deliverables

- Every bounded execution: `Discover → Plan → Execute → Verify → Iterate`, with an anytime stop when no further evidence can change the decision.
- Source code and preregistration on existing `research/g10-p2-reader-state-coupled` branch, human `WhoSia` authorship/committer; **never** `github-actions[bot]` as contributor. Do not multiply branches or create busywork commits. CI read-only.
- Notion = research judgments/lineage and negative-result decisions; Drive = private raw model/corpus bytes, receipts, full manuscripts and preservation packages; GitHub = code, public-safe protocols/tests. Each created artifact gets stable ID, local SHA, Drive ID and upload/cold-check status. No anonymous sandbox-only final outputs.
- Monthly/sequenced director review should record: the next single decisive empirical question, expected falsifier, strongest available baseline, stage gate, allocated source IDs, budget ceiling, current failure and concrete stop condition. Do not claim continuous background execution from a chat; each work session produces bounded auditable results.

## 7. What is *not* done yet

This is a **research program and decision contract**, not a completion receipt for CP5, the server prototype, P36 adapter, P62 disjointness, licensed native editorial pairs, or human ratings. Historical 340 P2 provider calls and 0 native independent quality ratings remain unchanged. Prior server audit reported but five Windows-local C: reports are not directly accessible here. The next highest-value unlocked experiment is **native original→revision source intake with license + work-group identity**, followed by a genuinely source-work-clustered full-text pilot. CP5 validation may run alongside, but CP5 cannot supply the missing human outcomes.
