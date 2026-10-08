# G9-P57 — Existing Native Antecedent Gold Admissibility Court

**Official:** KSGT Generation IX G9-P57 — Existing-Source Antecedent Authority, Native Context Disagreement & Gold-Admissibility Boundaries.

**One question:** Which existing human-annotated Korean referential sources *truly warrant* a direct `그중` group-antecedent accuracy claim? This audit does not collect new participant responses, model output, training data or raw literary text. It records **read-only actual external source contact** and enforces referent-task ontology boundaries.

Run `node --test experiments/g9-p57/evidence_authority/tests/authority.test.cjs` with Node 22 built-ins only. Run `node experiments/g9-p57/evidence_authority/audit.cjs` for metadata-only source classification; no corpus downloads. The schema explicitly reports missing exact target labels and disagreement, while recognizing **actual native Korean adjacent coreference gold** in KoCoNovel/GOLEMcoref.

Observed (not extrapolated): GOLEM Korean CorefUD `dev.conllu` 8,442 lines / `test.conllu` 9,354 lines, with **zero literal `그중` in these two inspected splits only**. The connected GitHub read of `train.conllu` failed due large file; train is **UNINSPECTED**, not a negative finding. Korean metadata uses explicit Entity annotations and `SplitAnte` evidence; independent character-coreference labels do not imply target partitive membership gold. KoCoNovel sample `coref.jsonl` fields and 10 story segments were directly inspected read-only. Pinned upstream commits and rights in `data/source_registry.json`; no raw text mirrored.

Human writing research and already held Korean syntax/discourse papers: [HUMAN_PROSE_RESEARCH.md](./HUMAN_PROSE_RESEARCH.md). Avoid overfitting to synthetic counterexamples or humanized AI-tone metrics. A new human-like persona or higher stylistic entropy alone does not improve fidelity, acceptability or actual reader utility.

**No new borrowed server/SSD/system Python/npm or global install.** `DIRECT_PARTITIVE_GOLD=0` is **verified within inspected current sources**, not proof that no such dataset exists globally. The code's hypothetical positive fixture proves the gate is not trivially always-abstain.
