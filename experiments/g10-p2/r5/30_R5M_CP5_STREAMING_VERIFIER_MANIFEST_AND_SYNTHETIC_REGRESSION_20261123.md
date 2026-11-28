# KSGT G10-P2 R5m — CP5 byte-exact streaming reconstruction tool, manifest validation and falsification gates

2026-11-23 KST. **New executable verifier; synthetic tests passed; no CP5 corpus bytes downloaded and no complete corpus validation claimed.** Official G10-P2 OPEN / QUALITY_HOLD; cumulative provider calls 340, new provider calls 0, human reader ratings 0.

## Primary source and measured claims

The actual user-provided `g9_p45_nikl_document_sufficient_stats_cp5_multipart_manifest.json` was opened from the mounted attachment and parsed through Python's standard `json` library. It is **2,757 bytes**, SHA-256 `328b4d1c8dbb96ae8286de3f0f7f2bdb53936304faad75df2b991d99b838bf84`, schema `ksgt.g9.p45.cp5.document-stats-multipart.v1`. It declares precisely 10 numbered compressed fragments, sequential concatenation without separators, aggregate `857083889` compressed bytes, expected joined compressed SHA-256 `9f9baa781c56241de1b1b84cac2bed6080f12c71350d6bda1d30cd4100a0aa76`, expected JSONL rows `12352778`, and `raw_text_present=false`. The exact 10 per-part hashes are contained in the attached original manifest; no public corpus payload is required in the GitHub source tree.

This is a **manifest-schema/structure verification**, not a positive verdict on the real fragments. The prior R5l Drive folder audit independently found 10 items and metadata sizes summing to 857083889 bytes, but did not rehash 857MB or parse any rows. The server's lack of local CP5 fragments is a genuine blocker. Original R5l and server-borne results remain unchanged.

## New bounded-memory implementation

The self-contained standard-library Python implementation `cp5_verify.py` verifies (1) schema, filenames and 1..10 sequence; (2) correct expected filenames and path safety; (3) each part's full SHA-256 and byte length; (4) joined whole-gzip byte SHA-256 **while reading the parts stream** (no reconstructed archive written); and optionally (5) gzip decompression + JSONL object and expected-row-count inspection through an `io.RawIOBase` chained reader. It emits `CP5_JOINED_BYTES_VERIFIED` after full file-hash agreement, `CP5_JSONL_ROWS_VERIFIED` only after actual row count, or `FAIL_NO_APPROVAL` on a discrepancy. Error paths do not emit PASS receipts. The receipt, if requested, is a **new** file outside the corpus/part root (no original byte modifications). Combined archive processing remains read-only with bounded memory, though optional row parsing can be time- and CPU-intensive.

The model tool execution created a locally packaged deliverable `KSGT_G10P2_R5M_CP5_verifier.zip` of **7,174 bytes**, SHA-256 `2289aa8e357965fb9f6433a7f25474759d17dbd9087e5d7990c51fe00972fef6`. Included files: `cp5_verify.py`, `test_cp5_verify.py`, `README.md`, exact public-metadata manifest, `LOCAL_DEVELOPMENT_RECEIPT.json`. This ZIP is a generated local conversation artifact; it has **not** been asserted uploaded to GitHub, Google Drive or the personal server.

### Executed regression results

On an author-generated small **synthetic** gzip JSONL fixture split into 10 byte fragments, `python -m unittest -v test_cp5_verify.py` yielded **9/9 PASS**. Explicit negative probes: missing part, changed part bytes, invalid part order, traversal filename, declared size mismatch, forged aggregate SHA, wrong row count; positive probes: complete rehash and successful full row decode. Actual attached manifest parses and its 10 part size sum equals 857,083,889. **No actual Drive part was downloaded, verified or decompressed**. This verifies the implementation's synthetic behavior, not its operational result on the full 857MB.

## What the evidence can, and cannot, answer

The CP5 data are representation-level document sufficiently aggregated EDF features, not sentence/paragraph raw text or actual original–edited native Korean pairs. Even a future `CP5_JSONL_ROWS_VERIFIED` would **not certify semantic entailment, referent identity, natural collocations, causal model superiority, independent source-work splits or blinded reader quality**. Its best G10-P2 role is aggregate register/year/publisher/topic surface-marker drift control and confound analysis.

For semantic input, rely instead on separately verified P36 original zero-anaphora annotation and P62 source-span/exposure receipts. No joining on guessed repeated names/words. The currently missing P36 native schema adapter cannot be substituted with historical `g9-p36-r2/adapter_response_chunk_v1.js` (which parses academic reviewer responses). Preserve R5k semantic and naturalness UNVERIFIED statuses. The strong 120B direct full prose remains the indispensable quality/cost comparator.

## Decision, limits, next action

**R5m CODE_AND_MANIFEST_SCHEMA_PASS / FULL_CP5_BYTES_HOLD / HUMAN_QUALITY_HOLD.**

To turn CP5 into independently verified source evidence, retrieve the 10 exact parts from the existing private Drive folder (not new NIKL raw data), perform a SHA check and optional row count on a machine with legitimate access, store the receipt privately, and only then promote the corresponding stage. The current script is a prepared tool, not proof of that later operation. No background task scheduled; no model training, corpus mutation, re-download of 20GB ZIP or GitHub Actions bot push occurred.
