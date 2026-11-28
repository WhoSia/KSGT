# G10-P2 R5b — Korean Lexical Orchestra and Genre-Realizer Rival Experiment

**Pre-execution registration: 2026-11-21 KST.** R5b is an **exposed development experiment** inside G10-P2, not an official new stage. The central target is **actual human-quality Korean writing**, not producing another reader questionnaire, HTML, evaluator or state diagram. Hold no human sample as a precondition for executing writer calls. The project owner may later serve as an expert first reader; that is a valuable *identified expert*, not a population-wide preference result.

## Origin and substantive rationale
KSGT 1 (2026-07-15) explicitly required lexical diversity, literary and scholarly registers, artificial contrast overuse correction, elegant sentence rhythm and quality separate from genre. KSGT 4 distinguishes KSGT-ANALYZE and -GEN and later moves away from recruiting participants as the whole research. KSGT 17 (2026-10-08) explicitly preferred a **compact generator attached to a capable existing model** rather than retraining gigabytes of language modeling machinery. KSGT 25 (2026-11-17) restates the practical purpose of escaping artificial AI writing. This chronology argues against more elaborate reader-model scaffolding as our next deliverable.

R5a provided 8 actual source-aligned 20B direct texts and 16 two-step complete texts (40 calls total). Source fidelity failures coexist with prose shortcomings: lexical repetition (그저/마치/고요), closing scene explanations, guessed notice hours, unnecessary scientific possibilities and bureaucratic chat. R5b intervenes **on surface realization itself**.

## Pre-declared source unit and contamination
All eight R5a source works are **reused author-exposed development tasks**, not an independent heldout or a newly independent cohort. Primary comparison is eight paired *whole texts* per arm, not sentence count. Reuse R5a original direct writer responses **by exact output SHA** from [Drive original](https://drive.google.com/file/d/1SJsUyVnGlviJH69PB-o85XLeCGAIBW5e/view), rather than pretend eight old outputs are new calls. Preserve the prior original 20B input prompt byte-for-byte in new direct-120B cells; no baseline-information asymmetry.

## Two factors; four main text arms
- **B20 direct legacy:** original 8 one-call GPT-OSS 20B R5a direct outputs (already executed, no new calls).
- **K20 craft:** same 20B, same task/facts, plus concise, genre-conditional Korean surface-realization policy (not model fine-tuning).
- **B120 strong direct:** same DIRECT prompt exactly, upgraded Groq GPT-OSS 120B (new calls).
- **K120 strong craft:** same 120B, same original facts, plus the **identical** craft policy supplied to 20B (new calls).

Pre-registered NEW live provider requests: 8 K20 + 8 B120 + 8 K120 = **24**. 8 old B20 calls reused. Temperature 0, max_tokens 1450, Groq reasoning_effort low and include_reasoning false for OSS, zero tools. Rotate arm sequence per work; exact provider response/usage/latency model identity and SHA sealed. No silent retries, append-only raw attempts and failures.

## Genre-realizer policy (frozen before live output)
Every condition preserves genre, purpose, reader, all five source propositions, source uncertainty and genre-specific license. Strong model has enough training to write fluent Korean; an *external style policy* may help select among naturally licensed expressions but cannot add facts.

**General:** Choose the most useful rhetorical focus and convey all task-critical facts with economical, natural syntax. Prefer native Korean collocations/verb choices and varied sentence length from discourse need, not randomly swapped fancy synonyms. Avoid invented strawman contrasts ("단순히 A가 아니라 B") when no true competing hypothesis is in the source. Resist robotic rephrasing, uniform paragraph lengths, meta-explanations, generic florid epilogues. Never invent notices, measurements, promises or story actions.

**chat:** Have the actual team member's practical question in view. Combine facts as a person would; omit ceremonial conclusion, deliver a specific known next action without generating a new one.
**science:** Distinguish measurement, confounding, permissible interpretation and already planned follow-up. Do not manufacture plausible new measurements, possible factors, or an unjustified causal preference; use appropriate mathematical/technical terminology in natural Korean.
**notice:** Put actual recipient decisions and timeline first, partition time/cases, never guess bell times, venue, email or notification protocol; avoid unnecessary greetings or performative bureaucratic titles.
**scene:** Let actual action and image carry the scene. Respect actor, object, action order, endpoint. Sensory texture is permitted, but no new events or fake meanings. Do not rely on generic atmospheric cliches, repetitive "그저/마치", or explaining the mood at the close. Subtle rhythm and metaphor are allowed when motivated.

This is explicitly a **prompt-policy baseline** and a diagnostic probe, not a new neural architecture or proprietary mathematical theory. It must compete with simply running a more capable base model.

## What is actually measured and what is not
**Mechanical observables:** full text produced, text lengths, provider model IDs, exact prompt/source identity, completion status, token ratios, text equality and lexical/cliche counts (counts are *descriptive*, not a quality criterion).

**Investigator's source-visible reading:** annotate concrete invented facts, causal changes, permitted scene events and awkward Korean prose from complete outputs with quotes, making no claim that one rater represents all Korean readers. **Expert owner review** may be requested only after sample texts and source facts are provided in ordinary, usable Korean: no need for complex HTML or a full human-study apparatus.

**No automatic quality promotion:** claims of strong-base-vs-policy advantage are provisional even if one assistant evaluator prefers the text. No new independent human measurements unless collected; no new independent source-semantic gold. A 120B model can be better only because it has more parameters and compute; disentangle model capacity (B20 vs B120), policy (B20 vs K20; B120 vs K120), and interactions. Report actual costs, not just number of text generations. Work-cluster sample n=8 is far from a power-calibrated general result.

## Rival-killing thresholds
1. If B120 is clearly better in actual Korean but K120 adds cost and stiffness, prefer the stronger direct writer to a reader-state wrapper.
2. If K20 works but K120 not, ask whether the surface policy merely compensates for weak base training (capability interaction), not universally improves Korean.
3. If craft creates new inaccuracies, stop deployment despite improved surface elegance.
4. If all variants retain generic literary cliches, no prompt trick is evidence of a new realization principle; investigate supervised author revision data or alternative native Korean preference training.
5. If model identity or prior original baseline cannot be verified, retain raw but reject the affected comparison, not fabricate it.

## References
- [G10-P2 program](../RESEARCH_PROGRAM.md)
- [R5a 40-call results and flaws](08_R5A_40_CALL_REAL_PROSE_RESULTS_20261121.md)
- [R5a original ZIP](https://drive.google.com/file/d/1SJsUyVnGlviJH69PB-o85XLeCGAIBW5e/view)
- [KSGT origin/drift audit](00_ORIGIN_TO_CAUSAL_TARGET_20261121.md)
