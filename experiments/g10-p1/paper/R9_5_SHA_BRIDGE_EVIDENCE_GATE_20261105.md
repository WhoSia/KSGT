# KSGT G10-P1 R9.5 — SHA-256 Bridge Evidence Gate (2026-11-05)

**Status: implementation and synthetic tests; no new 246-row replay, no original essay boundary certificate, no new reader evidence. G10-P1 OPEN.**

## Motivation
R9.4 admitted 180 normalized text links from 246 candidate UD dev/test records using FNV-1a 64-bit plus codepoint length. This is a useful fast index, but an FNV digest is not collision-resistant proof. R9.5 adds a distinct SHA-256 receipt verifier without silently upgrading past claims.

## Method and interpretation
The v03 checker hashes Unicode NFC text with all whitespace removed using SHA-256/UTF-8, then checks normalized codepoint length. A receipt can match zero, one, or multiple original M2 indices. Multiple source occurrences remain ambiguous. The checker rejects malformed and duplicate public ID receipts, records group-span interleaving and within-group inversions, and excludes suffixed split IDs sharing an ordinal from ordinal comparisons.

**Important boundaries:** The SHA-256 evidence concerns equality of *normalized text*, not raw source bytes, original writer identity, independently authenticated essay membership, or preference of independent Korean readers. Normalizing whitespace erases real byte distinctions; provenance must remain labeled accordingly.

## Verification and admission
Nine focused Node tests covering normalized equivalence, unique match, duplicates, missing records, invalid receipts, crossing spans, inverted sequence, split ordinal ties, and raw byte distinction passed on the local development prototype under Node v22.16.0. The repository implementation and tests have been committed separately; remote CI completion is not yet claimed.

The prior R9.4 counts **246 / 180 / 62 / 4 / 59 groups / 282 pairs** are historical FNV-receipt results. They MUST NOT be quoted as v03 SHA-256 replay outputs. A separate SHA-256 UD receipt generated from actual upstream original texts (with upstream version and hashes) is required before testing the 246 records through v03. Private learner sentences should not be published to GitHub.

## Research judgment
Further evidence engineering must be time-boxed; its purpose is to enable source-work-independent human-evidence analysis, not to displace the actual goal of stronger source-faithful Korean prose. If document boundaries remain unverifiable, proceed with an explicitly sentence-level study and hold document-level causal conclusions.

**No G10 promotion or writing-superiority claim.**
