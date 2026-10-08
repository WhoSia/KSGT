# KSGT Generation IX G9-P54 — Terminal Court

**Formal name:** KSGT Generation IX G9-P54 — Context-Grounded Reference Realization, Antecedent Evidence & Writer-Choice Boundaries

**Final verdict (2026-10-08): CLOSED_BOUNDED_EVIDENCE_PASS / INDEPENDENT_ANTECEDENT_GOLD_AND_WRITER_PREFERENCE_HOLD.**

## Question answered within the allowed authority
How much preceding-sentence evidence can a limited Korean `그중` resolver observe without inventing a uniquely established antecedent or falsely treating a writing preference as known?

**Source-contact result:** From the already-authorized and privately stored NIKL ZA 2025 source, exactly 25 literal `그중` contexts (9 NX written, 16 SX spoken) were scanned under pinned archive SHA-256 `c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d`. Broad lexical/numeral group cues in last two sentence rows: **17/25**; last five: **21/25**. Numeral group cues in last two: **7/25**; last five: **9/25**. Potential rightward transcript continuation flags: **11/25**, an unvalidated punctuation heuristic, not a gold utterance-boundary classification. Unique strict integer-counter-matched preceding group witness on this sample: **0/25**. This zero denotes scanner-support shortage, **not** the number of true Korean antecedents.

**Observed fail-closed outcomes:** 9 GROUP_CUE_REVIEW_ONLY, 5 ABSTAIN_NO_VISIBLE_GROUP_CUE, 11 ABSTAIN_RIGHT_CONTEXT_POSSIBLE. Zero auto-rewrites. These are mechanical/heuristic routing categories, **NOT accuracy against semantic gold**.

**Developer-authored counterexamples:** `5팀→그중 2팀` count compatible but still unproved; `1팀→그중 2팀` count contradiction; two matching team groups → competing antecedents, abstain; `그중 92%` is NOT automatically an integer-counter case. A uniquely matching quoted source plus **author-declared CLARIFY** only yields a review candidate; KEEP or CONTEXTUAL cannot become automatic editing authority. An authentic writer identity is not verified by a caller declaration.

**Implementation evidence:** Offline full standard-library Python reference probe, private corpus-contact observation and **17/17 local synthetic/counterexample tests PASS**. Source-safe public GitHub contains a compact equivalent Python A1-witness gate, **12 hand-authored remote-target tests**, read-only workflow configuration, real metadata-only receipt and report. The workflow's **CI execution was not observed at closure**, so no remote-CI PASS claim is made. Public code and synthetic tests are not independently confirmed by that absent run.

## Holds inherited intact
- Gold-validated per-context Korean group antecedents: **0 acquired**, not `0 correct`.
- Independent actual human author KEEP/EDIT decision or same-context preference: **NOT COLLECTED**.
- Human naturalness and end-to-end KSGT generator advantage over a capable same-base-model baseline: **NOT ESTABLISHED**.
- NIKL raw sentences and private individual position/hash index: **NOT COPIED** into GitHub or Notion.
- Borrowed friend server, SSD, GPU, system Python/npm: **NOT USED**.

P54 ends here. No new Lab namespace, no expanded model run or large download. Next study, if separately named, should tackle **independent contextual antecedent annotation or genuine writer-selection evidence** as one bounded question, not extend P54.
