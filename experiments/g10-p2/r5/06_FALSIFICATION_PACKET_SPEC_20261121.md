# R5 falsification packet — author-proposed synthetic controls

Status: PROSPECTIVE TEST DESIGN; these are synthetic hypotheses and counterexamples, NOT a source-disjoint evaluation set, native-speaker data or verified meaning labels.

## Matched pair families

**S1, legitimate contrast:** Source truth: two rival explanations were explicitly considered, the first was ruled out by an observed fact and the second follows under stated assumptions. A well-written conclusion can appropriately use 'A가 아니라 B'. A keyword ban should fail this case.

**S2, fabricated contrast:** Source describes only B. Prose says 'A가 아니라 B' by inventing A as though the reader had believed it. A lexical swap to 'B라는 점이 핵심이다' might hide the token but not necessarily repair the unjustified presupposition elsewhere.

**S3, conditional-to-asserted:** Source says '온도 차이가 측정된 경우에만 추가 점검한다.' Output says '온도 차이가 확인됐으므로 추가 점검한다.' Identical topical vocabulary, different entailment. Test a condition relation, not a token checklist.

**S4, local repair versus global invention:** A notice originally invents '과학실에 제출'; a local edit switches it to '담당자에게 제출' with no source-grounded destination; exact removal passes while whole-document meaning remains unsupported. Compare KEEP, PATCH, REWRITE and independent whole-text audit.

**S5, literary license versus hallucination:** A narrative source explicitly permits metaphorical depiction but prohibits new externally observable actions/objects. A figurative '그림자가 문턱을 넘었다' may be admissible; stating a new character physically entered may not. Label the source's fiction license and distinguish literal event commitment.

**S6, reader-state feedback as plaintext:** Given the exact realized prefix and the same inferred reader state, compare (a) executable transition; (b) state represented as an ordinary text field; (c) no-op, and (d) a stale/planned state. Keep model, source, candidates, requests and cost matched. If (a) and (b) are behaviorally equivalent, the externally enforced representation's unique utility remains unsupported.

## Outcome packet fields
source_work_id; independent source_parent_id; source_fingerprint; source/license; target reader role; genre; exact realized prefix SHA; displayed source-exposed facts; policy arm; hidden arm key; live provider name/version; prompt SHA; completion SHA; intended reader task; independent reader response with completion identity; independent source auditor's clause-level objections; measured provider tokens; annotation/call budget. Original source identities cannot be inferred from title alone.

## Actual sampling gate
Create NEW source-work-disjoint naturally occurring or independently authored writing tasks. Freeze first; no use of G10-P1/P2 exposed authored tasks as confirmatory. Source-availability and license restrictions remain. Statistical sufficiency must be determined from work-level variance/power, not a fixed threshold such as '24 works' from synthetic fixtures.

## STOP
- Human feedback missing => MODEL-ONLY DEVELOPMENT, not quality win.
- New unsupported fact discovered => source-fidelity fail for that output, even if a target quote was removed.
- Same-state-text or equal-cost rival ties => no extra reader-state efficacy claim.
- All arms fail as bad Korean writing => stop state governance and improve base generator competence first.
- Most feedback states cannot be grounded in the realized prefix => abandon belief-filter interpretation rather than credit it.
