# G10-P2 R5l — Personal-server evidence admission and native Korean corpus lineage reconciliation

2026-11-22 KST. **Report uses separately supplied server-audit text and independently read GitHub/Notion/Drive metadata. The five server-local C: files were not readable in this chat and have NOT been parsed.** G10-P2 stays OPEN / QUALITY_HOLD; no new language-model calls or independent human ratings.

## 1. Evidence classes, not a single PASS

- **LIVE_REMOTE_REPORTED** (separate GPT-6.2 Sol Medium on `BOOK-DCFR8U3IME`; user pasted completion summary): server `C:\KSGT_SERVER` inspected; NIKL 14 ZIPs sizes/mtime match historical ledger, 20,268,693,891 bytes; shard SHA 9/9 sample; about 145.1 GiB free; R6 previous exposed receipts include 12 mechanical proposals and 0 human adjudications; six synthetic interface tests pass. This chat did not read server disks or five Windows `C:` reports. File size and mtime comparison alone are NOT 14 fresh SHA proofs. The 15,889,340 representations, 9,018,434 JSON structures and 100,317,246 paragraphs remain historical completed-run counts observed in ledger, not a newly parsed live recount. Full process command lines were not enumerated due to CIM restrictions.
- **LIVE_DRIVE_METADATA_VERIFIED** (this chat): fetched `G9-P45_DIACHRONIC_LATTICE` folder. Ten exact named parts `g9_p45_nikl_document_sufficient_stats_cp5.gz.part-01` through `-10` exist. Metadata bytes: 9×94,371,840 + 7,737,329 = **857,083,889**. The valid **2,757-byte** manifest `1yBMfcJvDvXs_XSTzvkcyjN-wRbYKuMhY` was independently downloaded and parsed as JSON; manifest source gzip SHA-256 `9f9baa781c56241de1b1b84cac2bed6080f12c71350d6bda1d30cd4100a0aa76`; expected 12,352,778 representation-level rows. Another 1,199-byte manifest is stale/abandoned and must NOT be used.
- **NOT VERIFIED:** whole-part byte SHA, concatenated gzip SHA, gzip decompression, CP5 row parsing; no 12,352,778-row content result has been freshly replicated. The server has no local copies of these parts according to supplied audit. Drive metadata size matching is NOT equivalent to SHA-256 matching.
- **HISTORICAL**: P36 and P62 independent annotated source results; P45 frozen EDF descriptive distribution; never promote underlying sentence strings or human preference gold from these counts.

## 2. Critical P36 name collision resolved

The [Notion original NIKL P36-R10-R1 audit](https://app.notion.com/p/3e9ef561cf9281f7a3e4d078dcaebf31) is specifically the **zero-anaphora** project. Its three official raw SHA values:
- 2020 JSON `56d55a3915ba1a05de576c0de27ed931afea2dfcc8c26d289bb1d37412be376e`
- 2025 JSON `c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d`
- 2020 CSV `c8179e1bce2eaed22ae6d7afdf764034aac1e2ccdffe54b7f261ede2ad717610`

Its 2020 `document → sentence[] + ZA[] → predicate + antecedent[]` differs substantially from 2025 `document → sentence[] → ZA[] → predicate + ellipsis[] → restored + antecedent[]`. 2025 admits multiple antecedent spans, unknowns, `#` deictic references, adjunct/complement types; 2020 contains legacy `-1` external/unknown antecedents. 556,164 official slots were historically mapped to KSGT-ARG-v1 categories (2020 493,333 and 2025 62,831), but this is not an end-to-end Korean prose realizer.

The **current main and active R5k branch** Git trees were enumerated using GitHub's recursive tree API, and no matching NIKL P36 adapter path was found. A distinct **old** Git tree `a2f13bfd886cf82923efde5932dfe39929996dec` (commit `808b65fbcbdddcbc2430c7bb0e8b2dbc80ec9c44`) contains `experiments/g9-p36-r2/adapter_response_chunk_v1.js`, but reading the file proves it is an **English academic peer-review response quote/reply chunk normalization adapter**, not the above NIKL zero-anaphora adapter. Likewise `compiler_c3r2_structural.js` is an academic review-response structural contract, not an actual 2020/2025 NIKL schema parser. **Do not silently rebrand or copy these similarly labeled historical P36 files as the NIKL real-schema adapter.** The server's 404 for the originally recorded NIKL-native code path thus remains a genuine unlocated-source blocker, not a missing one-line import.

## 3. Evidence-to-generation authorization boundary

| Source | Allowed downstream use | Never infer |
| --- | --- | --- |
| P36 2020 NIKL annotation | original source predicate, restored subject/object slot, antecedent source IDs where witnessable | fully disambiguated current discourse reader state; 2025 identical ontology; authorial preference |
| P36 2025 NIKL annotation | multi-candidate set and unknown/exophoric/deictic cases | unique referent by arbitrary first-antecedent selection |
| P62 original source/span and exposure graph | source-work dependency, exact source offsets, prior-exposure quarantine | machine proposal is semantic gold |
| P45 CP5 derived EDF | aggregate marker frequencies and year/publisher/topic sensitivity | literal text, collocation vector, sentence revision target, quality rating, exact original+revised passage |
| R5j/R5k | bounded surface preflight, explicit semantic/naturalness HOLD | approved edit; unique coreference or polarity entailment |
| R6 12 machine proposals | provenance-backed proposal inventory from prior exposed audit | twelve correct human-reviewed referents |

## 4. Next experimental design decision: do not reopen 20GB by default

The evidence base is now strong enough to define a genuinely discriminating **full-text edit evaluation** *on already accessible real Korean source/revision pairs*, when acquisition and rights are confirmed. Hold source-work IDs fixed, deduplicate same underlying author/work across splits and control exposure. Use identical GPT-OSS 120B writer, same source facts, matched token/time/annotation budget, DIRECT/RICH/STATE_AS_TEXT/STATE_BOUND/KEEP, plus equal-cost iterative rival. Evaluate whole-paragraph idiom/naturalness separately from source-fidelity actor, object, scope, negation and quotation. Reader and source auditors must be independent of task writing. If full native revision pairs still unavailable, call it BLOCKED and do not substitute 12 machine suggestions or EDF counts as human gold.

The current **R5k edit guard is structurally limited and may even strand `에는` when deleting `유리창`**. This defect is a development counterexample, not a successful rewriting feature; use KEEP/ABSTAIN unless complete sentence validity is checked. Returning `STRUCTURAL_CANDIDATE_ONLY` must never be promoted to automatic apply.

## 5. Custody and actions

No private raw NIKL bytes, source IDs, corpus contents or server-local paths beyond generic location were written to GitHub. The files under `C:\Users\...\G10_P2_CORPUS_RECONNECTION_20261122` are user-pasted references, not accessible connector URLs or sandbox attachments; no file readback of those reports has been claimed. No server files were altered. No GitHub Actions writes, bot authoring, new model calls, new training, or human preference claims. Stage still **G10-P2 OPEN / QUALITY_HOLD**, model call total **340**.

**Gate:** accept existing server prototype only after its actual interface `README`, source code and `EXECUTION_RECEIPT.json` are supplied to this chat through a supported file or connector path and independently checked; do not merge on the basis of pasted aggregate test count alone.
