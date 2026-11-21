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

## 2026-11-21 — R1 execution receipts

[Verified R1 mechanism and limits](R1_VERIFIED_RESULTS_20261121.md), [CI run 44868642896](https://github.com/WhoSia/KSGT/actions/runs/44868642896): 13/13 hermetic Node tests PASS, 0 newly called models, 0 independently scored Korean readers. [Research OS Drive evidence capsule](https://drive.google.com/file/d/1sUk0yg1Vh0Kv_f-69nkuvq9Zjo-BTYni/view) is a synthetic experiment/CI summary, **not** model-output raw data (SHA-256 0e90941757e31e24d82c3c46e2ecfa8877a90b9ce48d6aeb9674e082fe689f76), uploaded and cold read back byte-identical. Keep its source evidence distinct from the independent full prose study to follow.

## 2026-11-21 — R2/R2b attribution and R3 dual-authority engineering

R2 used eight investigator-authored source works × five Korean claim statuses; 80 actual GPT-OSS calls. Both the binary assertion and five-label attribution tasks matched author labels 40/40 on short, conspicuously marked statements, while the five-class task consumed **18,204** tokens versus **15,373** for binary. See [R2 results](R2_ATTRIBUTION_RESULTS_20261121.md) and [raw provider artifact in Drive](https://drive.google.com/file/d/1w3IEOXRPMFyrJYRNpZ4etbdD69Pp60u4/view).

R2b reused the prior R9.34 *actual* model-written full passages rather than claiming new independent source works. 24 old generated texts from eight works were audited with 48 additional model calls. Against **22/24 author-adjudicable cases**, binary assertion agreed **20/22**, five-class attribution **16/22**, with actual actor-role and conditional-modality failures. See [R2b results](R2B_REAL_PROSE_RESULTS_20261121.md) and [original raw + new model replies](https://drive.google.com/file/d/1lDwdjS7LwCPeUcdS6qvJ2gARCCn6kWqT/view). Total P2 provider requests now **128**, but independent native-Korean reader ratings remain **0**.

R3 implemented a strict source-authority / surface-authority proof boundary. It examines four previously exposed P1 source works and twelve investigator-structured examples: **4 source-approved, 7 rejected and 1 mention-only**. The entire actual surface must match a registered authorized sentence; unknown paraphrases ABSTAIN rather than self-certify a guessed role. [R3 results](R3_DUAL_AUTHORITY_FINITE_RESULTS_20261121.md), [CI 44871827738](https://github.com/WhoSia/KSGT/actions/runs/44871827738): **39/39** regression tests passing. This verifies an *authored finite contract*, **not** a general Korean parser or a real writing-quality improvement. R3 added no new model calls.

**Director stop rule:** do not keep making narrow, author-written tests just to accumulate perfect scores. Prioritize a genuinely source-work-disjoint full-prose experiment comparing a strong direct model, rich prompt, the identical state as ordinary text, executable source–surface control, no-op and a compute-matched iterative rival. Collect independent reader task outcomes and semantic source audits. Until then G10-P2 scientific superiority remains OPEN/UNPROVEN.


## 2026-11-21 — R4a actually generated full prose and tested post-realization selection

[Preregistered R4a pilot](R4A_FULL_PROSE_SELECTION_PROTOCOL_20261121.md) froze 12 **new** researcher-authored development source-work groups (3 each chat, science, notice and fiction) and [60 actual live GPT-OSS calls](https://github.com/WhoSia/KSGT/actions/runs/44883541327): 24 complete first-stage prose candidates, 24 model self-audits, 12 plain-state model selections. Executable selector added no model call and preferred fewer **model-reported** source risks. It selected rich **1/12**, vs the same-state-as-text model choosing rich **3/12**; choices agreed **10/12**. All 60 calls completed; 49,978 recorded model tokens (vs only 6,963 tokens to generate all 12 strong direct alternatives). There is **no independently demonstrated reader quality improvement**, and model self-audit falsely marked some invented promises and invented notice locations as clean. A source quote alone is not a semantic proof.

[Full R4a results and author-screen negative cases](R4A_FULL_PROSE_SELECTION_RESULTS_20261121.md) · [Drive sealed original](https://drive.google.com/file/d/1bkxWgjehdnoXq3nJKwDwTcr5kwf4tfEC/view) · [4 condition-masked reader forms, no reader gold](https://drive.google.com/file/d/1hCk2DI2Mcd9UGqOCv6IhYtL2mBjNP9dt/view) · [4 separate source-auditor forms](https://drive.google.com/file/d/12pcwQmNJ6ZAv0ltv88bMsFCaqqXnfX_n/view). The [read-only forms run 44883956488](https://github.com/WhoSia/KSGT/actions/runs/44883956488) passed 55/55 Node tests. Four forms repeat the same 12 works; they are not 48 independent source works.

**No-go on broad superiority:** an expensive selection-and-self-audit chain is not justified merely because it sometimes chooses a different candidate. The next evidence gate is independent human reader use and separate source audit, followed by a new source-work-disjoint and compute-matched full-prose comparison. Do not claim a small model, a new Transformer alternative, or a quality gain without that evidence.
