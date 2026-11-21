# G10-P2 R5d — Real 120B coherent-span negative result: 1 deletion, 3 no-ops, no demonstrated writing improvement

Date: 2026-11-21 KST. Status: **EXECUTED exploratory model experiment / no prospective heldout, no independent human reader preference or semantic gold, no proven quality gain**. [Registered BEFORE inference](15_R5D_COHERENT_SEAM_REWRITE_PREREG_20261121.md). Prior eight R5a source briefs and four chosen R5c failures were all exposed to the investigator; this is a **posthoc selected continuation**, not a new cohort. Official G10-P2 remains OPEN.

## 1. Raw evidence
- [Native GitHub Actions #44901019275](https://github.com/WhoSia/KSGT/actions/runs/44901019275), head commit e2a1599a445df8c127ea7cd964f62e13b9039e25, SUCCESS. Genuine 4/4 GPT-OSS 120B Groq calls completed, temperature 0, maxTokens 1450, Node22 R5 38/38 + P2 80/80 PASS. Read-only git author/committer guard; never uses github-actions[bot] as contributor.
- Four strong GPT-OSS 120B original drafts reused from 44899223057 (original 2,804 tokens for the four). Eight previous PATCH and REWRITE provider responses reused from 44900323773 (4,203 + 4,592 tokens). **New R5d calls: 4 and 4,614 provider tokens.** Total **16 distinct complete comparison documents**, not 16 newly generated alternatives.
- [Original raw 4-call R5d ZIP on Google Drive](https://drive.google.com/file/d/1sz3cHhy-O_rrbnXCo4IA5B1toDKedjwy/view); [evidence folder](https://drive.google.com/drive/folders/16kh6NwRDAV6jqlLDPv6ya5cGb67QzB2H). ZIP 17,820 bytes, original Actions artifact #14706350065, SHA-256 `e8a8e19ed8cf21ffd02a2de97601b02c8014ed215eb9e61a4a3f22151f637f0d`, cold Google Drive download SHA agrees. Original ZIP has raw model JSON, exact complete Korean texts and plain Markdown comparison packet.
- The declared region boundary uses exact pre-inference start and stop anchors, must contain the prior problem phrase, and spans at most 40% of original characters. Outside the region, code preserves original bytes. The regions were **manually identified by the investigator**, not derived by a learned Korean anaphora parser.

## 2. Actual output ledger (strong negative evidence)
| Existing complete text | Source-witnessed seam model output | Code outcome | Source-visible developer analysis |
|---|---|---|---|
| SCENE_PAPER (extra walking action before finding untouched paper) | NO_OP: `원문 구간이 요구된 사실을 그대로 보존하고 자연스럽게 연결되므로 교체 필요 없음` | NO_OP | The model **denies the registered source issue** and preserves extra movement even after being shown the problem and entire related region. Exact full prose is not improved. |
| SCENE_GARDEN (unlicensed flowerpot-cleaning action and `그 순간`) | REPLACE region with empty string | APPLIED | The unwanted action and deictic cue disappear together, but **blank paragraph markup remains** and surrounding over-ornate writing persists. This is not a mature literary repair or high-quality Korean generation. |
| SCI_CLOCK (conditional future experiment and formulaic ending) | REPLACE entire region with exactly the **same** text | NO_OP / IDENTICAL_REPLACEMENT | A model can satisfy valid JSON and assert it improved clarity while modifying **zero characters**. The provider response is NOT an actual new prose improvement. |
| NOTICE_BOOK (scope of Thursday vs unknown other weekdays, missing return-box uncertainty) | NO_OP: `원문 문장이 사실을 정확히 반영하고 흐름에 맞아 교체 필요 없음` | NO_OP | Model incorrectly self-certifies `목요일 및 다른 요일의 운영 방식은 변함이 없습니다` despite source only supporting Thursday, and still omits the return-box unknown. |

**Counts:** 1/4 APPLIED (empty deletion), 3/4 NO_OP (2 explicit, 1 identical replacement), 0 mechanical rejects. Mechanically accepted changes were *not* quality verified. No human reader ratings, no independent source adjudication and **no empirical sentence-quality uplift**.

## 3. Why the original ambition overrules this branch
The previous R5c had 8/8 exact-span replacements, yet deletion created dangling `그때` / `그 순간` and an adjacent `발걸음을 멈추고` event without a motivating movement; scientific compression turned `보다 정확히` into `정확히`, an unwarranted sharpening of epistemic certainty.

R5d tested whether including relevant neighboring sentences would itself fix the problem. It did not: GPT-OSS 120B either refused the correction (three texts) or deleted the entire interval leaving an empty paragraph. The model both **proposes and judges its own reformulation**, and without learned Korean discourse realization that self-evaluation is demonstrably brittle.

This is not a failure of a grand reader-state theorem, because R5d is not a full reader-state implementation. It is a **negative result for the current hand-supervised source-witnessed patch technique**. If we merely expand to a third neighboring sentence, add more boxes, or invent another validator, we would repeat the exact process drift identified in KSGT 1–25. No reason remains to demand this editor as a compulsory writer stage.

## 4. Action-changing RAVEL ruling — put generation back first

**Suspend further mandatory exact-span/seam controller expansion on the eight exposed sources.** Keep the code and its failures as a reproducible research artifact. Prioritize a new actual Korean generator supported by *human-authored native revision evidence* and stronger pretrained language models, not more model self-certification.

Candidate nontrivial research path:
1. Recover authentic Korean author/editor adjacent revisions from existing Kowiki / licensed text trajectories; distinguish stylistic edits from factual/topic changes and bot/LLM-written edits, preserving raw bytes, source parents, provenance and rights. A Wikipedia correction is not necessarily literary excellence, so do not train a literary reward from mere edit frequency.
2. Discover **realization operations** (whole-clause omission, paragraph ordering, noun/verb collocation, sentence ending, referential zero/explicit noun, rhythm, source-supported qualifier) with source-context examples. Cluster or model edit decisions rather than hand-pick arbitrary lexical "AI-detection" rules.
3. Train/evaluate a genuinely compact source-conditioned **rewrite proposal or reranker** using disjoint author/doc/chronology splits, compared with the strongest direct 120B and equal-cost direct revision in actual full Korean prose. If it can only remove phrases and makes stories worse, abandon.
4. Employ the project owner's identified expert reading as scientifically useful *individual native writing criticism* without claiming population generalizability, and do not block experimentation on HTML forms or human recruitment.

The candidate objective is **preserve meaning and genre while generating excellent Korean**; source-checking and compositional constraints serve the writer. R5d does not show improved native writing or a new architecture. Keep G10-P2 OPEN. At latest completed experiment, cumulative actual G10-P2 model calls = **272 prior + 16 R5c + 4 R5d = 292** with no double counting of replayed responses.

## Cross-reference
[R5a original 40 calls](08_R5A_40_CALL_REAL_PROSE_RESULTS_20261121.md) → [R5b actual 24 new calls and 32 text comparison](12_R5B_24_NEW_REAL_PROSE_RESULTS_AND_HUMAN_WRITING_REFOCUS_20261121.md) → [R5c exact-span failure](14_R5C_16_LIVE_REPAIRS_AND_SEAM_FAILURE_20261121.md) → this R5d negative decision. These are all exposed small developer cohorts; call counts do not substitute for independently observed writing quality.
