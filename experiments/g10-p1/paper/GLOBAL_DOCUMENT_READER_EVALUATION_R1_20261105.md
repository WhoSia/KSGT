# G10-P1 Global Document Evaluation R1 — Reader-First, Source-Work-Clustered (2026-11-05)

## Primary outcome
The unit of scientific interest is a **complete Korean document read for its communicative purpose**, not isolated lexical fluency or format compliance. Blind Korean readers compare KSGT global-planned text with an equally sourced strong single-call model output. The primary contrast is **within a fixed model and source work**.

### Reader protocol (naturalness/usefulness without seeing method)
- Prompt to reader: "다음 두 글은 같은 목적과 자료로 작성한 문서입니다. 읽는 사람에게 더 잘 전달되는 글을 선택하거나 동률을 표시하세요."
- Show audience, genre, writing purpose and full A/B document texts, not algorithm names, model names, prompt, or source-ID annotations.
- Primary decision: A / B / TIE (with optional brief reason). No forced preference when difference is negligible.
- Independent secondary ratings: global flow across paragraphs (1–5), information priority (1–5), genre appropriateness (1–5), and overall usefulness for the intended audience (1–5).
- Randomize A/B assignment and booklet order; do not show the same original source work repeatedly to the same rater when this would cue repeated outputs.
- Avoid asking human readers to provide self-reported model identification. The method identities remain in a private key.

### Separate source-fidelity evaluation
Give expert reviewers the **complete original facts and uncertainties** plus one output at a time, randomized without arm labels. Differentiate:
1. Contradiction with explicit source fact.
2. Unsupported added commitment or action/eligibility rule.
3. Important omission affecting reader decision.
4. Unlicensed causal or epistemic strengthening.
5. Acceptable stylistic elaboration.
Allow "uncertain" and evidence citations (source fact ID, excerpt). Do not conflate human subjective preference with factual correctness.

### Document-scale effects
The actual unit is source work, with repeated models, arms, prompts, and random seeds nested within it. Avoid pretending 9 pairs on 3 works give nine independently sampled topics. Use document-work clustering and an appropriate hierarchical logistic/ordinal model only **after** collecting real votes, with descriptives first. Report reviewer disagreement and pairwise ties. The key interaction is model × architecture conditional on genre and source complexity.

### Pre-registered practical gates for the *next frozen new source-work-disjoint evaluation*
- Predefine meaningful minimum preference lift and acceptable increase in source error rate before a confirmatory run. Do not choose thresholds based on current 3 exposed works.
- Include source briefs **not authored or used during v0.1/v0.2 prompt tuning**, and record their authorship, rights and consent. Ideally sampled from real Korean writing situations.
- Single-call strong writing benchmark; generic document outline; global plan; controlled plan ablation; stronger multiple-call drafting/planning rival if claiming state-of-the-art.
- Compare exact source facts and output length distribution; input-token difference and cost, plus computation/annotation labour. One prompt arm having an extra 36% input tokens is not matched compute.
- Fail the gain claim when a strong one-shot model matches reader preference at lower cost, when source commitments degrade, or when model-specific effects have inconsistent signs.

### Novelty comparison must consider
IS-CoT (ACL 2026), LOOM (ESWA 2026), Align to Structure (AAAI 2026), Korean narrative structure/style pipeline (JICS 2026), and LongGenBench (ICLR 2025). A mere global outline or fixed three-paragraph format is insufficient novelty; the intended distinctiveness would have to be a **compact source-to-reader plan** that empirically improves holistic Korean document reading outcomes without extra model calls or manual annotation.

### Current status
Development code and 36 real global outputs exist. Independent Korean readers: 0. Confirmatory work: 0. This is protocol R1, **not** completed evaluation, and no fabricated rating or inferential statistic is permitted.
