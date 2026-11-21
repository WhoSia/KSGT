# R5 research unit C · Separated reader and source-fidelity evaluation

Status: instrument specification only. This record does not assert recruitment, human responses or consent.

## Stage A: reader sees one complete Korean output, no source and no method labels
Stratify by chat/science/notice/fiction and state the ordinary writing goal as a user would encounter it. Record: (a) would they use/send the text as-is, revise it, or reject it? (b) first precise revision location, if any; (c) what action or finding they understood; (d) fluency, overexplaining, unnecessary defensiveness, relation and rhythm; (e) for literary prose, whether imagery and narrative coherence serve the scene rather than merely diversifying tokens. Do not embed the expected answer or favored system name in the question.

Use within-work blinded pair order, deterministic counterbalancing by **source identity**, not merely by condition. Collect individual raters' outcomes with anonymous random reviewer tokens. Repeated responses to a work are correlated observations.

## Stage B: distinct independent original-source auditor sees complete source and output
Record every invented obligation, entity/agent swap, chronology change, conditional premise upgraded into a fact, unlicensed event and missing required information. Every finding must include source-fact ID(s), original text span, output text span, specific predicate/actor/scope relation, and evidence boundary. A quote's mere occurrence is not entailment. When a claim is stylistic license in fiction, record the license class separately from nonfiction's evidence requirement.

A whole-document fidelity PASS requires all mandatory facts and relations, not just disappearance of one flagged phrase. A replacement that changes one unsupported place into a different unsupported recipient is not a semantic repair.

## Stage P: private investigator mapping and provenance
Keep method names and A/B pairing keys out of the two public forms. Store original input/provenance SHA, candidate byte SHA, arm, randomization, source-work parent, model version, temperature, token and call receipts, all exclusions and review status. Do not join Stage A and B by an answer-key property visible to readers. Failed, blank and contradictory judgments remain as-is.

## No external human available
Use existing public human writing/revision traces for *hypothesis generation and preflight*, and the author's own direct feedback for developer iteration; explicitly label both authority levels. An LLM playing a participant is a synthetic critic and can calibrate the form but cannot yield 'independent Korean native reader preference'. Only truly independent human observations promote such a claim.

## Release gate
Without A/B separation, method masking, genuine provenance and independently adjudicated source faithfulness, the outcome label must be WAITING_FOR_INDEPENDENT_EVIDENCE. Do not label the 4 masked R4a or R4b forms as four sets of human votes.
