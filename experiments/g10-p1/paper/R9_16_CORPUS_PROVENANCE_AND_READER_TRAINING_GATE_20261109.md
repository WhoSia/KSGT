# KSGT G10-P1 — R9.16: corpus-provenance and genuine reader-signal intake

**Date:** 2026-11-09. **Status:** development of a training-ready evidence boundary, **not** model parameter training or a newly scored generation trial.

## Why this matters

R9.14's actual 15 Groq-generated Korean texts and the author's three exploratory reader reactions highlighted distinct dimensions: terse information structure versus comfortable readability, event ordering versus sentence rhythm, and a reader-helpful public notice versus an itemized inventory. One reader's preferences, especially across only three exposed works, are **not a training-quality ground truth**. R9.15 diversified prompt behaviors but did not secure authentic paragraph-level data or parameter-update rights. R9.16 treats **legally verified source provenance and genuine multi-reader preferences** as prerequisites to any SFT/DPO-like fine-tuning, rather than continuing to tune prompts on the same three examples.

## Implemented source and rating gates

- `r916_corpus_provenance_v01.cjs`: hashed input evidence, NFC-and-whitespace-equivalent source-text identity, complete-source-work links, derived-from lineage, author-scoped split cohesion (when author IDs exist), research/training permission assertions, source-unit split blocking, rater-level score receipts and descriptive mean/spread only. Handles transitive derivation and cross-dataset duplicate text. The code does **not** verify legal license documents, assign quality labels or redistribute Korean text.
- `r916_corpus_provenance_v01.test.cjs`: synthetic-only cases for exact/normalized duplicate leakage, transitive revision ancestry, shared author, training permission and score provenance.
- `r916_preference_pairs_v01.cjs`: allows local private contrastive examples only after an *explicit recorded preference* on one selected axis by **at least two distinct agreeing readers** and a researcher-verified training-use permission assertion. A tie, abstention, dissent, missing reader or research-only permission never automatically becomes a preference pair. Output contains original text, therefore private/local only.
- `r916_preference_pairs_v01.test.cjs`: synthetic cases for rating disagreement, ties, independently supplied ratings, axis separation and same prompt appearing under different source-work names.

**Important limitation:** the strict unanimous two-reader gate is an exploratory data-admission choice, not a scientifically estimated optimal threshold; it may systematically exclude disputed but valuable examples. A sampled disagreement cohort should be retained separately for adjudication. A `TRAINING_ALLOWED` field is merely a researcher's signed-off assertion: primary license and scope must be reviewed outside the code.

## Source review — explicitly evidence-graded

| Dataset | What can be verified now | What is NOT verified | R9.16 admission |
|---|---|---|---|
| National Institute of Korean Language, writing raw corpus 2025 | Official 2026-09-30 corpus release lists 1,000-character argumentative writing by university students/adults | Authenticated payload/schema, number of distinct works, exact redistribution and parameter-training terms | **HOLD; no text ingested** |
| NIKL writing scoring corpus 2025 | Official site explicitly says **two expert raters** for the approximately 1,000-character argumentative essays | Record-level rater schema, annotator agreement, content access and license scope | **HOLD** |
| NIKL instruction-based revision corpus 2025 | Official release lists this as a 2025 new data source | Exact file schema and license scope | **HOLD** |
| NIKL instruction-based revision corpus 2024 | Official description identifies sentence/paragraph/document-scale revision by content/organization/expression | Training and rehosting scope, complete file bytes | **HOLD** |
| KoSEnd (ACL SRW 2025) | Author repository contains `easy.json`, `intermediate.json`, `hard.json`; paper describes 3,000 sentences × 15 endings = 45,000 sentence ending labels | GitHub repo has no license metadata; 45,000 labels do **not** imply independent 45,000 source sentences or document quality judgments | **HOLD for training; sentence-level diagnostic lead only** |

Official dataset page: https://kli.korean.go.kr/taskOrdtm/taskList.do?clCd=END_TASK&subMenuId=sub01&taskOrdtmId=103 .
KoSEnd repo: https://github.com/seungukyu/KoSEnd and paper: https://aclanthology.org/2025.acl-srw.29/ .

## Next scientific work

1. Secure authentic primary-format NIKL raw/scored/revision corpus files and download terms **through authorized access**; record precise release, file hashes, split granularity, work keys, rater scales and allowed uses. Never substitute web snippets or the KoSEnd examples for source documents.
2. Build a document-level feature analysis with correctly tracked genre, topic, author and rater groupings. Do not infer Korean prose quality from surface regex, document length or grade alone.
3. Only where a permitted corpus supports it, construct true instruction→better-revision pairs or reader-consensus preference pairs. Stratify by reader and document category, preserve rejected candidates and abstentions. Distinct source work = primary grouping unit.
4. Freeze external work-disjoint evaluation data before parameter updates. Compare lightweight SFT/LoRA/pref-tuned generations with a **strong untuned model** and R9.15 profiles. Human reading naturalness and separate factuality/epistemic integrity are independent outcomes. Actual training execution requires licensed text and hardware; none has occurred.
5. Restore focus on **actual Korean prose** after corpus preparation, rather than another long chain of infrastructure-only gates.

## Open limitations
- No authenticated NIKL 2025 original essays obtained; no genuine two-rater data ingested.
- No new Groq generation, reader recruitment or independent quality inference in this release.
- No model parameter changed, no fine-tuning done.
- One-reader R9.14 impressions remain development feedback, not training or validation labels.
- While exact/normalization/author/lineage duplication is blocked, semantic paraphrases without explicit lineage may still leak; robust near-duplicate detection requires separate governed inspection.

**Official research stage: G10-P1 OPEN.**
