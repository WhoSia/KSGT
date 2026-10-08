# G9-P53 — Offline Genre-Authority Writer Instrument v0.1

**STATUS:** G9-P53 OPEN. DEVELOPMENT-ONLY / SYNTHETIC ENGINEERING TEST, no new Qwen inference and no independent Korean writing improvement evidence.

The lightweight writer must distinguish protected facts **F**, observed/unknown/hypothesized state **E**, explicit creative permission **L**, and declared writer goal and reference intention **W**.

- `src/genre_contract.cjs`: compiles six original Korean development briefs into B/U/K inputs (18 prompts), same F/E/L/W source prefix and SHA for all three arms. U and K carry exactly the same semantic plan atoms in ordinary vs typed formats. B is a no-plan baseline; B/K differences are **planning-confounded**, U/K representation differences are more narrowly interpretable but still length/token differences.
- `src/partitive_portfolio.cjs`: wraps existing G9-P53 v0.7 bounded source-witness interpreter and preserves the no-op as a genuine writing candidate. An overt group expression is only an *additional* candidate when the author requests clarity with sufficient evidence. Never force one-best style correction.
- `src/evidence_intake.cjs`: metadata-only rights/authority firewall; disallows unauthorized public raw, no-editor-to-writer promotion, no zero-anaphora-to-partitive-gold laundering, no edit-conditioned no-op prevalence.
- `src/audit_template.cjs`: reviewer questions and unadjudicated answer slots, not a human evaluation system.
- `fixtures/`: six hand-authored Korean development briefs and a five-source *metadata ledger*, not native-original gold and not a training corpus.

Run with preexisting **Node.js 22**, zero packages:

```sh
node --test experiments/g9-p53/genre_authority_v01/test/*.test.cjs
```

**Research boundary:** These tests validate the structure of permitted writing operations, not semantic truth or naturalness of any generated result. All 18 new prompts are development materials. Future real comparison requires same competent model, source-disjoint native samples, source preservation review, genre-appropriate creative permissions across arms and blinded independent writer-facing outcome evidence.

**Borrowed-server protocol (not used):** no borrowed folder access, GPU, system Python/npm modification, SSD write or global setup occurred. Any future rented-folder work must be separately authorized, HDD-root verified, local-cache/local-temp only, with external paths and symlinks protected and owner workspace cleaned after durable result copying.

Origin refs: [G9-P53 Notion](https://app.notion.com/p/3f3ef561cf928144aafec65a5556170c), [G8 S7 human rewrite candidates](https://docs.google.com/document/d/1xXfxSa2SSrJbZ0dClsvmYQa-KKt-wbm-TaWSrIV87T4/edit), [G8 S10 failed no-op intervention prediction](https://docs.google.com/document/d/1Lk8GS1rF98OcA6cSbVc6j3N-1yOp6pW4ixNcidVnHKg/edit).
