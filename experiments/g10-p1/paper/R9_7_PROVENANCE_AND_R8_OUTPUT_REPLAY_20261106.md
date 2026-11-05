# KSGT G10-P1 R9.7 — Dual-axis Research Audit (2026-11-06)

**Status:** provenance partial identification + actual R8 source-zip replay; no validated writing-quality superiority; G10-P1 OPEN.

## A. KoLLA provenance
Reopened sealed KoLLA v2.0 archive from Google Drive, 358,800 bytes, SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`. The contained M2 SHA-256 was `d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`; 1,418 sentence blocks. The R9.4 UD dev/test comparison (246 eligible rows, 180 unique normalized strings, 62 missing, 4 ambiguous, 59 *candidate* groups) is **historical** and was NOT replayed with R9.5 SHA receipts in this round.

[Conditional boundary model](../r97_boundary_partial_v01.cjs) and [synthetic tests](../r97_boundary_partial_v01.test.cjs) formalize a point-identification failure: A at source index 2 and B at index 5 admit three boundaries, after indices 2, 3 or 4, even assuming no third group and contiguous, adjacent candidate groups. Data-linked anchors alone do not authenticate original essay IDs. Local synthetic tests: 7/7 PASS; remote CI not independently claimed.

## B. Korean prose — fresh read-only reproduction from R8 raw outputs
Re-downloaded the original R8 Drive ZIP (`KSGT_G10-P1_R8_20261105_GPTOSS20B_6works_shared_draft_18calls_RAW.zip`) and independently recomputed its SHA-256: `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9`, consistent with the sealed R8 receipt. Parsed `r8_output.json` (6 development source works, 18 provider calls, same exact draft supplied to generic versus KSGT revision within each source work). Results by exact final UTF-8 strings:

| Measure | Result |
|---|---:|
| Source works (researcher-authored exposed development) | 6 |
| Generic revision == KSGT source-accountable revision | **2/6** |
| Different final revision texts | **4/6** |
| Three-paragraph final documents: generic | **6/6** |
| Three-paragraph final documents: KSGT | **5/6** |
| New independent human ratings | **0** |
| Independent semantic gold labels | **0** |

The text-identical works were `NOTICE_CONDITION_A` and `SCIENCE_LIMIT_A`. The KSGT two-paragraph exception was `SCENE_CORRIDOR_B`. A difference in output length or in wording is **not** a preference outcome. This audit deliberately avoids creating pseudo-human judgments or publishing learner-original text. These counts were recomputed with a local Python stdlib ZIP auditor and five local replay tests PASS, separate from the Node tests committed here.

**Interpretation:** a structured source-accountability revision can produce *exactly the same artifact* as a strong generic revision under matching draft input, even with extra structure. On these two works, any preference contrast between those two final texts is a tie by identity, not a performance gain. On the remaining four, independent error labeling and blind readers are required to decide relative quality. In `SCENE_CORRIDOR_B`, the KSGT arm also violated three-paragraph format while generic did not. These source-work observations constrain but cannot statistically establish a general quality deficit.

## C. New evaluation infrastructure
[Reader evidence validator](../r97_reader_evidence_v01.cjs) and [eight synthetic tests](../r97_reader_evidence_v01.test.cjs) enforce source-work-disjoint dev/held-out sets, separately held arm keys, explicit output hashes, and admissible independent Korean-reader records. An accepted schema does not establish reader identity, proper blinding in the real world, semantic correctness, significance, or quality superiority. Local Node tests for both new modules: 15/15 PASS.

## D. R9.8 decision
1. Preserve raw R8 outputs and original KoLLA ZIP in Drive; only derived aggregate metrics and audit code may be public.
2. Restore authenticated source-document identifiers before confirmatory essay-level splits; a gap-bounded guess is not gold.
3. Prioritize a source-work-disjoint Korean document evaluation comparing direct, generic shared-draft revise, and KSGT accountability. Human reading, semantic preservation, and computation are separate endpoints; pre-register before reading new held-out outputs.
4. If source-work boundaries cannot be certified, limit KoLLA claims to sentence-level descriptive analyses and do not let provenance work block the writing-research arm.

**No automatic G10-P2 promotion; human ratings 0; R9.5 246-row SHA cold replay still pending.**
