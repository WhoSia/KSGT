# G10-P2 R1 — First verified post-realization reader-state mechanism (2026-11-21)

**Status:** IMPLEMENTED / HERMETIC_CI_PASS / ONLY_AUTHOR_EXPOSED_FINITE_CORPUS / NO_LLM_WRITING_PREFERENCE / NO_INDEPENDENT_READERS.

## Source and actual code

- [Official P2 program](RESEARCH_PROGRAM.md)
- [Pre-registered contrast](R1_PREREGISTERED_STATE_CONTRAST_20261121.md)
- [Four author-written Korean briefs and eight source facts](fixtures/r1_reader_state_author_dev_v01.json)
- [Reader-state controller](reader_state_v01.cjs) / [10 test cases](reader_state_v01.test.cjs)
- [GitHub Actions R1 run #44868442416](https://github.com/WhoSia/KSGT/actions/runs/44868442416): **10 passed / 0 failed** on Node 22. GitHub Actions uses only contents:read, checkout persist-credentials false. It does not call Groq or create commits.

## R1 contrasts observed from the checked CI diagnostic

| Source work | Grounded first sentence then continuation | No first sentence then continuation | Quoted source sentence then continuation | Plan-only, no first sentence |
| --- | --- | --- | --- | --- |
| NOTICE | ANAPHORIC | EXPLICIT | EXPLICIT | ANAPHORIC (dangling) |
| SCIENCE | ANAPHORIC | EXPLICIT | EXPLICIT | ANAPHORIC (dangling) |
| CHAT | ANAPHORIC | EXPLICIT | EXPLICIT | ANAPHORIC (dangling) |
| SCENE | ANAPHORIC | EXPLICIT | EXPLICIT | ANAPHORIC (dangling) |

**Interpretation:** the new controller uses the **observed exact surface** to update what it regards as disclosed. Its plan-only control mistakenly licenses a dependent pronoun/reference in all four intentionally missing-first-sentence cases. This is a software mechanism demonstration and a synthetic, authored counterexample; none of these output counts are a model accuracy estimate or evidence of reader interpretation. The four scenes are not independent random samples.

**Additional checks:** exact unique source witnesses and source/output offsets; duplicate output facts do not multiply evidence; a paraphrase, quote, denial or hypothesis not included in the authorized surface list does not become observed truth; upstream replacement causes replay and invalidates now-lost facts; valid input KEEP returns byte-identical text; unsupported draft ABSTAIN returns original bytes; a one-sentence dangling anaphora can be replaced by its authored explicit variant with bounded scope; mismatched source ID, unauthorized surface, malformed string and unknown policy fail closed.

**Measured provider and human use:** new provider calls 0, independent human ratings 0, model parameter training 0, supported free-form Korean parsing 0. Computing a controlled state is not the same as inferring a real person's cognition. Annotation labor has not yet been timed.

## What this experiment does NOT establish

The controller only recognizes an enumerated inventory of exact Korean strings. It would mark a perfectly acceptable unregistered paraphrase UNKNOWN. It does not infer negation/scope from unseen sentences, judge whether a human reader actually remembered an antecedent, or make a longer passage emotionally natural. The "plan-only failure" was intentionally built into the baseline; it is not a measured disadvantage of a strong GPT-OSS direct-writer. It is not evidence that an external controller is novel compared with all existing source-grounding/realization systems.

## Next causal decision

1. Freeze new work-disjoint natural Korean source texts and a reference-auditing sheet. Do not use these four synthetic fixture works as unseen test data.
2. Give the **same** source facts, candidate alternatives and state packet to a model directly, to a model with an ordinary state prompt, and to the state-driven selector; compare full paragraphs, not simply pronoun choices.
3. Include artificially stale state, a no-intervention arm, full source-reparse and actual automatic extraction. Under uncertainty, prefer reader-observable clarity to a supposedly minimal ellipsis.
4. Collect independent native-Korean reader comprehension and editing burden separately from original-source fidelity. Account for source annotation work and extraction costs before claiming lightweight efficiency.

**P2 scientific quality status remains OPEN — no superiority claim.**
