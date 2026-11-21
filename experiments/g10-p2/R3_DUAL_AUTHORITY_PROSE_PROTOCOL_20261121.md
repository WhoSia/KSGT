# G10-P2 R3 — Source–Surface Dual-Authority Korean Writing Gate (planned full-prose experiment)

**2026-11-21 preimplementation note / NOT a completed reader study / not a new model.**

## Why the P2 objective cannot be another classification benchmark

R2 authored-snippet extraction: binary factual assertion 40/40, five-way attribution 40/40 but more tokens. R2b on previously written, actual R9.34 complete Korean texts: author-label concordance 20/22 binary, 16/22 with elaborate five-state labels. The apparent perfect classification does not transfer automatically to generated prose. Concrete failures:

1. Source facts authorize `윤해가 천을 받음`, but a detailed extractor described a sentence about `수빈이 내려감` as proof that `수빈이 천을 받음`; another excerpt contained both unrelated actor clauses.
2. `영점 오차가 일정하다면 차이에서 상쇄` is a *conditional rule*. It does not entitle a writer to assert that the error remained constant across both measurements.
3. `전기 연결을 신청한 팀` is not `모든 팀`. Markdown bold formatting and table row boundaries caused invalid evidence spans and an omitted duty.
4. `공유 시각 미정` does not authorize a new contact promise or a specific sharing time, even if the generated paragraph reads politely.

These examples require a **dual authority boundary**, not simply more detailed state labels.

## R3 initial executable architecture: two independent witnesses

1. `SourceAuthority`: a reader/writer-provided fact ID, exact source sentence span, relation (actor/predicate/object/conditional scope/modality) and allowed certainty. This ledger represents author-source permissions, **not** generated surface truth.
2. `SurfaceAuthority`: a candidate extracted claim, original output passage, exact unique witness span and attributed speaker/epistemic status. This ledger represents what the output actually says, **not** source permission.
3. `CrossAuthority`: allow a source-entitled, attributed, modality-compatible relation; block direct contradictions and illicit scope/generalization; return UNKNOWN/ABSTAIN for unsupported or unrecognized cases, never invent a patch. **Presence of the right words in a witness does not certify correct subject/predicate binding.**

In an initial four-work **closed structured relation** prototype, the researcher provides the extracted claim fields. The engine proves only the *cross-check interface* can reject fabricated actor, audience or unconditional commitment; it does **not** prove the language model automatically extracts those fields, reads Markdown tables, or writes better prose. The fact licenses must be traced to the exact R9.34 source fixture, not an invented retrospective source.

## Full writing experimental gate (after initial interface)

- Freeze genuinely new source-work groups from four genres, with factual vs literary incidental-detail licenses and bounded author source claims. Aim for >=24 source works is a design target, not a statistical power result.
- Compare **STRONG_DIRECT**, **RICH_PROMPT**, **SAME_STATE_AS_TEXT**, **EXECUTABLE_CONTROLLER**, **NO_OP/KEEP** and a **COMPUTE-MATCHED ITERATIVE RIVAL**. The controller and state-as-text reference receive the **same candidate slate, underlying LLM and identical source rights**. Compare total source annotation and extraction effort plus provider tokens.
- Report full complete-text clarity, reader task success, first-edit burden, pairwise usable-document selection, and an **independent** source-fidelity stage. Any failure to keep a good passage unchanged is an actual regression.
- If no independent human outcome is available, label results as engineering/development and do not declare G10-P2 quality gains.
- If state-controller gains disappear when the same state is given to the same model as prose, the claim is at most **better information representation**, not a new superior neural architecture.

## Acceptance / failure conditions for R3 interface

- A source sentence must be present verbatim at a unique, ordered source span.
- An asserted claim must have unique, exact realized-output evidence; a quote not associated with the claim is insufficient.
- All explicitly specified relation fields (actor, recipient, instrument, action, obligation scope, time, polarity and modal condition) must be equal to or narrower than a source license. **Do not infer missing fields from the source itself to rescue a defective output.**
- A conditional source rule cannot authorize its antecedent as a new unconditional fact.
- Unknown, conflicting, stale, quoted-as-asserted or source-unlicensed claims are not promoted to common-ground fact. A controller cannot assign someone else's assertion to the narrator.
- A source-approved, byte-identical passage should KEEP without further model calls.
- A source-invalid sentence with no licensed alternative should ABSTAIN, **not** pretend to have repaired natural language.

**Status:** R2/R2b raw evidence verified in Drive; G10-P2 R3 controlled source/surface contract to be implemented. Human-preference, independent quality improvement and Transformer-replacement claims: HOLD.
