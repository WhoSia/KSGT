# KSGT G10-P1 R9.1 — Existing Korean Human-Trace Data Admission & Legacy KoLLA Packet Replay (2026-11-05)

## Result
**Data-first external-human research RESUMED / NEW HUMAN RECRUITMENT = FALSE / DATA ADMISSION FAIL-CLOSED / CLINCHING QUALITY CLAIM UNIDENTIFIED / G10-P1 OPEN.**

The objective is to bridge R8's still-unverified source-accountable revision to historical real human-source material, not to propose another recruited Korean speaker panel or claim that existing references directly score new R8 outputs.

## I. Actual custody and source review

- **KoLLA v2 raw ZIP located, NOT fresh-hash-sealed:** [existing original 16908784.zip](https://drive.google.com/file/d/1dCUq2o8u6x1fzBg77DztfIWuH1dae8w2/view), in `KSGT/.../ORIGINALS_DO_NOT_MODIFY`, verified metadata size **358,800 bytes**. Original G8 R2at Court historic expected ZIP SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`; the ZIP was NOT freshly byte-hashed this round and the manifest status remains `METADATA_ONLY`.
- **Legacy KoLLA fixed evaluation CSV ACTUALLY READ:** [R2ay FINAL72_PACKET.csv](https://drive.google.com/file/d/13HSrmCpLbuJHJ7jjFcD6OctPDHM8TuRN/view), Drive metadata **22,721 bytes**; text fetched from Drive parsed in this session. Contains 72 rows and exactly 9 expected columns: `challenge_id,row_index0,m2_block_1based,row_sha256,risk_stratum,hidden_annotator,source,visible_ref,candidate`. All 72 rows are structurally well formed; 72 unique challenge IDs and 72 unique claimed source-row hashes. **There is no essay ID column**: 72 sentences must NOT be reported as 72 independent authors or essays. Actual role of historical `candidate` is provisional KSGT output, NOT another independent human reference; `visible_ref` comes from one pre-existing human correction layer. This is a legacy exposed development packet, NOT newly randomized holdout.
- **StyleKQC:** [R2bd-S6 existing 9-case audit](https://docs.google.com/document/d/197BTzBNyzK2wMh_5d2xqWa4UctYpRg62pjnGaIKdLQQ/edit), [S9 prospective human-reference report](https://docs.google.com/document/d/1XlBDlcNPSqHOwQT4uqtAJdqUGT0a1Yq78-gfo6PyN0w/edit), and [S10 predictor failure](https://docs.google.com/document/d/1Lk8GS1rF98OcA6cSbVc6j3N-1yOp6pW4ixNcidVnHKg/edit) exist. **Full original StyleKQC query-group raw file has not yet been verified as present on Drive.**
- **WMT24++:** [P2.1 real post-edit ledger](https://docs.google.com/document/d/1BKNTb4QA2QCuIIuYoJcX0D6BATaRUUPeWxWXPBLhHt4/edit) exists. The exact original full `en-ko_KR.jsonl` Drive byte mirror has NOT been verified. Ten historical rows were prior frozen, but do NOT treat them as new blind tests.
- **KLUE:** [historical official STS/NLI Git blob receipts](https://docs.google.com/document/d/1LwQ9MYrEnfVVe1VQiUX0C_eB2-mS4LnGK9wagGMQdkk/edit) exist. Row task gold is not full-document prose preference.
- None of these sources is admitted as a new source-work-disjoint G10 blind writing corpus merely because an archive/receipt exists. Copyright terms and redistribution rights must be verified **per task and source** before input reuse/republication. Original user-owned Drive data stays in Drive; **no learner Korean sentences, individual participant records, hidden candidate labels or restricted raw corpus content have been committed publicly.**

## II. Actual observed FINAL72 CSV replay (parsed today, not simulated)

| Historical stratum | Existing packet rows | Historical provisional candidate identical to source | Existing visible human reference identical to source | Candidate identical to visible human reference |
|---|---:|---:|---:|---:|
| `R2_LOCAL_MULTI` | **36** | **0** | **0** | **0** |
| `R3_STRUCTURAL_OR_ASYMMETRIC` | **36** | **10** | **14** | **0** |
| **Total** | **72** | **10** | **14** | **0** |

- This is literal string identity only. Different surface realizations may preserve the same meaning, and an exactly unchanged human reference is a **human KEEP action**, not automatic correctness. **0/72 candidate-reference exact matches is NOT a proven model failure or preference loss**, because single references, candidate constraints and dataset selection all matter.
- Existing hidden human correction(s) were not opened in this replay and candidate generation was not re-run; packet is previously exposed. No new model calls, no fresh human participants, no previously hidden KSGT evaluation.
- Both strata have 36 rows by legacy packet design; the high variance between them may reflect case selection, not population rates. This is **not** a prospective estimate of natural Korean editing necessity.
- The original CSV role fields lack `essay_id`, `group_id`, `licensing_receipt`, `raw_sha256`, and writer L1 information. **Block G10 fresh test admission until original KoLLA M2 line-to-essay mapping is verified** and legitimate usage limits are established. Source-row hashes alone are not source-work split proof.

## III. New reproducible implementation and tests

1. [r9_human_evidence_admission_v01.cjs](../r9_human_evidence_admission_v01.cjs): fail-closed rights, raw SHA, human origin, AI-assist uncertainty and explicit claim-authority rules; strict source work→group and group→split isolation; rejects fresh recruitment.
2. [r9_human_evidence_admission_v01.test.cjs](../r9_human_evidence_admission_v01.test.cjs): thirteen tests (authorization, provenance, semantic gold, split leakage, missing rights/bytes). Source-work split cannot be misrepresented as independent rows.
3. [r9_kolla_packet_audit_v01.cjs](../r9_kolla_packet_audit_v01.cjs): strict quoted CSV parser, row hash/ID duplicate protection; privacy-preserving aggregate stdout. Input is private Drive corpus material and should not be pushed into the repo.
4. [r9_kolla_packet_audit_v01.test.cjs](../r9_kolla_packet_audit_v01.test.cjs): nine schema/quotation/duplicate/authority tests using **synthetic** Korean test strings, no learner corpus.
5. [fixtures/r9_existing_human_inventory_v01.json](../fixtures/r9_existing_human_inventory_v01.json): four deliberately **HOLD** admission rows with actual found Drive/source receipt IDs, explicitly `METADATA_ONLY` or `PUBLISHED_RECEIPT_ONLY`, licensing `UNKNOWN`. This manifest is not a human evaluation dataset.

**CI:** read-only workflow [KSGT G10-P1](https://github.com/WhoSia/KSGT/actions/workflows/ksgt-g10-p1.yml) automatically runs `node --test experiments/g10-p1/*.test.cjs` on relevant file pushes. Latest workflow run must have final *completed success* job receipt before test PASS is asserted; queued is **CI_PENDING**, not PASS. Actions bots have only read permission and must never commit.

## IV. The real R9 bottleneck and prospective test gate

The historic human-data shortage is **not absence of humans**. The immediate problem is **misaligned authority and source-work grouping**:
1. Exact human reference rewriting reveals human action / observable alternative, but does not prove a newly generated KSGT document is preferred or meaning-valid.
2. Original corpus license, genre, writer/essay grouping and source-target connection must be recovered before independent source-work holdout.
3. New claim-specific baseline should include `KEEP`, a strong general-purpose LLM revision policy and KSGT provenance-focused policy, with the **same human-origin source**, same first draft, cost accounting and outcome-hidden human historical edit/reference. For genuinely novel tasks there is no preference label; leave that lane unidentified.
4. Evaluate **semantic faithfulness, behavioral alignment, content preservation, authorial/speech-act state and edit harm separately**. One human reference's character edit distance must not determine literary quality or selection.
5. If a strong generic revision is equal or superior at equal/lower total cost on a source-work-disjoint, authenticated external corpus, retire the narrow source-accountable prompt branch while retaining valid G8/G9 evidence.

**No next-node human recruitment.** Human collection instrument readiness and collection authorization are separate, authorization stays FALSE. No external source raw-byte rehash or corpus-level independent grouping is claimed where the necessary original files have not been re-read.

**Scientific status** G10-P1 OPEN. Previous **295 generation outputs of mixed granularity unchanged**. New source-work-disjoint held-out output count 0, new human readers 0, human task reference materials EXIST but task-specific. This round establishes a row-verified historical packet and a stricter experiment gate, not a measured prose improvement.
