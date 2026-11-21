# G10-P2 R5a — Realized-prefix belief-state sensitivity, actual Korean prose (pre-execution)

Date 2026-11-21 KST. Status: EXPLORATORY AUTHOR-SYNTHETIC DEVELOPMENT. R5a is an experiment identifier **inside G10-P2**, not a stage promotion. It does not satisfy the prospective independently sourced R5 holdout in the wider research protocol. **No new outputs have been inspected at registration.**

## Why this experiment is necessary
R4a is a 2-candidate posthoc chooser rather than an updated *during-writing* reader state. R4b repairs exposed drafts and cannot identify what happened after a newly realized prefix. First obtain **complete Korean texts**, rather than another unit-state-only test, in a controlled 8-source development cohort. The goal is mechanism sensitivity and software feasibility, not quality superiority.

## Design, frozen prior to live calls
Eight investigator-authored source-work groups, two each chat/science/notice/scene, with separate source-parent IDs. All original facts, writing purposes, target readers, and literary license are identical in all conditions, but the two-step conditions see their shared, actually generated prefix. All eight are **exposed development**; author declarations of parent differences cannot certify natural source disjointness.

For each work: (1) generate one strong **DIRECT_FULL** complete text and one **SHARED_PREFIX** (two target sentences) with the same GPT-OSS 20B model, at temperature 0; (2) run one bounded **PREFIX_EXTRACT** model call that reports which source facts were conveyed in the realized prefix, with quote strings anchored to actual generated surface; (3) generate two **complete texts** by concatenating the same prefix with a new continuation, using the same source, audience, purpose, instructions and candidate budget. The **OBSERVED_STATE** continuation uses the quoted observed prefix-state; the **PLAN_ONLY** negative-control continuation uses a declared first-fact plan, which may be true or false. Both conditions are *plain-text model prompts*; no executable selector is claimed. Rotate continuation call order by work index. Total requested calls = 8 × (1 DIRECT_FULL + 1 PREFIX + 1 EXTRACT + 2 CONTINUATIONS) = **40**, provided there are no provider failures. Keep raw failures rather than imputing completions.

This design does **not** isolate the causal efficacy of executable state vs state-as-text. It only asks whether false planned state and observed surface-grounded state lead to distinguishable complete prose given the same actual prefix, and whether the cost is tolerable relative to a strong direct writer. The extractor is **same-model and fallible**. Exact anchored surface quotes certify string identity only, **not meaning**. Do not interpret synthetic labels as reader beliefs or independent semantic ground truth.

## Registered mechanical outcomes and failure gates
- Ability to produce 8 directly written full texts, 8 initial prefixes, 8 parseable, quote-anchored extractor replies, and 16 completed continuations (24 resulting full texts), with every raw response SHA and provider usage preserved.
- Whether plan-declared first fact is actually certified by a uniquely matching quote in the prefix. If identical statuses are predicted, **no belief-state contrast** and no sensitivity credit. Do not force an artificial disagreement.
- Whether continuation outputs begin with an already included prefix; if so, mark potential duplicated output, not a quality win.
- Per-arm provider token totals. Two-step arms additionally pay full shared-prefix and shared-extractor costs; do not compare continuation tokens alone to DIRECT_FULL.
- Case-level investigator reading of source/actor/condition scope and actual prose naturalness is posthoc DEVELOPMENT REVIEW, not blind preferences or independent semantic gold.
- If extractor has invalid format/quote, mark UNOBSERVED/UNVERIFIED with an explicit abstention, rather than guessing fact membership. Record all 40 actual request attempts, status, failure, hash, and usage.

## Strongest counterclaims
A. Prefix-state is unnecessary because the strong direct writer simply writes better texts at lower cost.
B. Plans and observations align on most sources, leaving the study with little identifying variation.
C. Observed-state continuation simply repeats missing facts, and readers may prefer a different rhetorical move.
D. Extraction uses the very LLM whose writing is being tested, causing self-confirming false labels.
E. Fixed two-sentence prefixes distort natural genres, especially fiction. This is an intentionally narrow sensitivity probe, not a quality head-to-head proof.

## Promotion boundary
This development pilot cannot support general quality claims, new small-model superiority or original theoretical novelty. Only independently adjudicated whole-text reader/task outcomes on untouched source works, and a compute-matched strong-state-as-text vs **genuinely executable** intervention, can change that authority. Keep all negatives.

Read with [G10-P2 research program](../RESEARCH_PROGRAM.md), [R5 full causal prereg](02_CAUSAL_IDENTIFICATION_PREREG_20261121.md), and [origin](00_ORIGIN_TO_CAUSAL_TARGET_20261121.md).
