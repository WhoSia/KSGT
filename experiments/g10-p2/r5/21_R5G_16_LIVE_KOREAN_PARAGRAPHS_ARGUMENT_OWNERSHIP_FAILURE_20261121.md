# G10-P2 R5g — 16 real GPT-OSS 120B Korean paragraphs: DAG order did not guarantee entity ownership or source fidelity

Date: 2026-11-21 KST. Official stage **G10-P2 OPEN / QUALITY_HOLD**; developer-side source-visible analysis of actually generated Korean, **not blind native-reader preference, independent source-semantic gold or a new trained model**.

## 1. Frozen experiment and verified raw evidence

Pre-inference [R5g preregistration](20_R5G_EXECUTABLE_KOREAN_DISCOURSE_PLANNER_PREREG_20261121.md), [eight new author-written six-fact Korean rhetorical graphs](fixtures/r5g_new_eight_korean_rhetorical_dags_v01.json), [executable six-node exact topological order scorer and 120B writer](r5g_korean_discourse_order_realizer.cjs). All eight sources were created in this turn, **different from R5a–R5f source works**; still synthetic researcher-authored development, not naturally obtained human-edited prose or a random independent test corpus.

**Live native CI**: [GitHub Actions #44906786903](https://github.com/WhoSia/KSGT/actions/runs/44906786903), SUCCESS. R5 Node 53/53 and prior P2 80/80 tests PASS. First earlier preflight #44906644922 failed before any provider requests because an arbitrary validator required each natural Korean source fact to have 25+ characters; some valid clauses were 20–23 characters. This was corrected to a weak 15-character structural guard **without changing the registered source briefs, graph edges, source selection or model prompts**, then the live 16 calls succeeded. Read-only CI, WhoSia human author, no github-actions[bot] contributors.

**Original ZIP** [Google Drive](https://drive.google.com/file/d/1pKtaViq3wwtVawNdBVOZcx0mSTAidvaK/view), [evidence folder](https://drive.google.com/drive/folders/18bhGP8snKTB6MD1zMnGs4vzMCepkAren), **45,125 bytes**, SHA-256 `11f046944de91ae58433e982cae3526af61327e18d44f074a18d25cfd61d08d1`; original GitHub artifact #14708185893 SHA matches Drive cold download. ZIP CRC 38/38 entries successful. Includes original complete sixteen Korean texts `plain-Korean-16-graph-ordered-comparisons.md`, all source briefs, full provider JSON receipts, frozen exact solver plans and `final-score.json`.

Actual new **16/16 Groq GPT-OSS 120B calls**; temperature 0, maxTokens 1450, no second LLM call for graph planning.

| Condition | Original provider calls | Complete Korean paragraphs | Actual provider prompt+completion tokens | Numerically novel tokens (weak string test) |
|---|---:|---:|---:|---:|
| Strong DIRECT120B | 8 | 8 | **8,028** | 0/8 |
| Exact-DAG LATTICE120B | 8 | 8 | **11,209** | 0/8 |
| Total new experiment | **16** | **16** | **19,237** | — |

Relative extra provider tokens for planning `(11209-8028)/8028` = **39.62%** despite zero additional model calls. A deterministic solver is computationally cheap, but **prompt length is not**. Neither row is cost/length matched and the added computed plan is a different input representation. It isolates the *extra plan cue under identical source graph*, not a learned source-encoding architecture's causal effect or quality superiority.

## 2. Exact solver results

Planner receives **6 researcher-labeled factual nodes and mandatory dependencies**, enumerates all feasible topological orders (maximum 6!=720), then ranks legal orders with frozen genre-role early-position coefficients and topic-overlap/role-adjacency rewards. Direct and lattice prompts both see all same six node texts, status labels and predecessor links; lattice adds the executable selected ordered node IDs and status notes. Therefore the solver's own best order is known to respect every declared dependency; whether 120B follows it and preserves actor/action bindings is a separate realization problem.

| Fresh source | Total legal topological orders | Compiler-selected node order |
|---|---:|---|
| SCI_REFLECTANCE | 3 | F1→F2→F3→F4→F5→F6 |
| SCI_OCR | 3 | F1→F2→F3→F4→F5→F6 |
| NOTICE_PHOTO | 10 | F1→F2→F6→F3→F4→F5 |
| NOTICE_BROADCAST | 30 | F1→F2→F5→F3→F6→F4 |
| CHAT_ABSTRACT | 9 | F1→F2→F3→F5→F4→F6 |
| CHAT_RELEASE | 15 | F1→F5→F2→F3→F4→F6 |
| SCENE_CORRIDOR | 12 | F1→F4→F3→F2→F5→F6 |
| SCENE_STATION | 15 | F1→F4→F3→F2→F5→F6 |

**These scores optimize a declared rhetorical proxy; they are not automatically the best idiomatic Korean information structure.** In scenes, the order "atmosphere→person A→person B→unresolved tension" may encourage the LLM to incorrectly merge the two people into a single grammatical subject, because the planner contains no predicate–argument identity assignment.

## 3. Whole Korean document readback and source-visible contradictions

The source and **both complete text outputs** for all eight works were inspected. Judgments below are investigator development observations, not independent blinded votes.

| Work | DIRECT120B | LATTICE120B | Reasoned case assessment |
|---|---|---|---|
| SCI_REFLECTANCE | Natural four-sentence method→result→limit→plan | Comparable, slightly more wordy; correct caveat on unrecorded room lighting | Both usable as a short science report; no clear improvement compensating for longer prompt |
| SCI_OCR | Preserves 18/30 pages and cannot conclude about small type; first input phrase slightly awkward: `알고리즘 A와 B를 동일하게 입력한 결과` | More natural description of passing identical scanned images into two OCR systems, preserves uncertainty | Narrow local wording preference for LATTICE, not proof of general advantage |
| NOTICE_PHOTO | Gives submission instructions, but turns **unknown explanation-edit permission** into `수정 가능 여부는 추후 확인됩니다`: a future confirmation claim not licensed by source | Orders date, pending venue and submission clearly, but **omits F5** (whether captions may later be edited is unknown) | Neither fully solves communication of uncertainty; graph-induced omission despite 6/6 plan is important |
| NOTICE_BROADCAST | Covers 5th-period restriction, 6th-period unknown and Friday unknown, but omits **unapproved alternative music room**. Says `추후 공지를 참고해 주세요` without an explicit future notice undertaking | Includes unapproved music room but similarly presupposes future notice; groups unrelated unknown statuses into a heavy sentence | Coverage improvement for LATTICE, naturalness/unsupported future notices still problematic |
| CHAT_ABSTRACT | Says the summary **already bears the label** `'공개 초록 기준'임을 표기했습니다` although source only contains a **request to add** it; **omits uncertainty** about abstract vs final article | States full PDF missing, abstract/final equivalence uncertain and **asks** to add `공개 초록 기준`; aligns speech-act status with source | **Strongest narrow LATTICE benefit**: source status and pending request preserved |
| CHAT_RELEASE | Correctly distinguishes 11 local tests from **CI not run**, graphs from publication approval; smooth ordering of completed tests before reviewer request | Also preserves factual status, but puts reviewer request before local test result (less natural progress narration) | Both useful; direct arguably more natural information order |
| SCENE_CORRIDOR | Licenses both characters and the folded paper; slight invented spatial proximity `그 옆에서`, but character ownership remains | **Serious source contradiction:** the source says **정원** holds folded paper while **준호** only looks out at the rain; output instead: `그 창가에 서 있는 준호는 ... 손에 든 접힌 종이를 놓지 않는다`. 정원 never appears. Wording `복도는 조용히 비워져 있다` and `그 순간은 그대로 머문다` is also stilted. | **Plan accepted, entity/predicate binding FAILED.** This is a concrete counterexample to equating valid DAG topology or numeric match with writer fidelity |
| SCENE_STATION | Contains narrator seated, old man by clock, stalled hand and illegible ticket. Adds unlicensed act `승차권을 바라보니` and a generic image `빛과 그림자만이 ...` | Describes an almost-empty room as `사람 그림자 하나 없이` **although narrator and old man are in the room**; invents position `그 옆에 놓인 나무 의자` and ends with abstract `정적 속에 머문다` | Graph planning can increase unnatural decorative prose and create contradictions without any novel numbers |

**Important:** For both arms, string detection of new numeric tokens returned **zero**, yet the LATTICE fiction outputs changed **who holds an object** and whether humans occupy the space; DIRECT also turned an *unfulfilled request* into a *completed act*. Numeric and phrase-pattern guards are thus neither sufficient factual checks nor genuine Korean prose quality assessments.

## 4. Technical interpretation — distinguish information precedence, argument ownership and epistemic scope

The current executable planner supplies `G=(V,E_precedence)`, with rhetorical status attached to nodes. It does **not** supply a forced realization relation `holds(정원,종이)` vs `looks_at(준호,창밖)` or bind "unconfirmed" to a particular proposition's temporal scope. A linearization `F3→F2` is therefore insufficient to prevent a subject from absorbing the next fact's predicate.

For future experimental work (NOT implemented or claimed solved here), explicitly distinguish:

- `E_prec`: ordering constraints ("method before observed result"; "event before limitation") used in R5g;
- `E_arg`: typed predicate–argument attachments (actor/holder/recipient/target, semantic role, mention persistence; in Korean, omitted subjects and particles matter);
- `E_scope`: whether a statement is OBSERVED, PLANNED, UNMEASURED, UNDECIDED or a **request**, and which clause this scope binds;
- `E_dis`: rhetorical coherence that allows natural Korean topicalization, zero-anaphora, appropriate ellipsis, contrasting evidence and avoiding the stiff "상태 목록" of mechanically planned paragraphs.

The **next substantive generator** needs a candidate realization method that binds `E_arg` and `E_scope` during generation, **not another post-hoc reader-state audit or a purely lexical banned-phrase filter**. But simply adding these labels to the prompt would repeat the current prompt-wrapper experiment; a genuine compact mechanism would need *actual executable joint frame selection or constrained argument assignment*, trained/validated against suitable source-authenticated Korean editorial evidence and a strong same-budget baseline. If it is not more natural than direct 120B, retire it.

## 5. Pre-existing prior art and novelty restraint

Plain content planning or graph-to-text is decades old: Moryossef, Goldberg & Dagan (2019), [*Step-by-Step: Separating Planning from Realization in Neural Data-to-Text Generation*](https://aclanthology.org/N19-1236/) (the original paper is **already held** in the Research OS, not newly acquired in R5g); [Puduppully & Lapata (2021), *Data-to-text Generation with Macro Planning*](https://doi.org/10.1162/tacl_a_00381); [He et al. (2025), *Evaluating and Improving Graph to Text Generation with Large Language Models*](https://aclanthology.org/2025.naacl-long.513/). The 2026 [*Discourse-grounded text generation* dissertation](https://universaar.uni-saarland.de/handle/20.500.11880/42004) likewise uses rhetorical graphs and an ordered blueprint. Korean word order's topic/focus effects are described by [Park & Yeon (2023), *Notes on word order variation in Korean*](https://benjamins.com/online/prag/articles/prag.22023.par). These are **published background/abstract or official metadata consulted**, not a claim that all full papers were read and algorithmically replicated in this session.

R5g is **not KSGT architectural novelty**, and the observed literary failure is why an abstract graph must not displace the natural writer in the product. No justified promotion of G10-P2 to G10-P3 on the basis of 16 synthetic exposed tasks. The current effective baseline remains one strong complete Korean prose generation call, with any additional semantic structure carrying a **measured burden**.

**Stage arithmetic:** R5a/R5b/R5c/R5d/R5f total = **308** verified previous calls; actual R5g = **16** new → **324 cumulative actual provider calls**. A zero-cost graph solve is not a second LLM call. No independent native-reader preference, source-semantic gold or full-prose superiority has been established.
