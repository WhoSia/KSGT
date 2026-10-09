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
