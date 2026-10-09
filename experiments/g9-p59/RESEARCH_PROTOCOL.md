# G9-P59 — Reader-State Reference Choice: Preregistered Design (v0.1)

Status: OPEN / STRUCTURAL STIMULI MATERIALIZED / HUMAN WORLD CONTACT HOLD.
Parent: G9-P58 CLOSED, type-guard only. This stage does not reopen its verdict.

## Explanandum and competing explanations
Human Korean writers may select concise partitive reference (그중), an explicit antecedent noun phrase, or sentence-level restructuring even when nominally conveying the same subset claim.

- H1 accessible single referent -> KEEP relative to ambiguous contexts.
- H2 multiple accessible possible groups -> increased overt disambiguation or RESTRUCTURE.
- H3 reader knowledge and writer/genre preferences moderate H1/H2.
- H4 mechanical explicitness is not always better than restructuring.
- Rivals: length preference, literal repetition aversion, annotator instruction priming, genre prompts, unequal context informativeness.

## Four cells currently authored
Two genres (report/narrative) x unique/competing antecedent. [reader_choice_probe.cjs](./reader_choice_probe.cjs) contains all four. These are deliberately small pre-pilot examples, **not** a validated factorial study. Competition necessarily adds discourse information; these four cannot isolate unique causes or reader common ground and must not support effect estimates.

## Actual human-contact protocol
1. Expert Korean reader checks *each candidate* for referent, number, coherent sentence meaning and natural Korean usage; record adjudicator + disagreement, never infer from regex.
2. Produce source-preserving matched contexts, with two counterbalanced target assignments and distractor order; additionally randomize how much context a reader has seen without changing the actual source facts.
3. Ask independent readers to identify the referent first, with 'ambiguous/unknown' response permitted. Capture both choice and confidence.
4. Ask writers to KEEP, EXPLICIT, or RESTRUCTURE freely. Preserve original free text, not only assigned category. Blind hypothesis and candidate identity as feasible; counterbalance versions and presentation.
5. Separate quality/naturalness ratings from correctness and source fidelity. Never make a composite 'human-likeness' target.
6. Record voluntary consent appropriate to the study, no unnecessary identifiers, participant-level clustering and item provenance. Do not publish private corpus excerpts without rights.

## Possible preregistered estimands
- Referent identification: Pr(correct | condition, presented choice). Correct refers to an independently certified anchor; uncertain/ambiguous is its own valid outcome.
- Writer preference: Pr(KEEP/EXPLICIT/RESTRUCTURE | assigned context, reader condition, genre). Distinguish produced edits from survey judgments.
- Comparisons should use participants and items as clustering units, and include uncertainty intervals. No numerical thresholds or samples falsely claimed as observed.

## Stop/repair rules
- Abort preference claims if referent ambiguity is unintentionally altered, source semantics shift, blind labels leak or validated human observations are absent.
- If free structural revisions are common, expand the action ontology before modeling only KEEP vs EXPLICIT.
- If reviewer agreement is poor, surface disagreement; do not manufacture a consensus gold.
- The code's four string guards are instrumentation, not Korean linguistic accuracy.
- Do not promote a synthetic test to human-world-contact PASS. Do not allow GitHub Actions to commit, push, tag or alter refs.

## P59 current ruling
BOUNDED IMPLEMENTATION PRESENT / EMPIRICAL IDENTIFICATION HOLD.
Only transition to HUMAN_CONTACT_PASS after traceable consented Korean reader/writer observations and source-licensed matched items exist.

## 2026-10-09 v0.2 counterbalanced fixture upgrade
[reader_state_v02.cjs](./reader_state_v02.cjs) adds eight authored cells = 2 source targets x 2 group orderings x 2 reader-knowledge briefings. Full group facts, numeric cardinalities and the target expression remain stable within each full/limited briefing pair. This removes the earlier unique-group versus two-group *source-facts* imbalance inside those pairs. It does **not** by itself causally identify a reader-knowledge mechanism: briefings differ lexically and the limited condition admits unresolved reference. Authored target IDs are not independently recovered gold. A future preregistration must control briefing length/lexical effects and distinguish source-grounded intended target from reader-inferred referent.

No training or server use authorized until after RITHM and owner availability, currently tentatively next week. Offline code development, synthetic tests and CI read-only computation are permitted. Borrowed host must not be touched beforehand; future host uses confirmed HDD-only work directory, not /home/sean/coding/oozoon, which was found to be on SSD.

## 2026-10-09 v0.5 — source-scene and reader-state comparisons
- [dataset_v05.cjs](./dataset_v05.cjs): **4 explicitly synthetic source-scene families**, 2 writer-intended group targets × 2 antecedent orders × 2 declared reader-accessibility scopes = 32 rows. Dev 16 (2 families), validation 8 (1 family), synthetic holdout 8 (1 family). A given family never crosses split boundaries. All families still share the same *two-group discrete subset* template, so template-level generalization is **not established**.
- **Matched manipulation**: within each scene × target × antecedent order, source sentence, writer intention and KEEP/EXPLICIT alternatives are *byte-identical*, while only the declarative `readerState.accessibleRefs` differs. This is a controlled machine-input intervention, **not** evidence of real readers' accessible referents. Varying target changes the writer intention; it does not preserve the target meaning.
- [leakage_audit_v05.py](./leakage_audit_v05.py): independently verify per-row SHA-256 across JavaScript/Python JSON, split by family/scene/source-fact fingerprint in SQLite, and reject renamed-family cross-split aliases. All source scenes are authored synthetic and no third-party native corpus is claimed.
- [model_compare_v05.cjs](./model_compare_v05.cjs): same packet IDs, declared writer meaning, declared reader state, data fingerprint, complete coverage, unique prediction IDs; accept separately supplied model outputs through `--compare-file`. The local policy fixtures always KEEP, always EXPLICIT and always ABSTAIN are **not trained models**. No baseline wins in linguistic naturalness or human preference without external evidence.
- The reader-state contrast is an **ablation interface** for a future model. Keeping a metadata field constant/altering it is not a valid human reader trial. A valid future model comparison must separately freeze model checkpoints, learning resources, tokenization, corpus custody and compute envelope, and test on independent native source families.
- Reject the misleading claim that 4 authored families are 4 native gold examples. Distinct synthetic scenes ≠ independent Korean author labels; structurally disjoint splits ≠ unbiased human naturalness estimation.

## G9-P59 v0.6 — Belief-only counterfactual and rival-architecture theory (2026-10-09)
[Formal hypothesis and proof](./THEORY_V06.md), [executable belief oracle](./intervention_v06.cjs) and [v0.5 adapter](./intervention_bridge_v06.cjs).
- Maintain identical source, writer target/quantity, and candidate surface forms across `do(model_reader_belief=b)`. These are **simulated inputs**, not manipulated real readers.
- Target-aligned surprisal `-log b(target)` is not interchangeable with the scalar entropy `H(b)`. Mirrored `(0.8,0.2)` vs `(0.2,0.8)` yields equal entropy, different target-aligned reference decisions under the specified idealized utility.
- Toy theorem: KEEP loss `-log b(target)`, EXPLICIT relative cost `c`, threshold `b(target) < exp(-c)`. No calibrated human cost/reader belief, and free restructuring unmodeled.
- Compare surface-constant, entropy-only, target-aware and neural/discourse-memory hypotheses with equal evidence access; **do not** give an explicit-state architecture a privileged reader-state vector withheld from baseline Transformers.
- Required tests: message invariance, referent-label equivariance, zero-probability distractor invariance, equal-entropy mirror witness, probability validation and causal-input isolation. No architecture superiority inferred from passing toy tests.
- Prior `v0.5` scene-disjoint split remains synthetic only, with a single shared construction template. Reader-choice gold and genuine long-context memory competition remain HOLD.

## P59 internal §v0.7 — finite-memory and delayed-query comparison
This is one subsection of **the existing P59 stage**, not an independent versioned research page or a new official title. The cumulative mathematical manuscript remains [THEORY_V06.md](./THEORY_V06.md).

Memory question: for N uniformly drawn target identities with only m stored bits and no target-bearing decoder side channel, correct identification cannot exceed min(1,2^m/N). The 5-identity/2-code exhaustive enumeration verifies the bound. All alternatives observe the same symbolic event/role stream.

[Node memory policy experiment](./memory_v07.cjs): 168 target-position-distractor histories, position-only nuisance identities, four-bit one-slot comparisons plus independently reported larger-window payloads. [Python audit](./memory_audit_v07.py): independently recomputes policy outcomes, checks independence from target labels, and rejects a deliberate injected nuisance leak. [Delayed-query test](./delayed_query_v07.cjs): a future-unknown query over two independent eight-way targets requires at least six bits for guaranteed perfect reconstruction of both.

These results benchmark symbolic memory-update *policies*, not actual Transformer, selective SSM or entity-memory neural networks. Any architecture claim requires equal information/role labels, model and activation-memory accounting, matched training data/compute, document-disjoint native Korean evidence and independent meaning/style adjudication. Remote CI and human superiority are not implied by local PASS.

## P59 internal §v0.8 — exact delayed-query average-recovery ceiling
This is a subsection of the existing P59 protocol. The finite-state two-referent delayed-query setting has an exact optimally achievable average retrieval rate, not just the zero-error floor. See [cumulative theory](./THEORY_V06.md) and [executable bounded enumeration](./rate_distortion_v08.cjs).

- Two independent uniform N-way targets; encoder cannot see a future uniform a/b query; decoder has only K finite memory states and the query, not source text.
- Maximum accuracy is K(2N-K+1)/(2N²) for K<=N; (N²+K)/(2N²) for N<=K<=N².
- A three-bit first-only witness at N=8 is already optimal in this toy setting (72/128). Failure to exceed it is not evidence that memory architecture innovations are useless for different distributions, longer sequences, or natural language.
- A future neural comparison must **not** apply finite-bit bounds to unquantized continuous states. Account for precision, cache, context rereads and all target-bearing side channels. Frozen query timing, data budget, training resources and source genealogy are mandatory.
- A trained Transformer, SSM, hybrid or entity memory has still not been evaluated. Native Korean source semantics and human preferences remain unobserved. No independent new P-stage is opened.

## P59 internal §v0.9 — writing ability as an empirical benchmark, not an AI-detection contest

**Return to origin:** P59 §v0.7–§v0.8 finite-memory claims become an ingredient in Korean writing ability evaluation, not the definition of good prose. The official lab stage is still G9-P59; this is merely its next internal subsection.

The primary future target is a source-admissible improvement in actual Korean writing: **reader understanding, discourse structure, naturalness, genre/register fit and useful revision**. No automatic 'humanlike' or AI-detector evasion score is authorized.

**Current runnable bridge:** [writing_benchmark_v09.cjs](./writing_benchmark_v09.cjs) runs authored contrast fixtures: 32 P59 v0.5 rows x 4 outcomes. It may reject known subset-count mutations, flag unresolved reference, and hold unknown reconstructions. It must never turn a structural result, a fluency proxy or model-judge agreement into human preference. All 32 rows remain synthetic variants from only four scenes sharing a common two-group template. The planned full writing tasks (paragraph coherence, revision and register) have *zero* independently adjudicated samples here.

**Evidence transport from actual papers:** [WritingBench (NeurIPS 2025)](https://proceedings.neurips.cc/paper_files/paper/2025/hash/4aedf0cba303537fcb6cf948bb41b2df-Abstract-Datasets_and_Benchmarks_Track.html), [SummEval](https://aclanthology.org/2021.tacl-1.24/), [ACES](https://aclanthology.org/2023.wmt-1.57/), [EditEval](https://aclanthology.org/2024.conll-1.7/), [scientific revision evaluation (ACL 2025)](https://aclanthology.org/2025.acl-long.335/), [RARR](https://aclanthology.org/2023.acl-long.910/), and [G-Eval](https://aclanthology.org/2023.emnlp-main.153/) support methods and critique; none supplies Korean human naturalness gold for this corpus. [KoSEnd](https://aclanthology.org/2025.acl-srw.29/) can anchor sentence-ending naturalness if dataset rights and exact annotation protocol permit. [KoGEM](https://aclanthology.org/2025.acl-long.492/) tests grammar, [GOLEMcoref](https://github.com/GOLEM-lab/GOLEMcoref) tests annotated fiction reference (CC BY-NC license), and [KLUE](https://arxiv.org/abs/2105.09680) tests Korean language understanding; do not silently treat any as genuine writer preference.

**Evaluation gates:** source rights and scene-disjointness -> semantic/factual admissibility (FAIL/PASS/HOLD) -> calibrated human or independent annotation evidence on separate quality axes -> tentative within-genre paired comparison. If human labels are not available, report NOT_OBSERVED instead of inventing a winner. Use source-family/document clustering and order-swap negative controls for eventual judges; unmeasured style axes cannot be scored.

**Stop condition:** no Korean writing-quality or Transformer superiority claim based on synthetic oracle tests, near-copying, judge self-agreement, AI detection rates or translated English evaluation scores. For the future resource-limited study, prioritize existing **human-annotated Korean phenomenon-specific corpora and eval critic calibration**, then small blind source-admissible paired revisions if volunteers are available.

## P59 internal §v1.0 — source-confirmed paper custody and annotation authority audit (2026-10-09)

**Same G9-P59 stage; no new P-stage or paper title.** Twelve primary paper PDFs were read (title/author/abstract verified) and metadata-renamed/moved with unchanged IDs from Drive [00 Literature Radar](https://drive.google.com/drive/folders/1MLtYh0pv8QUZDReYzRqjDrOjRkSJAD16) to [10_PAPERS Canonical Literature Commons](https://drive.google.com/drive/folders/1D2M4LHcejREhlyp6vTd71xxLLx-6ldUP). All 12 move destination memberships were independently read back, and title-level canonical duplicate discovery found no same-title file in 10_PAPERS. **Byte-wise duplicate comparison across all Drive assets remains unperformed.** Exact 12 file IDs and study-specific evidence transport constraints appear under [cumulative THEORY_V06.md §v1.0](./THEORY_V06.md).

**Correction:** KoSEnd (Yu et al. 2025) is NOT a homogeneous fully-human-labeled benchmark. Section 3.3 describes human pilot annotation of a limited sample, followed by **LLM annotation of cases not manually judged**; paper limitations explicitly mention this risk. Retire all prior shorthand that calls the entire dataset 'human annotated naturalness'. The human pilot cannot be identified in our system per row until the **original released annotations** and label provenance are inspected. No raw external dataset is currently in canonical custody just because a PDF is saved.

**Korean quality validation contracts:**
- KoSEnd: naturalness of sentence-final forms, with per-label authority and calibration status; no whole-passage prose ranking.
- KoGEM: 1,524 grammar multiple-choice items, only grammar competence.
- GOLEMcoref: 2026 full paper has fiction-coreference descriptions across seven languages; Korean raw sample and **rights** must be examined before any evaluation run. Article ≠ raw annotated stories ≠ preferred reference expression.
- EditEval, WritingBench and Jourdan revision evaluation: use the methods for paired writing/editing evaluation; do not transport English genre scores, model-judge accuracy or user preference to Korean.
- SummEval, ACES, RARR and G-Eval: source fidelity, adversarial semantic mistakes and judge bias are diagnostics rather than evidence of Korean prose quality.
- Original 2023 Zheng et al. MT-Bench paper is still not verified in Drive. The two extra uploaded PDFs are distinct 2024 papers: MT-Bench-101 and Chatbot Arena.

**Stop rule:** keep actual Korean writing quality **HOLD** until source-disjoint native material, rights-verified original labels, and independent reader/writer evaluation exist. External paper claims remain citable with precise task/annotation provenance but cannot silently become new primary experimental outcomes.

## P59 internal §v1.1 — Korean corpus federation before scarce-GPU model work

§v1.1 stays inside the **existing P59** stage. Do not open a new stage or claim actual corpus benchmarks have been run.

**Existing user-held lineage:** P53 safe census `KSGT_G9P53_KRC_v06_NIKL2025_safe_census.json` records NIKL 2025 ZIP [Drive source](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view): 1,102 source documents, 30,346 sentences, 62,831 zero-argument slots across `NXZA2502512313.json` and `SXZA2502512312.json`. The original ZIP's Drive metadata exists. This is **not** partitive antecedent gold or native Korean writing-preference gold. The user reports additional corpus material under `C:\KSGT`, but the local drive is **not accessible or audited** in this run. Do not assert which files are presently there. No large corpus bytes should enter GitHub.

**Upstream release checks:** [KoSEnd](https://github.com/seungukyu/KoSEnd/tree/main/KoSEnd) advertises `easy.json`, `intermediate.json`, `hard.json`. Current connected GitHub API reads exposed blob hashes but empty body for these JSONs, so no row-level label schema or rights verified; the paper's mixed human/LLM annotation warning remains. [GOLEMcoref](https://github.com/GOLEM-lab/GOLEMcoref) publishes Korean CoNLL-2012 and CorefUD data; direct inspection of [splits.csv](https://github.com/GOLEM-lab/GOLEMcoref/blob/main/data/splits/splits.csv) counts 24 Korean train stories, 3 dev, 3 test. Both file views of one story share SourceWork and split; repository states CC BY-NC 4.0 but derivative/underlying fanfiction rights require review.

**Implementation:** [corpus_contract_v11.cjs](./corpus_contract_v11.cjs) contains metadata-only source profiles, audited task types, rights/source-work split enforcement, known mixed-label safeguards, conservative incomplete-label bounds, and a four-cell KEEP-vs-EXPLICIT contextual interaction arithmetic witness. [corpus_audit_v11.py](./corpus_audit_v11.py) independently validates the JSON metadata stream, NIKL old census totals, GOLEM official split counts and no silently promoted Korean human writing gold. These tests use fabricated metadata fixtures: no raw corpus loading and no claim that ingestion, independent human preferences or model ranking succeeded.

**Required future data gates:** actual raw-file SHA and underlying rights -> verified label schema and annotator authority -> stable SourceWork/SourceEdition grouping -> train/dev/test split by entire document/author family -> independent phenomenon-specific critic validation -> native Korean prose/human contact. A single early source-variant cannot be counted twice across format views or splits. The locally engineered 2×2 writing-choice intervention is a hypothesis and cannot be assigned 'causal' solely from computing a difference.

**Server boundary:** Future authorized HDD-only execution, no global packages or touching shared server areas; prioritize RITHM before KSGT GPU use. No user-server interaction occurred in §v1.1.
