# KSGT G10-P1 — R6 Prespecified Source-License + Genre-Realization Development Trial (2026-11-05)

**Status at preregistration:** G10-P1 OPEN; R5 observed 9/9 real outputs and recurrent unsupported-source additions. R6 not yet executed at registration. This R6 is *authored exposed development only* and is not human-blind confirmatory research.

## Motivation inherited from R5
- STRONG_DIRECT on NOTICE_CONDITION_A added "매주 금요일", absent from its source. GRAPH_ORDER placed application deadline first but also introduced a future notification pathway.
- Science outputs varied in metadiscourse/format and sometimes explained the *method* of writing rather than the actual science.
- All 3 narrative policies included invented character motions or claims. The genre license was never explicitly represented in R5, so fidelity and creative freedom were conflated.
- GRAPH_ORDER used 2,349 aggregate tokens vs STRONG_DIRECT 2,184 (+7.55%) on three exposed works. This is not matched-budget evidence of inferior quality.

## Hypothesis and strongest rivals
H1: Explicit, author-witnessed **fact protection / uncertainty / creative-license** combined with genre-conditioned document function makes Korean paragraphs more source-faithful and purpose-adequate than an already-strong direct model.
H0a: A generic, equally informed factual-checklist prompt suffices or outperforms the genre-policy compiler.
H0b: More detailed prompt instructions increase compute and reduce naturalness even if literal source leakage declines.
H0c: Genre-adaptive constraints prevent legitimate literary inference and produce lifeless prose.
H0d: Explicit source contracts improve only R5-exposed examples; new development prompts show no transfer.

## Frozen cohort and interventions
- Six **author-created** source works: three already exposed R5 cases (NOTICE_CONDITION_A, SCIENCE_LIMIT_A, SCENE_UNORDERED_A) and three NEW, still investigator-authored transfer-development tasks (PUBLIC_NOTICE_B, SCIENCE_CALIB_B, SCENE_CORRIDOR_B).
- All 6 have exactly six source sentences, author-declared edges where applicable, plus author-declared protected kinds (EXACT_VALUE, NEGATION, UNKNOWN, NONCAUSAL or NO_NEW_EVENT) and creativeLicense.
- 3 policies: STRONG_DIRECT (strong shared grounding instruction), GENERIC_CONTRACT (adds general checking), KSGT_GENRE_LICENSE (adds genre-paragraph role and references *the same protected annotations visible in source JSON*).
- Identical JSON source per work/arm, no external information advantage. Arm instructions/tokens differ: **not compute-matched**. Fixed GPT-OSS 20B Groq, temperature 0, max_tokens 900, reasoning_effort low, at most 18 calls. Per-work deterministic hash rotation counterbalances arm order. No outcome-conditioned retries or prompt tuning inside this run.
- All three works in each group are *NOT independent real-world Korean human-writing samples*. Three new authored examples do not constitute untouched externally sourced holdout or independent gold.

## Predeclared outcome dimensions
1. **Primary, but not adjudicable by this run alone:** Independent source-anchored claim fidelity on all outputs (unsupported recurrence/operational steps, negation or uncertainty strengthening, numeric drift, fabricated narrative events, causal certainty), with allowable literary detail explicitly separated.
2. **Second, not adjudicable by this run alone:** Independent Korean reader task comprehension, naturalness, genre purpose, and selection without arm labels. Distinct source-work cluster is statistical unit.
3. **Immediately observed metadata:** assigned/generation/failure denominator; actual provider input/completion tokens, elapsed latency when available, paragraphs and output characters.
4. **Researcher-only illustrative flags:** for R5 already seen “매주” recurrence and other obvious deviations; exploratory review not numerical human gold and not blind. Do not turn regex heuristics into semantic accuracy.
5. **Costs:** compare total tokens and incremental author annotation labor. Literal matched length is not achieved; do not claim a causal cost-effectiveness improvement.
6. **Negative controls:** the two scene sources have zero prerequisite edges, where changing word order is not relevant; the new genre contract may still change sentences by instruction, so they are not null-intervention arms in R6.

## Scientific stopping conditions
- Stop graph-order complexity until genuine independent quality advantage over strong direct and generic source-contract prompts.
- Stop expanding source-license complexity if it merely repeats instructions already present in source packet or if sentence fluency/coverage collapses.
- Do not promote success on these 6 synthetic sources to a Korean-writing result without genuine external source-work disjointness and reader/semantic annotation.
- Never merge format PASS, provider success, literal preservation, source fidelity, Korean quality and reader preference into a single score.

## Operations/provenance
Read-only Actions, `contents:read`, 18 max calls from explicit launcher, no bot-created commits. All original model output/usage JSON saved as private or nonpublic-short-retention artifact then durable Drive raw archive; Never expose API keys. Record SHA256, run ID, job ID, exact model settings, input manifest SHA and failures. Notion stores interpretation; GitHub code/CI; Drive raw bytes. G10-P1 OPEN.

**Gate:** Node suite must PASS before any API call; any provider failure remains in the denominator, and no synthetic result may be counted as human rating.