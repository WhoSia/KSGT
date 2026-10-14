# G9-P62-R4-R5-L3 — Source-Witnessed Role-Cue Candidate Inference

Status: original source-only computational/linguistic theory probe. Not a machine corpus run or independently adjudicated Korean reference study. CURRENT_STAGE=G9-P60 and Draft PR #1 remain unchanged.

## Purpose and theoretical contrast

Prior R5 M2 defines a category match between the source-following and target-following case/topic particles. That is a surface *particle congruence* heuristic; it does not derive an event participant role, topic center, agent, patient, or true reference link. The new independent role-cue module observes unchanged source-unit code-point spans and emits a typed witnessed surface cue rather than inventing semantic event roles.

For example, researcher-authored minimal pairs:

(1) "학생 세 명이 왔다. 그중 한 명이 말했다."
(2) "학생 세 명을 만났다. 그중 한 명이 말했다."
(3) "학생 세 명은 왔다. 그중 한 명이 말했다."

The particle adjacent to the source numeric group differs; this mechanically separates nominative, accusative and topic/contrast surface cues. The semantic antecedent remains unknown in each sentence. In particular, -은/-는 does not uniquely prove topic status or a specific reference. The same cue type can occur in different semantic and informational environments; lexical case is not an automatically inferred AGENT/PATIENT label.

The module records a source-witness digest for the original numeral fragment, optional immediately attached particle substring digest and original-unit bounds, quotation-open-stack comparison, cue inventory and explicit uncertainty reasons. It refuses source fragments occurring after a target, cross-original-unit particle assembly, inaccurate offsets, unverified source admission and semantic promotion. An attached particle whose following Hangul continuation may be part of a different lexical form is marked ambiguous. Nested quotation is still approximated by a deliberately incomplete surface delimiter stack.

## Distinct sources of uncertainty

- ABSENCE: no directly adjacent particle; do not infer a default.
- LEXICAL_ATTACHMENT: the apparent particle is a prefix of a longer unparsed form; do not infer reliable morphology.
- MORPHOSYNTACTIC_TO_SEMANTIC: even a directly observed nominative or accusative particle is not a certified thematic role of a discourse entity.
- TOPIC_OR_CONTRAST: subject/topic position, information status and contrastive interpretation are not equivalent.
- QUOTED_SCOPE: distinct reported-speech contexts and malformed delimiters do not license actual-world discourse continuity.
- SOURCE_CUSTODY: independently verified original source/occurrence admission is separate from a code-point span digest; a bare SHA is not semantic identity.

These reason types form partial evidence constraints. They should not be collapsed to one numeric confidence score or interpreted as an antecedent accuracy metric.

## Conditional formal invariants

Given an original unit string u and a verified numeric-group witness [a,b), any admitted adjacent-particle cue [b,c) is a substring of the same original unit. Its source coordinates and SHA-256 of u[b:c] remain unchanged under *strictly later text mutations*. This guarantees structural original-text custody for that substring, not morphological or discourse reference truth.

If the original same-unit substring is not present, or no independent source-node admission is supplied, the inferred semantic role remains None and the policy produces a source/uncertainty HOLD instead of manufacturing a role. Source-side role-cue extraction can be evaluated independently of target-local quantities, which belong to a different evidence type.

## Competition with existing R5

The existing M0 frozen guarded-v3 and M1/M2/M3/M4 remain frozen and unmodified. R5-L3 is an independent potential evidence extractor; it is not a replacement for M2 or a new frozen claim of accuracy. Prospective comparisons should use the same pre-target original numeric-group nodes and occurrence identity, recompute source admission and independently freeze explicit cue extraction before transfer. A source noun phrase with no visible case suffix is not necessarily nonreferential. A source nominative and a target object need not be non-coreferential. Quoted and hypothetical groups require stronger assertion-scope evidence than particle equality.

The authored tests contrast source case swaps, topic/contrast, phrase-boundary uncertainty, quote scope, future-only noninterference, exact integer offsets and the independent admission gate. These are formal unit checks and no human annotations. Actual full parse and compositional event-role discovery remain separate research questions. Examine competing discourse models before arguing novelty from a case-marker lookup.
