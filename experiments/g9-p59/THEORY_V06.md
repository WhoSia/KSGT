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
