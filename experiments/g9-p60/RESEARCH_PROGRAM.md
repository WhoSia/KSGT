# KSGT Generation IX G9-P60
## Source-Disjoint Korean Revision Evaluation, Semantic Admissibility & Reader-Calibrated Writing Preference
**Official full name:** KSGT Generation IX G9-P60 — Source-Disjoint Korean Revision Evaluation, Semantic Admissibility & Reader-Calibrated Writing Preference: Original-Output Provenance, Contamination Graphs, Genre-Conditioned Repair & Human-Anchor Identification

**Status: OPEN — actual P53 output archive re-audited locally; no newly validated revisions, human preference or architecture superiority.** This is the official successor to G9-P59, not a reinterpretation of the already existing G9-P54, nor a P59 subsection.

### 1. Inherit, do not discard, P59
The [cumulative G9-P59 theory](../g9-p59/THEORY_V06.md) defines limited-state information bottlenecks, query-blind delayed references, Korean discourse-conditioned KEEP/EXPLICIT/RESTRUCTURE, source-fidelity gates, human-evidence non-identification, and specific licensed-corpus/annotation limits. These are retained as explanatory and diagnostic prerequisites, **not** scored as Korean writing performance without independent observation. The P53 F/E/L/W source-and-writer contracts and P42 selective-edit/no-collateral-damage doctrine also remain upstream.

### 2. Empirical provenance court
Three original Google Drive archive packages were downloaded and directly examined (their bytes are NOT committed to GitHub):
- [P53 Qwen3-4B v0.3](https://drive.google.com/file/d/1vDGd3R_32J9EwbSK_ZyuvOBMossq8wu4/view): six actual B/U/K generated drafts over EX09 and EX10.
- [P53 Qwen3-8B B-only](https://drive.google.com/file/d/1pqDMGMt8drbz0pG3LiXbGMudiXi9gGCb/view): two B outputs over SCI01 and NAR02.
- [P53 Qwen3-14B B-only](https://drive.google.com/file/d/1o1iThI6yZ73fwKQvtO4fJ06MmwTBRVJR/view): four B outputs over SCI02, NAR01, SCI01 and NAR02; last two explicitly tagged EXPOSED_8B_CONTROL.

**Direct local hash verification:** all twelve stored output SHA-256 claims matched UTF-8 content; twelve distinct output hashes. Six distinct *brief IDs*; they are not independent generated subjects, and they are not independently human-edited texts. Source SHA is per-brief in the 8B/14B records; the 4B artifact only has a run-level source SHA and per-brief identifiers, so a 4B *per-brief* source SHA must never be invented. Source hashes on SCI01/NAR02 coincide between 8B and 14B. Output archive SHA and paragraph SHA provide immutable provenance references.

### 3. Contamination graph and retrospective source-disjoint splits
Let each candidate output be a vertex (v_i). Join two outputs by an undirected edge if they share a frozen source brief, a verified source content SHA-256 or an identical output SHA-256. The transitive closure defines connected components (C(v)). For a proposed split function (s), the minimum no-leak contract is
\[
\forall (u,v)\in E,\quad s(u)=s(v);
\quad \text{equivalently }s\text{ factors through connected components.}
\]
This is **necessary, not sufficient** for genuine uncontaminated evaluation: paraphrases, syndicated newspaper duplicates, latent writing prompt similarity and human exposure can create unobserved edges. Treat missing edge labels as audit uncertainty, not an assumption of independence.

Actual P53 component counts: **six** (EX09, EX10, SCI01, SCI02, NAR01, NAR02). All three model sizes contribute **twelve original output records**. Set a deterministic *retrospective only* partition by source brief:
- `pilot_train`: EX09, SCI01, NAR01 (three source components).
- `pilot_dev`: EX10, NAR02 (two components).
- `reserved_reaudit`: SCI02 (one component).

All six were generated/handled in previous research, so `reserved_reaudit` **is not a newly unseen heldout corpus**. A real confirmatory Korean writing test needs newly admitted, rights-checked, disjoint source works frozen *before* model/judge tuning. Do not infer statistical power from twelve texts or twenty-two paragraphs as twelve/twenty-two independent source units.

### 4. Paragraph ledger: drafts are not revisions
The first historical ledger contains **22 paragraph SHA entries from twelve actual source-authored drafts**, with source package reference, brief, component, exact paragraph index, model, and contamination flag. None has a validated edited descendant yet. The ledger schema requires later true revisions to refer back to the base paragraph, intended defect, F/E/L/W contract, edit candidate SHA, and source family; a free-standing B/U/K alternative is not automatically a before-after revision. Publication-scope ledger content is **metadata and hashes only**: no borrowed source article, full generated passage or private corpus content is silently added to the repo.

Required attributes for a later legitimate revision: original paragraph SHA; candidate paragraph SHA; source work/edition and inherited split; original writing task and genre; named defect to repair; protected factual claims (F); epistemic status (E); addition/fiction license (L); writer intention (W); provenance of independent semantic/reader witnesses; candidate source admissibility (PASS/FAIL/HOLD) and human style preference (observed/not observed). An unsupported PASS or fabricated human preference must be rejected by the schema. The [executable provenance/ledger/contrast check](./revision_evaluation_v01.cjs) generates a 22-row paragraph-ledger JSON report via `--emit-ledger`.

### 5. Two orthogonal outcomes, no disguised 'humanizing' score
For a source (x), discourse (d), genre (g), intent (w) and proposed edit (y):
\[
A(y\mid x,d,g,w) \in \{\mathrm{PASS},\mathrm{FAIL},\mathrm{HOLD}\},\qquad
Q(y\mid d,g,\text{reader})\in\mathbb R\text{ (if actually measured).}
\]
`A` is semantic/source admissibility; `Q` is separately measured comprehension, register and human writing preference. **Mechanical exact-string or typed-fact checks can only certify their closed, authored frame.** An idiomatic phrase can violate a hard source fact; source-accurate prose can be awkward. Neither axis is the other.

**Controlled 2×2 synthetic witness**: cross the typed statement *four of twelve science-club students introduced a device* with an unauthorized cardinality mutation to five, and independently vary a duplicated-connective surface form. Exactly two toy candidates preserve the typed source count; two remove the duplicated connective; **one is surface-smoothed but factually false**. This shows why a style-only proxy cannot identify fact preservation, not that any variant is empirically preferred by native Korean readers. The `surfaceRepetitionAbsent` feature is a deterministic, intentionally narrow diagnostic; it is explicitly **not a measured style improvement**. The test must never present artificial counts as a source-independent Korean semantic checker or assign a real human preference.

### 6. Genre-conditioned repair and causal estimands
Retain the P53 F/E/L/W gates: the same added sentence may be an unsupported factual claim in a scientific report and a legitimate detail within a licensed fictional scene. Language-model/judge confidence does not replace claim provenance. Keep `NO_EDIT` as a candidate when no actual defect has been witnessed.

For future independently assessed reader outcomes, measure two *distinct* quantities by source component:
\[
p_{\mathrm{admit}}(a,g) =\Pr[A(Y_a)=\mathrm{PASS}\mid g],\qquad
\Delta_{\mathrm{reader}}(a,b,g)=\mathbb E[Q(Y_a)-Q(Y_b)\mid
A(Y_a)=A(Y_b)=\mathrm{PASS},g].
\]
Conditioning on passing may select systematically different documents across arms: report pass rates **with** the conditional comparison, plus the proportion for which both arms are eligible. Without actual reliable human (Q), the second quantity remains NOT_IDENTIFIED. A randomized or source-matched setup with equal reader context, candidate order, material, generator budget, quality judge and model exposure must precede causal wording.

### 7. Original Korean label interfaces stay disaggregated
KoSEnd's actual public Git blobs were inspected: `easy.json`, `intermediate.json`, `hard.json` each contain **15,000 JSON rows (45,000 total)** with fields `usage_type`, `sentence_options`, `sentence_answer`, `usage_options`, `usage_answer`. Answers can be multiple labels or N. **No per-row annotator-provenance field appears**, so the paper's partial-human/LLM mixed annotation must not be promoted to all-human gold. A corpus naturalness *response* is not a passage-level writer preference score.

GOLEMcoref provides a separate Korean fiction coreference authority with official **24/3/3 works** across train/dev/test and dual CoNLL/CorefUD views. It is potentially a referent-chain critic benchmark, not an independent preference judge. The repository's CC BY-NC conditions and original story rights remain in scope. NIKL's pre-existing corpus and P45 derived statistics cannot provide original paragraph-edit annotations merely by being large.

### 8. Precommitted, computationally realistic comparison
On genuinely disjoint newly sourced Korean passages, compare (i) `NO_EDIT`, (ii) minimal source-aware edit, (iii) unconstrained style polish, (iv) P59 discourse-state-guided realization, under equal candidate access and compute budgets. Log factual admissibility, named-defect repair, unintended collateral changes, reader referent recovery, blinded preference, observed uncertainty and source-component cluster. Any system that preserves sources but does not improve measured readers' writing judgments **does not establish KSGT's proposed writing advantage**.

**Current disposition:** P60 OPEN / actual historical metadata and 22 paragraph hashes independently locally audited / controlled formal contrast constructed / real semantic and human editing gold HOLD / fresh document-disjoint writing superiority and neural advantage NOT_IDENTIFIED. Friend server unused.

### 9. Actual P53-anchored provisional edits, with semantic hold

The initial 22-hash ledger has now been extended with **two genuinely constructed *candidate revisions* of one actual prior P53 model paragraph**. The base is Qwen3-4B, EX09, K_TYPED_PLAN, paragraph 1, base SHA-256 `a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596`. The private local text is not added to the repo.

- `SOURCE_LABEL_REMOVAL` removes four `자료 n에 따르면` labels that were exposed in the prose. Candidate SHA-256 `925f378c6f3dbdac0cd66434fe3c93a23cebce4d8a97163bd92e9094a8284709`. This might improve flow, but might remove necessary attribution, so **epistemic and semantic admissibility HOLD**, native Korean human preference NOT_OBSERVED.
- `SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT` makes the same surface change and deliberately changes one `두 상자` occurrence to `세 상자`. Candidate SHA-256 `365ba48d2003328b93db628dce779d92bc66778af7b43c31cfc7503516875453`. This is an **authored deliberate factual-drift negative control relative to the original paragraph**, not an LLM-generated independent failure or source-grounded truth adjudication.

The [public metadata ledger](./provisional_edits_v01.json) records exact parent hashes, source component, revision type, edited text hash and unmeasured authorities without publishing the original text. The [P60 execution contract](./revision_evaluation_v01.cjs) links both candidates to the **one** matching ledger paragraph. Thus the evidence counts are **12 actual prior model drafts / 22 actual draft paragraphs / 2 provisional assistant-derived revision candidates / 0 independently validated correct revisions / 0 measured human writing preferences**.

These two candidates must **not** be counted as two independent source documents or as two demonstrated improvements. The fact-changing control is a designed challenge to a style-only editor; changing surface markers itself is not human-calibrated style improvement. Future source-aware F/E/L/W adjudication must decide whether citations were originally required.

### 10. P60 engineering authority after opening

`CURRENT_STAGE.json` now records current_stage=G9-P60, parent_stage=G9-P59, latest formally CLOSED stage G9-P58, official P60 Notion ID, and P59 history retained without creating a cosmetic terminal ritual. The new CI workflow runs the exact repository Node code and checks the ledger and two provisional candidate links, but its remote success is **not presumed** by merely committing the workflow. A separate local Python ZIP auditor actually read and verified the three original private P53 archives; this does not certify the separately implemented GitHub Node regression unless that code is executed independently.


### 11. P60-P1 — Evidence-bound paragraph revision court, not a new P-stage

**Predecessor correction:** Existing P59 P0–§v1.3 is retained as a scientific theory and diagnostic lineage. P60 is formally OPEN under the user-accepted official title; there is no retrospective P59 terminal ritual or invented P54 reuse. Stage labels P60-P1/P2 are engineering phases **inside P60**, not distinct official stage names.

The current [P1 source-linked court](./revision_court_v02.cjs) imports the independently earlier P53 [historical 22-paragraph ledger](./revision_evaluation_v01.cjs) and its [two provisional edits](./provisional_edits_v01.json). These are **12 actual model drafts, six source-brief connected components, 22 hashed draft paragraphs, two assistant-authored candidate modifications of ONE original paragraph, zero human quality measurements, and zero independently verified semantic repairs**. No text from source archives is reprinted in GitHub.

#### 11.1 Source-disjointness as an evidence graph—not an arbitrary random split

Let \(V\) contain source works, source editions, generator briefs, model-output paragraphs, proposed revisions and any near-duplicate/copy evidence. The contamination graph carries links only under a documented source-identity witness: common frozen brief, actual content hash, parent-to-revision relation, or independently verified same-source/near-duplicate relation. Entire connected components must receive the same split:
\[
\forall (u,v)\in E_{\mathrm{verified}},\quad \mathrm{split}(u)=\mathrm{split}(v).
\]
**Counterfactual link test:** adding a verified edge between historical \`EX09\` (\`pilot_train\`) and \`EX10\` (\`pilot_dev\`) correctly invalidates the split. An unknown lexical similarity is **not** a verified contamination edge; lack of a recorded edge does not certify actual independence. In particular, the existing P53 \`reserved_reaudit\` partition is historically exposed and may never be marketed as a fresh test set.

A revision's sourceWork, sourceComponent, parent paragraph hash and inherited split must agree simultaneously; a different work ID with a coincidentally matching paragraph SHA is a forgery to reject. The completed split is retrospective only: any independent confirmatory claim requires new source works admitted **before** prompting, model selection, evaluator calibration or judging.

#### 11.2 A four-axis, proof-carrying revision record

For every candidate \((s,x,y)\) record independent dimensions:
1. **Semantic admissibility** \(A(y\mid s,W)\in\{\mathrm{PASS},\mathrm{FAIL},\mathrm{HOLD}\}\), where \(W=(F,E,L,I)\) includes protected facts, epistemic attribution, licensed additions and writer intent.
2. **Named-defect repair** \(D(y;x,d)\) with a *specified, independently witnessed* defect \(d\), so that merely making more changes is not success.
3. **Collateral preservation** \(C(y;x,W)\), recognizing that removing a citation label can also remove a necessary attribution even when the new prose looks smoother.
4. **Reader outcomes** \(Q(y)\): blinded Korean referent comprehension and separate writing preference, each with a source/work-anchored measurement record.

No single criterion may be filled from another's score. The P1 \`evidenceReceipt\` validator requires candidate, source component, evidence axis, reviewer identity, protocol identity, witness ID, reviewer independence attestation and blinded candidate order for reader assessments. **Schema completeness is not proof the external evidence is genuine**. The current program deliberately does not promote it to semantic PASS or human preference; independent witness verification needs a trusted ingestion and assessment layer, not merely an arbitrary client-supplied ID.

For the two actual historically anchored edit candidates:
- \`SOURCE_LABEL_REMOVAL\`: base-to-revision cardinality mutation not observed, **but** attribution necessity and epistemic force HOLD. Do not call this a validated improvement.
- \`SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT\`: deliberately changes one source-draft count \`두 상자\` to \`세 상자\`. This is **a draft-relative controlled mutation**, not independent proof of external factual truth or falsehood. It is an adversarial failure witness for any judge that ignores protected numbers.

Both edits inherit the **same** P53 EX09 source component and \`pilot_train\`; no one-to-two inflation of independent source observations.

#### 11.3 How to measure quality without post-treatment selection laundering

An admissibility gate can make conditioning on passing edit outputs highly selective. Define independent events for source-work \(s\), model arm \(a\): \(A_{s,a}=1\) (source admissible), \(D_{s,a}=1\) (named defect fixed), \(C_{s,a}=1\) (no collateral damage), and \(H_{s,a}=1\) (blinded native Korean reader prefers candidate over matched comparator). One comprehensive target would be
\[
J_a=P(A_{s,a}=1\ \wedge D_{s,a}=1\ \wedge C_{s,a}=1\ \wedge H_{s,a}=1)
\]
with each event *independently evidenced*. This is a proposed construct, **not** observed in P53/P60 today.

If among \(n\) source works exactly \(w\) joint events are independently verified to hold and \(l\) verified not to hold, while \(u=n-w-l\) are unresolved, the finite-set rate is only identifiable within:
\[
\boxed{\frac{w}{n}\le J_a^{(\mathrm{these\ works})}\le\frac{w+u}{n}}.
\]
This is a sharp missing-outcome identification range, *not a confidence interval or a population estimate*. Currently \(w=l=0\) for six historical work components; interval [0,1]. A style-only closed-template diagnostic cannot narrow it.

For valid paired comparisons, report both *unconditional eligibility rates* (how often each model's outputs remain source-safe) and the conditional preference among works where both competing candidates pass. The conditional comparison alone can be misleading because the sets of eligible source works differ between candidate arms. Repeat variants are clustered by source work, not scored as independent panel subjects.

#### 11.4 Precommitted adversarial contrast and falsification

The earlier P60 two-axis synthetic \(2\times2\) crosses:
- nominal source count preserved versus deliberately changed;
- duplicated-connective surface proxy retained versus removed.

The polished-but-fact-changed cell exposes failure of surface-only judging. **There are no native Korean preference labels in the four cells**. Extend the future panel with \`NO_EDIT\`, minimal attribution-preserving revision, naive style polishing, and P59 discourse-state planning under equal evidence and token/computation budgets. Test:
- source number/polarity/causal and epistemic changes with independently verified original facts;
- an authored citation-removal counterexample where source attribution is compulsory;
- duplicate-source transitive leakage after the benchmark split has been frozen;
- evaluator reverse-order and verbosity-bias controls;
- clear versus competing referent contexts where writer meaning is identical.

**Reject the distinctive KSGT writing advantage** if matched ordinary source-aware editing equals or exceeds the discourse-guided candidate on independent eligible source works and genuine blinded Korean preference. Strong synthetic graph invariants are engineering evidence, not proof that the system writes better.

#### 11.5 Execution status / hard limitations

The JS P1 regression was executed in a V8 harness using the exact GitHub file bodies, original JSON ledger and explicit test stubs for Node built-ins; this **verifies logical regressions but is NOT a native Node/Actions execution receipt**. A separate Python stdlib validator checks the JSON source/parent/authority invariants when CI executes it. No private P53 archive was re-downloaded in this iteration. No new human gold, no true independent holdout, no friends' compute. Remote Actions workflow and exact Node PASS require an authentic CI/job receipt; workflow existence is not sufficient.

**P60-P1 OPEN implementation; P60 remains official live stage; latest formally closed is G9-P58.**


### 12. P60-P1 selection trap: source-safe quality is not the same estimand as quality among survivors

The [native Node negative-control experiment](./selection_trap_v02.cjs) formalizes a common unfair Korean-writing leaderboard: filter out source-unfaithful paragraphs and compare the average style scores of whatever remains. Let \(A_{s,a}=1\) if arm \(a\)'s revision of source work \(s\) is independently admitted, and let \(q_{s,a}\in[0,1]\) be a separately measured quality only when that candidate is admitted. On a **fixed, predeclared** source-work set \(S\), distinguish
\[
Q_a^{\mathrm{conditional}}=
  \frac{\sum_{s\in S}A_{s,a}q_{s,a}}{\sum_{s\in S}A_{s,a}}
\quad\text{versus}\quad
Q_a^{\mathrm{qualified}}=
  \frac{1}{|S|}\sum_{s\in S}A_{s,a}q_{s,a}.
\]
The second quantity is a *qualified-success objective* by definition: a rejected candidate contributes zero qualified success, **not** a claim that the rejected prose had zero subjective style quality. The first quantity summarizes surviving outputs, **not** an all-source system ability ranking. Neither number should be reported without the eligibility denominator and the fraction HOLD.

A constructed two-work proof-of-risk:
- System A is admitted on both works, with artificial quality \(0.7,0.2\): \(Q_A^{conditional}=Q_A^{qualified}=0.45\).
- System B is admitted only on the easy work, with artificial quality \(0.8\), and fails source admissibility on the other: \(Q_B^{conditional}=0.8\) but \(Q_B^{qualified}=0.4\).

Thus the ranking reverses when the denominator is properly aligned with the scientific question. This is **a deliberately authored mathematical counterexample**, not actual Korean quality annotations, and it does not imply that qualified-success is the single correct measure for every deployment. The experiment also checks five invalid-quality/duplicate-work/missingness conditions. The Node 22 local execution **PASS** is reproducible with GitHub Git blob SHA-1 \`7789a1b68904b7c1318e03bd8e06927b131fbced\`.

When an outcome is HOLD rather than an established FAIL, do not assign a made-up zero: instead report interval bounds for the qualified objective. If an arm has total verified qualified quality \(K_a\) on \(n\) source works, with \(u\) unresolved admissibility/quality outcomes each known only to lie in \([0,1]\), report \([K_a/n,(K_a+u)/n]\). Even with human annotations, any population inference must account for source-document clustering and how source works were sampled; this finite-item range is **not** a confidence interval.

**Implementation conclusion:** report all three (i) source-admissibility rate, (ii) preference/naturalness conditional on matched admissible pairs and (iii) fixed-source qualified performance with HOLD bounds. Do not optimize (ii) alone; it can reward a style-polishing arm that drops hard inputs. In P60 today the true human \(q\) is entirely NOT_OBSERVED, so none of these empirical style metrics is estimable. The synthetic selection canary is only an evaluation-protocol refutation.


### 13. P60-P2 — Frozen authored EX09 claim, byte-linked counterexample and matched revision policies (2026-10-09)

The previously unresolved **draft-relative** '두 상자' to '세 상자' contrast can now be related to the frozen **pre-generation source brief**: `experiments/g9-p53/krc_v03/new_briefs.json` (Git blob `2d2b8c0fee488a1aff988d9d3b26ec7596415ed1`; raw SHA-256 `722403f11ecdc621c8966e3285184a62e9a945a4263797c9ca107d4d7d948ead`). Its EX09 facts[0] and facts[2] explicitly say **two boxes**. The 4B private Drive ZIP `e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46` was retrieved again; the original EX09 K_TYPED_PLAN output, first paragraph, removal-only edit and removal-plus-count-drift edit all matched their existing P53/P60 manifest hashes. This upgrades the latter from merely a draft-relative mutation to a **contradiction against the authored frozen experiment brief**. It does **not** certify a historical real-world experiment.

The private-archive offline audit reconstructed four same-source, same-parent, **author-provisional** policies, each with a hash-only public entry in [policy_pairs_v03.json](./policy_pairs_v03.json): NO_EDIT; MINIMAL_ATTRIBUTION; ORDINARY_SMOOTH; P59_DISCOURSE. These were not independent model generations and contain no independently judged edits; their preservation, defect repair, collateral effects and native Korean preference all remain HOLD/NOT_OBSERVED. Candidate variants are **not** four independent source works.

The [P2 Node court](./source_claim_court_v03.cjs) freezes the precise original P53 authored brief bytes and rejects wrong parent/split, unwitnessed gold promotion, malformed or duplicated policy hashes. In public read-only Actions it verifies a **metadata/authority contract**, not the private ZIP bytes or free-form Korean entailment. The full private ZIP audit uses Python stdlib; its seven extra semantic/authority distinction statements are local findings, not automatically replayed by Actions. Do not inflate a verified protection failure to a complete model-improvement comparison. Real human preference still 0, fresh holdout 0.

P60-P1 native CI was **independently confirmed**: [run 37945220158](https://github.com/WhoSia/KSGT/actions/runs/37945220158), commit `aa875115975f794b3671b7ba284d664937bbf6d2`, job `113869631912`, all steps success. This corrects older 'CI pending' statements **only for the earlier P1-tested commit**. P2 CI status must be verified separately after its new commit.

**P2 reproducibility extension:** [source_archive_audit_v03.py](./source_archive_audit_v03.py) is an independent Python stdlib audit. Read-only public Actions invokes it without `--archive` (frozen source, parent, split and six negative controls); local approved execution with `--archive path-to-Qwen3-4B.zip` separately proves real output/candidate SHA and the original-brief contradiction. The source ZIP never enters public CI or the GitHub repository.

### 14. P60-P2 v04 — EX09 claim-unit audit and four-policy paired Korean revision (2026-10-10)

The *pre-generation authored* P53 EX09 brief contains protected facts F1–F5 and uncertainties U1–U3. The actual P53 K_TYPED_PLAN paragraph and four actual later assistant-authored revisions are one historical source work, **not four independent examples**. The source specifies equal box size, seed type, and water quantity, but does not establish identical soil/light/temperature. Thus the original paragraph's near-identical-initial-conditions implication is an analyst-level **U2 potential overstatement** rather than independently established semantic FAIL. The old `두 상자`→`세 상자` case contradicts this authored brief, not real-world observed seed data.

[Public claim ledger](./claim_alignment_v04.json) stores source-claim SHA-256 hashes, four candidate SHA hashes, 32 authored alignment hypotheses, and alignment witness commitments. The private evidence ZIP (held **outside GitHub**) contains original/candidate texts and 27 selected span SHA witnesses. Its independent Python hash verification does *not* prove semantic entailment. Policy arms:

- `NO_EDIT`: original intact; four visible `자료 n에 따르면` labels retained; U2 potential overstatement.
- `MINIMAL_ATTRIBUTION`: replace numbered labels with broader attribution while leaving U2 epistemic risk.
- `ORDINARY_SMOOTH`: compact style; some source details omitted, so collateral admissibility remains HOLD.
- `P59_DISCOURSE`: manually applied referent and epistemic planning; this is *not* a P59 neural generation or proof of superiority.

Four independent judgment questions remain separately reported: source admissibility (HOLD), named surface defect repair (NO_EDIT FAIL / other policies mechanical-only), collateral integrity (HOLD), and real Korean-reader preference (NOT_OBSERVED). `SUPPORTED`/ `PARTIAL`/ `GUARDED` annotations are author hypotheses, **not human gold**. No actual independently successful revision, no human preference, no fresh holdout; preserved actual source-work denominator = 1. Node [claim alignment contract](./claim_alignment_court_v04.cjs) and [independent Python audit](./private_claim_audit_v04.py) now run on **public metadata only** in CI, without private source archives. Optional local `--private-packet` and `--archive` independently validate private SHA commitments. V04 remote PASS cannot be declared until HEAD-specific Actions receipt. Next: independent U2 meaning adjudication, genuinely blind human preference and source-disjoint licensed additional briefs.
