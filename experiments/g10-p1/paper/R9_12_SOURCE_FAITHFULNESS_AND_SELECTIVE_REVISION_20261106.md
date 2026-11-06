# KSGT G10-P1 R9.12 — Source-Fidelity Frontier, Partial Preference Identification and Selective Revision

**Research stage (2026-11-06): G10-P1 OPEN.** This unit examines actual Groq R8 outputs from a sealed original ZIP and develops a *conditional* minimal-edit gate. **No new Groq calls, no external Korean reader ratings, no independent semantic gold, no new essay-boundary certification.**

## 1. What R8 actually tells us

Original actual Groq R8 archive SHA-256: `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9`. Six *exposed development* source works were edited by a strong generic and a source-accountable reviser, with shared drafts. Two work pairs have **identical final strings**. For the remaining four, reader preference was not collected.

Assign each source-work comparison a pairwise preference difference `Y_w ∈ {-1,0,+1}` (KSGT loss/tie/win). If *identical final strings are treated as structural ties* and the other four comparisons remain unknown, the sample mean `mean(Y_w)` is **partially identified only**:

`-4/6 ≤ mean(Y_w) ≤ +4/6`.

Per original genre: notice one identical + one unknown ⇒ interval `[-1/2,+1/2]`; science one identical + one unknown ⇒ `[-1/2,+1/2]`; scene zero identical + two unknown ⇒ `[-1,+1]`. These are *logical feasibility bounds*, not statistical confidence intervals. The comparison is only among the R8 reviser outputs; no direct-generation outcomes are in this estimand. No KSGT prose superiority can be inferred from them.

## 2. Source-conditional errors shared across policies

Inspecting the **actual** R8 final text against the investigator-authored source briefs yields concrete post hoc exploratory regression targets. These are not independent human gold labels. The source brief for `PUBLIC_NOTICE_B` states that the general exhibition opens **Saturday 10 AM**, with no weekly recurrence claim and no guarantee of a fixed schedule. **Both** generic and KSGT final versions add `매주 토요일` and mention fixed exhibition hours/location. For `NOTICE_CONDITION_A`, **both** final outputs contain the reader-facing audit meta phrase `정확히 보존되어 있습니다`. For `SCENE_CORRIDOR_B`, both outputs include an extra action in which Yuna takes the cup toward the end of the corridor; the source author only said she picked up a paper cup in the corridor. All four narrow trigger rules fire in both arms, **4/4**. This is a rule-based, retrospectively specified *development* diagnostic, not a general source-fidelity error rate.

One failure mode is therefore **policy convergence on the same unsupported claim**, rather than source-accountable revision automatically fixing the generic draft. Another is **planning/evaluation language becoming visible to a reader**, and a third is **unlicensed actions even in compressed scene prose**. Source fidelity and Korean stylistic naturalness must be rated separately; a regex flag neither proves semantic entailment nor reliable reader preference.

## 3. Engineering research contribution: a genuinely selective edit contract

`r912_selective_revision.py` accepts candidate evidence records but declines automatic editing. Its action choices are `KEEP`, `REVIEW`, and `PROPOSE_REPAIR`. With reviewer-attested, separately calibrated interval inputs, repair can be *proposed* only if

`p_error_lower × gain_lower > repair_cost_upper + style_loss_upper + threshold`.

An unreviewed issue or an uncalibrated interval returns `REVIEW` (not `PROPOSE_REPAIR`), and even `PROPOSE_REPAIR` has `authorizedEdit=false`. Independently **human-approved** patches are mechanically applied only with exact original SHA-256, matching codepoint span and before-string, authorized source fact references, and an explicit span budget. This code checks provenance/unchanged text **only**; it does not verify Korean meaning or the actual identity of an evaluator. Numeric intervals in synthetic tests are demonstrative and must *not* be used as empirically calibrated probabilities.

The real project priority is not accumulating validators. The evidence-contract module is only a preflight component for comparing **direct generation / strong rich prompting / ordinary same-draft revision / always-revise KSGT / selective KSGT** on genuinely new source works. A balanced same-information strong baseline and independent Korean readers remain required.

## 4. Two distinct scientific hypotheses to test

1. **Source-control hypothesis:** A selective, evidence-grounded editor improves source-fidelity errors per source work, without silently rewriting unsupported source claims into new invented facts.
2. **Prose-frontier hypothesis:** A selective editor better preserves Korean paragraph continuity, topical progression, ellipsis, sentence endings and natural genre register than an always-revise constrained editor *at comparable fidelity*. It must outperform a strong generic editor on an independently rated/cost-accounted frontier, not only on simple length reduction.

A third explanation, **common-draft self-audit contamination**, remains plausible from earlier Groq studies; the draft treatment D0/D1 in R9.9 helps distinguish it. The selective system must count the evidence-detection step as a provider call if it uses a model. Any selective arm that opts not to revise may legitimately have **zero repair-generation calls**, but still incurs the detection cost. Its policy cannot use held-out human gold as an oracle at deployment.

### Statistical analysis contract

Freeze each source work and assign an ID *before* generation. Split by underlying source/author or shared claim families, never sentence. Record every arm, including failed generations and no-op actions. For graded reader quality, compute per-source-work contrasts and cluster-aware intervals. For source truth, separate supported fact coverage, unsupported assertions, incorrect polarity, invented temporal recurrence, and uncertainty shifts. For real efficiency, report prompt, visible output, reasoning/completion tokens, total tokens, time and **cost per independently accepted document**. Independent readers must not see source labels or know the algorithm arm. R8 and retrospective regex canaries cannot serve as held-out evidence.

## 5. Verification and custody

Local tests: `25/25 PASS`, including 3 R8 original-source tests (private original present). The public regression test suite explicitly skips private original-byte tests when the ZIP is absent and may not claim actual original-data reexecution from CI alone.

Artifacts in source-only release: 3 Python modules, 3 Python test modules, 2 aggregate JSON files, this report and SHA-256 manifest. The raw R8 ZIP and source-brief originals stay in their existing legally controlled Drive location. Raw learner KoLLA text is not exported or embedded in aggregate results. A deterministic original-byte ZIP and its SHA256 are created for Google Drive; GitHub carries source and reproducible synthetic tests.

**Decision:** keep KSGT G10-P1 OPEN. Next R9.13 should move from infrastructure to actual prospectively frozen new source-work generation and independent native Korean reader/semantic review once legally permitted Groq execution and assessors are available. No fabricated human evaluations or latent essay labels.