# KSGT Generation X G10-P2 — Reader-State-Coupled Korean Writing Architecture: Source-Grounded Discourse Dynamics, Adaptive Realization & Human-Validated Quality–Cost Trade-offs

**OFFICIAL STATUS: G10-P2 OPEN (2026-11-21). No validated Korean writing-quality superiority.**
**Notion:** https://app.notion.com/p/41fef561cf928105a17bc0c33a9701bc
**Predecessor:** [G10-P1 bounded-pilot closure](../g10-p1/G10_P1_BOUNDED_PILOT_CLOSURE_20261121.md). Closing P1 did not turn the null/mixed results into a quality claim.

## Central scientific question
Can a reader-state transition performed **after a sentence is actually written**, with source-evidence spans and abstention under uncertainty, improve complete Korean writing compared with an identical model and the same state passed as ordinary text? Is any quality gain worth **all** model, extractor and annotator costs?

## Fair competing mechanisms
| Arm | Scope |
| --- | --- |
| STRONG_DIRECT | Capable general model, complete same source |
| RICH | Strong genre-specific writing instructions |
| STATE_AS_TEXT | Same calculated state supplied as plain text to the same model |
| STATE_CONTROLLER | Same state, same candidate set; source-grounded executable update and selection |
| PLAN_ONLY | Negative control: assumes an intended fact was actually conveyed |
| SHAM_STATE | Negative control: false, stale or deleted state |
| NO_OP | Preserve correct originals; abstain on unrecognized scope |
| EQUAL_COST_ITERATIVE | Compute- and call-matched iterative baseline |

## Scientific gates
**R1 — Finite mechanism:** four author-created genre cases; source-warranted facts; actual-sentence observation rather than plan hallucination; traceable source/output spans; quote/hypothetical rejection under a closed grammar; on upstream edit, replay state; no-op/abstention. Test with hermetic CI. A fixture's 100% rule success is **NOT** language understanding.

**R2 — Automatic extraction:** separate authored oracle facts, extracted candidate sets, and independent Korean reader interpretation. Report false exclusion, source mismatch, unsupported utterance, attribution errors, ambiguous output.

**R3 — Full-text causal comparison:** source-work-disjoint new work; a provisional target of >=24 independent sources across chat/science/notice/fiction is planning, not a power calculation. Fixed model, same facts, same candidate inventory, measured compute and extraction effort; explicit sham state, strong rich and no-intervention references.

**R4 — Human outcome:** blind reader task comprehension, choice/use, first edit and burden; independent later original-source audit for invented obligations, overstrong inference, character/actor mismatch, scope errors. Distinguish literary permitted incidental texture from invented events. Four R9.44 forms reuse the SAME 12 works and have zero independent ratings.

**R5 — Smaller architecture only after R3/R4 gain:** matched small Transformer vs reader-state proposer vs recurrent/SSM at equal tokenizer/training sources/parameters/hardware/inference budget. No claim of Transformer replacement without a Pareto gain.

## Source/realization contract
- Every admitted fact needs a literal source witness and a source offset. A written sentence needs a surface/evidence link, not just a plan record.
- State advances **only after** the actually realized output has been checked; unknown, quoted, hypothetical, changed or duplicated strings do not imply knowledge. Replacing earlier text invalidates later state.
- KEEP exact bytes when valid; ABSTAIN if the proposed repair is not source-licensed. Verify conditional scope as a relation, not substring presence.
- Record all provider completions, failures/retries, token and actual model usage; independent human evaluation remains the endpoint. Annotation labor and automatic extraction must be priced.

## Preservation
[P1 retrospective](../g10-p1/paper/R9_44_G10_P1_RETROSPECTIVE_P2_NAMING_20261121.md). [P1 original Notion](https://app.notion.com/p/40def561cf9281a0b990ee1b3662b79e). [P2 Notion](https://app.notion.com/p/41fef561cf928105a17bc0c33a9701bc). Historical CURRENT_STAGE.json counts preserved without false aggregation. Notion: research judgments; Drive: original and private bytes; GitHub: code/tests/docs. Read-only Actions. No bot commits.

**Initial outcomes:** new independent human ratings = 0; newly trained P2 networks = 0; demonstrated full-prose improvement = 0. P2 has officially started as research, not as a validated quality win.