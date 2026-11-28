# G10-P2 R5d — Coherent Local Rewrite as a Discourse-Dependency Closure (4 preselected seam failures)

**Registered before R5d provider inference, 2026-11-21 KST.** A small, executable *generative* fix of the failure discovered in R5c, not a reader questionnaire or abstract reader-state audit. R5d is a **developer-selected subset of four already-exposed sources**, and therefore exploratory only.

## Actual failure that motivates the change
In [R5c actual whole-text evidence](14_R5C_16_LIVE_REPAIRS_AND_SEAM_FAILURE_20261121.md), 8/8 single-quote patches were mechanically APPLIED, but literary deletions left `그때`, `그 순간`, and `발걸음을 멈추고` with diminished antecedents. In the chemical explanation a shortened final assertion strengthened a claim from 'more accurately identify' to 'accurately identify', and in a library notice the reduced scope yielded the awkward `목요일은 변함이 없습니다`. This makes **minimal character change a scientifically bad proxy for minimal coherent change**.

## Concrete contribution and bounded hypotheses
The unit to rewrite is a **continuity-closed span**, chosen by two external author-declared text anchors that frame a source-witnessed error and its immediate dependency. For each of four predeclared cases (SCENE_PAPER, SCENE_GARDEN, SCI_CLOCK, NOTICE_BOOK), the bounded interval must contain the original targeted phrase and no more than 40% of the original document's characters. All bytes outside the interval remain identical in an actual executable patch. This is **manual discourse-edge supervision**, not automated Korean dependency parsing, a new learned neural model or a genuine human reader-state estimate.

**R5d alternative:** one new GPT-OSS 120B call per case, source facts + genre + the original whole text + the exact entire continuity span + its observed dependency and reason, requesting strict JSON with a replacement only for this region. Reuse prior R5b unchanged B120, prior R5c exact quote patch, and prior R5c free full rewrite from their actual SHA-backed archived responses. **4 NEW calls**, 4 previous originals and 8 previous R5c edit/rewrite calls reused, giving 4 × 4 **16 full prose alternatives** (not 16 new calls). Same model provider, temperature 0 and maxTokens 1450. No new invented source facts or numeric tokens allowed; when strict JSON fails, preserve original, do not fabricate an improvement.

## Register beforehand
- SCENE_PAPER: begin at the sentence introducing a walk through exhibits; end after `나는 발걸음을 멈추고, 그 종이를 바라보았다`. These clauses must be jointly revised so no newly dangling `그때` or motion-stop claim remains after removing unlicensed movement.
- SCENE_GARDEN: begin at the unlicensed flowerpot cleaning action; end at the immediately following `그 순간` atmospheric sentence, so a replacement removes the action **and** does not leave a dangling event-dependent transition.
- SCI_CLOCK: begin at the final planned controlled experiment sentence and end at the following boilerplate claim; preserve the distinction between uncertain present causation and conditional future investigation.
- NOTICE_BOOK: begin at the `이번 안내는 수요일에만 적용되며,` sentence and end at `감사합니다.`; restrict claims about other weekdays, and where natural state that the return-box status is unconfirmed.

The selection is anchored in **R5c's observed failures**, so any positive result is an *adaptive developer result*, not a generalizable random study, source-disjoint holdout or new human gold.

## What would genuinely matter
Examine the four actual final Korean texts for continuity, idiomatic verb semantics, source-authorized scope, overall genre voice and the remaining old errors. The competing choices are KEEP/old one-span PATCH/full REWRITE/SEAM and the real cumulative source+new provider cost. A seam patch mechanically applied is **not** a quality win. If a neighboring sentence remains defective or the text sounds mechanical, say so; do not respond by stacking more rubber-stamp tests. If a new source clause is added outside the local region or a promise invented, stop the claim.

## Design next gate
After the four exposed developmental cases, any tentative advantage must face *new, genuinely unseen* source works or human revision traces; an endless cycle on the same eight examples would overfit. Candidate learned implementation: train a tiny region-selection or edit-dependency estimator from real Korean writer revisions, not hand-built arbitrary global rules. Compare to strong 120B direct and one-call rewrite on whole-text quality at marginal cost.

Official G10-P2 OPEN; no human-performance claim and **no experimental inference of algorithm novelty**.
