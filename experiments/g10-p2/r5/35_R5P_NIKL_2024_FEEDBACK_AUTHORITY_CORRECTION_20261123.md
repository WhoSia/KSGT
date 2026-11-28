# KSGT G10-P2 R5p — NIKL 2024 writing-instruction corpus: authority inversion discovered

Date: 2026-11-23 KST · Stage: **G10-P2 OPEN / QUALITY_HOLD**. This is a metadata and methodology court, **not a download or inspection of the restricted NIKL dataset bytes**.

## Research director's corrected finding

The priority-A 2024 National Institute of Korean Language corpus **글쓰기 첨삭 지원을 위한 지시문 기반 생성(인스트럭션) 말뭉치 2024** must not be assumed to consist of 1,500 human-written **BEFORE → improved AFTER** prose pairs. Its official **2024 research report** says that large language models created writing-evaluation responses to submitted drafts, and assessment experts **reviewed and modified those evaluation/feedback responses**. Separate sections treat content, organization and expression tasks. Therefore authority of an **expert-edited feedback answer** is not authority of an **expert rewrite of the input draft**.

- Official report: https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=45&pageIndex=1&report_seq=1184&searchOrder=
- Official report PDF URL is available through the national-language institute's download endpoint; consulted the extracted report text around summary, section 2, and appendix 2. Screenshot attempt from the web PDF failed; visual PDF page inspection not claimed.
- Official application/catalogue: https://kli.korean.go.kr/request/corpusRegist.do?lang=ko
- Official June 30, 2026 corrected-release bulletin: https://kli.korean.go.kr/m/boards/noticeView.do?recordId=1733

### Report-described composition (**not 1,500 expert rewrites**)

| Annotation task | Input unit | Instruction/example count |
|---|---|---:|
| CONTENT | paragraph | 100 |
| CONTENT | document | 100 |
| ORGANIZATION | paragraph | 100 |
| ORGANIZATION | document | 100 |
| EXPRESSION | sentence | 800 |
| EXPRESSION | paragraph | 300 |
| **TOTAL** | | **1,500** |

The report says input writing is drawn from NIKL 2023 raw writing materials. For content/organization, a language model response is examined by experts against a rubric and corrected or supplemented. The expression section identifies language/orthographic corrections at sentence/paragraph level, but **the released JSON schema has NOT been inspected**; whether each item includes an original sentence and a fully reconstructed changed sentence, as opposed to instructions, feedback or marked errors, is **UNKNOWN**. All annotation-task counts are corpus-construction statements, not independently parsed record counts.

## Scientific consequence for G4/G5

Previously R5j/R5n/R5o treated this dataset as a potential first-choice native source-revision pair collection. It remains a **priority dataset to obtain**, but only as a **writing feedback/expression-error analysis source** until raw schema and edited target surfaces prove otherwise. It cannot automatically satisfy:

- G4: professional human native-language whole-paragraph BEFORE → AFTER revision pairs;
- G5: blind reader preference/utility human labels;
- source-work-disjointness, originality or editor independence for complete paragraphs.

**Do not quietly rename feedback edits as text edits** or convert expert response correction into a paragraph naturalness gold. Its potential immediate benefit is human-audited feedback taxonomy for content/organization and expression errors, including inter-sentence connective and referential repair *if source spans are actually grounded*.

## Executable evidence admission

`r5p_annotation_authority.py` implements an explicit distinction between `LLM_FEEDBACK`, `EXPERT_EDITED_FEEDBACK`, `ANNOTATED_EXPRESSION_EDIT`, `HUMAN_REWRITE`, `HUMAN_RATING`, and original source. Even with all caller-asserted authority flags true, expert-edited **feedback cannot be counted as a source rewrite**, and a human-authored draft rewrite still cannot be called quality gold without an independent task court. Rights, source work ID, version pairing, exposure and source witness must be individually present. **15/15 synthetic tests PASS.** This is fail-closed metadata gating, not recognition from actual NIKL JSON.

## Next evidence-bearing move

1. Search existing Drive and local verified intake for the exact **2024 corpus ZIP**, not only report/paper/corpus-name matches. Current Drive broad discovery produced contextual academic documents but **did not locate a verified original 2024 corpus**.
2. The official site exposes `내려받기`, `미리보기`, `신청` UI controls, but authenticated entitlement, terms of use and actual downloaded ZIP remain unverified. A signed-in authorized user may need to acquire the corpus through the official application interface; do not bypass access controls or invent a direct ZIP URL.
3. After real byte acquisition: freeze SHA/terms, inspect the 2024 **released** schema, classify each record's role, test presence of true BEFORE/AFTER strings, and join to the parent 2023 source work ID. All unknowns remain HOLD.
4. Separately source or collect genuine professional native paragraph revisions and run the already preregistered source-disjoint whole-text DIRECT/RICH/STATE_AS_TEXT/STATE_CONTROLLER/EQUAL_COST/KEEP trial with independent reader/source audits. Never assume a high human-edited feedback count is a human reader sample.

No change to P2 340 historical model calls, 0 new model calls, 0 human reader ratings. No change to private originals. GitHub should contain only research documentation, code, and synthetic receipts; Drive is original artifact custody.
