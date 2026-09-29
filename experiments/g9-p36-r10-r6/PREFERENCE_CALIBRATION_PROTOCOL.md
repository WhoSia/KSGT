# R6 Preference-Authority Calibration Protocol

## Purpose

Convert the R6 observational choice pool into future counterfactual preference evidence without laundering corpus frequency into human preference.

## Stage A — Native-original matched pool

Current pool:
- strict mixed strata: 1,649
- pairable native-original observational pairs: 3,280
- actor-specific strict mixed strata: 618

These pairs are controls and donors. They are not preference labels.

## Stage B — Counterfactual surface construction

For each selected native-original context, construct the minimal alternative:
- NULL original → OVERT candidate using the official ZA restored form;
- OVERT original → NULL candidate only when generation-time antecedent availability and syntactic deletion gates pass.

The edit must preserve predicate token, clause scope, intended referent, tense/aspect/modality/honorification, and information not carried solely by the removed phrase.

If insertion/deletion position is not uniquely licensed, mark SURFACE_POSITION_HOLD.

## Stage C — Meaning-preservation gate

Reject a pair when the intended referent changes, scope or contrast changes, deletion removes indispensable focus/contrast, the restored phrase adds unsupported semantic content, or zero realization creates unresolved ambiguity.

The gate precedes preference collection.

## Stage D — Preference task

Only pairs passing meaning preservation may be judged for naturalness, preferred explicitness, perceived redundancy, discourse coherence, and style/register fit.

Judges must not be shown KSGT theory labels.

## Stage E — Authority model

Preference authority is hierarchical: pair-level choice, judge-specific explicitness bias, source/register effect, and local discourse effect.

Do not collapse judge variation into one global temperature.

A preference model may calibrate a distribution over admissible preference functionals only after sufficient native judgments exist.

## Stopping rule

Before external human recruitment, KSGT must first materialize a frozen counterfactual packet and pass internal surface/meaning-preservation review.

Observational R6 data alone may calibrate choice-set geometry and dispersion, but not human utility.