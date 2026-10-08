# KSGT G9-P53 · KRC v0.7 — Lightweight Writer Intent/Partitive Bridge

**Status: OPEN / EXECUTABLE SYNTHETIC PROBE / NOT CORPUS GOLD / NOT NATURALNESS EVIDENCE.**

This is a small additive mainline probe, not a replacement for the v0.6 experiment or for the separate local 72-test prototype. It restores the original KSGT-ANALYZE → KSGT-GEN design goal as *internal components of one KSGT*: observations must alter an actual writing decision.

Run `node --test experiments/g9-p53/krc_v07/intent_writer.test.cjs` on Node.js 22+. No Python packages, model weights, corpus download or human survey are needed.

- `PRESERVE_AMBIGUITY` and `NO_EDIT`: KEEP, even when an antecedent looks ambiguous.
- `CLARIFY`, multiple accessible same-kind source groups, exact *unique preceding* quote and declared author target: EDIT only the single `그중 한 X` span to `SOURCE_QUOTE 중 한 X`.
- Insufficient source/target/author declaration, duplicated spans, unsupported count: ABSTAIN. A `true` boolean does **not** independently authenticate an actual writer.
- If the group is uniquely licensed already, KEEP. Do not maximize edit count.

**Limits:** The examples are hand-authored; target-group identity is a declared input, not model-inferred or native corpus gold; the explicit replacement may sound more repetitive. String preservation is not truth-conditional equivalence. No cross-document revision, free Korean morphology, independent reader evaluation, semantic adjudication, or measured generator advantage.

**Research priority:** (P0) competent same-checkpoint B/U/K writing comparison; (P1) partitive/ellipsis/construction micro-study only when connected to output decisions; (P2) targeted, provenance-and-license-filtered prior corpora rather than GB quotas; (P3) optional lightweight adapters only after observed gain. Keep `G9-P53` open until actual writing-gain evidence is earned. See the canonical [Notion G9-P53 research notebook](https://app.notion.com/p/3f3ef561cf928144aafec65a5556170c).
