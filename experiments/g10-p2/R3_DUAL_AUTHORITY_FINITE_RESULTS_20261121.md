# G10-P2 R3 — Source–Surface Dual-Authority Finite Contract: Verified Engineering Result (2026-11-21)

**Official research status:** R3 **closed-grammar engineering verification PASS**, full-prose Korean quality and human preference **NOT TESTED**. No new LLM calls were made during this R3 implementation; G10-P2 cumulative real model calls remain **128**, all from R2/R2b extraction.

## Preregistration, sources and exact methodology

- [Frozen R3 causal and data-authority contract](R3_DUAL_AUTHORITY_PROSE_PROTOCOL_20261121.md)
- [Original R9.34 source briefs](../g10-p1/fixtures/r934_reader_cohort_v01.json)
- [Four original source works and twelve investigator-authored claim cases](fixtures/r3_dual_authority_4works_v01.json): CHAT_CHECK (P1 source fact 3), SCI_SCALE (fact 4), NOTICE_SETUP (fact 4), LIT_SHADOW (fact 3)
- [Prototype](r3_dual_authority_v01.cjs) / [unit tests](r3_dual_authority_v01.test.cjs)
- [Read-only GitHub CI run 44871827738](https://github.com/WhoSia/KSGT/actions/runs/44871827738): **39/39** P2 regression tests PASS, 0 failures, 0 provider requests in this run. Previous R3 CI 44871730127 failed 1/39 because a test expected the wrong error code for an incorrectly formed work ID; the test was corrected by distinguishing an invalid ID from a well-formed but unregistered one. The historical failing run remains discoverable.

## The source/surface contract

**Source authority:** identifies a literal source fact, an exact unique character span in the original source document and a researcher-prepared fact relation (actor, object, condition, time and modality when relevant). The source record says what a writer is *allowed to claim*, not what the current paragraph actually says.

**Surface authority:** identifies the realized output and a unique evidence span, plus a proposed structured relation extracted from that output. The realized output can itself be wrong about the source and cannot certify its own relation.

**Cross-authority gate:** compares source and proposed relation without trusting the proposal as correct. In this *first closed-grammar prototype*, even a matching hypothesized actor/predicate is **not sufficient for ALLOW**; ALLOW requires the **entire actual sentence** to equal an independent, investigator-authored licensed sentence for that case. Unknown paraphrases, quotes containing a licensed sentence, duplicate witnesses and unsupported text ABSTAIN. A quotation of a source proposition is not promoted to the narrator's fact. The preserved text is returned unchanged when there is not enough authority for a safe rewrite.

### Fixed 12-case results (engineering contract, not observed language quality)

| Contract outcome | Count | Representative case |
| --- | ---: | --- |
| ALLOW | 4/12 | A source-approved surface exactly states the licensed actor, audience, assumption and commitment |
| REJECT | 7/12 | A changed actor in LIT_SHADOW, widened audience in NOTICE_SETUP, asserted but unverified zero-offset equality in SCI_SCALE, invented deadline or promise in CHAT_CHECK |
| MENTION_ONLY | 1/12 | Someone reports that 윤해 received the cloth; the report does not on its own confirm the event |
| Unanticipated output mismatch | 0/12 | 11 R3-specific regression tests all pass |

**The counts are predetermined by the investigator's authored fixture and matching source policy.** Their agreement demonstrates the software obeys the specified constraints; it is not a statistical error-detection rate, automatic Korean semantic parsing accuracy or evidence of human writing improvement.

**KEEP:** a recognized, licensed sentence is returned byte-identically with 0 model calls.
**ABSTAIN:** unsupported or ambiguous changes are passed through unchanged with an explicit reason; no hallucinated local fix.
**REVISE:** not demonstrated as a robust new free-text editing capability. This first R3 gate only authorizes/rejects/abstains; actually writing better new sentences remains a separate workstream.

### Evidence from R2/R2b motivating this gate

R2's 40 researcher-authored snippets were easy enough for the unchanged GPT-OSS 20B model to match 40/40 binary and 40/40 fine-grained author labels. R2b with **previous actual GPT-OSS prose** dropped to 20/22 and 16/22 binary assertion concordance under those two prompts, with 2 author-uncertain cases excluded from the decidable denominator but retained as model attempts. The detailed model falsely attributed receiving cloth to 수빈 when 윤해 received it; exact quote spans were often present despite role-binding mistakes. A matched citation does not validate logical entailment.

[Real R2 80-call raw ZIP](https://drive.google.com/file/d/1w3IEOXRPMFyrJYRNpZ4etbdD69Pp60u4/view) / [real R2b 48-call raw ZIP](https://drive.google.com/file/d/1lDwdjS7LwCPeUcdS6qvJ2gARCCn6kWqT/view), both SHA verified after Drive cold readback.

## Research-director scientific disposition

R3 demonstrates that source-evidence and actual-output evidence need independent authority, with explicit modality and actor-role binding. **Do not spend the next cycle multiplying author-structured sentences:** the test's positive labels are built into its authorized surface catalog and do not measure model language understanding.

Next required advance: *full Korean prose* experiment on new source-work-disjoint briefs with strong direct/rich prompting, same source-state as normal text, identical model + candidate slate under executable control, no-op and compute-matched revision. Collect independent Korean reader task performance and a separate semantic source audit. A fallback that abstains on nearly all unknown expressions may be accurate on fixed examples but unusable for natural prose. Report rejection/abstention coverage, false approvals, usability and total annotation/provider cost.

**P2 remains OPEN. Independent reader gold = 0. Verified positive Korean writing-quality gain = none.**
