# KSGT G10-P1 R8 — Shared-Draft Provenance Revision Preregistration (2026-11-05)

**Research status:** G10-P1 OPEN. This is exposed developer-synthetic material, not external source-disjoint Korean writing gold. Preregistered before live output observations.

## Motivation

R7 source-ID typed claims can launder unsupported propositions; plan-to-final realization can introduce new recurrence facts; model output 30 API calls across six works, higher cost than generic two-pass with no human quality advantage. Rather than another abstract semantic judge or longer plan, R8 tests a **writing intervention on the identical starting Korean draft**: minimal provenance-oriented revision versus general draft polishing.

## Experiment and causal contrast

All six R6 investigator-authored previously exposed source works are reused, no new empirical sources and no hidden holdout. For each source:
1. Generate **one** shared source-faithful BASE_DRAFT with GPT-OSS 20B.
2. Give the **exact same original source JSON and byte-identical base draft** to GENERIC_REVISION.
3. Give the exact same source and draft to SOURCE_ACCOUNTABLE_REVISION; instruct it to make only minimal justified edits where specific claims exceed source, maintain the asserted certainty of original facts, avoid invented schedules/actions/object attributes, and preserve Korean flow.

Both revisions use **one provider call** after the same draft: equal call count, unmatched prompt tokens. Strong original BASE_DRAFT is also retained as a one-call reference. Six sources × (base + 2 revisions) = 18 intended output cells, maximum 18 actual calls. No redrafting, outcome-conditioned retries or model switching. Provider: Groq openai/gpt-oss-20b, temperature 0, max completion tokens 900 each call.

## Primary outcomes that remain unmeasured until independent adjudication

1. Source-grounded proposition correctness: do the revisions remove invented claims and preserve asserted facts without unjustified weakening/strongening?
2. Korean naturalness and purpose / genre appropriateness: no degenerate repetition or literal source-sentence laundry.
3. Independent reader task comprehension and blinded preference.
4. Source-work-level paired conditional effect, costs (prompt/completion provider tokens, output length, time), including failure denominator.

This pilot can count real provider calls and exact prompt tokens but not infer human-quality lift without independently evaluated readers. The six work units were seen repeatedly in R5–R7 and cannot support a confirmatory significance claim.

## Scientific nulls and stop gates

- H0a: general revision is as source-faithful, more natural, and cheaper.
- H0b: matched draft removes much of the apparent mechanism advantage from previous different-first-stage designs.
- H0c: provenance-focused revision damages rhythm, word choice, or the explicit certainty of original Korean source facts.
- H0d: changing which assertions the writer is told to inspect is still just a prompt salience effect, not a distinct formal invention.

A revision can output a hallucinated fact. No regex or source ID presence can be promoted to semantic truth. A raw transcript / JSON must preserve per-stage output, usage and any provider failures. CI must be read-only and bot commits forbidden. Source-work clustering mandatory.

**Failure condition:** Do not advance this strategy if it fails to outperform generic reviser on independent Korean meaning and naturalness when computing all model, annotation and verification expenses.