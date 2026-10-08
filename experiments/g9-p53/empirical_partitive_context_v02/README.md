# G9-P53 — NIKL Private Context Construction Court v0.2

**Verdict:** actual existing source bytes audited; **NO HUMAN PARTITIVE GOLD**, **NO AUTOMATED WRITER-PREFERENCE CLAIM**. This is a source-contact correction of the *coverage and context assumptions* of the tiny synthetic KRC v0.7 source-quote prototype.

Existing private source: [NIKL ZA 2025 original ZIP in KSGT Drive](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view). Scanner pins original archive SHA-256 and both internal JSON member hashes, rejecting unexpected version changes. Do not redistribute ZIP, source sentences, private row offsets, or the separate preliminary single-AI analysis in public GitHub. Execute locally only when legitimately in possession of the source:
```sh
python3 experiments/g9-p53/empirical_partitive_context_v02/construction_court.py /private/NIKL_ZA_2025_v1.0.zip --aggregate private_aggregate.json
```
**Observed before this code was promoted:** 25 `그중` occurrences: 8 bare, 6 `그중에`, 6 `그중에서`, 4 `그중에서도`, 1 `그중에선`; **0 match** the historical literal `그중 한 [X]` KRC v0.7 pattern. This does not show the model cannot generalize—only that v0.7's narrow programmed construction was not exercised by these corpus examples. Corpus has both news and spoken exchanges; some spoken transcript rows split one utterance across records, so even two preceding sentences are not necessarily enough to recover a referent.

A **separate private single-AI exploratory reading** marked 19 contexts as plausibly involving a group and 6 as unresolved without further context. These are **provisional, nonindependent and not ground truth**; no per-row interpretations or source excerpts are placed in public source control. An actual research-quality partitive corpus needs independent annotators, rights-cleared context, dispute labels, candidate antecedent spans, source group cardinality, and member/subset/ranking/quantifier roles.

**Next KSGT design question:** construction identity and referent-witness are separate primitives. Distinguish `geujung` selection/ranking/ratio phrases, antecedent group existence, nearby vs distant/next-turn discourse grounding, and legitimate writer ambiguity. Do not extend a find-and-replace system to unseen forms just because they share two Hangul syllables. A0 source alone cannot promote automatic edit; A2/A3 comparative human writer evidence remains unavailable.

**Test with no external data:** `python3 -m unittest discover -s experiments/g9-p53/empirical_partitive_context_v02/tests -v`. CI runs synthetic tests only. No new dataset acquisition, GPU, model invocation or borrowed friend server. P53 OPEN.
