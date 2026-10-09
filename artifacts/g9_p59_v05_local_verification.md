# G9-P59 v0.5 — Source-Family / Reader-State / Model Interface Receipt

Date: 2026-10-09. This is a **synthetic development receipt**, not a terminal or human preference study.

## Implemented
- [dataset_v05.cjs](../experiments/g9-p59/dataset_v05.cjs): 4 constructed scenes (school fair, library workshop, garden project, village meeting), 2 target groups x 2 orderings x 2 declared reader scopes each, 32 rows.
- [leakage_audit_v05.py](../experiments/g9-p59/leakage_audit_v05.py): cross-language SHA-256 verification and SQLite family/scene/normalized source-fact split audit; negative controls include source alias relabeling.
- [model_compare_v05.cjs](../experiments/g9-p59/model_compare_v05.cjs): identical row IDs and dataset digest, strict full-coverage and unique-ID constraints, separate action distribution and typed/held/abstain outputs. `--inputs` exports packets; `--compare-file <JSON>` evaluates submitted prediction files. The three included policies are **test fixtures, not trained LMs**.
- [Research protocol](../experiments/g9-p59/RESEARCH_PROTOCOL.md), [README](../README.md), [read-only Actions](../.github/workflows/ksgt-g9-p59-v03.yml).

## Local implementation tests on 2026-10-09
Node.js 22.16.0 and Python 3.13.5, no external dependencies installed.

- `node dataset_v05.cjs`: **PASS**, 32 rows, 4 source-scene families, development 16 / validation 8 / synthetic holdout 8.
- `node model_compare_v05.cjs`: **PASS**, three intentionally trivial policy fixtures on the same 32 packet identities. Always-KEEP => 16 narrow typed passes + 16 unresolved reader-state HOLD; always-EXPLICIT => 32 narrow typed passes; always-ABSTAIN => 32 abstentions. None of these results ranks humanlike writing or cognitive plausibility.
- `node dataset_v05.cjs --emit | python3 leakage_audit_v05.py`: **PASS**, JS-to-Python SHA rehash and SQLite split leak test with alias mutation. Four disjoint scene families, **one shared construction template**.
- Deliberate negative controls for duplicate IDs, family leakage, renamed family leakage, missing/mismatched dataset digests, invalid reader ref sets and incomplete prediction coverage were rejected in local implementations.
- The local candidate code differs textually from the GitHub-connected written files and Git blob SHA equivalence is **not asserted**. A remotely confirmed run is needed to certify repository HEAD itself; GitHub Actions success remains **UNCONFIRMED**. This avoids promoting local tests to a false CI verdict.

## Scientific counterexample
Always-EXPLICIT obtains more *typed contract passes* than always-KEEP, even though this says nothing about Korean style, undue repetition or human preference. Hence **contract pass rate cannot be used as the optimization target** for 'humanlike' writing. Hold quality ranking until real, source-licensed, human-reviewed competitor outputs exist.

## Evidence ceiling
- `unique` versus `competing` changes **declared model reader-state metadata**, not sampled human mental states; source and writer intention remain identical within matched pairs.
- Changing target group changes the writer's intended referent; it is not a meaning-preserving transformation.
- The scene families are **authored synthetic**, not independent corpus texts. They differ in lexemes/events but **share a source-construction template**; the synthetic holdout is only a pipeline rehearsal.
- Exact candidate matches are structural, not independent semantic entailment; free restructuring remains unvalidated.
- No trained model, GPU, friend server, human experiment, reference-choice accuracy or naturalness improvement was run.

**Verdict: G9-P59 v0.5 LOCALLY TESTED; EMPIRICAL HUMAN CONTACT HOLD; REMOTE HEAD CI UNKNOWN.** G9-P59 remains OPEN; G9-P58 stays CLOSED.
