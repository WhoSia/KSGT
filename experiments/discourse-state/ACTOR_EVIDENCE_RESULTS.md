# KSGT R9.42–R9.42b — Source warrants, subject realization and explicit actor choice

## Predeclared contrast and evidence

We continued from R9.41 but did not assume its "departure resolves competitor" state label was semantically licensed. Four new authored Korean briefs each have five incremental contexts while the intended actor and next action remain fixed: solo actor, competitor, competitor departure, explicit "only target remains by the object" assertion, and competitor return. The annotation-driven finite policy retains both candidates after departure. It only narrows the candidate set at the separate explicit assertion and reopens it at a return. Every registered source sentence has an ordered, text-anchored offset. Later regression tests reject a quote or hypothetical containing the same target phrase as a positive assertion, but only by enforcing the exact authored sentence boundaries. This is not a general quotation or factuality parser.

**Research limitation:** The controller agrees 20/20 with the labels that were authored according to its own rule. It did not discover the states from independent natural prose. Even a physical departure and a "person alone by object" sentence do not mathematically prove how an arbitrary reader resolves an omitted subject. These labels are operational choices, not reader-understanding gold.

## R9.42: Do inferred candidate sets change free Korean continuation?

- Free generation on the same full context, with or without the annotated candidate inventory: 20 contexts × 2 arms = **40** normal model completions on GPT-OSS 20B.
- All 20 paired surface outputs were **byte-identical**. In each source, the model returned the same overt-name sentence for every context, preserving the exact source action wording. Source-name occurrence 20/20 per arm; source-action occurrence 20/20 per arm.
- Total model tokens: 6,834 for raw context, 7,141 with candidate inventory. The structured arm adds 307 tokens across the 20 calls without changing any generated sentence.
- The naive heuristic that removes a competitor upon departure selects omission for all four exit-only contexts; the evidence-preserving policy retains the names. This is a disagreement between **authored policies**, not an independent reader result.
- Tests after exact-boundary hardening: 44/44 discourse tests passed in the later R9.42b CI (the initial R9.42 run had 41/41).

[Code: actor evidence](actor-evidence.cjs) · [R9.42 GitHub run](https://github.com/WhoSia/KSGT/actions/runs/44827912596) · [Raw original ZIP in Drive](https://drive.google.com/file/d/1maYOwy6bx2MdeQ6-cdhU1l6TQBjCVPlq/view)

Raw run artifact SHA-256: `1201e645616639d66502bc162768944e34c057f7f152834cc61f12cb91c1c070`. Downloaded copy from Drive matches the uploaded GitHub artifact byte-for-byte; 83 ZIP members with no ZIP test error.

## R9.42b: Separate explicit reference choice from writing

We held the same 20 contexts and model fixed, asking for a strict NAME or OMIT decision instead of asking the model to write a sentence. All 40 completions returned one valid label and their original receipts were preserved.

| Authored-policy comparison | Raw context | Source candidate inventory | Always name (non-model) |
| --- | ---: | ---: | ---: |
| Label matches out of 20 | 9 | 11 | 12 |
| Explicit OMIT decisions | 19 | 15 | 0 |
| OMIT on a case where this policy requires a name | 11 | 8 | 0 |
| NAME where this policy allows omission | 0 | 1 | 8 |
| Model tokens | 7,279 | 7,641 | 0 |

Only four source cases changed categorical decisions: one improved DRAWER exit-only, one worsened DRAWER explicit sole-actor evidence, and two improved competition cases. The difference of +2 policy matches is not a human-preference or statistically validated improvement, and the candidate list was supplied from the very annotation used to define the policy. Always-name is pragmatically acceptable in the omission-allowed cases, so its 12/20 **policy match** must not be treated as its writing accuracy.

A particularly revealing discrepancy is the return condition: all four contexts still elicited OMIT in **both** model arms even though the authored candidate set explicitly contained the returning competitor. The model's categorical decisions overuse omission in this configuration; the earlier free-form generator named all twenty. The mismatch shows why decision compliance, overt word choice, and reader referent selection must be measured separately.

[Code: explicit-choice experiment](actor-choice-pilot.cjs) · [R9.42b GitHub run](https://github.com/WhoSia/KSGT/actions/runs/44828444469) · [Original ZIP in Drive](https://drive.google.com/file/d/1fFhfNIWcSQBRbsKmIlt1xESTrthcPaDD/view)

R9.42b raw artifact SHA-256: `a3134ce95e363065a935b046648a1299036f4ebf7ea016702cecb6ece73ec516`. Drive re-download matches GitHub artifact byte-for-byte; 83 entries pass the ZIP integrity test.

## Research-director decision

**Stop promoting actor omission frequency as an endpoint.** The controlled renderer is a narrow proof of a state-to-wording interface, but its advantage depends on information authored in the state. The LLM given that same information did not improve the complete sentence, and its isolated label choice remained unreliable. This experiment does not establish a better writing system, a new architecture, or real reader clarity.

Return the main development allocation to complete Korean prose. Reuse R9.34's direct/general/discourse-conditioned 12-work outputs as a reader-blinded source-bound evaluation, rather than producing more synthetic actor variants. Prepare original source, three anonymous complete drafts, a separate source fidelity review, and questions about reader tasks, first edit location, intrusive AI-style rhetorical structure, and whether either is directly usable. Pre-register ties and "all unusable." Reserve the controlled source-state layer for relation errors whose correction produces a measurable end-to-end benefit over strong direct writing. If that gain disappears under a matched candidate inventory, concede that the information representation—not an exotic architecture—is the useful contribution.

The broad KSGT goal remains natural, purposive Korean writing. A missing subject is neither inherently more natural nor a proxy for minimizing the reader's discomfort. This finding argues for shifting effort from closed grammatical success to the reader-facing quality and practical use of entire passages.
