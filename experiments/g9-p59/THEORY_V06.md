# KSGT G9-P59 v0.6 — Discourse-State Intervention Invariance, Referential Competition & Architecture-Level Causal Discrimination

**Status:** OPEN / executable mathematical toy / native Korean semantic correctness, human choice and neural architecture advantage **UNTESTED**. This is a proposed theoretical model, not a previously established theorem of Korean pragmatics.

## 1. Objects and operational distinction

- (S): frozen licensed source facts; (M=(r^*,k,p)): writer-intended target referent, selected subset count and proposition.
- (D_t): discourse prefix; (G,W): genre and writer variables.
- (B_t(r)=P_{model}(R=r\mid D_t,K_t)): *model-estimated* reader referent belief; not a direct observation of human mental state.
- (A\in\{K,E,R,\bot\}): KEEP (`그중`), EXPLICIT, RESTRUCTURE and ABSTAIN.
- (L_0(r\mid a,D,B)\propto P(a\mid r,D)B(r)): a possible listener update model (not fit or validated).
- `do(B=b')` in v0.6 is **an intervention on a model input / hypothetical reader-state variable**, not an intervention on a human.

The source, writer meaning and candidate texts must be frozen within a v0.6 reader-belief pair. Replacing (r^*) itself changes intended meaning and is a separate factorial axis, not a meaning-invariant intervention.

## 2. A falsifiable idealized binary decision theorem

Let (p=B(r^*)\in(0,1]). Assume a fixed perfectly disambiguating explicit alternative, both alternatives licensed for (M), a truthful reader distribution, and an extra explicitness cost (c\ge0).

```text
L_KEEP     = -log p
L_EXPLICIT = c
L_EXPLICIT < L_KEEP  iff  p < exp(-c).
```

Proof: (c<-\log p\iff \log p<-c\iff p<\exp(-c)). Ties are represented as TIE, not silently assigned to either action.

The result is a *conditional consequence of deliberately strong assumptions*. Real explicit expressions can fail to identify the group, redundant repetition has context-dependent cost, restructured sentences change the choice set, and human choices can be stochastic. None of (B,c\) is measured here. This proposition is **not** a theorem that humans always prefer a definite expression below this threshold.

## 3. Equal-entropy adversarial witness

Fix intended referent (r^*=a), cost (c=0.4).
(B^+=(.8,.2)), (B^-=(.2,.8)), in referent order ((a,b)).
(H(B^+)=H(B^-)\approx0.5004) nats, yet (L_K^+=-\log .8\approx0.2231) and (L_K^-=-\log .2\approx1.6094).
The target-aligned toy chooses KEEP under (B^+) and EXPLICIT under (B^-); any deterministic (H(B))-only rule with the same cost must give identical answers to both. This is a mathematical counterexample to *entropy as a sufficient statistic for target-aligned reference choice under the toy decision rule*. It does not establish an empirical benefit over attention.

## 4. Competing policy classes and discriminators

| Family | Observation | Expected toy signature | Possible defeat |
|---|---|---|---|
| Surface-constant control | same words, ignores (B) | no response to belief-only intervention | any distinct outputs as belief changes |
| Entropy-only (\pi_H) | (H(B)), intended referent unavailable | identical choice for equal-entropy mirror pair | correct different choices on mirror pair |
| Target-aligned oracle (\pi_T) | (r^*, B(r^*)), cost | threshold switching and label equivariance | altered referent or count without corresponding change of intent |
| Fully informed text model | same (S,M,B,G,W) and resource budget | may learn **exactly** the oracle behavior | no structural separation follows merely from oracle success |
| Explicit discourse-memory model | same evidence stream, persistent (z_{t+1}=F_\theta(z_t,o_t)) | hypothesized lower long-range loss / better calibrated reference under fixed budget | comparable baseline performs equally or better |

The first three are analytical controls / toy programs, **not evaluated neural architectures**. Importantly, a Transformer supplied with the same target and belief has no known limitation preventing it from computing (-\log B(r^*)). Giving only the proposed model explicit (B) would create an unfair information advantage.

## 5. Intervention protocol and invariances

Define (x=(S,M,D,G,W)\) and model outcome (π_\theta(E\mid x,B)). A proposed within-model contrast is
```text
tau_theta(B0,B1 | x) = pi_theta(E|x,B1) - pi_theta(E|x,B0)
```
This is *input sensitivity*, not an identified human causal effect.

Required controls:
1. **Message/source invariance:** (S,M,\text{KEEP-text},\text{EXPLICIT-text}) identical across belief interventions.
2. **Target alignment:** conditional on the same (r^*), lowering (B(r^*)) may increase EXPLICIT under the idealized hypothesis.
3. **Label equivariance:** renaming all referents consistently and renaming (r^*) must preserve the predicted action.
4. **Null distractor:** appending an impossible zero-probability competitor leaves the idealized oracle unchanged; nonzero competitors may change normalization and decisions.
5. **Entropy collision:** mirrored beliefs with equal entropy are permitted to yield different target-aware actions.
6. **Against tautology:** compare neural systems on the same (S,M,\text{reader-evidence}); when the belief vector is supplied, supply it to *all* competitors.
7. **Adversarial surface:** reject any candidate which changes polarity, subset size, referent identity or source bounds; this is separate from human stylistic preference.

## 6. Neural architecture sketch and train-time rivals

```text
Input evidence O_1:T -> memory Z_T -> inferred reader belief Bhat_T
Frozen writer meaning M + Z_T + Bhat_T -> expression policy pi(A | M, Z_T, Bhat_T)
Candidate surface -> independent source-referent validator -> keep/revise/abstain
```

Candidate architecture: (Z_{t+1}=F_\theta(Z_t,O_{t+1})), (\hat B_t=\mathrm{softmax}(G_\theta(Z_t))), (\pi_\theta(A\mid M,Z_t)=\mathrm{softmax}(-\beta C_\theta(A,M,Z_t))).

Possible loss: (\mathcal{L}=\alpha\mathcal{L}_{referent}+\lambda\mathcal{L}_{source}+\mu\mathcal{L}_{choice}+\gamma\mathcal{L}_{memory}). Each term needs independently admissible labels; **none has been learned or weighted from real preference data**. Adversarial synthetic labels can train a constraint model but cannot substitute for Korean reader preference gold.

For a memory bottleneck with at most (2^m) distinct states and (n>2^m) equipossible target-identifying histories, at least two histories collide by pigeonhole; a deterministic decoder seeing only that state cannot distinguish both targets. This is a finite-state *necessary capacity observation*, not an advantage theorem for any specific neural architecture or a prediction of Korean naturalness.

A scientific comparison requires **identical source-evidence access**, matched training budget and checkpoint selection, scene/document-disjoint native material, blind writer/reader judgement and interpolation vs genuinely new composition templates. Compare attention, SSM and explicit-state/hybrid baselines only when each receives equivalent information. The existing 4 v0.5 authored scenes share one template and cannot provide that comparison.

## 7. Precommitted interpretation

- **PASS (toy):** mathematical threshold, equal-entropy distinction, source/meaning invariance, rename/null-distractor invariance, invalid-belief rejection.
- **HOLD (empirical):** (B_t) calibration from independent readers; human (c); genuine model sensitivity; native Korean meaning; writer style preference; all architectural superiority claims.
- **Falsification path:** show target-aware intervention effect disappears under matched model inputs; show it is explained only by textual side channels or length; show native reader judgments disagree with proposed threshold; show equal-budget Transformer matches or exceeds explicit-state architecture.

**This is a scientific *question-generator* and test contract, not a new Transformer-replacement result.**

## P59 internal §v0.7 — Persistent referent memory and information bottlenecks

This is **one subsection of P59**, not a new named stage or a standalone research paper. Scientific claim remains OPEN and evidence remains synthetic-only.

### A. Exact finite-state identity-reconstruction bound
Assume (i) \(R\) uniform on \(N\) targets; (ii) the sole target-bearing channel into the decoder is an \(m\)-bit state \(Z\) with at most \(K=2^m\) values; (iii) the final query and post-encoding side information are independent of \(R\), conditional on \(Z\); (iv) decoder outputs one target. Then
\[
\Pr(\hat R=R)\leq \min(1,K/N).
\]
Proof: for an arbitrary stochastic encoder \(q(z\mid r)\) and optimal deterministic decoder \(g(z)\),
\[
\Pr(\hat R=R)=\frac1N\sum_z q(z\mid g(z))\leq \frac{K}{N}.
\]
For \(K\leq N\), the upper bound is attained by mapping \(K\) representative targets to distinct codes and all remaining targets to existing codes, then decoding each code to its representative. Thus minimum classification error is at least \(1-\min(1,2^m/N)\). An exhaustive 5-target/2-state check (32 encoders) recovers the exact \(2/5\) ceiling.

**Boundary:** this bound is invalid if the decoder also reads a target-bearing source passage, if a key or query leaks the target, or if a supposedly finite-precision memory can store additional unrestricted bits. It is a single-shot identity theorem, not an impossibility result for Transformers, SSMs, or real readers.

### B. Long-range distractors and rival memory update rules
The symbolic history has one tagged anchor target, followed by 0, 1, 2, 4, 8, 16 or 32 distractor events. The final query does not contain the target. Every policy receives the same event IDs and role tags.

The test compares constant guessing (no memory), last-observation overwrite, target-tag gated storage, and rolling windows of 1, 4 or 33 event slots. With eight target IDs, a symbolic event slot is charged four payload bits (three ID bits plus a tag bit). Larger windows are therefore **not** matched-memory comparisons, and extra pointer/runtime state is not included in these lower-bound accounting figures.

An initial draft leaked target identity into the distractor IDs. The implementation was corrected so distractors depend only on their positions, and an explicit independence regression was added.

### C. Results and non-implications
The actual local Node 22 test enumerated eight targets, three pre-anchor positions and seven post-anchor lengths: **168 symbolic histories**. Constant guess was correct 21/168; overwrite 42/168; one-slot window 24/168; gated target memory 168/168; four-slot window 72/168; 33-slot window 168/168. Overwrite's 18 additional successes beyond the zero-distractor cases are chance identity matches, not genuine reconstruction of the anchor.

**Do not interpret this as a Transformer versus SSM result.** A Transformer receiving the same role tag can implement gating; a selective SSM can also preserve the target. The overwrite and window programs are deliberately impoverished analytic controls. A full-context attention model using 132 symbolic payload bits is not memory-matched to a gated model charged four bits. Runtime, clock state, pointer bits, KV-cache precision, learning budget and parameters remain unmeasured.

### D. Fair neural competition contract
Freeze source access, tokenization or controlled equivalent, target-label access, task instructions, train/validation/test corpus genealogy, context length, and selection criterion. Report activation/KV memory, recurrence-state bytes, model parameters, training/inference FLOPs and latency separately. Precommit interference schedules, unseen source families and native Korean meaning assessment. Contrast a real Transformer, a real selective state-space model, a matched hybrid and an explicit entity-memory variant. All arms must receive the same target-bearing evidence; an extra hand-coded anchor tag or belief vector cannot be privileged to one arm.

**Disposition:** toy identity-capacity theorem and scripted nuisance invariance locally verified; neural architecture advantage, reader-state realism, natural Korean writing quality and human preference **HOLD**.

### E. Delayed-query pressure: a stronger memory-capacity discriminator
The earlier tagged-target task identifies *which* entity should be stored during encoding. A selective recurrent model or an attention model can both implement that trivial gate. To remove that shortcut, consider two independent targets \(R_a,R_b\), each uniform among \(N\) labels. The encoder sees both but **does not know** which slot \(Q\in\{a,b\}\) will be queried until after state compression.

For **zero-error recovery under every future query**, \(Z\) must distinguish all \(N^2\) ordered pairs; otherwise two pairs collide and differ in at least one slot, which a future query can select. Hence \(m\geq\lceil2\log_2N\rceil\). At \(N=8\), the zero-error floor is **six bits**. This does not bound optimal average query accuracy of every three-bit encoder; it bounds simultaneous perfect recovery.

The [delayed query regression](./delayed_query_v07.cjs) enumerates 64 independent pairs and both queries: an authored three-bit first-only memory achieves 72/128 correct; a three-bit last-only memory achieves 72/128; a six-bit two-slot memory achieves 128/128. These are engineered witness policies, not trained neural performance measurements. The test reinforces that a future-unknown query may require preserving more than one referent. Future experiments should expand to relations among referents and discourse updates before asserting a real Korean-writing advantage.

### F. A proposed learnable architecture, not yet a model result
Let \(H=(O_1,\ldots,O_T)\) be a discourse stream and \(Q\) an unknown future reference query. A model forms memory \(Z_T=F_\theta(H)\) **before** observing \(Q\). The retrieval head estimates \(p_\phi(R_Q\mid Z_T,Q)\). If future queries have a specified distribution, a natural theoretical bottleneck objective is
\[
\min_{\theta,\phi}\mathbb E[-\log p_\phi(R_Q\mid Z_T,Q)]
\quad\mathrm{subject\ to}\quad I(H;Z_T)\leq m\log2.
\]
For literally discrete \(m\)-bit states, \(I(H;Z_T)\leq m\log2\) automatically; with continuous learned activations, dimensionality is not bit count and precision/compression must be declared separately. Randomizing future queries forces memory selection to balance multiple potentially relevant referents instead of exploiting a known single target.

An explicit entity-memory implementation could update slots \(z_{i,t+1}=g_{i,t}z_{i,t}+(1-g_{i,t})u_\theta(z_{i,t},O_{t+1})\), with salience-based allocation and later query-conditioned retrieval. **This is an architecture proposal**, not a new expressivity theorem: Transformer attention and selective recurrent blocks can approximate analogous conditional updates.

Natural Korean generation adds an expression decision head only **after** a meaning-preservation gate. No source fidelity or human style reward can be learned merely from synthetic exact-string tests. When independent reader and writer data exist, separately estimate reader belief calibration, correct antecedent recovery, source entailment, and KEEP/EXPLICIT/RESTRUCTURE preference instead of a single 'humanlike' scalar.


## P59 internal §v0.8 — Exact delayed-query rate–distortion and neural-comparison prerequisites

**Placement:** This is an internal *paragraph/subsection of G9-P59*, not a new stage, new official version title or separate Notion page. The earlier §v0.7 derived a *zero-error* memory floor. Here we determine the *optimal average accuracy below that floor* under sharper assumptions.

### A. Exact finite-state delayed-query theorem

Let \(R_a,R_b\) be independent uniform variables over \([N]=\{1,\dots,N\}\). An encoder observing the ordered pair \((R_a,R_b)\) but **not** the later query \(Q\in\{a,b\}\) produces one of at most \(K\) discrete memory states. After encoding, \(Q\) is sampled uniformly and independently. A decoder receives only the memory state and \(Q\), then predicts \(R_Q\); there is no additional target-bearing side channel.

The maximum achievable probability of correct retrieval, optimizing over all deterministic encoders and decoders, is
\[
A^*(N,K)=
\begin{cases}
\frac{K(2N-K+1)}{2N^2}, &1\le K\le N,\\
\frac{N^2+K}{2N^2}, &N\le K\le N^2.
\end{cases}
\]

**Proof.** A decoder assigns a pair \((x_z,y_z)\) to each memory state \(z\): its predicted answers for queries \(a\) and \(b\). For each source pair \((a,b)\), the encoder selects the decoder pair maximizing \(\mathbf 1[a=x_z]+\mathbf 1[b=y_z]\). Thus an exact matching decoder pair gains 2 points, a pair sharing exactly one coordinate gains 1, and a pair sharing neither gains 0. Among \(K\) distinct decoder pairs, let \(u\) be the number of distinct first coordinates and \(v\) the number of distinct second coordinates. Exactly \(uN+vN-uv\) source pairs share at least one coordinate with some decoder pair; the \(K\) decoder pairs themselves each gain one additional point. Total optimal reward is \(uN+vN-uv+K\), divided by \(2N^2\). For \(K\le N\), \(u,v\le K\) and the reward is maximized at \(u=v=K\), achievable by \(K\) disjoint diagonal pairs. For \(N\le K\le N^2\), choose \(N\) diagonal pairs and any \(K-N\) further distinct pairs, so \(u=v=N\), attaining \(N^2+K\). No greater value is possible because there are only \(N^2\) source pairs and \(K\) exact matches. QED.

This includes the earlier zero-error boundary \(K=N^2\) (or \(m\ge\lceil2\log_2N\rceil\) for memory of at most \(m\) bits), and quantifies the nonzero-error region.

For \(N=8\), \(K=1,2,4,8,16,32,64\) permits exact average accuracies \(12.5\%,23.4375\%,40.625\%,56.25\%,62.5\%,75\%,100\%\). At \(K=N=8\), the first-only 3-bit witness is actually **optimal under these assumptions**, even though it appears unsophisticated.

### B. Reproducible falsification checks

The [v0.8 exact theorem oracle and exhaustive witnesses](./rate_distortion_v08.cjs) checks all possible codebooks for \(N=2,3,4\) and \(K=1,2,3\), within a bounded enumeration, and confirms equality with the closed form. It also verifies \(N=8,K=8\) against the §v0.7 delayed-query witness \(72/128\), and \(N=8,K=64\) against perfect recovery \(128/128\). These are mathematical tests, not learned-network results.

### C. What this changes for fair architecture competition

**A benchmark above the finite-state optimum is evidence of an unequal comparison, a side channel, an invalid effective bit budget, or an incorrect theorem assumption**, not a Transformer breakthrough. For continuous activations, the number of coordinates is not the number of effective bits: specify numerical precision, quantization, key-value cache, external context readback, query timing, hidden state, and search history. A model allowed to re-read source text after \(Q\) has an entirely different information budget. If the query can be anticipated during encoding, the delayed-query theorem does not apply.

Competing implementations should include (i) an actual attention-based network, (ii) an actual selective recurrent/SSM network, (iii) a hybrid, and (iv) an explicit referent-memory network. All receive the same evidence with the same privacy/licensing scope; no manually supplied target label or reader-belief vector goes only to the proposed model. Compare each on zero-error floor, accuracy relative to the appropriate finite-state ceiling, extrapolation under distractor distance, memory and compute, *and only separately* independent human reference-choice and Korean naturalness outcomes.

### D. Evidence ceiling and path back to KSGT

The theorem assumes two independent uniform discrete referents, a uniform delayed query, a finite discrete memory state, and exact-match retrieval loss. It does **not** prove a universal memory inequality for nonlinear real-valued neural networks, nonuniform source distributions, semantic similarity loss, natural Korean generation or actual human pragmatics. The four synthetic P59 v0.5 source families remain one shared construction template. P59 stays OPEN; no superiority or human-world contact claim is promoted.


## P59 internal §v0.9 — From discourse-memory theory to a Korean writing-quality benchmark

**This is an internal subsection of the existing G9-P59, not a new P-stage or a new official name.** The objective is high-quality Korean writing that helps readers understand intended meaning, not detector evasion or imitation of an alleged unique human style. No model, judge or human writer is claimed to be measured here.

### 1. Return-to-origin bridge: what information theory does and does not prove

Sections v0.7 and v0.8 established conditional information limits for query-blind finite-state referent recovery. They supply a **necessary information-preservation condition** only under their explicit no-side-channel assumptions. They do not imply:
(1) that a referent-correct sentence is readable, pleasant, well paced or genre-appropriate;
(2) that a Transformer cannot represent a discourse state;
(3) that higher memory accuracy translates into better Korean prose; or
(4) that the model's alleged reader-belief distribution is calibrated against actual readers.

Let \(S\) be licensed source claims, \(M\) writer-intended propositional and referential content, \(D\) discourse history, \(G\) genre, \(W\) writer constraints, and \(Y\) the produced passage. A reader \(r\) extracts \(\hat M_r(Y,D)\). Define a **hypothetical** communication distortion:
\[
d_r(M,Y,D)=w_{\mathrm{ref}}\,\mathbf1[\hat R_r\ne R^\*]
+w_{\mathrm{prop}}\,d_{\mathrm{meaning}}(M,\hat M_r)
+w_{\mathrm{coh}}\,d_{\mathrm{discourse}}(D,Y).
\]
The weights and distortions are *not observed or identified*; this is a decomposition of future empirical targets, not an operational single quality score. Stylistic acceptability, redundancy, rhythm and genre are additional dimensions, not automatically functions of referent accuracy.

### 2. Admissibility before aesthetic preference

A source-grounded writing candidate may be **admitted for stylistic comparison** only when the following claims are supported by appropriate, independently admissible evidence:
- source-derived facts are maintained, unsupported facts are not added;
- required referents, quantities, polarity and causal/temporal relationships are preserved;
- task-specific format/genre constraints are not violated.

Write \(\mathcal A(S,M,G)\) for source-licensed candidates. If a necessary fact is missing, false or externally unverified, use FAIL or HOLD depending on what is actually established, **never force PASS**. Then judge a passage among admissible alternatives using a vector:
\[
\mathbf q(Y)=(\text{coherence},\text{reader comprehension},\text{Korean naturalness},
\text{genre/register fit},\text{redundancy economy},\text{revision utility}).
\]
A candidate \(Y_1\) dominates \(Y_2\) only if it is not worse on every measured axis and better on at least one, **with the evidence available for those axes**. Incomparable passages and unknown human axes are allowed. No universal scalar "humanlikeness" is inferred.

For paired writing revisions, the scientific estimand is conditional:
\[
\Delta_j=\mathbb E\big[q_j(Y_{\mathrm{revision}})-q_j(Y_{\mathrm{baseline}})
\mid S,M,D,G,\ \mathrm{both\ admitted}\big].
\]
Unmeasured \(q_j\) cannot be imputed from a hard-constraint pass or from a generator-critic agreement. The sample unit is a source document or writer task, **not each paraphrase of the same scene**.

### 3. Central falsifier: the correct but worse-writing counterexample

The earlier v0.5 always-EXPLICIT policy obtained 32/32 *closed-template passes* and always-KEEP obtained only 16/32 due to referential ambiguity. This does not support 32/32 versus 16/32 on writing quality. Repeating fully specified nouns can be redundant; keeping an unresolved \`그중\` can confuse readers; a natural restructuring might outperform both.

Thus **typed correctness is a gate or diagnostic, not a preference reward**. Optimizing the number of exact-template passes can incentivize repeated lexical material. Likewise, a fluid but false rewrite cannot win by superficial fluency. This is why KSGT must measure a *vector of writing capabilities* and independently validate any human-derived ordering.

### 4. Literature-to-test transport ledger (metadata only; no datasets imported)

| Verified publication / linked source | Reusable methodological device | Transport boundary for KSGT |
|---|---|---|
| [WritingBench, NeurIPS 2025](https://proceedings.neurips.cc/paper_files/paper/2025/hash/4aedf0cba303537fcb6cf948bb41b2df-Abstract-Datasets_and_Benchmarks_Track.html) | Broad writing tasks, query-specific criteria, separate style/format/length requirements | Its rubric-critic/leaderboard is not Korean human preference ground truth. Treat judge scores as **proxies requiring calibration** |
| [SummEval, TACL 2021](https://aclanthology.org/2021.tacl-1.24/) | Coherence, factual consistency, fluency and relevance measured separately with expert/crowd annotations | English news summarization, not direct natural Korean passage judgments |
| [ACES, WMT 2023](https://aclanthology.org/2023.wmt-1.57/) | Adversarial controlled error classes and per-phenomenon profiles | Translation metric diagnostics; surface overlap is not source faithfulness or native writing quality |
| [EditEval, CoNLL 2024](https://aclanthology.org/2024.conll-1.7/) | Evaluating *improvements to existing text*, not only next-token writing | Primarily English editing and task-specific reference sets |
| [Scientific Text Revision Metrics, ACL 2025](https://aclanthology.org/2025.acl-long.335/) | Separate instruction-following, revision correctness and other metrics; hybrid judge limitations | Their finding that LLM judges struggle with correctness is a warning, not a universal rate transferable to Korean |
| [RARR, ACL 2023](https://aclanthology.org/2023.acl-long.910/) | Evidence-grounded revision while preserving unaffected material | Attribution and local revision do not themselves measure native Korean genre or style |
| [G-Eval, EMNLP 2023](https://aclanthology.org/2023.emnlp-main.153/) | Criteria-aware LLM evaluation and comparison with human annotations | Correlation in an English summarization setting; authors raise risk of favoring model-produced text |
| [MT-Bench / Chatbot Arena, 2023](https://arxiv.org/abs/2306.05685) | Position/order and verbosity bias as negative controls for LLM-as-judge | Dialogue assistant comparison is not a Korean writing quality oracle |
| [KoSEnd, ACL SRW 2025](https://aclanthology.org/2025.acl-srw.29/) | Korean sentence-ending naturalness judgments: 3,000 sentences with judgments for 15 ending forms | Valuable **local Korean naturalness subtest**, not discourse-level writing gold; licensing/raw access unverified here |
| [KoGEM, ACL 2025](https://aclanthology.org/2025.acl-long.492/) | Korean grammatical linguistic-competence adversarial tests, 1.5k QA pairs | Discrete grammar Q&A cannot be transported as essay naturalness labels |
| [GOLEMcoref public repository](https://github.com/GOLEM-lab/GOLEMcoref) | Human-annotated Korean fiction coreference and zero-anaphora spans | Character coreference is not writer expression preference; source data has CC BY-NC 4.0 terms, redistribution/derivative rights require audit |
| [KLUE, 2021](https://arxiv.org/abs/2105.09680) | Korean NLI, parsing, relation extraction and related linguistic probes | Korean understanding tasks are diagnostic support, not passage generation preference gold |

**Evidence-admission levels.** L0: mathematics, synthetic authored counterexamples, and internal implementation tests; L1: directly inspected third-party original annotations under compliant custody, preserving task/genre/language of those labels; L2: externally validated Korean reader/writer measurements on source-disjoint native texts. Source discovery alone is not data ingestion. A high-quality English benchmark can justify a **method**, not import its numerical claims into Korean writing. Data copyright/license and split lineage are hard gates.

### 5. Proposed economical benchmark: tests of *writing improvements*, not provenance detection

Proposed task families (only the first has v0.5 authored fixture coverage):
- **R — referential economy:** maintain \`그중\` when a group is genuinely recoverable; clarify or restructure when context supports competing readings; independently separate referent correctness from repetition preference.
- **C — compositional coherence:** compose multi-paragraph material with information order and dependency relations; test forward/backward references and connective licensing, not only adjacent-sentence grammar.
- **V — source-grounded revision:** repair awkward or ambiguous Korean while maintaining factual commitments; compare to original and test whether an edit materially improved a specified problem without adding invented details.
- **G — genre and register:** preserve the same meaning across legitimate formal/informal or report/narrative realizations, including Korean endings, particles, rhythm and pragmatics. Genre-conditioned differences are not automatically errors.

Each task requires a source snapshot and rights receipt, a writer-intent contract, negative controls, candidate genealogy, genre/reader condition, explicit admissibility claims, and separately recorded evidence for every evaluated axis. Never call a synthetic text 'human reference' or a fluent sample 'source-faithful' without proof.

### 6. Low-cost evaluators and the human-world boundary

**Free/cheap engineering gate:** symbolic source witnesses, typed cardinalities, referent ambiguity conditions, mechanical anti-leak checks, assertion-generated minimal pairs, role/genre metadata, and bounded counterfactuals. This can *refute* known errors and diagnose failure families; it cannot certify idiomatic Korean.

**External annotation reuse:** after rights and protocol inspection, use released Korean ending judgments, independently human-annotated Korean coreference and benchmark labels only for the phenomenon they actually measure. They can validate *judges/critics* on specific error types with no new GPU training. They cannot jointly manufacture a universal gold 'better writing' score.

**Future bounded human anchor:** if eligible readers become available, prefer blind paired comparisons on *qualified admissible passages* with item-level disagreement, randomized order and genre stratification, instead of a long survey or forced composite score. Keep confidence intervals and item/source-family clustering; never label a tiny pilot a general Korean public preference. If no readers are available, leave writing-quality identification **HOLD** and publish only diagnostic findings.

**Failure modes:** repetition gaming; template-copy 'success'; a judge favoring longer/own-model outputs; preference-label laundering; leaked variants across splits; biased selection of only passages with valid metrics; preference-model overfitting to judge; genre-agnostic scalar utility; conflating Korean grammar questions with polished writing; inferring architectural superiority from a formal-memory toy bound.

### 7. Strict conclusion

KSGT can make a rigorous contribution before having a large GPU cluster by providing: (i) falsifiable memory-to-referent hypotheses, (ii) source-licensed Korean construction and revision tests, (iii) adversarial diagnostics of candidate critics, (iv) a transparent human-evidence boundary, and (v) a resource-normalized future model comparison. It **cannot** yet claim a model that writes better than a Transformer, or that its written outputs are preferred by Korean readers. P59 remains OPEN; all v numbers remain internal subsections.

### 8. Two small identification results under severe resource constraints

**Proposition 1 (impossibility of certifying style from constraints alone).** Suppose two source-admissible passages \(y_1,y_2\) have identical observed structural test transcripts \(T\), while no actual reader preference/understanding data or validated quality measurement is observed. There are at least two hypothetical human utilities \(U_+\) and \(U_-\), both consistent with exactly the same \(T\), for which \(U_+(y_1)>U_+(y_2)\) but \(U_-(y_1)<U_-(y_2)\). Hence structural transcripts alone cannot identify a human style preference order.

*Proof.* Define \(U_+(y_1)=1,U_+(y_2)=0\) and \(U_-(y_1)=0,U_-(y_2)=1\) while keeping all source/structural observations unchanged. Without an observation that links \(T\) to utilities, neither is excluded. QED. This is **not** a claim that human preference is unknowable forever: independently annotated native-writing data can constrain the two alternatives.

**Proposition 2 (conservative partial-identification comparison).** If each actually measured quality coordinate \(q_j(y)\) is certified only to lie in an interval \([L_j(y),U_j(y)]\), then a sufficient condition for robust Pareto dominance \(y_a\succeq y_b\) on the *specified measured axes* is \(L_j(y_a)\ge U_j(y_b)\) for each \(j\), with strict inequality for at least one. If the inequality fails, do not force a winner; measurement intervals may overlap and unmeasured axes remain unidentified. A missing Korean naturalness label cannot be replaced by zero uncertainty. This conservative certificate is intentionally harder than a mean-score leaderboard and is better suited to a small-resource project that must distinguish knowledge from assumptions.

**Engineering translation.** A closed Korean grammar/semantic witness may establish an error or satisfy an author-declared template, but does not supply the interval on human naturalness. Conversely, source-grounded human pairwise annotations can constrain one or more quality coordinates without proving all factual details. Reporting two parallel evaluation ledgers—admissibility failures and preference evidence—is mandatory.

### 9. Context-dependent writing quality: a small impossibility witness

**Proposition (no universal isolated-sentence reference metric).** Let a Korean segment \(y\) contain context-dependent anaphora, e.g. \`그중 네 명은 ...\`. Consider two admissible preceding discourse states \(D_1,D_2\) with the **same written segment**, the **same writer-intended referent** \(r^*\), but different accessible antecedent distributions. Under any explicitly stipulated evaluation target that assigns a higher probability of correct referent recovery in \(D_1\) than in \(D_2\), no segment-only metric \(f(y)\) can reproduce that distinction: \(f(y)\) necessarily returns the same value in both cases.

**Proof:** its sole input is the identical segment \(y\). The target's context-conditional recovery criterion differs by construction. QED. **Scope:** this is not a limitation on a full-context Transformer evaluator \(f(y,D,S,G)\), and the proposed reader distributions are not calibrated human observations. It is a minimal proof that the **evaluation interface needs sufficient discourse context** if the target includes referential clarity.

**Practical test:** freeze candidate sentence and writer meaning; manipulate authorized reader knowledge/antecedent competition, then separately test the reference recovery criterion and stylistic preference. A static text-only fluent-output scorer should be treated as an insufficient comparator for this aspect. If real readers do not differ as hypothesized, the human explanatory hypothesis is defeated; the synthetic intervention alone cannot vindicate it.

### 10. Information-efficient external validation selection

If human annotations are scarce, do not draw uniformly from thousands of near-identical synthetic transformations. Build a *predeclared disagreement matrix* among eligible model or critic policies, grouped by genuine source-document families and linguistic phenomena (partitive recovery, source contradiction, connective coherence, register and revision). Select a limited, diverse **diagnostic** set covering distinct predicted failure signatures, while reserving completely unseen documents for independent evaluation. This is a methodological proposal for reducing annotation waste, not an estimator of population-level writing superiority. Report selection-induced bias, missing coverage and uncertainty; do not turn the chosen hard cases into a representative leaderboard.

Together these propositions connect the v0.7–v0.8 information-theoretic memory results to a refutable human-writing benchmark without inventing native Korean annotations, pretending English summarization scores transfer numerically, or training an expensive frontier model.


## P59 internal §v1.0 — Original-paper admission, label provenance and resource-constrained Korean writing validation

**Status:** research-design extension **inside G9-P59**, with 12 newly admitted original research PDFs in the canonical Drive literature commons. This subsection does not create a new P-stage, model, public leaderboard, or empirical human-preference result.

### A. Verified source receipt and correction

On 2026-10-09, 12 original PDFs were opened and their author/title/abstract matched, then renamed and moved **in place** from Drive \`00_INTAKE — Literature Radar\` to \`10_PAPERS — Canonical Literature Commons\`. Their existing Drive file IDs were preserved; move receipts and final parent membership were verified. Ten are the initially missing paper topics; two further papers are **MT-Bench-101 (Bai et al., 2024)** and **Chatbot Arena (Chiang et al., 2024)**, neither of which is the originally cited **Zheng et al. 2023 MT-Bench / LLM-as-a-Judge paper (arXiv:2306.05685)**. KLUE (Park et al., 2021) had already been held. **PDF availability does not imply raw dataset custody, annotation permissions, or dataset-split verification.**

Direct original-file receipts:
- [Wu et al. 2025, WritingBench](https://drive.google.com/file/d/1IbUF4RhNkMM8336txCx5-gw-lr9c-j6W/view)
- [Dwivedi-Yu et al. 2024, EditEval](https://drive.google.com/file/d/1A2NcyWeUo8BAMqp8FWATIBz-QxSECTN0/view)
- [Yu et al. 2025, KoSEnd](https://drive.google.com/file/d/14tiEgX0NDXHU7CSm0jef5drhB4Js6qCc/view)
- [Kim et al. 2025, KoGEM](https://drive.google.com/file/d/1PgpbciMydfSObDbNxZhnqS2ndHC2A-0S/view)
- [Fabbri et al. 2021, SummEval](https://drive.google.com/file/d/11AVNzeVzwFRhlRnkMek-nPi2oPwrsDhx/view)
- [Jourdan et al. 2025, Scientific Text Revision](https://drive.google.com/file/d/1q3M8fC7XJp1tAw4YYzp0jtI5AumN0Oqn/view)
- [Amrhein, Moghe & Guillou 2023, ACES](https://drive.google.com/file/d/1HbgkW62Nu2Ypua_kBkunEsnpF8feNMfW/view)
- [Gao et al. 2023, RARR](https://drive.google.com/file/d/181Lpp8DFqUaEJIbNzDvzwcQej8n94zgH/view)
- [Liu et al. 2023, G-Eval](https://drive.google.com/file/d/1uYKz-fsd64r8DeTCx7K6WJ1awcZ04aLA/view)
- [van Cranenburgh et al. 2026, GOLEMcoref](https://drive.google.com/file/d/1hHUWG90ImTBhXnX_sTihPaCMraBk-1lb/view)
- [Bai et al. 2024, MT-Bench-101](https://drive.google.com/file/d/1YoGbd4djCHXwGANLBN4DimUAGEXT3QGq/view)
- [Chiang et al. 2024, Chatbot Arena](https://drive.google.com/file/d/1x_Wslejz-YKKlpMWAT93kbQ21vWk0uE6/view)

**Critical correction to §v0.9:** KoSEnd is NOT a homogeneous independent-human-rated corpus. Its source paper describes 3,000 sentences and 15 candidate ending forms; subsection 3.3 reports limited **native-human annotation** for a small pilot (20 sentences and 300 ending instances per difficulty level), followed by **LLM annotation for non-human-annotated cases**, with model agreement calibrated against human majority votes. The authors explicitly acknowledge LLM-label risks in Limitations. The raw dataset has not yet been imported and we cannot assign per-row human authority until original labels and provenance fields are inspected. Thus **KoSEnd_ALL != HUMAN_GOLD**.

### B. Direct results that transport—and ones that do not

| Original evidence | What the paper actually observes | Authorized use inside KSGT | Forbidden transfer |
|---|---|---|---|
| WritingBench (Wu et al., 2025) | Six writing domains, 100 subdomains, query-conditioned criteria, trained critic, own-study human alignment checks | Per-task rubric construction and judge-bias experiments | Treat reported alignment percentage or trained critic as Korean human ground truth |
| EditEval (Dwivedi-Yu et al., 2024) | Multiple English editing operations; metric/task dependence | Distinguish revision competence from drafting; intervention-relation tests | Treat English reference edits as native Korean idiomatic preference |
| KoSEnd (Yu et al., 2025) | Korean ending naturalness with mixed human/LLM labels | **Human-pilot-only** potential calibration after label audit; LLM labels require separate uncertainty status | Promote all 3k x 15 variants to independently human-validated writing gold |
| KoGEM (Kim et al., 2025) | 1,524 Korean grammar MCQs across five linguistic categories | Grammar correctness/competence diagnostics | Infer a smooth Korean essay or reader preference from correct MCQs |
| SummEval (Fabbri et al., 2021) | 14 metric comparisons, expert/crowd annotated summaries, 23 summarizers | Multidimensional human vs auto-evaluator validation protocol | Transfer English news-summary correlations numerically to Korean writing |
| ACES (Amrhein et al., 2023) | Approx. 36k translation diagnostic items, 68 phenomena, 146 language pairs | Controlled semantic perturbations and per-error-family profiles | Treat MT challenge-set accuracy as general writing quality |
| Scientific Revision (Jourdan et al., 2025) | ParaRev 258 revised paragraph pairs, 516 instruction points, expert study with 10 annotators; LLM judge more reliable on instruction adherence than correctness | Separate revision instruction, correctness and preferred final text; design judge abstention | Assume a reference similarity metric always judges useful revisions |
| RARR (Gao et al., 2023) | Attribution/evidence search with evidence-conserving correction | A source-grounded revision architecture baseline | Infer naturalness or reader preference from attribution alone |
| G-Eval (Liu et al., 2023) | LLM evaluation of summary/dialogue, with documented own-model bias concerns | Criterion-based judge, swap-order/self-preference audit | Substitute LLM preference for human Korean writing gold |
| GOLEMcoref (van Cranenburgh et al., 2026) | 827k-token multilingual fiction coreference over 7 languages including Korean | Document-scale referent/zero-anaphora recovery test **if raw rights/annotations pass** | Equate coreference labels to author choice among KEEP/EXPLICIT/RESTRUCTURE |
| Chatbot Arena (Chiang et al., 2024) | Real pairwise crowdsourced chatbot preference methodology | Human pairwise order randomization and sample-family controls | Claim chatbot preference measurements identify Korean polished-prose quality |
| MT-Bench-101 (Bai et al., 2024) | Fine-grained long-dialogue task taxonomy | Context tracking/task decomposition ideas | Imply it replaces the original MT-Bench paper or supplies prose gold |

### C. Three distinct claims and an annotation-transport obstruction

For each source \(j\), distinguish **document available** \(P_j\), **released original dataset obtained under verified license** \(D_j\), and **independent-human label on the precise desired variable** \(H_{j,k}\). These are logically different statements:
\[
P_j \not\Rightarrow D_j,\qquad D_j\not\Rightarrow H_{j,\text{Korean prose quality}}.
\]
A label measuring coreference accuracy cannot stand in for an unobserved Korean writer's stylistic preference. A human annotation on a subset does not elevate AI-annotated remainder to independently human-annotated status. This is *authority nontransport*, not an objection to using helpful proxy tasks.

Let \(X\) be source context and \(Q_k\) a target construct such as reader recovery or naturalness. To transport an observed metric from source evaluation domain \(s\) to target Korean-writing domain \(t\) one would need a calibrated measurement relationship and sufficient overlap, e.g. an evidence-based condition on \(P_s(O\mid Q_k,X)\) versus \(P_t(O\mid Q_k,X)\). **No such general domain-invariance result has been established here.** Accordingly, externally published English correlation coefficients and model leaderboard placements are **methodological comparators, not transported Korean scores**.

### D. Resource-efficient writing benchmark, without pretending to have an LLM cluster

Keep the previous six axes, but split admissible observation sources into different tasks:
1. **Korean sentence-ending appropriateness:** the released KoSEnd human subcohort, if label provenance/rights are verified; remaining LLM labels stay independent-proxy tier. Test register, particle/ending interactions and reorderings rather than grading whole essays.
2. **Long-range reader referent reconstruction:** Korean fiction within GOLEMcoref, subject to actual dataset custody, splits by complete story and license verification. Match reference recovery and language-specific zero-anaphora phenomena; this measures discourse competence, not stylistic choice.
3. **Source-grounded revision utility:** controlled edits with independent source facts; inspect source preservation and task instruction separately, use the Jourdan and EditEval studies to guide study design, not to supply Korean labels.
4. **Passage-level Korean prose quality:** document/genre-level native writing with blinded human comparisons on *semantically admitted* candidates. No such labeled corpus has been collected here; keep this axis \`NOT_OBSERVED\`.

These four gates cannot be summed automatically. Use a vector-valued outcome and comparisons with missing values explicitly recorded. A cheap structural critic can reject deliberate quantity, polarity, referent and unsupported-fact mutations; it cannot certify a Korean paragraph is fluent. For future limited human time, group items by source/story, balance genres and perturbation families, predeclare a small non-leaked subset, randomize presentation order, and state sampling uncertainty rather than reporting a fake population leaderboard.

### E. Research stopping rule / falsification priority

Stop any claim of "human-level writing" or "architecture advantage" whenever: (i) data/annotation provenance is unverified; (ii) only synthetic toy scripts pass; (iii) a judge was calibrated only on its own model's text; (iv) semantic admissibility remains HOLD; (v) one synthetic scene/template is reused across splits; or (vi) a claimed Korean-native score is derived from imported non-Korean labels. The valuable contribution can be a **calibrated failure diagnostic and independently audited benchmark design** even without building a new frontier LLM.

Next inside this same P59 file: exact provenance field inspection for released KoSEnd and GOLEMcoref raw labels; construct an open, license-compliant Korean multi-phenomenon *diagnostic* baseline; only later pursue a small blinded human Korean-writing evaluation. Raw dataset source rights are checked at ingestion, not assumed because the corresponding article is stored in 10_PAPERS.

### F. Public release reality check, separately from PDF custody

The original authors' public repository READMEs were independently consulted:
- [KoSEnd](https://github.com/seungukyu/KoSEnd): confirms the 3,000-sentence/45,000 ending-variant setup, but its README's general phrase 'two-stage annotation' **does not override** the paper's precise subsection 3.3 split between small human pilot and LLM-annotated remainder. We have not yet inspected row-specific labels or established corpus rights.
- [KoGEM](https://github.com/SungHo3268/KoGEM): points to a released [KoGEM Hugging Face dataset](https://huggingface.co/datasets/Poppo/KoGEM) and documents CC BY 4.0 together with KOGL Type 1 attribution context. A README badge does not by itself resolve rights over every source question; inspect its actual dataset card and provenance before materialization.
- [GOLEMcoref](https://github.com/GOLEM-lab/GOLEMcoref): explicitly states human-annotated gold fiction coreference with Korean material in \`data/gold_annotations/korean\` and a project CC BY-NC 4.0 notice. This establishes *public release location and declared license*, **not ingestion to Drive**, not release of unconstrained derivative prose, and not preference gold.
- [ParaReval](https://github.com/JourdanL/parareval): released per-annotation fields separately include instruction-relatedness, correctness/acceptable revision, and human preference, with original paragraph, model A/B versions and source paragraph IDs. These are **English scientific editing annotations**, useful for proving the importance of keeping three evaluation targets disaggregated; they do not become Korean writer votes.
- [WritingBench](https://github.com/X-PLUG/WritingBench): public queries/criteria, critic and generator infrastructure; model-specific judge scores remain method-level observations, not Korean-reader labels.

**Resource-constrained choice:** calibrate specific Korean phenomenon-level critics against properly licensed original labels, and separately calibrate preference/acceptability on whatever native Korean paired writing becomes available. A single overall score calibrated on KoGEM grammar MCQs, KoSEnd mostly-LLM ending annotations and GOLEM human coreference would mix incompatible constructs, rather than solve the under-resourced evaluation problem.


## P59 internal §v1.1 — Corpus federation, label provenance and discourse-conditioned writing outcomes

**Single-stage rule:** §v1.1 is an internal subsection of G9-P59, not a new research stage or a standalone formal name. All downstream stages remain unchanged; P59 stays OPEN. No friend's server, local Windows files, or third-party raw corpus was accessed or modified in this subsection.

### A. Recovering an existing local-data lineage without pretending to read a local disk

An earlier user's *G9-P53* research audit, \`KSGT_G9P53_KRC_v06_NIKL2025_safe_census.json\`, identifies the original Drive archive [NIKL_ZA_2025_v1.0.zip](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view). The archive's Drive metadata was verified to exist. The **prior audit**, not fresh reprocessing, reports:
- \`NXZA2502512313.json\`: 1,027 documents, 13,907 sentences, 37,960 zero-argument/ellipsis slots, 9,059 multi-antecedent slots, nine \`그중\` sentences.
- \`SXZA2502512312.json\`: 75 documents, 16,439 sentences, 24,871 slots, 2,616 multi-antecedent slots, 16 \`그중\` sentences.
- Combined: 1,102 documents, 30,346 sentences, 62,831 slots, 11,675 multi-antecedent slots and 25 sentences with \`그중\` (from a previous lexical audit).

**Measurement separation:** The NIKL task is restoration of omitted sentence arguments; neither a multi-antecedent slot nor a lexical occurrence of \`그중\` certifies an independently annotated partitive antecedent or preferred KEEP/EXPLICIT realization. The G9-P53 census contains no original source text, and the present executor cannot inspect the user's \`C:\\KSGT\` disk; local file presence, byte-hash identity and Windows folder structure therefore remain *USER_REPORTED / UNVERIFIED*. The earlier \`ksgt-corpus\` plan also names Korean literature, permitted criticism/columns, scientific reporting, parallel translations, explicit writing-failure cases and minimal contrast pairs. Those are candidate data *families*, not a currently inspected inventory or license grant. A historical "Shadow Corpus" concept permits statistics and failure-type analysis under appropriate rights, not copying unlicensed entire passages or using them as fine-tuning gold.

### B. Inspecting actual released dataset structures

The public [KoSEnd repository](https://github.com/seungukyu/KoSEnd/tree/main/KoSEnd) lists three files \`easy.json\`, \`intermediate.json\`, \`hard.json\`; its author paper reports 3,000 Korean sentences × 15 ending candidates. The connected GitHub file API returned file hashes but **empty body content for these large JSON files**, so sample-level schema, license and human-vs-LLM annotation markers were **not** verified. Do not infer that all three files are independently human-labeled. The original paper's human-pilot/LLM-remainder caveat remains controlling.

The public [GOLEMcoref repository](https://github.com/GOLEM-lab/GOLEMcoref) contains human-curated Korean fiction coreference in \`data/gold_annotations/korean\` with distinct CoNLL-2012 and CorefUD representations. [The original split CSV](https://github.com/GOLEM-lab/GOLEMcoref/blob/main/data/splits/splits.csv) was read: 30 Korean stories, split **24 train / 3 dev / 3 test**. CorefUD zero-anaphora/inclusion relation is a different representation of the *same* work, not a second independent sample. Its repository \`LICENSE\` and README declare **CC BY-NC 4.0**; since the corpus includes stories sourced from publishing/fanfiction platforms, rights for source material, derivatives and redistribution still need a separate scoped check, even if private noncommercial analysis is permitted under applicable terms. No GOLEM corpus bytes were imported.

### C. Four distinct validation constructs, not a synthetic single quality label

Treat these as different measured quantities:
1. \(q_{\mathrm{ellipsis}}\): argument omission/restoration success (NIKL);
2. \(q_{\mathrm{coref}}\): referent identity, chain consistency and long-range recovery (GOLEMcoref);
3. \(q_{\mathrm{ending}}\): sentence-ending fit, with explicit human/LLM label provenance (KoSEnd);
4. \(q_{\mathrm{writing}}\): actual native-Korean author/reader judgments on a source-preserving revision or generated paragraph (**currently unobserved**).

KoGEM MCQ can add grammar-knowledge diagnostics; English ParaReval can teach *annotation format* for revision correctness, acceptability and human preference, but supplies **no Korean writer preference observation**. There is no identified universal function
\[
q_{\mathrm{writing}}=f(q_{\mathrm{ellipsis}},q_{\mathrm{coref}},q_{\mathrm{ending}},q_{\mathrm{grammar}})
\]
without independently validated linking evidence. Two candidate writing systems may match every separate component score while reversing actual human prose preference. Thus the components are potential mediators and diagnostics, not a surrogate leaderboard.

### D. Interaction estimand: when does explicit reference actually help?

Freeze source work \(S\), intended referent and proposition \(M\), writer genre \(G\), and allowed candidate content. Cross two writer realization policies \(A\in\{\mathrm{KEEP},\mathrm{EXPLICIT}\}\) with two **assigned reader-information conditions** \(C\in\{\mathrm{clear},\mathrm{competing}\}\). The intended target must be invariant across the crossing. Define \(p_{a,c}\) as the *independently measured* probability that a reader selects the intended referent after receiving candidate \(a\) under condition \(c\). A useful interaction is
\[
\Delta_{\mathrm{ref}}
=(p_{E,\mathrm{competing}}-p_{K,\mathrm{competing}})
-(p_{E,\mathrm{clear}}-p_{K,\mathrm{clear}}).
\]

**Hypothesis, not finding:** if overt reference is most useful when antecedents compete, \(\Delta_{\mathrm{ref}}>0\). This contrast distinguishes *context-sensitive clarification* from a blanket preference for verbosity. It is not a universal preference theorem: successful reference recovery can coexist with unwanted repetition or stylistic awkwardness. Collect a separate, blinded \(p_{\mathrm{preferred}}\) or genre-adjusted reader-comfort outcome among candidates that preserve source meaning.

Without randomized context assignments, stable reader instructions, no target leaks and a genuine human comprehension outcome, \(\Delta_{\mathrm{ref}}\) is descriptive at best. Under the current synthetic v0.5 cases it is **NOT_OBSERVED**. A toy demonstration with \((p_{K,clear},p_{E,clear},p_{K,competing},p_{E,competing})=(.9,.9,.5,.85)\) gives \(\Delta=.35\) by arithmetic only; **these numbers are invented program canaries, not user or reader data**.

The 2×2 factorial structure also allows RESTRUCTURE as a third action, separate from explicitness, when enough admissible native Korean passages become available.

### E. A rigorous boundary on mixed-label calibration

For a fixed, finite diagnostic sample of \(n\) cases, suppose \(h\) decisions are confirmed correct against *actual independently witnessed human labels*, \(e\) confirmed incorrect, and \(u\) have no adequate witness, with \(h+e+u=n\). The true population-of-these-n accuracy is only partially identified:
\[
\boxed{h/n\ \le A\ \le(h+u)/n.}
\]
This is a sharp logical identification interval if all unknown cases might be right or wrong. **It is not a sampling confidence interval or an estimate of Korean population agreement.** If no case has inspectable independent-human labels, the bound is [0,1] and the quality claim is uninformative. To narrow it requires legitimate new annotation or independently calibrated error information. A KoSEnd pilot selected by difficulty and not randomly representative cannot silently calibrate the whole LLM-labeled remainder.

Likewise, original dataset release, rights, raw-file custody, label task type and human annotation source are distinct authorities. The corresponding executable [v1.1 Node metadata contract](./corpus_contract_v11.cjs) and [independent Python audit](./corpus_audit_v11.py) enforce these boundaries. They validate authored metadata fixtures and known release/split counts, **not the unseen raw corpus**.

### F. Low-resource research and eventually a fair writing benchmark

The cheapest scientifically useful order is:
1. Keep a registry with immutable ContentBlob SHA-256, SourceWork, SourceEdition, AssetRecord (semantic role/provenance) and AssetLocation (Windows/Drive/HDD reference). A path alone is not content identity; separate file versions and author/work duplication.
2. Stage *only* metadata and license receipts first. For each actual dataset, inspect a small, rights-compliant sample, original annotations and available label provenance. Preserve public GOLEM work-level train/dev/test grouping across both CoNLL/CorefUD views.
3. Calibrate phenomenon-specific critics against genuine annotations: NIKL ellipsis, GOLEM coreference, KoSEnd ending naturalness stratified by verified human/LLM label source. Report unknown provenance separately, and never transfer a zero-anaphora or coreference label to partitive-writing-choice gold.
4. Use minimal source-preserving KEEP/EXPLICIT/RESTRUCTURE candidates across actual different source documents, not near-duplicates of one authored template. Sample independent human readers only when available, with assigned knowledge and randomized candidate order. Distinguish target recovery, factual conservation and writing preference in the analysis.
5. Compare a simple lexical or current-LLM baseline, source-aware editor and proposed discourse-state architecture on the same tasks and input permissions. Do not spend a large GPU budget until the simple baselines and proxy-vs-human validity checks uncover a real discriminating failure mode.
6. If next week's friend server is granted: use a user-authorized HDD-only private work area; no SSD-heavy staging, no global software changes, no access to others' files, and yield to the RITHM compute priority. Dataset ingest must remain explicitly permissioned and separate from GPU work.

**Falsification:** If a source-aware baseline performs as well as the explicit-state model on matched native Korean comprehension *and* source-admissible writing preference, the distinctive architectural claim fails, regardless of synthetic memory-bottleneck proofs. Conversely, even a critic with perfect source-fact rule scores cannot demonstrate preferred Korean prose without a human validity anchor.

### G. Status after §v1.1
- **Verified now:** Original NIKL ZIP's Drive metadata, prior P53 census artifact, GOLEM repository split CSV's Korean story counts (24/3/3), GoLEM repository's CC BY-NC 4.0 license text, public KoSEnd filenames and previous paper-described mixed annotation design.
- **Not verified:** \`C:\\KSGT\` current local dataset bytes/tree; individual KoSEnd JSON schema and license; GOLEM rights for each fanfiction story; raw GOLEM/NIKL sample reprocessing; any measured Korean prose preference or neural model advantage.
- **Evidence level:** READ-ONLY_SOURCE_INSPECTION + LOCAL_SYNTHETIC_METADATA_CONTRACT_TEST. P59 OPEN / official P58 latest CLOSED.

## P59 internal §v1.2 — Past-work recovery, annotation-schema gates & useful paragraph revision

**One subsection of the existing G9-P59; no new official stage or independent research title.** The current user's screenshot shows thirteen ZIP files under \`C:\KSGT\`, including yearly Korean newspaper packages from 2020–2025, merged newspaper CSV/JSON and written-language CSV/JSON. These are reported *file-presence visual evidence*, not a fresh byte/hash or internal schema inspection. ZIP package, original source work, format variant and document are different identity levels.

### A. Reopen the actual earlier KSGT lineage before new data collection
[KSGT 14.md archive](https://drive.google.com/file/d/12f5QO-qfbUjq5uOxq7KsTLtQUPeHAc8p/view) records P45 Work-mode/Chat handoffs that **already streamed thirteen NIKL ZIPs**. The [actual Drive CP5 multipart manifest](https://drive.google.com/file/d/1yBMfcJvDvXs_XSTzvkcyjN-wRbYKuMhY/view) was read again: schema \`ksgt.g9.p45.cp5.document-stats-multipart.v1\`, **12,352,778 rows**, **ten parts**, 857,083,889 compressed bytes, SHA-256 \`9f9baa781c56241de1b1b84cac2bed6080f12c71350d6bda1d30cd4100a0aa76\`, \`raw_text_present=false\`. The prior \`RAW_CORPUS_RETIREMENT\` was restricted to *already encoded CP5 variables*: no further raw reread needed for those same analyses, original ZIPs retained unchanged. CP5's EDF/publisher/topic statistics are NOT paragraphs, source-edit pairs, source identities or human writing-preference gold. Existing per-archive hashes must be reused rather than recomputed unless a new scientific question needs new features and access is lawful.

[KSGT 17.md archive](https://drive.google.com/file/d/1xY3vO7uHkZjzg2GZ4zdAJ73Q-slqhX5B/view) and [P53 canonical note](https://app.notion.com/p/3f3ef561cf928144aafec65a5556170c) show earlier **actual Qwen3 model writing experiments** and a structured genre-generation contract \`F/E/L/W\`: protected facts (F), epistemic status of each claim (E), genre-dependent invention license (L), writer intention (W). P53's B/U/K experiment recorded source-fact contradictions, unsupported time claims and source-label leakage into natural prose. These are important *historical model failure observations*, not newly generated P59 samples, native writer judgments or a fair large-model architectural advantage. KSGT already had Write/Edit/Judge axes and a Korean Human Revision Atlas proposal; do not present them as new inventions.

G9-P22/23's selective edit method and [P42 Harvest](https://app.notion.com/p/3eaef561cf92814bbbefef4ad7f9f091) identified collateral edits and uniform-polish flattening risk. The earlier PPG guard can **detect** damage but has no authority to invent roughness or stylized noise. This is the correct ancestor of the v1.2 editor-critic, rather than ad-hoc de-AI phrase deletion.

### B. A precise barrier: aggregate corpus statistics cannot adjudicate local edits

Let \`T(X)\` denote the existing CP5 feature extractor from source passage \`X\`, and \`R(X)\` an edit-critical property (truth preservation, local antecedent recoverability, connective licensing). If \`T(x_1)=T(x_2)\` but \`R(x_1)\ne R(x_2)\`, then no function \`g(T(X))\` can correctly decide \`R\` for both passages. It receives identical sufficient-statistic inputs for two required different answers. This elementary **task-specific non-sufficiency witness** is not a critique of CP5's original diachronic goals; it forbids claiming that its counts encode unavailable passage-level semantics. Re-read selected raw documents only if a new P59 property can demonstrably not be derived from the sealed CP5 tables, source access is authorized, and read cost/rights are controlled.

CSV/JSON variants and merged/yearly packaging cannot be independent confirmation without **SourceWork/SourceEdition** crosswalks and content hashes. The 2021 CSV↔JSON two-character discrepancy in the archive is a reason to keep both original formats until representation-level reconciliation, not evidence that two text samples are independent.

### C. Actual annotation-format access: a conservative verdict

- [GOLEMcoref README](https://github.com/GOLEM-lab/GOLEMcoref) describes Korean CoNLL and CorefUD CoNLL-U forms; the [official split CSV](https://github.com/GOLEM-lab/GOLEMcoref/blob/main/data/splits/splits.csv) confirms **24 train / 3 dev / 3 test Korean source stories**, shared between representation views, with repository CC BY-NC 4.0 and underlying story-rights caveats. Standard CoNLL-U uses ten tab-separated fields. **No actual annotated Korean token sample was ingested in this run; a ten-column parser is syntax-only until real schema/label review.**
- [KoSEnd](https://github.com/seungukyu/KoSEnd) releases \`easy.json\`, \`intermediate.json\`, \`hard.json\`. The browser lists \`easy.json\` as **7.32 MB** and declines preview; the connected GitHub API returned an empty body. Hence **actual JSON field names, per-row label provenance and raw reuse conditions remain HOLD**. A supposed parser must accept an audited field mapping, not guess \`humanGold=true\`.
- NIKL Zero-Anaphora P53 restoration slots are not partitive-antecedent or writer preference labels. KoGEM grammar and KoSEnd ending selection are valuable separate diagnostics but not multi-paragraph writing-quality gold.

The executable [v1.2 inspect-only adapter](./annotation_revision_v12.py) can scan local ZIP central directories *without extracting text*, validate synthetic ten-column CoNLL-U syntax, hold KoSEnd rows until fields/provenance are mapped, and enforce evidence-backed F/E/L/W revision gates. Its self-tests use only tiny **fabricated** ZIP/syntax/witness examples, never real dataset observations.

### D. Repair the right defect while preserving meaning

For source paragraph \`x\`, candidate revision \`y\), genre \`g\`, discourse \`D\), and writer authority \`W=(F,E,L,I)\` define admissible revisions
\[
{\cal A}(x,W,D)=\{y : \operatorname{PreserveFacts}(F,x,y)\wedge\operatorname{PreserveEpistemic}(E,x,y)\wedge\operatorname{AuthorizedAdditions}(L,x,y)\wedge\operatorname{RespectIntent}(I,D,y)\}.
\]
A field marked **independentWitness** records an external *claim about* those constraints; the checker does not magically validate real Korean entailment. Unknown witness gives HOLD. A negative independent witness gives REJECT. A complete witness gives \`WITNESSED_GATE_ONLY\`, *not* a naturalness PASS.

Among actually admissible candidates, a future human-calibrated policy may minimize
\[
\arg\min_{y\in{\cal A}}\quad
\mathbb E_{r}[\ell_{\rm comprehension}(y,D_r)]
+\lambda\ell_{\rm collateral}(x,y;W)+\mu\ell_{\rm edit\,burden}(x,y),
\]
while retaining \`NO_EDIT\` when the alleged flaw is unverified. These weights, losses and reader distribution are **not identified from current data**. More edit distance is not automatically better revision, and fewer words need not be more natural. Different genres authorize different creativity: a grounded report cannot invent facts that might be acceptable fictional details in a story. In the presence of a P53-like contradiction, lexical polish cannot compensate for violation of a protected fact.

**Critical experimental falsifier:** on the same facts, audience and candidate budget, compare historical B/U/K prompts, a minimal-edit baseline and a discourse-planning alternative. Ask both *whether the named defect was repaired* and *whether other constraints were harmed*. Log rejection, HOLD, conditional human preference and source-family denominators separately; if source-aware ordinary editing equals proposed explicit-memory planning on independent Korean comprehension and source-grounded preference, the claimed architecture-specific writing advantage fails.

### E. Cheap but honest human-comparison estimands
For matched source passages \(s\), track \`A_s\` = independently witnessed factual admissibility, \`R_s\` = reader referent recovery, \`D_s\` = independently verified repair of a stated problem, and \`P_s\` = blinded native-Korean writing preference. The vector \((A,R,D,P)\) has *four distinct authority sources*; none can be filled with synthetic program PASS. A paired mean \(\sum_s(P_{after}-P_{before})/n\) is descriptive until experimental assumptions are justified, must cluster repeated variants by source work and must not conceal differential candidate HOLD or REJECT rates. Work with the existing P45/53 artifacts first; obtain new independent human labels only when permitted and necessary.

### F. Status and next gate
**P59 §v1.2**: past Work-mode corpus analysis RECONCILED; CP5 manifest ACTUALLY INSPECTED; screenshot 13 ZIP names USER-VISIBLE ONLY; formal dataset adapter PROTOTYPE TESTED; original KoSEnd row schema / Korean GOLEM annotation sample / real writing preference **HOLD**. Next: verify raw sample schema under rights, inspect existing P53 saved source-output bundles without re-training, and assemble a document-disjoint minimal Korean revision test with author/writer-correctness witnesses. No friend's computer used.

## P59 internal §v1.3 — Actual P53 output lineage, KoSEnd/GOLEM original rows, contamination graph and paragraph-edit ledger

**Authority boundary:** This section remains in G9-P59. The requested G9-P54 number was already used and has [its own canonical historical Notion page](https://app.notion.com/p/3f3ef561cf9281ffbf94d12bc8785520): *Context-Grounded Reference Realization, Antecedent Evidence & Writer-Choice Boundaries*. P54 is not available for a new title. A subsequent new official stage should use **G9-P60**, without retroactively renaming or re-closing P54/P55/P56/P57/P58. No official stage promotion occurs merely by drafting a candidate title.

### A. Original P53 documents audited, not reconstructed from anecdotes

**Three original Google Drive ZIP files were actually read and SHA-256 checked in a separate Python container run:**
- [Qwen3-4B six passage outputs](https://drive.google.com/file/d/1vDGd3R_32J9EwbSK_ZyuvOBMossq8wu4/view): ZIP SHA-256 \`e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46\`. Six *model generations* under B_CLEAN/U_PLAIN_PLAN/K_TYPED_PLAN on source brief IDs \`EX09\` and \`EX10\`. Source hash in these records is **packet scoped**, not a per-source independent fact annotation. Human reader study previously cancelled.
- [Qwen3-8B B-only](https://drive.google.com/file/d/1pqDMGMt8drbz0pG3LiXbGMudiXi9gGCb/view): ZIP SHA-256 \`57a7af352b9328f1ad5682e7fae3a893b5ef2948bfcc01e41437558ed0348951\`. Two B outputs on \`SCI01\`, \`NAR02\`; preflight instrument, no K comparison or native reader scores.
- [Qwen3-14B B-only](https://drive.google.com/file/d/1o1iThI6yZ73fwKQvtO4fJ06MmwTBRVJR/view): ZIP SHA-256 \`aad15005ad97ec5b9211798d783efb49deca1646ab804ccc22f5e377d3a3ce72\`. Four B outputs: \`SCI02\`, \`NAR01\` as \`PRIMARY_UNEXPOSED_DEV\`; \`SCI01\`, \`NAR02\` explicitly recorded as \`EXPOSED_8B_CONTROL\`. The two exposed cases have *identical row source SHA-256 across 8B and 14B*; they are intentional cross-model repeat stimuli, not separate source texts.

**Actual identity audit:** 12 different model-generated outputs, all 12 stored text hashes reproduced from bytes, *zero exact text duplicates*, **six unique source brief families**: \`EX09\` 3, \`EX10\` 3, \`SCI01\` 2, \`NAR02\` 2, \`SCI02\` 1, \`NAR01\` 1. These outputs are **not** 12 independently selected writing topics, **not 12 edits by humans**, and **not a qualified confirmatory test set**. The frozen metadata-only [P53 per-candidate ledger](../../artifacts/g9_p59_v13_p53_generation_ledger.json) records SHA/source-arm/cohort; it intentionally excludes raw paragraph text. [Offline re-auditor](./original_records_v13.py) can repeat the actual archive verification on authorized local copies.

This directly tests a key distinction: \`ACTUAL_NEURAL_OUTPUTS\` does not entail \`INDEPENDENT_NATIVE_REVISION_GOLD\`.

### B. Actual original KoSEnd JSON annotations, beyond paper/README description

The connected GitHub API's ordinary \`fetch_file\` omits large file contents, but Git blob fetch by **exact SHA** succeeded. All three original files were parsed as JSON (UTF-8 BOM removed):
- \`KoSEnd/easy.json\`: blob \`afec52a9d441b2d05e8cafd38e669f6c69538d98\`; 15,000 rows; 155 repeated sentence-option records;
- \`KoSEnd/intermediate.json\`: blob \`36e548942213f0b8960dd3b906a707c8fe224d63\`; 15,000 rows; 2,737 repeated sentence-option records;
- \`KoSEnd/hard.json\`: blob \`5cb1b2f9e744125b15496a291fe2114f8c2ac3ac\`; 15,000 rows; 2,336 repeated sentence-option records.

**Exact five fields per original row:** \`usage_type\` (string), \`sentence_options\` (list), \`sentence_answer\` (list), \`usage_options\` (list), \`usage_answer\` (list). No \`annotator_id\`, \`human_gold\`, \`label_origin\` or \`humanEvidenceId\` field exists in the read rows. All **45,000 rows** share this field signature. Some valid answers are multi-choice arrays; an \`N\` token appears in **11,558 sentence_answer lists** (4,469 easy, 3,153 intermediate, 3,936 hard). **Two rows** have empty \`sentence_answer\` arrays (easy 1, hard 1). No answer letters were found outside each row's offered A/B/C/D option labels, allowing the sentinel \`N\`. \`N\` requires interpreting the upstream schema, not treating it as a normal answer-letter index or automatically human gold.

There are also exact \`sentence_options\` repeats *between* difficulty files: easy/intermediate 555 intermediate rows, easy/hard 390 hard rows, intermediate/hard 390 hard rows (pairwise membership counts, **not** unique cross-file identities). Crucially, **this identity is at the option-list grain**. It is not evidence of duplicated source works at higher annotation grain; a stable source-family crosswalk is still needed.

**Consequences:** Never random-split these 45k rows and call them independent human-rated prose. Construct a source/group graph from identical option lists, source text normalization **without erasing contrasts**, and any original source IDs available in ancillary records; split by connected component if contaminating source/group links are known. Preserve difficulty and both question types. Since row-level human versus LLM label origins are unobservable in the released JSON, all observed labels must have provenance \`MIXED_UNKNOWN_PER_ROW\`; there is **no inferable subset of independently human-labelled rows**. The literature's small human pilot exists in the paper but the released per-row mapping to it is unavailable here.

### C. Actual original GOLEMcoref Korean CorefUD files

The [original authors' repository](https://github.com/GOLEM-lab/GOLEMcoref) exposes \`data/gold_annotations/korean/conllu/{train,dev,test}.conllu\`, independently fetched from the GitHub blobs. The actual 10-column fields are \`ID FORM LEMMA UPOS XPOS FEATS HEAD DEPREL DEPS MISC\`. Annotations in \`MISC\` include \`Entity=(e...) \`, continued multi-token mention spans and closure markers. The files also include \`# newdoc id\` boundaries and \`# global.Entity = eid\` headers.

| Corpus split | Original Git blob SHA | Source works (\`# newdoc\`) | Syntactic token/empty-node rows | Rows with \`Entity=\` |
|---|---|---:|---:|---:|
| train | \`5076532c2f4b304867f3276f25c03b1b62d9fad6\` | 24 | 76,440 | 9,355 |
| dev | \`cfc77ba3a8e9c4070e99fe2ac0e9f6e555405c67\` | 3 | 6,449 | 801 |
| test | \`f73a4fdaac3977a53db6112dcdf1104fdc7723b8\` | 3 | 7,142 | 911 |

The **90,031 token/empty-node rows**, **11,067 entity-tag-bearing rows**, and **30 source works** are original-file **format census statistics**. Entity-marked token rows are **not** a count of gold entities, coreference chains, or independent antecedent judgments. Original dataset documents are human annotated for character coreference, but those gold relations are **not** preferred writer realization or polished Korean prose. CorefUD and CoNLL-2012 views of one story remain one SourceWork and must not cross data partitions. Source fanfiction rights and CC BY-NC 4.0 noncommercial limits remain scoped license questions; raw fiction prose was NOT copied into KSGT GitHub.

### D. Canonical paragraph-edit ledger: contrast without laundering authorship

The unit of inference is a *SourceWork* \(s\), containing an authorized source-text version \(x_s\), frozen factual/epistemic/genre/writer constraints \((F,E,L,W)_s\), a known named failure \(d_s\), an original model candidate \(b_s\) (when stored), and revision candidate \(y_{s,a}\) indexed by action and model. Each version has a separate source SHA and surface SHA:
\[
\mathrm{EditRecord}=(s,\mathrm{version},\mathrm{arm},\mathrm{provenance},\mathrm{sourceHash},\mathrm{outputHash},\mathrm{witnesses}).
\]
Authority for source fidelity, actual repair, third-party comprehension and native preference are independent. An existing model output with no attributable human revision must have \`edit_kind=MODEL_DRAFT\`, \`human_revision_gold=false\`, and \`human_preference_gold=false\`. If a valid original-to-revision pair does not exist, mark \`PAIR_UNAVAILABLE\`; do not invent an AI-to-human before/after comparison.

**Data-split construction:** build a contamination graph \(G=(V,E)\) over all candidate records with edges for same SourceWork, same original source SHA, exact option-list duplication, revision ancestry, CoNLL/CorefUD duplicate representations, or observed source/author family. Each **connected component**, not each generated paragraph, is assigned to only one evaluation split. False positive edges cost sample size; missing real edges leak training information. Report candidate n, source-work n, and component n separately.

### E. Causal question only after semantic admission

For candidate \(y\), first estimate noncompensatory admissibility \(\mathrm{Adm}(y\mid F,E,L,W)\), and distinguish **PASS / REJECT / HOLD** using independent evidence. For human-observed outcomes, let \(R(y,D)\) be correct referent recovery, \(U(y)\) the resolution of a preregistered defect, and \(P(y)\) blinded natural-Korean writing preference. There is no justified scalarizing away a **meaning violation** with high fluency.

Given source-disjoint matched pairs, analyze \(R\), \(U\), \(P\) separately, cluster by source component, and report missing human outcomes and reject rates. For example, a proposed preference effect
\[
\tau_P=\mathbb E[P(Y_{\mathrm{plan}})-P(Y_{\mathrm{baseline}})\mid \mathrm{source\ supported},\mathrm{genre},\mathrm{reader\ context}]
\]
requires the matched interventions, *measured* human preferences, equal candidate budgets, reader assignment and no hidden source exposure. None is supplied by the original 12 P53 model texts or synthetic guard PASS.

The scientific prize of the no-GPU phase is **measurement identification** and a properly reused source-disjoint native evaluation packet, not a larger synthetic leaderboard.

### F. Existing P54 and suggested future official progression

G9-P54's historical title and previous A1 witness-only results remain intact. P59 can continue internally through §§v1.4+ without a special closure ritual. If a **new** mainline official stage is desired after the current G9-P59, propose:

**KSGT Generation IX G9-P60 — Source-Disjoint Korean Revision Evaluation, Semantic Admissibility & Reader-Calibrated Writing Preference: Original-Output Provenance, Contamination Graphs, Genre-Conditioned Repair & Human-Anchor Identification**

This is a **name proposal, not an opened stage**. It should not be registered as \`current_stage\` until the user accepts the new name and its empirical question; do not infer G9-P54 is vacant.

### Postscript — G9-P60 officially opened (2026-10-09)
The previously proposed G9-P60 name has now been **explicitly accepted** by the user and registered as the new mainline stage in [CURRENT_STAGE.json](../../CURRENT_STAGE.json) and [the official P60 research program](../g9-p60/RESEARCH_PROGRAM.md). Preserve this historical P59 theoretical record and its internal subsections; do not reinterpret the already existing G9-P54. P59's reference-choice, query-blind memory, P42/P53 F/E/L/W and source-honesty limits are operational constraints inherited by P60's independent paragraph-revision and writing-quality evaluation. The P60 opening does **not** prove a native Korean writing-quality gain and does not invoke a separate P59 termination ritual.
