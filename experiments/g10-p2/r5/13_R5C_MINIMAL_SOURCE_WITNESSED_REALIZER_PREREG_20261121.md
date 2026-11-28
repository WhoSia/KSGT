# G10-P2 R5c — Source-Witnessed Minimal Realization Edits versus Strong Complete Rewriting

Date: 2026-11-21 KST. **Frozen before R5c model inference**. This is an actual executable source-conditioned Korean prose intervention, not a new reader-survey UI, model training or independent human validation. R5a/R5b eight source works are already exposed; R5c is explicitly **developer-stage diagnostic reuse**, NOT confirmatory evidence. Official G10-P2 remains OPEN.

## Research question
Can one strictly anchored source-referenced edit to a strong GPT-OSS 120B Korean document improve a previously identified author-visible error **without altering the rest of the original text**, at a lower all-in model-token and edit-distance burden than a single unconstrained whole-document rewrite of the same original text?

R5b proved stronger 120B and generic genre-policy prompts still fabricated notices, omitted uncertainties and made fictive actions. R5c shifts from simply instructing the writer to executing a **real span-application and refusal mechanism**. The state is an **error-bearing source witness**, not a speculative model of what a human reader is thinking.

## Actual source and target freezing
- Reuse 8 R5b B120 DIRECT complete texts exactly from [GitHub Actions #44899223057](https://github.com/WhoSia/KSGT/actions/runs/44899223057), [Drive ZIP](https://drive.google.com/file/d/1gIPzK5yUwvy-_J7DShDfs_zZ_M9iwFDs/view). Freeze SHA for every original full text and prompt; verify bytes and model ID on cold replay **before new inference**.
- Eight specific flaw targets selected by investigator in advance, one per text. Each anchor quote must appear exactly once in the B120 original, otherwise hard fail. Fix the **selected defect**, no cherry-picked posthoc target changes. Targets cover unsupported social instructions, omitted key uncertainty, overbroad notice scope, invented notification promise, forbidden literary action, unlicensed narrative expansion, repetitive scientific closure and boilerplate scientific closure.
- Source references identify 1-based facts in the original 5-fact source and may not be invented from model state. Quote anchors certify string occurrence, not source meaning. User-authored original literary voice remains a primary target.

## Three alternatives, one frozen draft
1. **KEEP_120B (zero extra calls)**: the original unmodified strong 120B draft, including known defect. Honest NO_OP alternative.
2. **EDIT_120B (one new provider call)**: send original full text, five factual source clauses, genre/purpose/license, exact quote and diagnostic/source references. Ask 120B for a *single strict JSON edit*: decision REPLACE or NO_OP; quote (must byte-match frozen target); replacement (≤600 characters); reason. Execute **one literal span replacement, no other edits**. If JSON invalid/quote mismatch/repeat/new unsupported numeric information, **fall back to KEEP** with no speculative repair and log original response. Source-sensitive lexical numerical gate checks that every newly introduced numeric token already occurs in the 5 source facts; necessary but not sufficient for fidelity. Do not ban all new words or licensed metaphor. A text can still change meaning; human/source audit needed. A NO_OP is recorded, not silently treated as success.
3. **REWRITE_120B (one new provider call)**: same strong model and same original text, source facts, the exact target quote, diagnostic reason and references, but may rewrite entire document for naturalness, completeness and defect repair. No executable patch controller. All prompt information identical except the allowed edit surface and structured output requirement. Compare all-in model tokens, edit distances and concrete source errors. This is **one-call matched**, not token-equal, because output length differs; report tokens honestly and avoid overclaiming equality.

Two model responses per source, **16 new live Groq GPT-OSS 120B calls**, temperature 0, fixed maxTokens=1450, raw attempts and model receipts SHA sealed; 8 old model B120 calls reused, not billed again.

## Registered interpretive tests
- 8 exact pre-inference target anchors, 8 prior drafts SHA matching, 16 new calls with cold replay and 3 whole prose choices per work (24 texts).
- Mechanical edit status: APPLIED/NO_OP/REJECTED (and rejection code). A REJECTED edit **does not mean model corrected the original**; final output is original text.
- Anchored target phrase disappearance is weak. Search outside edit for lost facts, invented promises/events, altered time/causal certainty and ghost repetition. The model itself is **not** an independently authorized evaluator.
- Textual edit minimality: original common prefix and suffix preservation outside target, raw character edits, no mandatory 1–5 rating, no HTML or recruitment. Rich literary rewriting can improve while causing more changes; minimal is not automatically good.
- A deliberately flawed target may be *false positive* if legitimate atmospheric detail or genre variation; note dissent and allow retarget only in future explicitly registered iteration.
- Count **all provider prompt/completion tokens**. Compare KEEP=0 marginal, EDIT vs REWRITE actual marginal totals and final quality as developer observations only; do not infer a computational Pareto frontier before independent quality calibration.
- If strict edits repeatedly fail validation or yield stilted prose, reject the controller as mandatory. If free rewriting is consistently more fluent despite extra changes, quality outranks a cosmetic patch pass rate. No mythical scientific advance from an all-green CI.

## Original KSGT obligation
KSGT 1 demanded beautiful, varied, truly natural Korean writing; KSGT 24 owner explicitly preferred information order and absence of unnatural moralizing over mechanically greater warning coverage. User rejects spending months polishing thin HTML human-judgment instruments. Keep research generative: next experimental unit should produce actual usable Korean texts, including fiction whose aesthetic value is not captured by occurrence checks.

## Version status
Identifier R5c is an **experimental subunit**, not a newly approved Generation or G10-P3. Do not increment cumulative model calls until authentic receipts and cold archive exist. Keep scientific claim ACTUAL_GENRE_SOURCE_REPAIR_BENEFIT=UNPROVEN until independently assessed. Do not count editor's author-visible diagnoses as independent source gold.
