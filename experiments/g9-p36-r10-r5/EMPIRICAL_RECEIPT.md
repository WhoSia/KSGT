# R5 empirical receipt

## 2024 prospective replication
Preseal: `a760b2d78082cc917a5bae89da9583095147dea3`.

- Predicate tokens: 481,404; predicate mapping failures: 0.
- SUBJECT: omitted 256,972 / overt 203,869 / simultaneous 8,718 / absent 11,845.
- OBJECT: omitted 52,650 / overt 156,183 / simultaneous 933 / absent 271,638.
- Omitted share among exclusive observed realizations: SUBJECT 0.5576; OBJECT 0.2521.
- Predicate-surface+slot strata containing both omitted and overt observations: 22,870; tokens: 422,426.
- H1 subject>object: PASS.
- H2 simultaneous state nonzero: PASS.
- H3 mixed-action strata >=100: PASS.
- H4 one deterministic global omission rule is inadequate: PASS.

## 2025 discovery/calibration
- Predicate tokens: 73,169.
- SUBJECT exclusive omitted share: 0.6205; OBJECT: 0.2333.
- Same predicate-sense+slot strata with both realizations: 3,594; 72,932 tokens.
- Five-fold document holdout AUC: slot 0.6727; slot+lane 0.6903; slot+lemma+sense 0.8195; slot+lane+lemma+sense 0.8164.
- Generation-time evidence among 62,831 omitted slots: prior-text 39,335; future-text-required 14,423; deictic/special 6,619; position unresolved 2,449; unresolved 5.

Interpretation: these are realization prevalence and predictive-structure results, not preference, utility, or causal estimates.
