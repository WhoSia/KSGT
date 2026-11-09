# KSGT G10-P1 R9.14 — Real Korean Prose Reader Pilot (2026-11-09)

**Decision:** We stopped producing only plans and actually called Groq GPT-OSS-20B on 3 exposed, investigator-authored Korean briefs × 5 matched-source generation arms. **15/15 live API responses completed.** User blind rating **pending**. G10-P1 OPEN.

## Provider evidence and immutable custody

- GitHub Actions: https://github.com/WhoSia/KSGT/actions/runs/42554195938 — completed/success.
- Real Groq model: `openai/gpt-oss-20b`, 0 temperature, 1050 maximum completion tokens; 15/15 provider calls `finish_reason=stop`, all usage receipts present.
- Raw GitHub Actions artifact 13646652384; ZIP SHA-256 `1f7101780a804743d341fe373b63dceb4664eff9176d423de3b48dcc49d2f940`. A copy is in Drive, separately from the policy-masked reader packet.
- Original JSON includes actual Korean text, arm, source and prompt SHA-256, completion SHA-256 and prompt/completion/reasoning token counts. Raw texts are **not** committed to GitHub.
- Safe aggregate: `experiments/g10-p1/fixtures/r914_actual_groq15_safe_aggregate_20261109.json`.
- Three tasks are exposed synthetic/investigator-authored science, scene, notice briefs from `fixtures/challenge_cohort_v01.json`. Not a new heldout cohort.

## Actually executed arms

The R9.13 prompt factory `g10_axis_factorial_v01.cjs` provides precisely the same authoritative fact, audience, purpose, uncertainty, and author relations to all arms.

| Arm | Prompt tokens | Completion tokens | Total tokens | Finished texts |
|---|---:|---:|---:|---:|
| STRONG_DIRECT | 2036 | 588 | 2624 | 3 |
| RICH_BASELINE | 2150 | 578 | 2728 | 3 |
| ORDER_ONLY | 2444 | 643 | 3087 | 3 |
| KOREAN_ONLY | 2753 | 518 | 3271 | 3 |
| ORDER_PLUS_KOREAN | 3047 | 565 | 3612 | 3 |

This token ledger is an actual observation. **Additional instructions have a nontrivial cost**. No objective fluency/semantic score is available.

## Exploratory blind reading for the human researcher

A private Drive reader packet contains three A/B pairs, one per genre, comparing strong rich baseline and combined order+Korean-realization prompt. Pair orders are SHA-seeded from task IDs, mapping stored separately and **not displayed before the user submits judgments**. Each pair includes a source-fact recap and unmodified original Korean final prose. User chooses A/B/tie for naturalness, coherence and, separately, flags fidelity risks. Structural pairing is exact within each source and base model but the prompt lengths differ, making this an informal direct experience rather than causal evidence for a paper.

Raw Drive location: https://drive.google.com/file/d/1GW383TlYKIgPhtGct4IJqOKW-vkTtKQ8/view
Blind reader packet: https://drive.google.com/file/d/1lyvx0MiBm1soFtMt2al-Xyu32M-cG4A8/view

## Immediately visible qualitative caveats

- In the **science brief**, one direct output added an invented experimental intent (not present in the source). An extra uncertainty sentence in a different condition could also over-generalize. Neither can be called a fully validated hallucination count without source-level annotation.
- In the **scene**, source actions themselves have an apparent ambiguity about refusing to receive an umbrella and then a later “received back” action. A text whose wording seems awkward may be faithfully exposing an unclear source; do not attribute every such problem to the model.
- In the **notice**, some versions omit uncertainties about laptop use or handouts, whereas a reader still may prefer the shorter message. This is precisely why source fidelity and readable prose must be judged separately.

## Next gates

1. Let the user choose A/B/tie blind across the three genres **before revealing the condition key**.
2. Discuss concrete passages, lost protected facts and writing cadence, not automatic numerical superiority.
3. Run a source-work-disjoint prospectively frozen cohort and independent Korean reader study before any confirmatory inference.
4. If there is no perceptible quality benefit, remove or redesign expensive planning layers rather than converting the project into another source-provenance-only exercise.

**No invented human ratings. No G10-P2 promotion. G10-P1 OPEN.**
