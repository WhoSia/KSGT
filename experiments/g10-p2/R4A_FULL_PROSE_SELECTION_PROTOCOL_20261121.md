# G10-P2 R4a — Reader-facing full-text candidate selection, preregistered exploratory pilot (2026-11-21)

**Before calls:** G10-P2 R3 showed a closed proof contract on four investigator-structured prior works but did not improve complete Korean prose. R4a returns to whole reader-facing writing. This pilot uses **12 newly authored, source-work-disjoint development briefs** (3 chat, 3 science, 3 school notices, 3 literary scenes). They do not overlap R9.34 or R2 author-created works, but remain **author-created development**, not independent Korean reader gold, and they are not a hidden confirmatory holdout after this run.

## Question and minimal causal contrast

Given exactly the same finished Korean prose alternatives and identical model-generated risk evidence, does a **deterministic post-realization selector** make a better choice than an LLM seeing that state as ordinary text? This measures *candidate selection*, not a Transformer replacement, an independent readership model, or generation of a new candidate from an executable state.

All 12 briefs have one audience, purpose and fact set. Each brief receives:
1. **DIRECT** — strong factual and literary-scene-safe direct generation (one GPT-OSS 20B call).
2. **RICH** — same model, source and writing goal, plus strong, general genre/task guidance (one call).
3. **AUDIT_D/AUDIT_R** — an identical source-grounded risk-extraction instruction applied separately to both completed candidates (two calls). It returns a strict JSON risk set with exact candidate and exact original-source quote spans, or explicit uncertainty; a cited quote is not semantic proof. A source-violating claim without a matching original source phrase may be marked only with a closely related reference and must not be claimed supported.
4. **STATE_AS_TEXT_SELECTOR** — GPT-OSS 20B receives **both complete candidates, the same source, and both structured audit packets** and selects A or B; it cannot rewrite the text (one call).
5. **EXECUTABLE_SELECTOR** — deterministic JSON validation + risk-counting + optional abstention uses the **exact same audit packets, source and two candidates**, no extra model calls. For fully validated audit packets prefer fewer model-reported distinct risks; tie selects DIRECT/KEEP; invalid or unknown audit yields ABSTAIN if both uncertain, never fictional repair. This is a fallible, model-dependent selection heuristic, not verified semantic correctness.

Thus **five real provider calls per independent source work** = planned **60** calls, plus the executable selector after the fourth call. A BINARY "which candidate?" model without the audit state is *not* included in R4a; a later compute-matched strong alternative is required before any causal claim beyond this pilot. DIRECT/RICH as one-call real-world baseline are reported separately; the state-using selector has a common 4-call preparatory budget and an additional fifth call for its LLM selection arm. Do **not** compare these arms as equal-cost pipelines. The cost ratio must be displayed.

## Freeze and provenance

- Freeze all 12 source briefs, source fact order, objective, audience, and permitted fiction detail budgets; writer prompt hashes are frozen **before** any live request.
- Preserve actual provider request, response, response SHA, request SHA, model ID, usage, elapsed time, non-stop/failed outcomes and attempt IDs. Separate stages are fail-stop: a missing response does not silently disappear from the denominator or get replaced.
- The base model is `openai/gpt-oss-20b` routed through the existing explicit Groq client at `temperature=0`, `maxTokens=1450`, reasoning effort low. All selector packets are read from actual generated text, not the planned content.
- Write outputs under temporary Actions runner folders, persist **one original evidence ZIP in Drive** after verification and keep provider output text **out of the Git repository**.
- Protected source licenses: science and notices introduce no new operational details; chat does not create new commitments; literature may add incidental harmless texture but not new named characters, acts, causal explanation, or reordered final beats.
- No automatic reviewer can serve as the independent ground truth for itself. The main outcome in R4a is measurable **selection divergence / risk-quote validity / self-reported error**, not improved prose quality.

## Predeclared comparisons and stop criteria

Record paired selection on each work: DIRECT, RICH, STATE_AS_TEXT chosen text, EXECUTABLE chosen text, their exact SHA and 4+1 provider costs. Compute selector agreement, switch counts, KEEP rate, whether controller/LLM select the same complete text, and invalid risk packets. If any audit omits literal source/target spans or an output is truncated, mark invalid/uncertain. Do not convert a model-self-reported absence of risk to an independently verified safe passage.

**No outcome will be called "quality gain" until** blinded native-Korean reader usability/comprehension/first-edit preferences and *separate* original-source factuality auditing are collected across source-work-disjoint briefs. R4a's source tasks must not later be called withheld.

## Technical and scientific negatives anticipated

The extractor may hallucinate source violations, omit actual violations, treat literary texture as factual error, miss actor reversals or misread Markdown. The deterministic selector can choose a more fluent but less faithful candidate and can be overly conservative when source snippets are unavailable. If the executable selector never changes the candidate, it has not demonstrated meaningful control, even if all CI tests pass. If it always changes, that may reflect false-positive audits. Preserve both.
