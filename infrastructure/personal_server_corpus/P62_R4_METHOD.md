# G9-P62-R4 — Source-Grounded Discourse Entity Composition

Status: PROPOSED within P62; CURRENT_STAGE=G9-P60. Draft PR #1 stays unmerged. No real R4 source-work-independent corpus experiment has yet been run. The synthetic exercises in this court are authored by the developers; they are not independently adjudicated reference labels.

## Motivation and R3 falsifiers

R3 examined 19,255 frozen literal targets on 886,879 source structures. The 154,040 suffix perturbations changed inherited structural choices for 182 targets and lexical choices for 2,806; these are target-unit-suffix instrument sensitivities, not correctness results. R3's first stream algorithm and typed local-constraint model differed on 1,197 target proposals (512 new proposals, 543 lost proposals, 142 other selections). No significant net proposal-coverage gain was found: -0.312 percentage points [-0.704,+0.085], document-equal, source-work clustered. One proposed numeric witness crossed original source-unit boundaries and failed a separate admission check. The 5,382 admitted fragments are original text evidence, not antecedent gold. A 5,400-frame authored individual-group test never validated coordination unions or general negation scope.

The gap is an architectural problem: a single numeric fragment is not the same object as a discourse entity, a group, a coordinated union, or an assertion that some people exist. R4 introduces different TYPES of proposed nodes rather than adding another arbitrary ranking score.

## Formal machine contracts

Let D be the sequence of original source units, with code-point offsets and hashes. Let P_t be the strict original prefix ending before observed target t. A source witness is a tuple of original unit index, half-open code-point indices, equivalent global bounds and a SHA-256 digest of the witnessed unchanged unit substring. A GROUP_MENTION is an observed numeric fragment backed by exactly one admitted witness. Its cardinality is an observed machine parse, not a true discourse cardinality.

A prospective coordinated union U(A,B;m) has two independently witnessed group components A,B and an independently witnessed coordinator m, each in the same original source unit and temporal scope. It retains its component spans. It does not fabricate a contiguous source span for the union's semantic denotation. Its total cardinality remains NULL until disjointness and denotational scope are independently justified. Two adjacent mentions without an explicit connector are not enough. Disjunctive alternatives and mismatched classifiers must not be treated as a coordinated union.

Define a typed assertion attached to a group mention: SURFACE_EXISTENTIAL_NEGATION, SURFACE_EVENT_NEGATION, or UNRESOLVED_ASSERTION. These are local substring patterns and do not assert event truth or group existence. A quoted or hypothetical group remains recorded, but external promotion requires independent scope evidence. An unrelated later negation must not delete the earlier group.

The machine prefix-state signature is H(P_t, ordered observed source witnesses and graph events). For a fixed observed target and unchanged strict pre-target prefix, appending or replacing future text must not change prefix node IDs, union edges, scope types, eligible candidates, or the prefix-state signature. Explicit target-local counter/cardinality requirements may be applied in a SECOND, documented compatibility step; this does not license future antecedents and is not a suffix-invariant semantic theorem.

The semantics of Korean coordination or true negation scope are not established by this surface fragment parser. Known counterexamples must remain visible.

## Executable source-only R4 prototype

p62_r4_discourse.py consumes a list of unchanged original Korean source-unit strings and an observed target identity. The stream is read chronologically, with group mentions traced to their original source units. Group and coordinator records carry exact original-unit/code-point SHA-256 witnesses. UNION is a hypothesis node with NULL total cardinality and without reference_licensed. Quote scopes use original opening offsets rather than mere parity, blocking spurious identity between separate quotes. Local existential negation blocks an asserted existence-based proposal without deleting observed mention evidence. Event negation remains a distinct tentative assertion. Unknown cardinalities and ungrounded source spans do not become accepted antecedents.

Result types include PROVISIONAL_SINGLE_GROUP_SOURCE_FRAGMENT, HOLD_COORDINATED_COMPOSITION_AMBIGUOUS, ABSTAIN_COMPETING_GROUPS, ABSTAIN_NO_ADMISSIBLE_GROUP and HOLD_INVALID_QUOTE_SCOPE. A deliberately independent verify_graph check enforces original witness integrity for both components and coordination.

Original tests in test_p62_r4_discourse.py contrast documented authored examples of conjunction, disjunction, adjacent groups, counter conflict, alternative source segmentation, fabricated source offsets, unrelated/existential/event negation, same-versus-different quotes, hypothetical scope, target-local suffix compatibility, unknown cardinalities, and randomized future-edit noninterference. These tests do not prove correct natural-language understanding.

## Distinctive risks and explicit nonclaims

Coordinator discovery currently recognizes only a narrow surface pattern; ellipsis, complex nominal modifiers, nested groups, disjunction under coordination, pronoun interpretation, comma conjunction, negation scope under quotation and cross-paragraph group composition are unresolved. This algorithm intentionally abstains on multiple nearby competing groups or a proposed union with live constituent candidates. Its proposal rate may be below R3; less guessing is not evidence of improved referential accuracy.

Quote scope is a delimiter heuristic and can be wrong under unusual punctuation/escaped source. In particular, a source containing quotation or hypothetical cues is not automatically actual-world evidence. Source spans verify bytes/Unicode under this representation, not that they mention a semantically valid entity. The current window and ambiguity threshold are not fitted to independent Korean judgments. No claims about writing quality or human preference are possible.

## Next: genuine transfer from completed corpus

The personal-server ingestion has completed 10,667 members and 15,889,340 representations / 9,018,434 canonical JSON structures / 100,317,246 paragraphs, separate from frozen P62/R3. To test generalization, construct a NEW frozen cohort outside all original R2/R3 source-work and exposure components, using exact-structure, subset, resegmented, normalized-only and conservative cross-ID version exclusion paths. Mere difference in NIKL ZIP or year does not prove work independence. Preseal source digests, cohort inclusion/exclusion, unchanged R3 code, R4 code and fixed evaluation metrics BEFORE observing transfer results.

Run unchanged R3 baselines first on the exact same prospective cohort, then R4; report proposals, abstentions, competing union graphs, verified original-unit source spans, scoped-negation flags, matched-numerator differences, document-equal component-resampled intervals, runtime/memory and adversarial regressions. Keep every private original text, source identifier and result row outside public GitHub. New machine-only data does NOT establish semantic coreference accuracy.

## P63 readiness, not automatic promotion

A P62 closure proposal requires mechanistically novel and falsifiable computational entities; independently tested custody and explicit counterexamples; prospective source-work-exclusion and transfer receipts with honest leakage HOLD where uncertain; executed negative-control and ablation results without postinspection tuning; and a coherent formal question beyond heuristic revision. The R3 future-anchor circularity, segmentation failures, nulls, ambiguous source versions and missing independent human semantics remain inherited boundaries. Human-confirmatory reference and writing evaluation is intentionally late-stage and need not stop machine-only research. No P63 or stage change until explicit authorized closure decision, independently verified commits/CI/Notion and private cohort execution.
