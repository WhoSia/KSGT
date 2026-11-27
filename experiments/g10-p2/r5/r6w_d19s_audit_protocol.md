# R6w — Source-authority and functional elaboration audit

Status: prospective interpretation protocol before access to generated outputs. Development only. No independent human judgments and no automated quality ranking.

## Unit and categories
Annotate propositions and discourse moves, not words or sentences indiscriminately. A sentence can contain both a licensed paraphrase and an unsupported implication. Record the exact span, source ID(s), the category, and the reason; label uncertainty when a literal reading and a pragmatic reading differ. Core facts C1–C6 are six obligations, not six arbitrary regex matches. An explicit "not measured" is not interchangeable with "not controlled"; lack of memory is not a claim of nonattendance. Optional O1–O6 can be used or omitted without core penalty. Do not reward adding facts merely for making output long.

- CORE_PRESENT / CORE_OMITTED / CORE_DISTORTED: audit each required obligation once, allowing multiple spans as evidence.
- OPTIONAL_GROUNDED: supported by a supplied optional fact. In CORE arm, that same claim cannot be assumed licensed merely because it occurs in RICH arm.
- ENTAILED_PARAPHRASE: proposition warranted by supplied facts without added mechanism or certainty.
- EXPLANATORY_MOVE: clarifies implications or limits without asserting an unsupported external proposition; must respect arm license.
- LICENSED_TEXTURE: genre-specific bounded permitted elaboration, e.g. incidental sensory detail; distinguish new consequential action or motivation from incidental detail.
- UNSUPPORTED_ASSERTION: asserts something the supplied material/permission does not warrant; not necessarily false in the world.
- LICENSE_VIOLATION: e.g. event after prescribed ending, unexplained new obligation, forbidden asserted mental state.
- INDETERMINATE: genuine ambiguity; preserve annotation rationale and avoid forced scoring.

## Reader-function axes (separate, not weighted)
Fidelity (six obligations and unsupported claims), functional expansion (new useful discourse work vs rephrasing vs padding), coherence (referent tracking and paragraph transitions), genre voice (appropriate lexical choice and cadence), first-edit burden (KEEP allowed; proposed changes are evidence, not a human gold). Assess only with complete texts. A long text can be accurate and redundant; a short text can be false. Do not substitute length for style. Numeric quality estimates require an actual rubric and an independent assessor; no artificial 0–1 values from the investigator. Report differences within the four source families and preserve uncertainty. Do not treat 48 cells as 48 independent sources.

## Masking and disclosure
For factual audit, show each exact source and license with its output; cannot blind source richness or licence when needed to judge authority. Hide model, file ID and target length from a reader-only audit; preserve order-independent labels. Reader-only preference is separate from task compliance. Current investigator has seen design; developer readings are nonindependent and must be labeled accordingly. No claims about population or human-like writing from this batch. Do not use this development dataset as held-out confirmation.

## Decision boundary
If short and long instructions do not materially separate achieved lengths, manipulation weak: do not infer a length-dose effect. If they separate but source errors do not vary consistently by family, no universal pressure correction. If fidelity failures increase in long, low-information conditions, inspect which propositions and transitions are affected before introducing an architecture. If a legal explanation adds value without changing facts, preserve it; if an added clause lacks a discourse function, expansion alone is not sufficient. No stage promotion on a descriptive result.
