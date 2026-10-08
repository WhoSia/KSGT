# G9-P58 — True/Pseudo Partitive Semantic Typing Court

**Official:** KSGT Generation IX G9-P58 — Partitive Semantic Typing, Discourse-Given Set Recovery & Genre-Conditioned Referential Economy

**Single small question:** Can P55's strict integer subset module be prevented from silently converting *kind-denoting pseudo-partitives, measure fractions, event parts, or discourse-new expressions* into anchored `그중` group references?

### Evidence used before code
- [Shin (2017), Partitive Descriptions in Korean, DOI 10.5334/gjgl.143](https://doi.org/10.5334/gjgl.143): postnominal/quantifier constructions may express **true or pseudo-partitive/quantitative** structures with kind-denoting and definite DP. The DOI/abstract and accessible research text were consulted; original independent Drive PDF is not landed.
- [Song (2021), IHRC Korean Sejong spoken corpus, DOI 10.17002/sil..60.202107.89](https://doi.org/10.17002/sil..60.202107.89): internally headed relative clause partitive subtype `가운데` test; **different syntactic target**, do not promote to `그중` gold.
- Already-held and **actually read** original [Ham (2026)](https://drive.google.com/file/d/1q_1MyyChyI4_h1ErQsNS1g4ttHiZuzaK/view): precedence of context, two-level (preceding discourse + local sentence) topic/focus/presupposition analysis; [Roh, Na & Lee (2005)](https://drive.google.com/file/d/1NU0FFg_k0HGJqaCiHlAJpWS81XuL-JaC/view): center transitions and Korean zero-realization Npair/Ninter/Nintra/Nnon; [Choe (2021)](https://drive.google.com/file/d/1cKp51GEWKfzr99WDHUA7geX4fkbVNWBd/view): tested position/reference of null/overt pronouns, not a proof that `그중` is always overt.

### Typed scope and non-claims
`semantic_gate.cjs` requires a **declared** source semantic class (`REFERENTIAL_INDIVIDUAL_SET`, `REFERENTIAL_KIND_SET`, `KIND_DOMAIN`, `MASS_MEASURE`, `EVENT_PART`, `UNKNOWN`), selection mode, source quote, discourse-given, scope key and explicit writer objective. It never independently infers these from Korean text; this is an engineering contract for downstream semantic analysis, not that analysis itself.

- `REFERENTIAL_*_SET` with declared discourse-given matching scope and strict member subset: can propose **review-only** overt `quote + 중...` **ONLY** if author `CLARIFY`, but always preserve the original. Matching quote and source-count do **not** validate the actual antecedent or human preference. Proper subset is the *limited operator* used here, not all possible Korean quantificational constructions.
- `KIND_DOMAIN`: `KIND_OR_PSEUDO_PARTITIVE_QUANTITY` review, no ungrounded entity reference. A *referential set of kinds* is different and may be a true partitive given suitable discourse evidence.
- `MASS_MEASURE`: fraction of mass/volume is **not constrained by discrete member count**. Half of three apples can denote half of the total amount if cutting/material reading is licensed; *odd half of countable whole units* is not licensed as an integer member subset without further context.
- `EVENT_PART`: event mereology has distinct truth conditions and antecedent horizon.
- Without discourse-given evidence or writer direction, preserve `그중`. A repeated noun phrase is NOT automatically more natural in Korean narrative/dialogue/scientific writing.
- Even 16/16 authored synthetic type/counterexample tests **are not Korean gold**. Existing 25 NIKL literal `그중` contexts have no independent true/pseudo-partitive labels. No empirical semantic classification accuracy or human editing preference is computed.

**Literature custody:** [48-paper Drive inventory](../../literature_audit/BIBLIOGRAPHY_CUSTODY.md) and [five newly acquired ACL open-access originals](https://drive.google.com/file/d/1DO69U-BAu5enDzp7uMv6U4a4s7clSwLs/view) in `00_INTAKE`, not yet individually canonical. No private NIKL raw text or model training. No friend server/global installations.

**Terminal stop rule:** if source typing/abstention tests and literature rights receipt are verified, close P58 as a *bounded semantic-layer pass*, carry **lack of automated semantic parser, human writer preference and naturalness gold** as HOLD. Do not create another superficial regex corpus sweep just to extend P58.
