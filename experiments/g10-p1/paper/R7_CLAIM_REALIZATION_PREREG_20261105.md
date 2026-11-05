# KSGT G10-P1 R7 — Source-Accountable Claim Planning and Korean Realization (2026-11-05)

**Preregistered before provider run.** R7 remains a development experiment on the same six investigator-authored and disclosed R6 source works, not a confirmatory independent holdout or evidence of writing superiority. G10-P1 OPEN.

## Question and intervention

Can dividing proposed Korean prose content into **directly witnessed source commitments**, **explicitly qualified interpretation**, and **world-fact-free rhetorical bridges**, then realizing the plan as full Korean prose, avoid unsupported event/attribute additions without flattening naturalness or increasing cost beyond strong two-pass writing?

R6 established 18 real Korean development outputs, but its KSGT GENRE LICENSE still invented a cup's emptiness and a new character movement despite a NO_NEW_EVENTS author constraint. KSGT used 6,363 provider tokens versus strong direct 4,967 across six exposed authored works, with no independent reader measurements. R7 must test an actual *generation mechanism*, not another longer negative instruction.

## Three frozen policies (same source JSON and model)

1. **STRONG_DIRECT**: one complete Korean document completion, with the same full source facts and license.
2. **GENERIC_DRAFT_REVISE**: model produces a complete draft, receives original source again and revises to final Korean prose; two genuine calls. This is the strongest ordinary multistep rival.
3. **KSGT_CLAIM_PLAN**: first call produces 4–12 units of typed JSON source claims, explicitly qualified interpretations, or non-assertive rhetorical bridges; strict reference/shape checking before a second call realizes the units in natural Korean. An invalid plan fails the policy cell rather than silently retrying or inventing a better plan.

Types: SOURCE_CLAIM must reference at least one actual F ID; QUALIFIED_INTERPRETATION must reference actual F ID(s) and mark qualified=true; RHETORICAL_BRIDGE must have zero fact IDs and addsWorldFact=false. This validates **witnessed labels and type-shape only**, not entailment of the claimed content, nor the final text. If a fabricated claim is typed SOURCE_CLAIM with an actual ID, the validator can accept it. That is a mandatory adversarial semantic negative case for future testing.

## Experimental conditions, controls and estimands

Six existing R6-exposed, investigator-authored sources; 6 × 3 = 18 assigned final-output policy cells. At most **30 provider calls** (6 direct ×1, 6 generic ×2, 6 typed ×2). Each arm gets the *identical original source packet*; phase prompts and total token budgets differ. Groq openai/gpt-oss-20b, temperature 0, max 900 tokens per stage, low reasoning effort. Fixed policy order per source in this minimal R7 (potential order/time confound), no outcome-dependent retries. CI first verifies all Node tests; dry-run precedes provider use. All failed cells, intermediate model texts, actual usage and latency are retained. The raw artifact is not committed by Actions.

Primary scientific quantities require independent human ground truth not available at launch: source-entailed claim fidelity, independent Korean reader task comprehension, genre-specific fluency, literary legitimate expressiveness. Secondary measured quantities: per-stage generation success, invalid typed-plan rate, three-paragraph compliance, prompt/completion token cost and runtime. The six works are not independent human-authored outside-source texts, and 18 policy outputs are not 18 independent source works.

Strong nulls: (H0a) generic draft/revise beats typed KSGT at matched *two calls* and lower token cost; (H0b) typed plan only tags hallucinations without removing them; (H0c) missing plan claims cause omission, unnatural prose or unusable JSON; (H0d) naturalness worsens in narrative genres. Single-call strong baseline is necessary but is not a compute-matched rival.

## Predeclared interpretation and stopping rules

- A schema pass is never a semantic pass; no automatic independent Korean quality score is produced.
- Model success / three-paragraph format / source fidelity / reader preference are distinct.
- A typed JSON plan could fail to parse; record the failure in numerator and all original assigned cells in denominator, no retries.
- Even if every typed plan parses, check actual source-drift and completeness. If generic two-pass writing is comparably faithful or more natural at lower cost, stop this typed mechanism and return to the KSGT global writing question.
- Preserve provider artifacts in Drive with byte-level SHA-256 and GitHub Actions links; Notion holds decisions. Keep Actions read-only, forbid github-actions[bot] authored commits.

**Status at freeze:** R7 actual new provider calls ZERO, human ratings ZERO, no observed outcome.