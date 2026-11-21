# KSGT G10-P2 R5l — External-root evidence admission, distinct-referent uncertainty, and bounded server handoff

2026-11-22 (KST). **Source-only execution and adversarial development, no corpus-source inference, provider inference or human language quality ratings.** Official stage remains G10-P2 OPEN / QUALITY_HOLD; cumulative model requests **340**, new requests **0**.

## Why the server reconnaissance changed the next gate

The separate user's Windows-host execution report (BOOK-DCFR8U3IME) states that 14 NIKL original ZIPs (20,268,693,891 bytes) had historical ledger size/mtime alignment, 9/9 sampled shard SHA-256 replay, 6/6 server prototype synthetic checks, 145.1 GiB free and 12 previously exposed machine R6 proposals with 0 human labels. This GitHub workstream **did not independently read that private host**; a historical 32,001-shard ledger and 100,317,246-paragraph completed census are **not** present-day whole-corpus integrity audits. The CP5 2,757-byte [Drive manifest](https://drive.google.com/file/d/1yBMfcJvDvXs_XSTzvkcyjN-wRbYKuMhY/view) was checked, but the 10 large fragments were not recombined or rehashed and the CP5 file contains **no raw prose text**. No current P36 adapter path was authenticated.

A source evidence layer is only useful if it distinguishes **source bytes** from **interpretation** and does not accept the candidate's self-declared authenticity.

## Tested code

- [r5l_evidence_bridge.cjs](r5l_evidence_bridge.cjs) accepts a Korean source passage, an evidence record and independently pinned source/evidence SHA-256 values. It compares SHA over UTF-8 source bytes and canonical JSON evidence; it checks the expected version, Unicode code-point coordinate unit, observed protected surface hashes and source-exact mention substrings. Incomplete / stale / unsupported cases ABSTAIN. It exports an in-process **frozen WeakSet capability**; only a record returned by a successful `admit` can be passed to `screenWithAdmission`.
- [r5l_evidence_bridge.test.cjs](r5l_evidence_bridge.test.cjs) locally executed **18/18** Node assertions, covering stale source, evidence mutation, removed pinned root, mismatched coordinate systems, wrong protected evidence hashes, bounded R5k edit, semantic UNVERIFIED and naturalness UNVERIFIED, injected fake admission object, and frozen post-admission state.
- The test creates **two different windows** that both bear the surface noun `유리창`. Even when both pinned hashes match the provided record, an actor/object ID may still be **false**, and deleting one occurrence may leave bad Korean particle syntax. The result is at most `STRUCTURAL_CANDIDATE_ONLY`. This is a deliberate surviving semantic counterexample.

## The discovered bypass and its repair

An initial R5l source-only version accepted any plain object containing the string `status: PINNED_BYTE_EVIDENCE_ONLY` at the downstream gate. A caller could bypass validation by forging that object. The repair requires membership in a private `WeakSet` filled **only during successful admission**, and freezes the record together with the protected span, mention, and fact-id collections. A copied or substituted object is rejected, and mutation after admission throws in strict mode. These controls protect the in-process handoff, not cross-process authentication, not a cryptographic digital signature, and **not** the factual truth of annotation labels.

**Critical limitation:** a caller who controls both `evidence` and the alleged `pinned` root can recompute both digests and get a valid byte-consistency admission. Therefore the root must be obtained out-of-band from a trusted corpus archive ledger and pinned in a separate trust domain; simply adding two SHA strings to the same untrusted JSON file is security theater. R5l's `canonical` is a version-specific deterministic local JSON representation, **not RFC 8785/JCS** and not a cross-language signature protocol. Interoperability requires an explicitly defined encoding and independent cross-language test vectors. Private original bytes must remain private.

## Proposed P62→P2 mapping (not yet executed on server bytes)

| P62 / P36 observation | Candidate R5l field | Authority limit |
| --- | --- | --- |
| source archive SHA and original text | `pinned.sourceSha256`, `evidence.sourceSha256` | source copy must be independently checked |
| source document/work identity | source custody metadata (future revision) | identity and split cannot be inferred from equal source names |
| original source-offset span | `mentions[].startCp/endCp/text` | transport only after independently checked coordinate conversion |
| 2020/2025 zero anaphora slot | `sourceFactIds` or separate annotated candidate record | 2020/2025 ontologies differ; slot is not semantic agent |
| source predicate scope | `protectedSpans[].kind,startCp,endCp,sha256` | source-preserving only; no verified semantic scope attachment |
| machine antecedent prediction | external unresolved interpretation | not gold; do not silently upgrade to referent truth |
| corpus exposure / split | external provenance ledger | no independent work disjointness from present fields |

**Not done:** original P36 adapter restore; CP5 gzip reconstruction; real R6 source-text row admission; actual multi-source generation; semantic or human quality improvement. Server-side prototype details are not available in this GitHub workstream beyond the supplied report, so no claim of a verified joint integration exists.

## Next genuine complete-text court, rather than endless guard extensions

The source team should export **a tiny authorized, already-exposed development set** with checked source IDs, coordinate units, candidate alternatives and ambiguity. The generator team must then compare the exact same complete Korean prose tasks under KEEP, STRONG_DIRECT120B, STATE_AS_TEXT, PINNED_SOURCE_STATE, and EQUAL_COST baselines. Record whole-text Korean naturalness separately from independently inspected source fidelity: actor ownership, polarity, quote boundaries, modality, promises/requests, chronology and unsupported events. Count calls, prompt and output tokens, annotation/extraction labor and latency. Predefine an unexposed source-work-disjoint confirmatory sample before claiming any effect. The R5l bridge may be **Pareto dominated** by strong direct writing and must be retired if it worsens naturalness or cost.

## Operations and recorded result

Human-authored GitHub commits on existing branch only; no new branch, no github-actions[bot] commits. The initial source+test work and the capability correction were performed as four distinct meaningful source/test commits. Local Node.js 22.16.0: 18/18 explicit assertions **PASS**; existing R5k regression and distinct-window red-team runs also replayed. No hosted CI conclusion is claimed. No private source uploaded. No server files touched.

**Decision:** `R5L_BYTE_TRANSPORT_TESTED / TRUST_ROOT_EXTERNAL_HOLD / SEMANTIC_REFERENT_HOLD / FULL_PROSE_QUALITY_HOLD`.
