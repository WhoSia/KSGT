# KSGT G10-P1 R9.4 — External KoLLA Essay-ID Bridge, Complete Public UD dev/test Audit (2026-11-05)

**RESEARCH VERDICT: PARTIAL ORIGINAL-STRING PROVENANCE LINK CONFIRMED (180 UNIQUE) / ORIGINAL 100-ESSAY AUTHORITY STILL HOLD / NEW HUMAN RECRUITMENT 0 / G10-P1 OPEN.**

## 1. What was actually checked (no inference inflation)

The [verified KoLLA v2 ZIP](https://drive.google.com/file/d/1dCUq2o8u6x1fzBg77DztfIWuH1dae8w2/view) was re-read in Python from the local 358,800-byte original (ZIP SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`, M2 SHA-256 `d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`). Exactly **1,418 M2 source blocks** were indexed.

Through the GitHub connector, the public [UD_Korean-KSL](https://github.com/UniversalDependencies/UD_Korean-KSL) **dev and test** CoNLL-U text was fetched, tied to upstream Git blob SHA-1 `eff8a689c1dad1231ac5d342ebb78742f6327fa3` (dev) and `637d4405a89b41439b63cc175ec20ae666227905` (test). Original text was held in the research tools, not re-exported publicly. A **private SHA-independent text fingerprint index** was generated from the public UD `# text` entries: FNV-1a 64-bit over **Unicode NFC and removed whitespace**, plus normalized Unicode codepoint count. It was exported as a private Drive Google Doc in the [R9.4 receipt folder](https://drive.google.com/drive/folders/12_2OkjKKTshgcaHvw_728QqYbQq2nuwR), then downloaded into the Python analysis environment. A collision-safe policy admits a mapping only if there is **exactly one original M2 block with the same normalized fingerprint and length**. For absolute cryptographic per-row linkage, the raw upstream text should still be independently byte downloaded and compared later; FNV-64 is not a collision-resistant SHA-256 proof. Seven prior links had been directly compared string-for-string.

## 2. Correct the misleading raw `KL-` prefix count

The public dev/test files contain **338 total entries whose `sent_id` begins with `KL-`**. It is **incorrect** to treat these as 338 canonical KoLLA v2 `KL-fb/fi/hb/hi-essay-sentence` records.

| Public ID class | Records | Evidence interpretation |
|---|---:|---|
| Canonical `KL-fb/fi/hb/hi-N-N` | 240 | Four-component candidate essay/sentence linkage |
| Split suffix `KL-fb/fi/hb/hi-N-N-N` | 6 | Potential extra tokenization/sentence split; separate admitted row |
| `KL-H_P_...` or `KL-H_T_...` | 92 | **Different ID genealogy**; not admitted into a guessed essay group |
| **Total public dev/test KL-prefix records** | **338** | Not all a uniform provenance class |

This explicitly revises R9.3's provisional phrase “168 KL source IDs / 97 group candidates in public test”: **test contains 168 `KL-` prefix entries but only 122 canonical forms and 2 suffix forms**. Prefix counts must never substitute for source-class or matched-original counts.

The 7.7 MB public UD training CoNLL-U was NOT retrieved: the GitHub connector returned a size-related failure or empty sliced content. Therefore **this is a complete admissible-format dev/test check, NOT a full train/dev/test UD corpus audit**.

## 3. Actual 246-case private cold replay (independent Python and Node)

| Observable result | Counts |
|---|---:|
| Public dev records checked | 122 |
| Public test records checked | 124 |
| **Total candidate ID records checked** | **246** |
| Unique normalized original-M2 source match | **180** |
| No original source match under specified normalization | 62 |
| Two matching original source strings (ambiguous) | 4 |
| Distinct exact-linked original M2 locations | 180 |
| **Candidate external essay groups covered** | **59** |
| Group spans interleaved in original M2 | **0** |
| Within-candidate-group order comparisons | **282** |
| Sequence order inversions | **0** |
| Source M2 mapped to multiple conflicting essay labels | **0** |

The 180 uniquely matched rows are distributed by public ID cohort as **FB 79 / FI 68 / HB 33 / HI 0**; absence of HI anchors is *not proof that HI does not exist in the original KoLLA*. Four ambiguous source cases are explicitly retained as unresolved: `KL-fb-8-17` maps to M2 42 or 344; `KL-fi-24-26` maps to 313 or 626; `KL-hb-13-1` maps to 946 or 1003; `KL-hb-16-9-1` maps to 952 or 1013. **No positional heuristic was allowed to choose one**.

Within the 59 group candidates, **282** pairs of uniquely matched sentence IDs preserve increasing source order. The original M2 locations of these candidate groups occupy noninterleaving spans. Together this is strong *structural corroboration* that part of the external ID reflects the original corpus' essay ordering. It does not independently prove all unknown M2 blocks' essay assignments, human author identity, or an authoritative full 100-essay partition.

## 4. Research-method claim boundary

- Every `source ↔ UD sentence` unique match is **text-level provenance evidence** using normalized comparison.
- Every `KL-fb-24` group assignment is **a candidate group inferred from public UD names**, not a separately certified original raw KoLLA essay ID.
- 180 individual matches are **not 180 independent documents, annotators, or native-reader observations**.
- Original KoLLA L2 authors and human GEC annotators are different participants with different authority. Neither is a prospective blinded Korean L1 reader panel.
- A potential source-group partition that is built by interpolating between nearest known anchors will be *an inferred working partition*, not gold, and cannot be used as a confirmatory independent essay split.
- An originally published human correction is an observable human editing action, **not necessarily a requirement to edit** or an external judgement that a particular new KSGT output is superior.
- No LLM was run to generate new KSGT candidates. No new native speaker was recruited or rated new documents.

## 5. Test receipts and location

- [r9_ud_hash_bridge_v02.cjs](../r9_ud_hash_bridge_v02.cjs) implements Unicode-safe FNV-64, unique match admission, within-group order inversion and between-group span collision detection. [Seven Node tests](../r9_ud_hash_bridge_v02.test.cjs) were actually run on local Node v22.16.0 and all **7/7 passed**. These are synthetic-unit tests, not evidence of human quality improvement.
- The original ZIP against source index and matching report were rerun locally in Python 3; **5/5 local validation tests passed** (including protected input checksum and expected 246-case report). Private local audit/source-row mapping remains non-public to avoid silently releasing learner material.
- [Public aggregate receipt](../fixtures/r9_4_ud_246_aggregate_v01.json) stores only source hashes, upstream blob identifiers and aggregate counts; raw learner text is not in the repo.
- [Private source hash index on Drive](https://docs.google.com/document/d/1DsZ1WWQJk8wbyNqAlCFaZtPc3Kah_xXD-Bu3qWWnlFo/edit) includes the 240 canonical ID hashes; 6 suffixed split IDs were added separately to the final Python analysis. The text of original learner sentences was not copied into that receipt.
- **Remote GitHub Actions Node CI:** independent final completed job outcome is not yet observed. A queued job is not a pass.

## 6. Decision

**Scientific progress:** the claim “there is no externally verifiable essay link at all” is no longer defensible; 180 independently discovered source-to-UD ID links, 59 candidate group labels and zero observed order inversions provide direct partial provenance contact. The claim “all 100 original essay boundaries have been restored” is also **not defensible**: 62 unmatched, 4 ambiguous, 92 differently formatted prefix records, unrecovered train split and no independently confirmed original 100-essay index.

Next, attempt authenticated release-version-stable original KoLLA/EXMARaLDA sentence→essay ID mapping, and separately investigate why the 62 dev/test entries do not match strictly normalized original M2. Keep immutable original SHA custody, avoid unrecorded edits to texts or normalization that changes Korean semantics. If no complete mapping exists, only descriptive pairwise human correction research with cautious authority can proceed from this corpus. **G10-P1 remains OPEN; new output quality and independent native-reader preference are still unobserved.**
