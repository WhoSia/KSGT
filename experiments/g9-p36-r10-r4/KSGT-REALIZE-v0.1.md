# KSGT-REALIZE-v0.1 — Recoverability is not Realization Choice

## 1. Core split

For a semantic argument token A in context C:

- R(A,C): the intended referent can be recovered.
- L0(A,C): null realization is grammatically/discourse-licensed.
- P0(A,C): null realization is preferred over overt realization.
- U0(A,C,S): null realization better serves style objective S.

KSGT must not use:

R => L0 => P0 => U0

as a chain of implications. Each arrow requires independent evidence.

## 2. One-sided observation theorem

The NIKL ZA corpus gives rich information about cases where a component is omitted and recoverable.
It does not supply a matched risk set of semantically comparable overt argument opportunities under the same contexts.

Therefore ZA gold directly estimates properties of:

P(recovery structure | Z=NULL, annotated ZA universe)

not:

P(Z=NULL | context)
P(prefer NULL over OVERT | context)
P(style utility(NULL)-style utility(OVERT) | context)

This is a sampling/estimand boundary, not a weakness of corpus quality.

## 3. Offline vs online recoverability

R2 established genuine following-antecedent gold.

A full-document annotator may recover a zero argument using material that occurs later.
A generator deciding whether to omit an argument at token t cannot normally use future text not yet generated as evidence that a listener can recover it at t.

Thus:
OFFLINE_DOCUMENT_RECOVERABILITY != ONLINE_GENERATION_LICENSE.

Following-antecedent cases remain valid recovery gold but require separate cataphoric/structural licensing before authorizing omission generation.

## 4. Textual vs contextual recoverability

NIKL special/deictic states show:
TEXTUAL_ANTECEDENT_ABSENT != UNRECOVERABLE.

Speaker/hearer, deixis, shared situation and discourse common ground may license recovery.
Therefore a text-only salience model is incomplete for Korean generation.

## 5. Multi-span composition

R2: 18.58% of 2025 zero slots use multiple antecedent spans, up to 35 spans.
A generator-side recoverability score therefore cannot assume:
ONE OMITTED ARGUMENT = ONE PREVIOUS MENTION.

KSGT-REALIZE represents a referential basis as a typed witness set.

## 6. Decision grammar

SEMANTIC VIABILITY
  -> GENERATION-TIME RECOVERABILITY
  -> NULL-LICENSING
  -> INFORMATION-STRUCTURE / DISCOURSE FIT
  -> REGISTER / SOCIAL-PRAGMATIC FIT
  -> STYLE UTILITY
  -> SURFACE CHOICE

Later stages can rank live realizations.
They cannot create semantic or referential authority that earlier gates lack.

## 7. Literature boundary

Korean centering/topic-chain work is admissible as a structural prior: discourse salience and topic continuity matter for null realization.
It is not a universal decision rule such as TOPIC => NULL.

Older generation work is especially valuable as a rival architecture, not as final authority for modern KSGT.
The decisive future experiment must contain both null and overt realizations or a risk-set construction that makes their choice comparable.

## 8. Closure

R4 does not build another omission predictor.
It defines what a valid future predictor would have to observe.
