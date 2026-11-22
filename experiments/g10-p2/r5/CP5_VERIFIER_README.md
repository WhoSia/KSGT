# KSGT G10-P2 R5m — CP5 read-only multipart verifier

This is an independently developed standard-library Python verifier for the **existing** G9-P45 CP5 sufficient-statistics gzip multipart archive. It **does not** download parts, reconstruct raw Korean text, parse ZIP sources, or produce Korean writing-quality labels.

## Source authenticity

The manifest is the original 2,757-byte `ksgt.g9.p45.cp5.document-stats-multipart.v1` manifest. It advertises 10 numbered fragments and a joined compressed size of **857,083,889 bytes** (SHA-256 `9f9baa781c56241de1b1b84cac2bed6080f12c71350d6bda1d30cd4100a0aa76`), with **12,352,778** JSONL rows and **no raw source text**. These are **manifest assertions**, not newly established archive readback. The legacy 1,199-byte manifest must not be substituted.

## Run (Windows PowerShell or Linux)

Store the ten parts in a folder without renaming; ensure available disk space. The manifest may be in a separate path.

```powershell
python cp5_verify.py --manifest .\g9_p45_nikl_document_sufficient_stats_cp5_multipart_manifest.json --parts-dir C:\path\to\CP5_parts
```

This validates each part's SHA-256, verifies sizes, and also validates the joined compressed SHA-256 **without creating an 857MB assembled file**. The `stage` will be `CP5_JOINED_BYTES_VERIFIED` only if all checks pass.

To additionally decompress and validate all JSONL objects and the expected row count (expensive: read/decompress many rows):

```powershell
python cp5_verify.py --manifest .\g9_p45_nikl_document_sufficient_stats_cp5_multipart_manifest.json --parts-dir C:\path\to\CP5_parts --rows --receipt C:\path\to\distinct_audit_receipts\cp5_verified.json
```

The optional receipt must be **new** and live outside the corpus parts directory. Neither mode modifies input data; `--rows` doesn't write extracted records. For full preservation, inspect the output receipt and store it in the authorized Research OS / private Drive receipts folder, not in a public source corpus repository. Never claim full CP5 validation solely from Drive metadata or manifest inspection.

## Development tests

```bash
python -m unittest -v test_cp5_verify.py
```

These 13 tests use *only synthetic small compressed JSONL bytes*: exact content/row PASS, missing parts, modified bytes, incorrect sequence, path escape, manifest size mismatch, tampered aggregate digest, row count mismatch, booleans in schema, oversized decoded rows, symbolic links and nested receipt output. Real CP5 part bytes are not present in this package.

## Provenance and scientific use

- Official manifest is included solely as metadata, with no raw Korean corpus content.
- The program is not a coreference model, semantic validator, full sentence editor or provider API runner.
- P45 EDF sufficient statistics can support aggregate marker distribution analysis but not lexical collocation inference from text, paragraph revision, or human preference gold.
- The data may have duplicated newspaper years/versions; each `document_rows` value is a representation count, not a count of independent unique works.
- Original raw shards and 20GB NIKL ZIP archives must not be deleted or rewritten.
- Any use for G10-P2 end-to-end evaluation needs source/genre controls, source-work-disjoint splits and separate independent Korean reader + source fidelity audits.

## Preserved copies (2026-11-23)
[Authenticated Drive folder](https://drive.google.com/drive/folders/1vGOnNQX0KHLlTMU8uChPq7KKUAioz-NF) contains the original unmodified ZIP (SHA-256 `2289aa8e357965fb9f6433a7f25474759d17dbd9087e5d7990c51fe00972fef6`) and its five constituent files; remote file-size readback 6/6 succeeded. The user-facing Drive folder is authoritative archive; these tracked GitHub files are reproducible code, never private raw corpus.

## R5m.1 hardening and custody
The revised verifier caps each JSONL line at 64 MiB, refuses a receipt path inside the corpus parts directory even when nested, and rejects boolean values in integer manifest fields. It still has a potential time-of-check/time-of-use limitation if another process mutates fragments between checksum verification and optional decompression; use an immutable snapshot. The new [private Drive R5m.1 folder](https://drive.google.com/drive/folders/1aX_XB82o6Czw2q7DdHLPivlyf0ru-_qM) contains the updated code, 13-test suite, metadata manifest, README, receipt and ZIP, while the [original R5m archive](https://drive.google.com/drive/folders/1vGOnNQX0KHLlTMU8uChPq7KKUAioz-NF) remains intact. New ZIP 8,192 bytes, SHA-256 `bb60a54e51a2d9ea85e8ff690b307b3b63ab08e9e38ccbb4e1ba9aab4ec77972`. Drive file sizes were verified; full cold-byte SHA-256 readback of Google Drive objects is not yet claimed.
