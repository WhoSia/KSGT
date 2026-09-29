# G9-P36-R10-R6 Empirical Receipt

## Comparable choice-set materialization

Exclusive 2025 predicate-slot opportunities:
- total: **106,125**
- OVERT: **58,290**
- NULL: **47,835**

Overt accessibility controls:
- P2 prior proper-name repeat: **9,557**
- P1 prior exact head repeat only: **10,992**
- P0 no prior accessibility proxy: **37,741**

Null-side accessibility:
- prior-text available: **29,665**

Strict matched observational strata
`source × slot × predicate-sense × proper-name-history × recency × prior-subjecthood`:
- mixed NULL+OVERT strata: **1,649**
- pairable native-original matched pairs: **3,280**
- actor-specific mixed strata under the same strict key: **618**
- actor+predicate-slot mixed strata under antecedent-available contexts: **2,023**

These are observational matched pairs, not counterfactual preference labels.

## Accessibility-proxy falsification

Accessibility does not deterministically force omission:
- high-accessibility P2 overt controls: **9,557**
- high-accessibility P2 null cases: **8,633**

Document-hash five-fold prediction on prior-accessible cases:
- accessibility proxies only: AUC **0.8065**
- + predicate identity: AUC **0.8598**
- + actor proxy only: AUC **0.7820**
- + predicate and actor proxy: AUC **0.8502**

Interpretation: accessibility and predicate identity carry substantial distributional signal, but no observed proxy deterministically identifies the action. Actor identity is not a universal additive predictor.

## Document-level overdispersion

Pearson dispersion relative to one binomial rate per source×slot:
- News SUBJECT: **2.393**
- News OBJECT: **1.650**
- Spoken SUBJECT: **6.715**
- Spoken OBJECT: **4.316**

Beta-binomial fits:
- News SUBJECT: rho **0.0332**, ΔAIC(binomial−beta-binomial) **586.2**
- News OBJECT: rho **0.0289**, ΔAIC **188.3**
- Spoken SUBJECT: rho **0.0173**, ΔAIC **289.7**
- Spoken OBJECT: rho **0.0224**, ΔAIC **136.6**

A homogeneous Bernoulli model is therefore too smooth at document level. Poisson is not the primitive model because realization is opportunity-conditioned and bounded by the number of opportunities.

## Actor/speaker variation proxy

For actors with at least 20 exclusive opportunities, observed omission-share SD:
- News SUBJECT **0.1082**
- News OBJECT **0.0720**
- Spoken SUBJECT **0.0779**
- Spoken OBJECT **0.0916**

After conditioning residuals on source×slot×predicate identity, actor-mean residual variance remained above within-stratum permutation expectation:
- observed variance **0.01707**
- permutation mean **0.01230**
- plus-one p **0.01**

This supports structured author/speaker heterogeneity, but not a causal personality interpretation.

## Local sequence dependence

Observed same-action transition rate minus within-document permutation mean:
- News SUBJECT: **−0.01227** (z≈−5.65)
- News OBJECT: **+0.00566** (z≈+3.25)
- Spoken SUBJECT: **+0.00668** (z≈+2.22)
- Spoken OBJECT: **+0.02864** (z≈+6.71)

There is no universal burstiness law. Local persistence changes direction by source×slot regime.

## Court

Prospective hypotheses:
- H1 high-accessibility overt controls >= 1000: **PASS**
- H2 accessibility does not force NULL: **PASS**
- H3 matched strata with both actions >= 100: **PASS**
- H4 extra-binomial document variation: **PASS**
- H5 local state dependence beyond document-level rate: **PASS**, with heterogeneous sign

Promoted:
- `COMPARABLE_OBSERVATIONAL_CHOICE_SET`
- `STRUCTURED_VARIATION_EVIDENCE`
- `OVERDISPERSION_AUTHORITY`
- `SOURCE_SLOT_SPECIFIC_LOCAL_STATE_EVIDENCE`

Held:
- causal preference effect
- true counterfactual omission utility
- topic/focus causal effect
- universal speaker personality coefficient
- universal Poisson/burstiness law
