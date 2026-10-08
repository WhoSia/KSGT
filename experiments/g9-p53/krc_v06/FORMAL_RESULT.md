# KRC v0.6 — Korean Partitive Reference, Restricted -고 Generation & Real-Corpus Authority Court

**Research stage:** KSGT Generation IX G9-P53 · **Authority:** source-grounded construction demonstration and independently verified NIKL corpus inventory, **not** naturalness superiority or an externally annotated partitive test.

## Main construction result

KRC v0.5 could omit a repeated overt actor and combine two independently licensed events, but could not verify what **그중 한 컵** referred to. KRC v0.6 adds a typed plural discourse group

\[
G=(\text{id},\text{kind},|G|,\text{introducedAt},\text{accessibleUntil}),
\]

a context-scoped partial subset \(S\subset G\) with \(|S|=k\), and its complementary remainder \(G\setminus S\). A surface `그중 한 컵` can be generated when there is exactly one accessible cup group and \(0<k<|G|\). The engine **does not claim to know the individual's physical identity**: it introduces an existential singleton reference, bound to the source group. For two cups, the complementary cup has cardinality one; for three books, the remainder of a singleton has cardinality two but the individual books remain unselected.

A second independent operation derives `-고` from a bounded source lexicon of Korean verb stems, e.g. `놓다 → 놓고`, `올려놓다 → 올려놓고`, `붓다 → 붓고`, while checking the frozen source finite spelling, polarity, actor and declared sequential edge. This is a finite morphological procedure with source lexical warrants, **not** a general Korean conjugation theory.

## Four real Korean paragraph outputs

**EX17 science, constructed** — 민지는 투명한 컵 두 개를 실험대에 놓고 두 컵에 같은 양의 물을 부었다. 그중 한 컵을 창가로 옮겼다.

20분 뒤 창가에 둔 컵의 물 온도가 다른 컵보다 높았다. 두 컵 주변의 공기 온도는 측정하지 않았다.

**EX18 library scene, constructed** — 사서는 책 세 권을 책장에 올려놓고 그중 한 권을 책상으로 옮겼다. 나머지 두 권은 책장에 남아 있었다.

사서는 책상 위의 안내문을 읽었다. 창가에는 의자 하나가 놓여 있었다.

The two source contexts yield four passages (canonical and composed), with source event IDs preserved. The compiler blocks two accessible groups of the same noun kind, unlicensed group introduction, wrong type, selecting more items than the group contains, claiming individual identity without evidence, impossible complement sizes, polarity or actor mutation, and missing temporal/conjunctive warrants.

**CI [37748138188](https://github.com/WhoSia/KSGT/actions/runs/37748138188): SUCCESS**, Node.js 10/10 plus Python data-adapter 2/2 synthetic tests. A total of 4 documents, 2 restricted productive `-고` joins, and 2 group-partitive selections; **zero LLM calls and zero human ratings**.

## Existing real data — no redundant downloading

The user's Drive already holds an original NIKL zero-anaphora corpus investigation from G9-P36-R10. We located and independently checked:

- [NIKL ZA 2020 CSV ZIP](https://drive.google.com/file/d/1uJfzGphk2JpT2lg7kuuyUY2HpZyFVTix/view), SHA-256 `c8179e1bce2eaed22ae6d7afdf764034aac1e2ccdffe54b7f261ede2ad717610`. Two CSV streams contain 493,333 annotated subject/object omission slots in total.
- [NIKL ZA 2025 ZIP](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view), SHA-256 `c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d`. Its two JSON streams contain 30,346 sentences and 62,831 omitted-argument slots (subject, object, adjunct, complement, plus three blanks).
- The 2025 source contains **25 sentences with the literal string `그중`**, split 9/16 across NX/SX. Those sentences have 45 total zero-argument annotations. However these are **not labels linking the partitive `그중` to a particular plural group**, and should never be advertised as partitive coreference gold.
- Older **G9-P36-R10-R1** already inventoried these NIKL source populations, source hashes, version differences and exceptional identifiers; v0.6 respects that history rather than claiming a novel collection or treating version counts as longitudinal change.

A private-byte analysis utility is provided at `experiments/g9-p53/krc_v06/audit_nikl_2025.py`. It requires an authorized original 2025 ZIP and emits aggregated statistics only. It does not export sentences into GitHub or CI. The synthetic tests exercised its annotation-counting logic; the original dataset was examined separately in the user's connected Drive-backed runtime.

## Additional public Korean corpora

| Corpus | Contribution to KSGT | Current custody / restrictions |
|---|---|---|
| [KoCoNovel](https://github.com/storidient/KoCoNovel) | Korean literary **character coreference** and speaker links | Public repository; README says CC BY-SA 4.0. **Discovered, not copied.** Per-work public-domain/provenance should be checked. |
| [GOLEMcoref](https://github.com/GOLEM-lab/GOLEMcoref) | Fictional discourse, **zero anaphora and split antecedents** in Korean CoNLL/CorefUD | Public, **CC BY-NC 4.0**, with original fanfiction rights concerns; **discovered, not copied**. |
| [UD Korean-KSL](https://github.com/UniversalDependencies/UD_Korean-KSL) | Morphology, phrase attachment, learner error controls | CC BY-SA 4.0; **not a native-fluency gold corpus**. |
| [KoSEnd](https://github.com/seungukyu/KoSEnd) | Korean sentence endings for a later register/stylistic mechanism | Locate first; corpus licensing not yet confirmed, so no raw ingest. |
| [KLUE](https://github.com/KLUE-benchmark/KLUE) | Syntactic DP/NLI control tasks | Not a directly annotated Korean partitive corpus. |
| [Open Korean Historical Corpus](https://huggingface.co/datasets/seyoungsong/Open-Korean-Historical-Corpus) | Diachronic Korean prose/vocabulary distributions | Already registered previously in KSGT; CC BY-NC 4.0 and not an edit trajectory. |

The corpus selection follows **task semantics**, not just dataset size: zero-pronoun restoration is different from partitive group anaphora; learner-corrected prose is different from native idiomatic prose; and corpus access is different from authorization to redistribute copyrighted writing.

## Evidence and next decision

KRC now has a meaningful distinction between **which group** a partitive refers to and **which individual** it selects. The source-level cardinality relations and the generated Korean word forms remain finite, manually curated examples. They are **not yet validated against an independent gold set of Korean partitive references**, so one cannot infer naturalness or large-scale generalization.

Next prospective study should:
1. derive a small, independently held-out Korean **partitive antecedent annotation protocol**, not retrofit the 25 NIKL sentences as gold;
2. contrast source-plausible and ambiguous examples with **two same-kind accessible plural groups**, different number/type and shifted discourse salience;
3. validate reference-level precision on authorized public Korean texts (KoCoNovel/GOLEMcoref) only where their annotation actually supports the relation;
4. expand `-고` beyond five source-listed verbs while keeping polarity, argument and tense/aspect conditions visible;
5. return to **whole-passage Korean writing quality** once the construction engine genuinely generalizes to new, natural prose contexts. Do not revive invalid v0.1 reader materials or optimize a cosmetic detector.

**Main result:** A small but testable Korean writing construction step, supported by a large already-available zero-anaphora evidence lane with explicit ontology mismatches. No automatic “KSGT beats generic AI” claim.
