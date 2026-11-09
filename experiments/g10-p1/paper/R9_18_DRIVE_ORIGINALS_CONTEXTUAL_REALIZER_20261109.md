# KSGT G10-P1 R9.18 — Drive original-paper reread and contextual generation design
**2026-11-09; G10-P1 OPEN.** Eleven original PDFs were read from their existing Research OS Drive records, not replaced by abstracts or search snippets. **No new model calls, fine-tuning, human ratings or demonstrated prose-quality improvement.**

## Original text audit
| Primary source in Drive | Exactly supported mechanism | KSGT boundary |
|---|---|---|
| [Barzilay & Lapata 2008](https://drive.google.com/file/d/1R5-G5kk10Ox5Tr2EshQBmX_b8O7TKhjc/view) | Entity grid: entity grammatical-role transitions; learned coherence ranking on alternative renderings | No Korean prose-quality guarantee |
| [Roh & Lee 2003](https://drive.google.com/file/d/1X_XR83Rhn9PC5uv5bPM593tHDGVZnEjd/view) | Cost-based centering for Korean zero pronouns. 87 texts in three genres; 151/203 Cheap-Continue instances omit the center | Continuation does not automatically license argument ellipsis |
| [Ham 2026](https://drive.google.com/file/d/1q_1MyyChyI4_h1ErQsNS1g4ttHiZuzaK/view) | Context-dependent information structure; topic/focus/presupposition; primary/secondary layers | No automatic 은/는 vs 이/가 rule or labeled data |
| [Lee Hooin 2024](https://drive.google.com/file/d/1AZ7SG3LmuLmlqqp1PnOIDbr7l-IpwV-V/view) | Korean discourse relation annotation proposal from RST/PDTB/DR-core: logical, temporal, contrastive, structural, interactional families | Relation labels not automatically valid parser predictions |
| [Yu et al. 2025 KoSEnd](https://drive.google.com/file/d/14tiEgX0NDXHU7CSm0jef5drhB4Js6qCc/view) | 3,000 sentences × 15 ending forms; model performance differences | Limitations explicitly say much labeling used LLM assistance; not 45k independent human document judgments |
| [Wu et al. 2025 WritingBench](https://drive.google.com/file/d/1IbUF4RhNkMM8336txCx5-gw-lr9c-j6W/view) | Task-conditional writing criteria, 1,000 prompts and six domains | English/multilingual critic performance not Korean blind reader evidence |
| [Shim & Jeong 2025](https://drive.google.com/file/d/1hBTRCsUo5ASFEVV9BTYHrVn6qfNC_dRn/view) | 116-person Korean essay study separates AI-source detection and assessed quality | A small study does not establish general machine superiority |
| [Iida & Tokunaga 2014](https://drive.google.com/file/d/1iSlg7hhz2-i_KNJ8YT2XGernAqUwGtIC/view) | Six Japanese revisers, 120 essays; two coherence models fail to beat random on revised-order pair preference | No proxy-coherence = reader preference assumption |
| [Zhang et al. Verbalized Sampling](https://drive.google.com/file/d/1ugGf5KJdAbm7K2WJ6l_0k7zG05OHur6d/view) | Preference-data typicality bias and diversity intervention | KSGT unanimous-preference intake may flatten style; disagreement is valuable evidence |
| [Agarwal et al. 2025](https://drive.google.com/file/d/1SLeTGbL-9Cgj9J2xdsLCquKFlR7ibfDR/view) | Controlled 118-person US/Indian study: AI suggestions homogenize some styles | Not a Korean study; motivates non-universal style preferences |
| [Zeldes et al. eRST](https://drive.google.com/file/d/1fsdtNoAjaae2YcZkNSq_WlooYShEjqZw/view) | Non-tree/concurrent discourse relations and signals, English corpus >200k tokens | No direct Korean annotation license or validated generator |

## R9.14 and R9.16 implications
One exploratory reader recognized strong rich generation as comfortably readable, while guided plans sometimes produced mechanical source recitation. Preserve both informational accuracy and reader comfort; never treat either as a scalar gold label alone. R9.16's strict two-reader unanimity gate should *not* discard dissenting style examples from custody, only exclude them from the current simple preference-training export.

## R9.18 code and validation
Implemented a five-arm prompt-construction prototype with shared authoritative source facts:
STRONG_RICH; ENTITY_ACCESSIBILITY; RELATION_FUNCTION; READER_DECISION; JOINT_CONTEXTUAL.
Entity tags are author-provided labels, not coreference predictions; hints avoid automatic omission where referents compete. Relations are drawn only from author-provided edges and do not invent causal links. Reader functions differ for notices, science and scenes. Source SHA and prompt SHA are recorded; actual model calls 0.
Local Node 22 tests: 12/12 PASS. This is **offline engineering**, not evidence that the strategy improves Korean writing.
Reproducible complete local archive: `KSGT_R918_DRIVE_ORIGINALS_AND_GENERATION_HARNESS_20261109.zip` SHA-256 `961c11ec3b5e8222d269773a39ec355a2b9a9bc9ed231b42e1e7700c7231f52b`. Original papers or third-party corpus texts **not** included in archive.

## Immediate research priorities
1. Study which errors R9.14 exposed in reader-first application, then test variants on new, legally permitted source-work-disjoint Korean documents.
2. Compare actual reader-rated coherence/clarity, sentence rhythm, fidelity, and cost; independent blinded readers and source reviewers.
3. Investigate NIKL corpus already acquired in previous KSGT epochs before requesting additional downloads. Raw ZIP existence and rights must be verified, not inferred from archive notes.
4. No claim of fine-tuning or generalization until actual parameter training and out-of-work evaluation.
