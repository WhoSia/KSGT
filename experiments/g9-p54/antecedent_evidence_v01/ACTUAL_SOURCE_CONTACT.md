# G9-P54 — Bounded Preceding-Sentence Evidence Experiment

**Question:** When can an observable group mention in preceding Korean sentences license a `그중` antecedent candidate, and where must interpretation/editing abstain?

## Actual pinned private source contact (not NIKL gold)
- Private NIKL ZA 2025 source, SHA-256 `c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d`, 25 literal `그중` contexts. Source raw and row indices remain outside the public repository.
- A *two-sentence* lookback detects broad group-noun/number cues in **17/25**. A *five-sentence* diagnostic detects cues in **21/25**. Some expressions are weak unrelated noun matches, not verified references; the larger window can increase false candidates.
- Numeric cues are seen in **7/25** with lookback two, **9/25** with lookback five. **0/25** satisfy this implementation's narrower fully integer-and-counter-compatible single preceding-group rule. This is intentionally conservative and does not mean these natural expressions lack antecedents (percentages, Korean number words, and nested units are outside the rule).
- **11/25** have a following text row and appear potentially unfinished under a coarse punctuation/ending heuristic. This is a *review flag* for spoken transcripts, not a validated incomplete-utterance annotation.
- Source-only outcomes on 25: **9** group-cue REVIEW, **5** without visible group cue ABSTAIN, **11** possible right-context ABSTAIN. The 11 spoken flags may be overinclusive. **No automatic rewrites**, **zero independent antecedent gold**, **zero human KEEP-vs-EDIT preferences**.

## Controlled Korean positive and counterexample tests
- `총 5팀이 참가했다. 그중 2팀이...`: unique integer counter-compatibility = **candidate only**, not proof of coreference.
- `1팀이 참가했다. 그중 2팀이...`: cardinality mismatch -> **reject** that simple candidate.
- `5팀과 4팀이 참가했다. 그중 2팀이...`: competing groups -> **abstain**.
- `그중 92%`: must not masquerade as `건` or `팀` integer-count rule; **separate partitive-ratio construction**.
- Unique exact preceding quotation + writer `CLARIFY`: **one review candidate**, never a preferred correction. Without author clarification, or if `KEEP` is selected, no intervention.
- Fragment potentially completed in following spoken sentence: preserve **right-context review**.

## What this proves and what it does not
**BOUNDED ENGINEERING PASS:** inspectable extraction/routing, source SHA, explicit counterexample refutations, fail-closed writer intent, original-data custody. It does not prove an accurate Korean coreference resolver. Observed antecedent accuracy is unmeasured because the 25 NIKL contexts have no independently provided `그중` group antecedent gold. Nor does it prove that a candidate should be inserted into a real writer's prose.

**Stopping rule:** P54 may close as a bounded partial research pass with `HOLD` on independent antecedent truth and human writing preference. Do not expand this P-stage into a many-week model-training project; the next P-stage should identify a single fresh discriminating question.

The published Python source runs without package installation or friend-server access; GitHub Actions tests only synthetic cases and public metadata, and does not read NIKL raw.
