# G10-P2 R5o — Actual Korean revision-corpus intake and source-work identification court

**2026-11-23 KST.** New work on real pre-existing KoLLA corpus source; preserves exact original and conservative admission limits. G10-P2 **OPEN / QUALITY_HOLD**.

## 1. What was actually inspected

Direct Google Drive read of original KoLLA ZIP, SHA d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7. Internal M2 SHA d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4. 1,418 source sentences, 4,464 annotation records, 1,410 two-annotator blocks, 8 with annotator 1 missing. 3,649 non-noop edits. No corpus contents output to GitHub.

Independent local replay of actual M2 original yielded **432 pairs with identical reconstructed two-human corrections**, **977 distinct reconstructed outputs**, and **1 strict-reconstruction conflict** because two zero-width insertions and a replacement overlap (1-based block 1124, annotator 0). Of the 432 identical pairs, 241 both KEEP and 191 both change identically. The 977 disagreements split into annotator0-only KEEP 235, annotator1-only KEEP 90, and both changed differently 652. Legacy R9.3 counted 653 both-changed-different, but its algorithm resolved the one overlap somehow; source identity and the 432 agreement count independently reproduce. A conservative implementation should mark the 1 ambiguous pair **ABSTAIN**, not force an ordering to reproduce the old 653. Two-annotator evidence is not a single quality ranking.

## 2. Work/author provenance limit

The source M2 has no authoritative source-essay IDs or full paragraph boundary mapping. Historical R9.4 identified 180 unique sentence links to 59 candidate essay groups from UD-KSL dev/test external IDs, 62 not matched, 4 ambiguous; 100 original essays **not fully reconstructed**. Grouped corpus inclusion needs the complete work IDs, license and exposure lineage. The recently committed R5n.1 grouping tool cannot manufacture missing IDs; running it on each sentence as an independent document would be **a leakage bug**. This is real G4 admission progress (raw revision pairs observed), but not a G4 PASS.

## 3. Candidate ranking corrected by official source intent

Official NIKL catalogue for 2024 *글쓰기 첨삭 지원을 위한 지시문 기반 생성(인스트럭션) 말뭉치* (version 1.1) explicitly describes source writing selected from 2023 original writing materials, with revisions at document/paragraph/sentence levels using content, organization and expression criteria. Its current **raw bytes are not verified in our connected Drive**, and actual authorship, pairing, license and split remain to audit. **Top G4 acquisition target**.

The 2025 similarly named *지시문 기반 첨삭 지원 말뭉치* has a 2025 official research report describing **Korean language consultation and orthography/usage Q&A**, not the same paragraph correction object. Label **DIFFERENT TASK — no automatic 2024↔2025 revision join**.

KoLLA is **AVAILABLE BUT L2/SENTENCE-ONLY / ESSAY-GROUP HOLD**. P36 NIKL is **AVAILABLE HISTORICALLY AS ARGUMENT GROUNDING**, not text revisions. P45 CP5 is **REGISTRY-LEVEL SURFACE STATISTICS**, not raw source text. P62 R6 has twelve machine proposals/zero independent human judgments. These are distinct evidence classes, not interchangeable experimental gold.

## 4. Immediate next experiment once rights and splits are real

Freeze source-work-disjoint tasks, original plus authorized human revision and genre purpose. Run same GPT-OSS 120B candidate generator with STRONG_DIRECT, RICH, STATE_AS_TEXT, STATE_BOUND, EQUAL_COST_ITERATIVE, KEEP and sham state; preregister tokens and annotation labor. Use independent native Korean readers to score *whole paragraph* utility and an independently blinded source-fidelity auditor for actor/object/modality/negation/invented obligations. Cluster outcome uncertainty by source work, not M2 sentence count. If the only accessible evidence is KoLLA sentence-level grammatical edits, do a separate **L2 GEC calibration** pilot but **do not** promote to G10-P2 native whole-prose quality claim.

## 5. Reproducibility and preservation

- Package: `kolla_m2_audit.py`, 11 synthetic tests, aggregate-only JSON receipt, README, this report. ZIP does **not** contain learner sentences, teacher corrections, original ZIP, or granular row traces.
- Original KoLLA ZIP remains in its existing Drive location, no duplicate source upload.
- New provider calls **0**, human quality judgements **0**, training **0**; G10-P2 historical provider calls **340**.
- A prospective full native prose improvement claim is **HOLD**.
