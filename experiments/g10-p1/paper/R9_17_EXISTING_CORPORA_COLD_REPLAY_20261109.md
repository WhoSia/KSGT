# KSGT G10-P1 R9.17 — Existing-Corpus Cold Replay (2026-11-09)

**Decision:** Reuse actual acquired materials first. Do not treat a former archive download or a previous textual report as proof that current raw bytes are accessible. No new LLM model calls, parameter updates, external learner-text publication or new independent reader ratings.

## Actual KoLLA original ZIP cold replay

- Original KoLLA ZIP: 358,800 bytes; SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`. Five inner entries, including the full M2 and four ratings CSVs.
- Original M2 SHA-256 `d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`; 1,418 source sentence blocks.
- Crucial distinction: **eight** source blocks contain only annotator-0 `noop` and have no annotator-1 annotation. Therefore the historical 440/1418 surface-agreement count requires imputation that the missing second annotation also made no changes.
- Exact observed two-annotator domain: **1,410** blocks, **432 agreements**, **978 disagreements**. Breakdown: 241 both unchanged, 191 both same-edited, 653 both edited to different text, 90 reviewer 0 only edited, 235 reviewer 1 only edited.
- All four CSVs have two nonempty rows × 252 fields (format observed, score codebook and work-level linkage not certified). Original essay boundaries still HOLD. These counts do **not** measure naturalness or preference.
- Seven local replay tests PASS, including tampered-ZIP SHA rejection. Replayer and counts exclude all learner-original text.

## Previously acquired corpus ledger

- **NIKL zero-anaphora 2020**: historical KSGT-17 report attests an original CSV audit and 493,333 omission annotations; current raw ZIP/CSV has not been obtained in this replay.
- **NIKL zero-anaphora 2025**: historical report attests 62,831 omission annotations and original ZIP examination; current raw ZIP has not been obtained in this replay. The two numbers use different annotation contracts and are not directly comparable.
- **KoLLA v2, Groq R5–R8, R9.14**: original ZIP files available in the current local runtime. The generation outputs are actual model responses but not independently judged gold.
- **NIKL writing raw/scored 2025**, **NIKL instruction-based revision 2025**: official release confirmed, but no authenticated raw payload has been identified in accessible Drive searches or local runtime. The writer-scored corpus is distinct from the NIKL 2025 zero-anaphora corpus.
- **KoSEnd**: author GitHub files are discoverable, but file-level training license not confirmed; it is sentence-ending evidence, not natural Korean essay-quality gold.

## Operational plan

1. No redundant KoLLA download. Preserve original ZIP privately and only publish aggregate receipts.
2. Recover old NIKL original-asset Drive file IDs from prior corpus custody records. Report historical data counts separately from independently reverified bytes.
3. Access NIKL 2025 writing raw/scored datasets by the official authenticated delivery route and inspect rights + actual schemas. No account-access bypass.
4. On authentic permitted examples, investigate Korean reader-first genre/domain features and actual human annotations. Do not collapse multiple human references into single 'best' prose without a preference judgment.
5. Resume actual prose generation after data provenance is grounded, without another chain of irrelevant validator-only tasks.

**References:** [Original KoLLA v2](https://zenodo.org/records/15287129), [NIKL 2026-09-30 corpus release](https://kli.korean.go.kr/taskOrdtm/taskList.do?clCd=END_TASK&subMenuId=sub01&taskOrdtmId=103), [NIKL corpus request](https://kli.korean.go.kr/request/corpusRegist.do?lang=ko). Previous KSGT internal Drive archive: `KSGT 17.md`, `1xY3vO7uHkZjzg2GZ4zdAJ73Q-slqhX5B`.

**G10-P1 OPEN.** R9.17 raw KoLLA replay PASS; 2020/2025 NIKL current raw-byte custody HOLD.
