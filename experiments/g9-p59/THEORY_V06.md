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
