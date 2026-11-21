# G10-P2 R5i — Source-Trace Clause Aggregation (Post-hoc R5h Development, ZERO new provider calls)

**Design dated 2026-11-21 after reading all R5h actual Korean outputs.** The source cases and R5h outputs are known to the developer. This is intentionally **post-hoc engineering**, not a new registered independent test, not human quality gold and not another prompt/reader-state wrapper.

## Actual problem
R5h role-bound finite candidate compilation prevents the LLM from arbitrarily reassigning the folded map or other source-owned object to a different character. It also emits six separate short sentences and repeats names. Example selected R5h source:
"유나는 한 장의 접힌 지도를 손에 쥐고 있었다. 기록실 문 가까이에 서 있었다. 서진은 닫힌 서랍을 바라보고 있었다. 서랍 손잡이에는 손을 대지 않았다."

A natural native Korean clause aggregation can combine two **consecutive same-actor frames** without altering which person owns the map. Compare by **actually compiling source-bound complete Korean texts**, not asking another model to edit a span in the generated paragraph.

## Frozen original data, no retriggered provider calls
- [R5h 16 genuine model calls success](https://github.com/WhoSia/KSGT/actions/runs/44909195424). Source [full original ZIP](https://drive.google.com/file/d/1ygI87GYkV_EXaSIf7HIoFpcI3H31vx8a/view) from GitHub artifact #14708508335: 52,344 bytes, SHA-256 `d8fb6a733accde7cd2a8c4dabc2f559f39881efdb13e2c1be8860546927cbfd1`, 38 ZIP members verified.
- Frozen raw inner `r5h-live/final-score.json` SHA-256 **`ed62b1f3a8f1772dad92eb4c14d38b1c6f710f16c577f8c9020cbd294a7b9216`**, 81,417 bytes, recorded **before any R5i rewrite code or execution**. Any changed original JSON must fail in an independent CI.
- Existing 8 true direct strong 120B completed texts, 8 selected role-bound texts and 8 default role-bound texts reused unchanged. **0 new provider calls** in R5i.

## Executable change and limits
R5h has exact source-author-written frame `S2:S3` with same character A and `S4:S5` with same character B, all 8 sources. A new **structural aggregation pass** operates on `frameID, actorID, predicateVariant`, not on a loose original surface substring. It reconstructs the source-selected predicate variant from the frozen author fixture, and:
1. For A: transform fixed `(손에 쥐고 있었다|손에 들고 있었다|손안에 두고 있었다)` into `(손에 쥔 채|손에 든 채|손안에 둔 채)`, then insert the S3 posture. The source actor is printed exactly once and its name/particle chosen by executable Korean morphology. Example `유나는 접힌 지도를 손에 쥔 채 문 앞에 서 있었다`.
2. For B: transform selected S4 environment/look clause `(서 있었다|바라보고 있었다|시선을 두고 있었다)` into safe same-subject connective `(서서|바라보며|시선을 두며)`, followed by S5 predicate. S4 and S5 are source-licensed to occur in one shared scene, but their co-temporality and rhetorical reading are still researcher assumptions. No unverified cause is inserted. Unsupported verbs must **not** be forcibly joined; keep both source clauses.
3. Retain S1 setting and S6 explicit unresolved ending verbatim. Emit either **4 or more full Korean sentences** and source-to-output frame spans; never remove facts or change `A` into `B`, nor allow LLM-proposed free text.
4. Apply the exact same compiler to R5h's already-completed **selected** and **default** source variants: 8 + 8 = **16 new zero-model-call full Korean texts**. Compare against the old 24 full texts. No new real authors or gold judgments are claimed.

## Scientific risks / kill rule
- The use of `-며` with negative predicates can imply simultaneous or topical linkage not directly entailed by the source; for the frozen scenes this is researcher-assumed, not verified entailment.
- Deterministic template compilation remains lexically limited; source-role preservation does not automatically mean a better literary voice.
- Rewriting every clause into an identical two-pair cadence can produce even more **template homogeneity**. Character switch and zero omission must not make readers infer that character B is still character A.
- No phrase count, full-text model preference, or code test may be called independent Korean aesthetic quality gold; the human user can examine actual finished prose when useful without obligatory HTML forms.

R5g discovered predicate-argument misbinding. R5h implemented author-framed source-role preservation but cost 14,811 vs 5,338 model tokens (+177.47%) for 8 pieces. R5i measures whether a **zero-call compositional aggregation** can address R5h's unnatural clause segmentation without paying the LLM more. Even a local positive developer example does **not** establish a general Korean writing system or new scientific discovery.
