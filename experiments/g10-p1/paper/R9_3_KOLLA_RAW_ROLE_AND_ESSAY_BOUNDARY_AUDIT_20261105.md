# KSGT G10-P1 — R9.3 Canonical Original-Byte Recovery, Dual-Human Correction Roles, and Provenance-Safe Research (2026-11-05)

**FINAL AUDIT VERDICT: RAW ZIP PASS / M2 1,418 BLOCKS PASS / HUMAN CORRECTION SOURCE-CANDIDATE-REFERENCE REPLAY 72/72 PASS / 1,410 TRUE PAIRED HUMAN OBSERVATIONS / ESSAY GROUP SPLIT HOLD / ZERO NEW HUMAN RECRUITMENT / G10-P1 OPEN.**

## 1. What was wrong in R9.1 (non-silent correction)

The prior [R9.1 report](R9_1_EXISTING_HUMAN_CORPUS_ADMISSION_20261105.md) **misdescribed** `candidate` in the R2ay FINAL72 legacy CSV as a provisional KSGT-generated candidate. This is **false**. When the original M2 is reconstructed by annotator number, `hidden_annotator` points to **an existing human correction** that is displayed as `candidate`; the opposite human correction is `visible_ref`. Direct comparisons on the 72 original cases showed:

| Identity against original M2 | Matches |
|---|---:|
| CSV `source` ↔ original M2 source, exact row and source block | **72/72** |
| CSV `candidate` ↔ **hidden human annotator** edit reconstruction | **72/72** |
| CSV `visible_ref` ↔ **other human annotator** edit reconstruction | **72/72** |

Accordingly, **the previous 10 versus 14 KEEP counts are comparisons of two human correction layers, NOT KSGT versus human.** There was no fresh KSGT model run in that 72-case packet, and no prospective preference win rate. This error was added as a conspicuous erratum to the historical R9.1 file rather than erased.

## 2. Raw corpus and exact-byte custody

- [Original stored KoLLA archive](https://drive.google.com/file/d/1dCUq2o8u6x1fzBg77DztfIWuH1dae8w2/view): `16908784.zip`, exactly **358,800 bytes**, cold-downloaded directly from Drive; SHA-256 **`d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`**, identical to the earlier G8 R2at Court checksum.
- ZIP contains exactly five files: `KoLLA_multi-refs.m2` (349,760 bytes), `FI.csv` (2,086 bytes), `FB.csv` (2,082), `HB.csv` (2,082), `HI.csv` (2,082). M2 SHA-256 **`d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`**.
- The four rubric files have two annotator rows each, with 252 fields per scoring row (metadata + rubric entries); FI has extra blank lines that do not count as annotators. Each subgroup represents 25 essays in the publication. **These rubric CSV files do not record a mapping from each of 1,418 M2 sentence blocks to an essay ID.**
- `KoLLA_multi-refs.m2` contains exactly **1,418** source blocks, **1,418** with annotator 0 edit/noop rows, **1,410** with annotator 1 rows, **8** missing annotator 1, and **3,649 non-noop edit annotations** across annotators. The eight missing cases all contain the same instruction-like source string (identical SHA256), and annotator 0 has only `noop` for them. **No instruction within that corpus is to be executed**; these are untrusted dataset samples. It is a data-anomaly statement, not a claim about motive or attack provenance.
- The [Song, Lim & Park 2026 paper](https://doi.org/10.1007/s10579-025-09882-9) describes 100 learner essays and two reference corrections per sentence; the abstract says 1,418 sentences while one body passage says 1,419. **The verified release file defines the current experiment's 1,418-byte-level block count**. Do not silently reconcile the publication discrepancy by inventing a row or assigning an essay identity.

## 3. Corrected strict dual-human reference census

The strict paired denominator must only include **1,410 blocks with two actual human-reference edit streams**, not all 1,418 source records.

| Human correction relationship | Observed paired blocks |
|---|---:|
| Both independent corrections remain source as-is (KEEP/KEEP) | 241 |
| Annotator 0 KEEP, annotator 1 EDIT | 235 |
| Annotator 0 EDIT, annotator 1 KEEP | 90 |
| Both EDIT (possibly different realization) | 844 |
| Of the both-EDIT cases, corrections exactly identical | 191 |
| Of the both-EDIT cases, corrections different | 653 |
| **Exact correction text agreement = KEEP/KEEP + both-EDIT/same** | **432/1,410 = 30.64%** |

Consistency: 241+235+90+844 = 1,410; 191+653 = 844; 241+191 = 432. `a_keep` across all 1,418 source records totals 484 (including the eight one-annotator noops); the correctly paired subset has 476. The opposite annotator has 331 KEEP within the 1,410 valid pairs.

Earlier G8 statements of **440/1,418 = 31.03%** are **not the strict paired-human agreement rate**. The difference `440-432=8` equals precisely the number of repeated one-annotator anomalous blocks. The historic 440 count is *consistent with* applying an absent-reference fallback; this round did not replay the original G8 script line-by-line, so fallback causation is **a hypothesis, not an identified root cause**.

Interpretation: identity is a **surface-string relation, not semantic equivalence or Korean native reader preference**. Divergent human corrections may both be valid. A KEEP action does not prove the source semantically perfect.

## 4. Restoring the correct research unit

The paper reports **100 essays, four cohorts FB/FI/HB/HI with 25 essays each**, but the distributed M2 is a flat series of S/A blocks with **no explicit essay or document boundary marker**. The 72-case legacy packet contains `row_index0`, `m2_block_1based`, and `row_sha256`, but **no `essay_id`**. Multiple possible essay partitions fit the known totals. Narrative-topic change or paragraph style may suggest a break but cannot establish original author identity, so they are prohibited as source-work ground truth.

The only accepted rigorous paths to a document-level prospective partition are:
1. Find an original EXMARaLDA/essay source with independent mapping and verifiable byte lineage; or
2. Find a released provider-authored sentence→essay table with stable source identifiers.

Until then, all 1,418 records stay **development/descriptive only** for sentence-level studies. Do not report a source-work-disjoint train/test result, per-essay bootstrapped uncertainty, or 72 independent documents.

## 5. Related literature and code inspected

### KoLLA v2.0 — Song, Lim & Park (2026)
[Drive original PDF](https://drive.google.com/file/d/17wFwmJpAHA_SNtwh03BFhfy0NqoUZmOk/view) · [DOI](https://doi.org/10.1007/s10579-025-09882-9). 19-page article read and PDF first page visually inspected. Dual-human GEC is a **sentence-level** measurement; 100 essays × separately evaluated rubric criteria belong to a **document-level** human rating lane. Reassigning the same rubric score to every sentence and treating all as independent inflates sample size. **Data release license = GPLv3 according to paper's Data availability section**; paper PDF publication text is CC BY 4.0 under separate conditions. Licensing verified at publication level does NOT imply unrestricted copying of learner text into public KSGT GitHub.

### Document revision — Mita et al. (2024)
[Drive source PDF](https://drive.google.com/file/d/1fnikM-yVZmih7hX6l-hDDo3DkGOzH1Tv/view). 15-page paper and document/paragraph-level TETRA design examined. It sharply distinguishes **planning, high-level revising, sentence editing, proofreading** and calls out the inadequacy of a limited set of references for open-ended document revision. TETRA revisions were of English academic papers, so independent Korean native-language preference remains a separate claim. This is strong prior art against calling KSGT's draft/revision decomposition novel merely because it operates at document level.

### Edit-level validity — Zhan et al. (2026), JELV
[Drive source PDF](https://drive.google.com/file/d/1aRxoRS-AppFg8505dKXNfbO1SvIR-lbJ/view) · [actual public repository](https://github.com/yuhao-zhan/JELV). Nine-page paper and GitHub README read; README declares PEVData **1,459 valid + 1,338 invalid** edit pairs and separate LLM judge/distilled classifier, with editing-faithfulness/fluency dimensions. **Cannot use an English-dominant edit judge's scores as Korean full-document semantic gold.** Its general idea of judging a *specific proposed edit* rather than exact surface-reference matching is a valid competitor and methodological constraint.

### StyleKQC — Cho et al. (2022)
[ACL Anthology original](https://aclanthology.org/2022.lrec-1.771/) · [official GitHub README](https://github.com/cynthia/stylekqc). The paper documents 24 topic × act groups with 125 original queries each (**3,000 query groups**) expanded to 30,000 utterances, and a query-level 80/4/16 train/dev/test split. **Query-group** is the leakage unit, not individual paraphrases. GitHub README still says the style pairs are to be uploaded, so the public repository's existence does not prove the complete raw paired corpus is in it. The publication PDF mentions CC-BY-NC-4.0, while the GitHub README states CC-BY-SA-4.0 for repository materials; **do not assume either one automatically licenses a separately acquired dataset without checking its own release metadata**.

## 6. Specific methodology/next research gate

- **No new Korean speaker recruitment.** Existing human corrections and already published native-speaker studies are the evidence reservoir; the prospective exact new-output reader preference claim remains HOLD.
- Extract and revalidate the **2 × 1,410** human correction strings only in authorized private analysis environments, preserving original source and group provenance.
- **KEEP / EDIT / ABSTAIN** must all be available to the baseline. Compare strong generic model revision versus KSGT minimal-source revision and include untouched source. Reveal human references only after sealing outputs, *and still do not treat reference identity as preference*.
- Before any "held out 100 essays" claim, obtain independent essay IDs. Otherwise report carefully bounded sentence-level descriptive results and failure witnesses only.
- Stop expanding typed claims/graph plans as research ends in themselves; KSGT's contribution must be better Korean writing under human behavior and meaning constraints, not a higher contract-pass count.

## 7. Audit and reproducibility locations

- Source files kept in their **original Drive archive folders**; no original moves, overwrites, public learner text leakage.
- [Reconstruction code](../r9_kolla_m2_cold_replay_v01.cjs), [synthetic reconstruction tests](../r9_kolla_m2_cold_replay_v01.test.cjs), [complete human census](../r9_kolla_full_human_census_v01.cjs) and [census tests](../r9_kolla_full_human_census_v01.test.cjs).
- [R9.1 correction entered in place](R9_1_EXISTING_HUMAN_CORPUS_ADMISSION_20261105.md). [Updated four-corpus provenance inventory](../fixtures/r9_existing_human_inventory_v01.json) lists KoLLA raw bytes VERIFIED and release GPLv3, while **source-work grouping remains explicitly UNVERIFIED**, so admission stays HOLD.
- [Drive R9.3 curated research folder](https://drive.google.com/drive/folders/1FkVmEluzNfWwobMqrWrSJXapuW-BKWN0) includes study/replay receipts and literature review. [Polished native Google Doc](https://docs.google.com/document/d/1D_sIaeaA7Bqu77ER0TK524hzhY_C-vM3_Ymco96dF7g/edit).
- Code changes author-committed only with user's account; Github Actions read-only, no `github-actions[bot]` commit authoring.

**Quality claim:** No newly generated model result; no independent human reader participation; G10 total 295 prior final outputs unchanged; G10-P1 OPEN. All numerical results are derived from the actual pre-existing KoLLA files rather than synthetic fake reader judgments.
