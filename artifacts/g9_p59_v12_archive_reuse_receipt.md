# G9-P59 §v1.2 — Work-Mode Corpus Reuse and Korean Revision Evidence Receipt

Date: 2026-10-09. **Single existing P59 stage — not new stage or new named paper.**

## Historical lineage reopened
- [KSGT 14 chat archive](https://drive.google.com/file/d/12f5QO-qfbUjq5uOxq7KsTLtQUPeHAc8p/view) reports that Work Mode **already streamed thirteen NIKL ZIPs** for G9-P45 CP5; not a new v1.2 corpus execution.
- [Actual CP5 multipart manifest](https://drive.google.com/file/d/1yBMfcJvDvXs_XSTzvkcyjN-wRbYKuMhY/view) opened on 2026-10-09: schema `ksgt.g9.p45.cp5.document-stats-multipart.v1`, 12,352,778 document rows, 10 parts, 857,083,889 total bytes, compressed source SHA-256 `9f9baa781c56241de1b1b84cac2bed6080f12c71350d6bda1d30cd4100a0aa76`, raw_text_present=false. Original bytes of the ten chunks were not re-downloaded or rehashed here.
- [KSGT 17 chat archive](https://drive.google.com/file/d/1xY3vO7uHkZjzg2GZ4zdAJ73Q-slqhX5B/view) and [P53 canonical](https://app.notion.com/p/3f3ef561cf928144aafec65a5556170c) report prior actual Qwen3 B/U/K generation and source-faithfulness failures, and the F/E/L/W writer contract.
- [P42 Harvest](https://app.notion.com/p/3eaef561cf92814bbbefef4ad7f9f091) previously established selective-edit/PPG risk boundaries; **do not claim prior mechanisms were invented in v1.2**.

## Inspection status
- User screenshot: 13 local `C:\KSGT` NIKL newspaper and written-text ZIP filenames. **No access to Windows drive bytes**; no current hashes, entries, labels or file tree audited remotely.
- KoSEnd: exact public names `easy.json` / `intermediate.json` / `hard.json`; `easy.json` 7.32 MB, too large for public GitHub preview; row-schema/label-source inspection **HOLD**. Entire dataset is not human gold.
- GOLEMcoref: Korean train/dev/test works **24/3/3**; standard CoNLL-U fields described by upstream; actual Korean token-level annotation content **not ingested**. Repository CC BY-NC 4.0 with underlying story rights still to inspect separately.
- CP5 feature table lacks source paragraph text, so cannot substitute for actual revision correctness or preference labels.

## Executable evidence
- [P59 §v1.2 Python schema/revision guard](../experiments/g9-p59/annotation_revision_v12.py): optional ZIP central-directory-only local scan, CoNLL-U ten-column syntax probe, explicit KoSEnd source field/provenance mapping gate, F/E/L/W witness gating and paired human outcome HOLD. The connected GitHub file is committed and read back.
- A separately authored **local fuller Python prototype** was executed with Python in the current container and returned PASS on fabricated ZIP traversal, CoNLL-U syntax, KoSEnd mapping/witness, F/E/L/W accept/reject/hold and empty human outcome guards. The **GitHub file is a shorter implementation and was not byte-identically re-executed from the connector in this receipt**; remote GitHub Actions PASS is **not established**. Do not substitute prototype PASS for remote repository test.
- All test fixtures are explicitly synthetic. Real Korean prose quality human evidence **zero**, model comparison on new native corpus **zero**, friend's machine use **zero**.

## Harvest provenance
[KSGT Research OS Harvest Backflow Bridge](https://app.notion.com/p/3d2ef561cf9281ed8d05e82fb0be4eff): H-KSGT-P59-V12-A..D = CP5 sufficiency restriction / P42 preservation & P53 F-E-L-W reuse / corpus label-task separation / revision-collateral-loss hypothesis. [Global Harvest genealogy continuation](https://app.notion.com/p/3d2ef561cf92814fbf59d63b9971e907) links this record. No new global sequence number or epistemic promotion.

**Disposition:** P59 OPEN, P58 CLOSED; §v1.2 THEORY+METADATA PROTOTYPE COMPLETE, real annotation schema and native writing human preference **HOLD**.
