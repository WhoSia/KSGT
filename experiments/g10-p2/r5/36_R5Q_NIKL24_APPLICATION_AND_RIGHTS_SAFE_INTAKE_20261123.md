# G10-P2 R5q — Application submission, data admission and causal experiment gate

**Research director decision (2026-11-23):** The user reported submission of the NIKL 2024 writing-correction instruction corpus request, with a stated agreement period **2026-11-23 to 2075-12-31**. The submitted status is *user-reported*, not a connector-verified portal entitlement. No download or raw corpus receipt has occurred in this work. **G10-P2 OPEN / QUALITY_HOLD.**

## Exact evidence update

The previous R5p LIRA decision was D1 0.9090, D2 0.9230. D1's `feasibility` was director-assessed as 0.70 before the user submitted the request. Post-application, we update feasibility to **0.77**, yielding **D1 0.9195**; D2 remains **0.9230**. The 0.0035 difference is far below meaningful subjective precision; **D1 and D2 remain joint P0**. This is a subjective choice, not a calculated likelihood of acceptance. See the scored, source-tagged `R5Q_LIRA_LINES.md` (16/16 lines), `R5Q_DIRECTOR_DECISIONS.json` and the fail-closed `R5Q_APPLICATION_GATE.json`.

The earlier G4 registry already warned that some NIKL 2024 instruction examples may consist of **expert-corrected language-model feedback**, which is **not identical to a human's before/after rewrite of the original Korean prose**. The actual released source schema must adjudicate this. Research must not silently move a feedback-instruction dataset into a native editorial quality-gold role.

## Stage 0: acquisition, without content mutation

- The user supplies the actually downloadable authorized archive or access is demonstrated through their connected account. Keep the original private; do not upload its unredacted text to a public GitHub repository.
- Record original filename, timestamp, physical file size, SHA-256 and complete agreement/rights language, **privately**. The reported end date does not by itself imply unrestricted redistribution, ML training, third-party sharing or publication permission.
- Run `nikl24_intake.py --archive <zip> --receipt <new-receipt.json>` on a legitimate copy. Its read-only ZIP pass rejects missing, encrypted, path-unsafe, symlinked, duplicate, excessively large and high-ratio entries, then validates per-member CRC; no extracted corpus sentence is written. A CSV/JSON-only *different archive format* needs a distinct verifier, not a forced ZIP acceptance.
- A metadata-only PASS does **not** imply original/editorial pairing, work IDs, semantic entailment or human readership judgments. It retains `actual_editorial_pair_schema_verified=false`.

## Stage 1: evidence-based schema mapping

Inspect **only after allowed access** and explicitly record actual observed keys, value types, document→paragraph→sentence hierarchy, revision instructions, model-generated critique vs human critique vs source-text rewrite, editor/source provenance, work/author identifiers, annotation disagreement and reuse permissions. This is a schema discovery task, not a hard-coded claim that a particular field exists. Sample a few *private* before/after full-paragraph instances only if pairable; reject fabricated pairing and incomplete lineage.

## Stage 2: source-work contamination quarantine

Run the R5n.1 source-work splitter over authenticated parent-work/author identities. Identical or linked works must never cross splits; prior R1–R5 prompts, model outputs and annotations are exposed/development material. Absent IDs or unresolved parent links imply quarantine. The splitter's `independence_claim=false` persists until an independent boundary audit accepts the data.

## Stage 3: prospective full-prose experiment

Before any unseen holdout generation, freeze the source-work census, task and genre stratification, baseline model identity/inference settings, prompt and information parity, allocation seed, sample-size/power calculation from a genuinely separate development pilot, measurement contract, error categories, costs and data exclusion rules. Primary outcomes: independently blind *Korean reader task usefulness* and independently source-visible *factual fidelity*; secondary outcomes: naturalness, reader edit location, cost, speed, annotation effort. Cluster on original source-work; multiple generations and raters of the same work are repeated observations, not independent works. Compare STRONG_DIRECT, RICH, STATE_AS_TEXT, STATE_CONTROLLER, EQUAL_COST_ITERATIVE, KEEP and SHAM_STATE with matched factual evidence, same underlying model and accounted full computational costs. A preregistration document without a frozen actual dataset/power analysis is **not** final prespecification.

## Conditional decisions after validation

- Clear independently measured Pareto gain over both direct and same-state text, and equal-cost iterative baseline, with no source violations → independent genre replication, state sufficiency/ablation, then a possible small-model study.
- Fidelity gains but reader-naturalness or costs worse → selective high-risk source-safety checker, *not* mandatory prose controller.
- Null/dominated result → retire mandatory reader-state controller and publish the failure boundary; redirect effort to corpus-grounded Korean pragmatics/realization.
- Contamination, access ambiguity or insufficient human outcomes → scientific HOLD and repair protocol, not a negative or positive language quality result.

## Current observed receipts

This cycle only tests a **synthetic** ZIP fixture. `python -m unittest -v test_nikl24_intake.py`: 12/12 PASS. No actual NIKL 2024 ZIP provided, no actual native before-after document aligned, 0 new provider calls, 0 new independent human scores, 0 new model training; historical 340 calls unchanged.

## Preservation

GitHub: executable verifier, tests, report and score/gate metadata. Private Google Drive: exact copies of those deliverables and a single ZIP; original corpus stays at its private authoritative location when received. Notion: source/decision judgment and P0 assignment. Human application dates in this report are general user-provided research status and must not be mistaken for a machine-verified contractual grant.
