# KSGT Generation X — G10-P1 R3: Order-Only Identifiability, Null-Intervention Screening and Executable Paired Preflight (2026-11-05)

**Disposition:** G10-P1 OPEN; R3 engineering implemented. All R2 sources remain EXPOSED SYNTHETIC DEVELOPMENT. Actual new model completions = 0; independently validated reader responses = 0; prose-quality improvement NOT ESTABLISHED.

## 0. Historical BFS review and anti-drift

Generation VIII G8-P2.5 judged ACTUAL HUMAN ACTION != EDIT NECESSITY and ACTOR AUTHORITY != SEMANTIC AUTHORITY. G8-P2.6's frozen eight eligible examples produced one supported INTERVENE, seven ABSTAIN (87.5%), and a STANDALONE COVERAGE FAIL. This is a warning: an increasingly conservative contract can be scientifically careful yet useless as a writing engine. R3 is not a new authority taxonomy.

G9-P60 protected source-work grouping against repeated-output pseudo-replication. G10-P1's 196 single-paragraph and 36 three-paragraph previous generations are development observations, not 232 independent sources. No human reader preference data were found in CURRENT_STAGE.json.

## 1. R2 confound corrected

R2 has identical JSON sources across its five arms, but different instructions and prompt lengths. A graph-vs-ablated result can therefore reflect instruction wording, token length or order. R3 constructs two **order-only** prompts with:
- identical system and user instruction wording;
- identical source JSON including author-declared edge set;
- identical fact ID multiset and reference format;
- distinct order of fact IDs in a non-binding reference plan where a topological ordering differs from the original list.

Arms:
- SOURCE_ORDER_PLAN: author-source enumeration F1,F2,...;
- DEPENDENCY_ORDER_PLAN: stable topological order of explicitly author-declared prerequisites.

The prompts have identical serialized *character* counts. This is not a promise of identical tokenizer counts, wall time, response length, or effectiveness. Provider token measurements would still be required.

## 2. Deterministic preflight finding: only 1 / 3 works permits this intervention

| Exposed work | Declared edges | Proposed graph order differs? | Scientific interpretation |
| --- | ---: | --- | --- |
| NOTICE_CONDITION_A | 2 | YES | One identifiable order-proposal comparison; factual truth of edge labels not gold |
| SCIENCE_LIMIT_A | 3 | NO | Already ordered under declared edges; no treatment contrast |
| SCENE_UNORDERED_A | 0 | NO | Null intervention; do not infer graph effectiveness |

Therefore: sourceWorks=3; identifiableOrderPairs=1; noOrderContrastPairs=2; assignedEligibleCalls=2 (one model) in the R3 order-only pair preflight. These are design counts, not new generated documents, model calls, ratings or scientific evidence. A 1/3 developmental intervention coverage is a warning about narrow application and possible prompt overhead.

## 3. Files and execution gate

- r3_order_only_pair_v01.cjs: creates provenance-preserving order-only matched-information prompts and explicit caveats.
- r3_order_only_pair_v01.test.cjs: nine regression assertions including unchanged science and edge-free literature.
- r3_paired_runner_v01.cjs: pure preflight; dry-run default; counterbalances per source-work using a preregistered stable hash; records failures in full denominator; skips identical plans.
- fixtures/r3_development_request_v01.json: frozen illustrative model, temperature 0, maxTokens 1200, no API credentials.
- r3_paired_runner_v01.test.cjs: eight tests using injected simulated providers. Mock text and failures are **test fixtures**, never actual API generations.
- CLI defaults to dry-run and intentionally refuses a live API run until a separately approved execution path is used. Remote CI may execute the pure tests; read-only Actions is prohibited from committing.

**Verification authority:** These source and test files have been committed on GitHub. Do not call an unobserved remote workflow success. A separate independent runtime replay is required to claim a fresh 17/17 R3 test pass.

## 4. Scientific inference and strongest null hypotheses

H1: Presenting an explicit author-witnessed dependency order (rather than original enumeration) raises Korean reader task accuracy on genuinely disorder-prone documents, when all source information and model budgets are matched.

H0-1: A competent LLM uses the source edges itself; order advice has no incremental effect.
H0-2: The intervention applies to too few naturally occurring works to justify its annotation and engineering costs.
H0-3: The apparent gain is a sequencing / placement bias or prompt tokenization difference.
H0-4: Over-constraining discourse order harms suspense, contrast or natural Korean information structure.

A preordered source and an edge-free source are mandatory negative controls; they are not failed experiments or new independent data. Qualifying on a post-treatment model output is forbidden. Randomization/selection must happen before seeing outcome quality.

## 5. External research and novelty ceiling

- Kim et al. (2026), Align to Structure, AAAI, https://doi.org/10.1609/aaai.v40i44.41085: RL aligned with linguistically grounded global discourse motifs; structure alone not novel.
- Liu et al. (2026), Disco-RAG, ACL, https://aclanthology.org/2026.acl-long.189/: discourse trees and inter-passage rhetorical graphs used for QA and long-document summarization. KSGT cannot claim exclusive ownership of graph-based generation planning.
- Chernyavskiy et al. (2026), DiscoRAG, LREC, https://aclanthology.org/2026.lrec-1.162/: rhetorical structure and query-oriented retrieval on narrative documents; reader/task-sensitive structure is also not new by itself.

Literature above supports the novelty ceiling, **not empirical evidence of any KSGT improvement**. Technical ordering under author-labeled prerequisites is a bounded known technique.

## 6. R4 scientific and operational decision

Do not invest in a bigger R3 planner merely to produce more code. First:
1. Check the R3 GitHub CI exact commit and replay tests in an independent Node 22 environment.
2. If approved, run the eligible paired arms with the same fixed model, source, decoding parameters; observe actual prompt and completion token usage, latency, output, failure denominator and order/sequence effects. Freeze order and method mapping before viewing outputs.
3. Add an explicit-edge direct model and an instruction-length-matched placebo to rule out easy confounding; do not claim token equality from character equality.
4. Collect new naturally occurring, source-work-disjoint Korean writing tasks and independently validated author source/edge labels. Pre-register representativeness and intervention applicability, not only quality conditional on changed orders.
5. Evaluate comprehension/action eligibility separately from native Korean prose naturalness and source fidelity. Cluster by independent source work, retain ties and abstentions.
6. STOP if direct model matches graph on comprehension and fluency at lower cost, or if graph intervention coverage stays negligible.

**Decision:** R3 establishes a cleaner experimental *contrast* with one eligible synthetic source work; it does not establish an improved Korean text generator.