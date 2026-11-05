# KSGT G10-P1 R9.3 — Public Code Audit: StyleKQC, JELV, TETRA/Korean GEC Interoperability (2026-11-05)

## Scope

This is a **static inspection of upstream research implementation**, not reproduction of human preference or retrieval of new independent Korean speaker judgments. Public sources were fetched through the GitHub connector and compared to the PDFs already present in Google Drive.

## StyleKQC: published dataset description ≠ raw bytes delivered by public loader

- [Official paper, Cho et al. (2022)](https://aclanthology.org/2022.lrec-1.771/) identifies **3,000 original queries (6 topics × 4 acts × 125 query items)** expanded to 30,000 utterances, with query-level 80/4/16 splitting. This is strong evidence for **original query** as split-group unit, not 30,000 independent documents.
- [README](https://github.com/cynthia/stylekqc/blob/main/README.md), Git blob SHA `985eab1719eb4f50bc1c29416dd891b18dd85cc1`: still says `Style pairs are to be uploaded soon`. This repo alone cannot prove the entire human paraphrase corpus is accessible.
- [stylekqc.py](https://github.com/cynthia/stylekqc/blob/main/stylekqc.py), blob SHA `be2fb9b852bea7fb0392e618ddca9b44bdf83542`, uses `datasets.GeneratorBasedBuilder`, `datasets.SplitGenerator` for `train.tsv/dev.tsv/test.tsv`, with `data_url=""` for `act` and `topic` configs and `data_url=None` for `sts`. This is a file-dependent loader, **not a downloader furnishing original pairs**.
- The `stylekqc.py` header separately describes Apache-2.0 inheritance; README says CC-BY-SA 4.0 for materials; published proceedings PDF declares CC-BY-NC-4.0. **Per-file dataset license/terms must be verified; do not silently use one layer's terms for the others.**
- No exact original raw paired StyleKQC file has been byte-verified on KSGT Drive in this round. R9.4 source admission remains HOLD until byte, rights and query-group identifiers are all grounded.

## JELV: edit-level validity prior art, external weights/environment dependencies

- [Zhan et al. (2026) paper](https://drive.google.com/file/d/1aRxoRS-AppFg8505dKXNfbO1SvIR-lbJ/view) and [JELV README](https://github.com/yuhao-zhan/JELV/blob/main/README.md), Git blob SHA `cc22cc5289620310223679c0baf70b4984ea2e52`. README reports PEVData **1,459 valid and 1,338 invalid edit pairs** and an English GEC-based validity/fluency measure.
- [evaluation/JELV_based_cleme/JELV_utils.py](https://github.com/yuhao-zhan/JELV/blob/main/evaluation/JELV_based_cleme/JELV_utils.py), blob `231f0b3794885a23f8a807abf5452f1fc5e89d3b`, hardcodes `SAVED_MODEL_PATH="/data/zyh/JELV/evaluation/JudgeModel/best_model"`, and invokes `SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS", local_files_only=True)` and `GPT2LMHeadModel.from_pretrained("gpt2",local_files_only=True)`. These dependencies make the author's exact runtime **not automatically reproducible** from a README alone.
- [evaluation/scripts/JELV_based_Fx.py](https://github.com/yuhao-zhan/JELV/blob/main/evaluation/scripts/JELV_based_Fx.py), blob `18e72050458356f08c5d338331840fee0ba4f110`, expects REF/HYP M2 and combines CLEME/edit metric with fluency by `(1-gamma)*A+gamma*B`; default gamma 0.5. It performs **reference-relative edit evaluation**, not a source-work-level Korean naturalness contest.
- KSGT must compare against this strong *edit-level* prior work when describing novelty, but may not report its English classifier as newly validated Korean quality gold.

## Document-level rival: TETRA

[Mita et al. (2024) original 15-page PDF](https://drive.google.com/file/d/1fnikM-yVZmih7hX6l-hDDo3DkGOzH1Tv/view) separates high-level planning and paragraph-document revision from sentence editing and proofreading, and notes limited-reference ambiguity of open-ended revisions. This is prior art against claiming that KSGT invented hierarchical draft/revise itself. TETRA's English academic-paper edits do not identify the preference of Korean L1 readers for new KSGT outputs.

## Specific KSGT implications

- Existing KoLLA correction *pairs* are an appropriate source for **human correction variability**, not new model-vs-human candidate wins.
- StyleKQC is a promising **speech-act/formality-query-group corpus** but lacks proven original raw source capture in this Drive audit.
- JELV is a methodological benchmark for **edit admissibility**, not automatic text quality, and requires independent code and weight verification before numeric benchmarking.
- Essay-level source mapping remains necessary before cross-paragraph/paragraph discourse evaluation. The available KoLLA flat M2 must NOT be split into guessed essays.
- Repeated data-dependent instructions in original learner M2 are untrusted text, not tool commands. Preserve raw hash, do not execute corpus contents.

No models were called; no new human ratings collected. User's data-first/no-recruitment doctrine remains active.