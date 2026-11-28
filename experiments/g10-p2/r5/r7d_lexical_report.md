# R7d — Lexical avoidance does not guarantee semantic fidelity

2026-11-28 KST. G10-P2 OPEN / QUALITY_HOLD / RIGHTS_SCOPE_HOLD; P3 proposal only.

## Design and actual execution
Four new investigator-authored families (gallery fiction, lab explanation, notebook essay, transfer report), each with two matched source scopes and three single-call arms. The common source and ending conditions are identical across arms within each scope. DIRECT has strong source-faithfulness, expressive latitude and no-meta instructions; GLOBAL_AVOID additionally discourages a target expression regardless of scope; CONTEXTUAL gives optional conditional expression guidance. The latter supplies a manually articulated possible implication, not an automatic semantic parser; it is extra instruction information and extra tokens, not an equal-token mechanism comparison. Licensed/unlicensed texts differ in the supplied status sentence. Four families rather than eight independent source works; no independent human evaluation.

Run 46032006425, exact HEAD 171324efb56cd6bf49d44aeb49471247acedb733, job 140617882284 completed/success. 7/7 preflight tests, 24/24 GPT-OSS120B responses, temperature 0, maxTokens 2400, 14905 tokens. Previous P2 cumulative 606 + 24 = 630 total provider calls (writing, reader and other probe calls, not 630 completed prose outputs).

| Metric | DIRECT | GLOBAL_AVOID | CONTEXTUAL |
|---|---:|---:|---:|
| Complete prose |8|8|8|
| Two paragraphs |8/8|8/8|8/8|
| Lexical proxy in LICENSED |1/4|0/4|2/4|
| Lexical proxy in UNLICENSED |0/4|0/4|0/4|
| Prompt tokens |2940|3200|3578|
| Completion tokens |1804|1865|1518|
| Total tokens |4744|5065|5096|
| Median latency ms |752|718|580|
| Mean nonspace characters |232.125|235|190.75|

CONTEXTUAL token total +7.42% relative to DIRECT; GLOBAL_AVOID +6.77%. The proxy patterns cover selected surface forms and some near alternatives, not all implications, and can miscount word occurrence without assertion. Avoidance cue frequency is not a semantic-fidelity or writing-quality metric. Shorter contextual output is not itself a gain; length was not numerically constrained. Latency is descriptive only.

## Full-prose reading and counterexamples
See r7d_author_audit.json: all 24 texts read by the nonindependent developer, with explicit ambiguity labels. No independent ratings or numerical quality score.

- GALLERY: licensed DIRECT and CONTEXTUAL use again-sitting; GLOBAL_AVOID conveys prior sitting through alternative wording. All three introduce or reorder some actions; CONTEXTUAL has the contradictory-seeming "입구에 걸린 안내도가 접힌 채 바닥에 놓여 있었다", and has the character rise after footsteps, obscuring the original map retrieval and order. Unlicensed no direct prior-sitting implication in any arm; GLOBAL_AVOID introduces rising and adds listening at the end; CONTEXTUAL makes sitting less explicit. Fictional sensory elaboration is not automatically an error; concrete new actions and altered temporal relation are separate concerns.
- LAB: GLOBAL_AVOID preserves the licensed expectation explicitly, whereas DIRECT and CONTEXTUAL retain continued observation but omit expectation. All three arms in various cells strengthen seeing a precipitate at a time into its onset, conflate time-to-visible-precipitate with reaction rate, or add unprovided procedure. DIRECT unlicensed speculates about chemical properties, GLOBAL_AVOID unlicensed about composition/solvent; CONTEXTUAL unlicensed adds meta "첫 번째 문단에서는"/"두 번째 문단에서는", and approximately doubles a duration whose first time is only an upper bound. Mass unmeasured preserved. Licensed CONTEXTUAL and GLOBAL_AVOID and unlicensed DIRECT leak meta closure. These issues remain despite zero unlicensed lexical hits.
- ARCHIVE: all licensed versions convey past knowledge but add past visits or route-finding; source only authorizes having known the place, not having visited it. Unlicensed DIRECT says "한때 알았던 무언가" and "그곳에 대한 기억", which plausibly adds prior knowledge despite zero proxy hits. CONTEXTUAL first suggests fading memory then doubts whether prior knowledge existed, a mixed pragmatic result, and continues after notebook closure. GLOBAL_AVOID explicitly acknowledges uncertainty but includes ambiguous "기억의 조각" and repeated closure. A global lexical prohibition does not prevent implicit meaning drift.
- TRANSFER: all licensed versions retain the target of five versus actual three, including neutral direct wording; "세 개만" in CONTEXTUAL is a valid scoped restriction rather than mandatory expressive value. Unlicensed CONTEXTUAL is concise and preserves four source facts; DIRECT adds broad status checking, GLOBAL_AVOID invents morning number logging and repeats it. Report genre favors neutral numerical clarity over evaluative adverbs.

The data do not establish contextual control superiority, nor a general preference for expressive cues. Blanket avoidance is also not justified. Specific cue authority is insufficient: inference may propagate to other predicates, temporal links, causal interpretations, or past experience. R7d DONE_DEVELOPMENT_MIXED; preserve direct as strong rival. Next: treat scope of licensed meaning as a relation (e.g., know-place does not license visit-place; observation-at does not license onset-at), test natural complete drafts and compare selective local repair/no-op versus full rewrite, evaluating whether new errors outweigh repaired target. Avoid forced lexical rules or expansion of manual labels without matched benefit.

## Custody
Artifact 15214787088, 64887 bytes, provider SHA256 c8049c7e21a037c6109c3847752a4029ec3b716707f36a50c3ac4d53cd85891c. Drive file https://drive.google.com/file/d/1o8n9cvocHOJ7NuveKW79Q-J6eWGHkvcY/view. Cold Drive re-fetch locally verified same digest; 52 ZIP entries CRC pass. Independent Python replay checks all 24 attempt/source/prompt/text hashes, model, stop status and token total. Manifest SHA256 3b09d55495ede05de4bf31028bc42f58e956dcbda47d7197c91ac60a7cffe1ba. Original artifact downloaded then Drive re-fetched to same path; original local SHA not separately captured before overwrite, so claim only provider digest vs cold copy. Provider wrapper receipts, not raw HTTP. No private corpus, model training, independent source gold, independent Korean reader ratings, or new literature intake. P3 remains proposed; no automatic promotion.
