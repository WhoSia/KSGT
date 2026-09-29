# KSGT-REALIZE-v0.3 — Structured Human Variation, Choice Sets, and Non-Ideal Realization

## 1. The primitive is not a count process

For realization opportunity i, the primitive object is an action on an opportunity:
[
A_i in {mathrm{NULL},mathrm{OVERT},mathrm{PRONOMINAL/MARKED}}.
]

Aggregate omission count over a document is
[
K_d=sum_{iin d}mathbf 1[A_i=mathrm{NULL}],
]
so a Poisson model is not the primitive law. Under independent heterogeneous opportunity probabilities it is Poisson-binomial; under document/speaker heterogeneity it becomes a mixture. A Poisson approximation is admissible only in a rare-event/exogenous-exposure limit, which is not the observed SUBJECT regime.

## 2. Comparable observational choice sets

For predicate token p and syntactic slot s, define the exclusive observational choice set
[
mathcal C_{p,s}={mathrm{NULL_ONLY},mathrm{OVERT_ONLY}}
]
only after preserving `BOTH` and `NONE` as separate states.

Antecedent-available overt controls are evidence tiers:
- P0: no prior lexical accessibility evidence;
- P1: prior exact dependent-head repetition;
- P2: prior proper-name repetition.

P1/P2 are accessibility proxies, not coreference gold.

A native-original matched pair is admissible only when both corpus examples share a presealed observable stratum. Such a pair is an observational comparison, not a counterfactual preference label.

## 3. Preference is partially identified

Let
- X_it: observed predicate, sense, slot, source and accessibility state;
- H_it: latent discourse and information-structure state;
- Gamma_it: semantic-role uncertainty set;
- B_u: persistent author/speaker realization bias;
- Z_it: local discourse-production state;
- S_it: style/social-pragmatic target.

The desired policy is
[
pi(amid X_{it},H_{it},Gamma_{it},B_u,Z_{it},S_{it}).
]

Current corpus evidence does not point-identify this policy because overt and null examples are observationally selected, H is incomplete, and unrealized alternatives lack native preference labels.

## 4. Structured variability, not free noise

Human-like variation is modeled as structured heterogeneity:
[
B_usim Pi_B,qquad
Z_{t+1}sim K_{r,s}(Z_t,X_t),
]
where K is conditioned on source regime r and slot s.

A single global burstiness or temperature parameter is forbidden. Empirically, local persistence changes sign across source×slot regimes.

## 5. Document-level overdispersion

A baseline binomial assumes one fixed omission probability p within a source×slot regime. The observed document counts are substantially overdispersed.

A beta-binomial donor model is
[
P(K_d=kmid n_d,alpha,eta)
=inom{n_d}{k}rac{B(k+alpha,n_d-k+eta)}{B(alpha,eta)}.
]

The induced intraclass correlation is
[
ho=rac{1}{alpha+eta+1}.
]

This does not make beta-binomial the final linguistic theory; it certifies that a single homogeneous Bernoulli law is too smooth.

## 6. Overexplicitness is not automatically error

Define an overexplicitness candidate as an OVERT realization that remains observable despite strong prior accessibility evidence.

It is not an error label. It may reflect:
- latent discourse risk,
- author/speaker explicitness bias,
- contrast or focus,
- social-pragmatic caution,
- rhetorical repetition,
- planning/processing constraints,
- or objectives absent from the current state representation.

Thus KSGT must not inject arbitrary mistakes to appear human. It must preserve latent objectives and calibrated heterogeneity.

## 7. Information-structure proxy discipline

Pre-choice proxies may include recency, mention count, prior subjecthood, predicate sense and source regime.

Current surface topic/case marking is downstream of the choice and cannot be treated as a pre-choice causal variable by default.

Korean information-structure morphology is polyfunctional; therefore no marker is granted a one-to-one topic/focus ontology.

## 8. World-choice geometry

Let F_it be the actions surviving semantic, recoverability and grammatical gates from KSGT-REALIZE-v0.2.

Each action has a protected vector
[
u(a,omega)=
(u_{sem},u_{ref},u_{disc},u_{IS},u_{style},u_{redundancy}).
]

Before preference calibration, KSGT returns the robust Pareto frontier.

After author-specific or population-specific preference evidence exists, a calibrated preference functional may induce a distribution over the frontier:
[
P(A=amid F,X)
=int mathbf 1[ainargmax_{bin F}U_	heta(b,X)],dPi_{u,t}(	heta).
]

The distribution over preference functionals is the source of calibrated variation. It is not a license for unstructured random temperature.

## 9. Non-ideal naturalness

A realization system may be linguistically competent yet statistically unnatural if it is too smooth.

Naturalness therefore has at least three separable layers:
1. semantic/pragmatic admissibility;
2. choice calibration conditional on observable context;
3. dispersion and local-history calibration conditional on author/source/style.

Matching only the marginal omission rate is insufficient.

## 10. Stopping law

R6 may promote:
- observational comparable choice-set authority;
- structured-variation authority;
- overdispersion and source×slot local-state evidence;
- native-original matched-pair materialization.

R6 may not promote:
- causal preference effects;
- human utility weights;
- topic/focus causal effects;
- a universal author-personality parameter;
- a single stochastic law for all Korean realization.

True counterfactual preference authority requires prospective native choice/judgment evidence or an independently justified quasi-experimental design.
