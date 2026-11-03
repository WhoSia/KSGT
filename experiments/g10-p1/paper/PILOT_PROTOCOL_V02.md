# G10-P1 v0.2 — Korean Discourse Realization Pilot and Falsification Protocol
**2026-11-03 · preregistration-style engineering plan, NOT new human data**
**Stage:** G10-P1 OPEN. Source code [paired runner](../paired_runner_v02.cjs), [v0.2 planner](../discourse_plan_v02.cjs), [development cohort](../fixtures/cohort_v02.json).

## Decision: develop prose, not permission theory

The central criterion is whether the **generated paragraph** is naturally written Korean, faithful to the source and useful to its readers. A formal discourse label or a passing unit test is only instrumentation. We will not publish a philosophical theory of edit legitimacy as a substitute for actual writing quality.

## v0.2 versus the earlier simple three-way fact partition

The v0.1 plan deterministically divided the input fact list into roughly three contiguous sets. This is inspectable but is **not discourse parsing** and its three moves do not establish a rhetorical relationship.

The v0.2 plan separates:
- `factId`: an exact source item, not newly inferred truth.
- `move`: SETUP/EVENT/OBSERVATION/INTERPRETATION/LIMITATION/CONCLUSION if AUTHOR annotated, otherwise UNSPECIFIED.
- `evidence`: OBSERVED/GIVEN/REPORTED/INFERRED when explicitly supplied, otherwise UNSPECIFIED.
- `relation`: one of BACKGROUND/TEMPORAL_NEXT/ELABORATION/CONTRAST/EVIDENCE_FOR/LIMITATION, **only supplied by the source author**.
- `entity`: optional discourse participant clue. It is NOT an automatically resolved referent.
- `unresolved`: constraints on assertions that the source did not establish.

Only a genuinely supplied TEMPORAL_NEXT relation can reorder facts; an incompatible cycle is rejected. Ordinary rhetorical relations are preserved as typed edges without independently inferring a temporal or causal direction. This deliberately avoids an unearned semantic claim.

**Caveat:** A guided model can still ignore a plan, invent causal claims, or write stilted Korean. None of this has been tested with human readers in G10 yet.

## Controlled comparisons

All arms use the **same base model** (version locked by provider), same source facts, genre, target reader, author purpose, uncertainty constraints and all available human-supplied annotation labels. This latter condition is essential: if only the guided arm sees the annotation, any quality benefit is confounded with privileged information.

| Arm | Method | What it tests |
| --- | --- | --- |
| DIRECT | Minimal Korean paragraph-generation request with full source metadata | Naive generation baseline |
| RICH_PROMPT | One-call rich source-fidelity/discourse/Korean-style prompt with the same metadata | Strong engineering comparator |
| DISCOURSE_GUIDED | v0.1 three-move grouping with same metadata | Whether coarse explicit planning adds value |
| LICENSED_PLAN_V02 | Source-author-licensed discourse graph + epistemic roles + Korean realization in an inspectable structure | Whether structured planning adds incremental value |

The v0.2 arm can have longer prompts. Record exact prompt SHA, actual prompt tokens, completion tokens and latency. Never claim equal compute merely because there is one model call per arm. A future length-matched control should be built if significant differences emerge.

### Development data

Three author-written sample tasks: science observation/explanation, scene essay, school notice. Their fact annotations and relation edges are author-created scaffolding; **not independent annotated Korean discourse data**. They are for pipeline development, error diagnosis and smoke tests only.

### Prospective validation (still unperformed)

1. Collect new source-work-disjoint Korean writing assignments, with explicit lawful source rights and frozen source identity/genre/goal.
2. Freeze prompts and base model, use randomized condition order on the same source task, never retune from the confirmatory set.
3. Obtain all candidate paragraphs, including API failures and source-invalid generations; preserve full source-task denominator.
4. Conduct independent blinded native Korean reader preference, paragraph coherence, topic/focus naturalness and pragmatic suitability assessment; source-admissibility reviewers should independently assess fact, negation, quantifier, causal/epistemic and referential errors.
5. Use source-work clustered intervals and genre/source-length stratification; avoid treating multiple candidates/raters on the same work as independent population units.
6. Measure actual end-to-end cost. If v0.2 is worse than a strong rich prompt, reduce or change the planning interface instead of publishing a narrow governance result.

### Blinding / ingesting ratings

[blind_packet_v01.cjs](../blind_packet_v01.cjs) takes only actual successful generation reports and randomizes masked candidate order, storing mapping separately. No human scores are generated. [reader_summary_v01.cjs](../reader_summary_v01.cjs) refuses absent, incomplete, duplicated or non-attested scores and calculates source-work grouping. Its identity and independence checks are **self-attestation only**; the researcher must authenticate real reviewers before making scientific claims.

### Current status and exact next experiment

**Engineering:** source-licensed planner, deterministic tests, actual API runner, development cohort, blind packet and reader summary exist. [CI](https://github.com/WhoSia/KSGT/actions) is read-only; escaped-newline YAML error on first multi-test expansion was corrected. 
**Scientific:** G10 live model generations=0 observed; independent native-reader ratings=0; quality superiority=NOT_TESTED; cost superiority=NOT_TESTED.
**Next action:** provision a permitted existing base LLM in the project environment, run the three author-written developmental source works × four arms, inspect the prose for real Korean discourse and overassertion errors, then redesign the plan based on actual samples before an unseen human test.

## Explicit stop conditions
- If no actual prose generation occurs, the work remains ENGINEERING_ONLY, not a completed Korean generation paper.
- If a rich prompt performs equally well at less cost, no extra architecture contribution is claimed.
- If the planner only repeats human annotations without a demonstrable benefit, it is a formatting component rather than a scientific invention.
- If model self-ratings disagree with genuine Korean reader preferences, native-reader evidence prevails and limitations are recorded.
