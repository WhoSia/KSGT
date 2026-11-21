# G10-P2 R5k — Native Korean bounded revision: source offsets, abstention and referent-identity counterexample

2026-11-22 KST. **Parallel workstream while a separate GPT-6.2 Sol Medium session audits the private personal server.** This workstream did **not** access, mutate, download, delete, or claim current readback from the server. Existing source archives, P36/P45/P62 receipts, and all P2 provider responses remain untouched.

## Inherited doctrine and exact problem

Official program: [G10-P2 RESEARCH_PROGRAM](../RESEARCH_PROGRAM.md), branch `research/g10-p2-reader-state-coupled`; actual P2 provider requests through R5i = **340**. Strong direct full-prose GPT-OSS 120B is the mandatory quality/cost rival. G10-P2 remains OPEN / QUALITY_HOLD.

- R5g: rhetoric DAG valid yet actor ownership and request status drift in complete actual 120B Korean paragraphs.
- R5h/R5i: typed fixed clauses preserve author-labeled source roles, but sentence/collocation quality weak and role-compiled 120B token cost high; 0 human preference observations.
- R5j: an input-provided 'license' does not certify Korean semantics. The [negative probe](r5j_semantic_false_accept_probe.cjs) demonstrated **polarity inversion accepted** by the supposedly licensed ellipsis mechanism. This is a verified counterexample to the control's sufficiency, not merely missing a test.

## New R5k experimental target

Separate three evidential levels **before** running any language model:

1. `EXACT_SOURCE_SURFACE`: immutable original text digest and Unicode codepoint offsets; exact edit span present. A bounded edit may not alter any *provided, hashed protected surface span* (e.g., negation, aspect, quotation, reported request).
2. `SOURCE_FACT_AND_REFERENT`: independently supplied source ID, actor/object IDs, source-span lineage and referent identity. **Not inferred or certified** by the R5k prototype; the owner of these fields matters.
3. `HUMAN_REALIZATION`: whether the revised complete text is an appropriate Korean sentence and retains intended pragmatic and literary functions. No R5k structural check can certify this.

The new [source-span-bound edit scanner](r5k_source_span_edit.cjs) only implements a **limited surface-level preflight** for deleting an exact repeated nominal. Inputs are source text and SHA-256, an edit in Unicode codepoint coordinates, a supplied exact mention trace, a set of supplied protected source spans with individual hashes, and source fact IDs. It returns `STRUCTURAL_CANDIDATE_ONLY` with `semanticStatus=UNVERIFIED` and `naturalnessStatus=UNVERIFIED`. Otherwise it abstains with a distinct reason. In particular it never returns `SEMANTICALLY_SAFE`, `QUALITY_IMPROVED` or `AUTOMATICALLY_APPROVED`.

**Why this matters:** A correctly hashed sentence can still support several referent analyses. Preserving the word `않았다` does not guarantee its attachment, scope or the truth of the resulting sentence. Deleting just `유리창` from `유리창에는` leaves a particle strand `에는` and may degrade fluency. A lexical substring appearing elsewhere is **not** a coreference certificate.

## Mechanistic tests and deliberately surviving failure

- [17 locally run assertions](r5k_source_span_edit.test.cjs) cover valid surface surgery, explicit UNVERIFIED statuses, altered SHA, stale offsets, out-of-range coordinates, nondelete rewrite, polarity span overlap, missing/forged provenance surfaces, missing repeated noun, supplementary-plane Unicode indexing, malformed request. **Implementation-only tests; no human text ratings or source-semantic ground truth.**
- [Adversarial semantic-identity probe](r5k_distinct_referent_counterexample.cjs) uses `서쪽 유리창` and `동쪽 유리창`. These two objects share the nominal form `유리창` but denote *different windows*. A caller can mislabel both with the same object ID. The surface editor still returns a *candidate*, while its semantic status correctly remains UNVERIFIED. This establishes the limit of lexical and caller-provided provenance rather than a successful coreference algorithm.
- This is a **restricted transformation contract**, not yet a production Korean rewriter, not an extractor trained on P36/P62, and not evidence that a guard improves prose.

## Server parallel handoff schema

Server team returns *evidence*; this workstream must not invent raw-corpus availability. Suggested optional fields:

`source_artifact_sha256`, `source_edition`, `source_document_id`, `source_work_dependency_component`, `paragraph_utf8_sha256`, `span_coordinate_unit`, `source_fact_id`, `predicate_span`, `argument_role`, `antecedent_span_set`, `quotation_conditional_negation_scope`, `licensing_terms`, `data_exposure_status`, `verification_receipt`.

**Every field is conditional.** P36 NIKL 2020 and 2025 annotations differ in ontology; P45 CP5 feature-only document statistics do not contain raw text or general Korean collocations; P62 machine candidate identities are not semantic gold. No cross-corpus row join or independent split can be inferred from equal words, dates, publisher labels, or IDs alone. Original files and private IDs never go to public GitHub.

## Prospective end-to-end contrast: don't select the model by a fake proxy

On *admitted, source-work-separated* real human Korean text plus accessible source and revision targets, preregister complete-text evaluation before generation.

| Arm | Complete-text operation |
| --- | --- |
| KEEP | original source text exactly retained |
| DIRECT | one strong GPT-OSS 120B full-text draft/revision |
| DIRECT_RICH | same strong model, full source and explicit genre/accuracy guidance |
| STATE_AS_TEXT | same verified typed evidence written in Korean prose |
| STATE_BOUND | same candidate set and model, plus source-exact structural editor; can abstain |
| EQUAL_COST | direct writer with matching total model and annotation/selection budget |

Primary outcomes: *whole-paragraph* clarity/idiomaticity/usefulness in genuinely blinded reader judgments, separately audited source fidelity (ownership, modality, chronology, new promises/acts, negation), and total provider tokens / annotation hours / latency. Explicit negative cases: zero-pronoun ambiguity, homonymous objects, quotation, unmeasured scientific result, unfulfilled notice, actor swap, post-edit state invalidation, over-deletion and original KEEP. The source-bounded editor should lose if it damages grammar, increases burden or is Pareto dominated by direct generation. No extra provider calls until admitted evidence and preregistered task slices are actually available.

## Results / authority

- Three source-only assets created in this R5k round: module, regression tests, adversarial referent-identity probe, plus this research report.
- Local Node.js 22.16.0 **17 regression assertions PASS** on the module. The separately preserved semantic-identity case has an expected `STRUCTURAL_CANDIDATE_ONLY` result with `semanticStatus=UNVERIFIED`, **not** semantic validation.
- G10-P2 new model requests 0; cumulative 340. No new native source text acquired, no new trained network, no human preference evidence, no server write, no automatic corpus analysis.
- No claim of novelty from Korean zero anaphora, agreement, referent detection, or planning: prior P36/P62 and published work predate the implementation.
- Next sensible unit: consume the **server's actual audited evidence receipts** and run a source-faithful *complete-text* rival comparison; do not build more author-authored 'safe edit' gates merely to inflate pass rates.

**Decision: R5k STRUCTURAL_PREFLIGHT_PASS / SEMANTIC_IDENTITY_HOLD / NATURALNESS_HOLD / QUALITY_HOLD.**
