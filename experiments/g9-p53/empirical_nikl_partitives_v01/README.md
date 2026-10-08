# G9-P53 — Existing NIKL 2025 Partitive-Candidate Radar (No New Data Purchase)
**VERDICT: PRIVATE EXISTING-BYTE METADATA CONTACT / PARTITIVE GOLD HOLD.** No new model, no friend server, no private raw in public repository.

The user already has [NIKL ZA 2025 v1.0.zip in the KSGT Drive](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view). This existing artifact was temporarily read in a private local sandbox. Exact ZIP SHA-256 `c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d`, and the two JSON member SHA-256s are pinned in `nikl_partitive_radar.py`.

Use existing Python 3 standard library; no pip/npm, download, compute server or GPU. Run only with a privately held original ZIP:
```sh
python experiments/g9-p53/empirical_nikl_partitives_v01/nikl_partitive_radar.py /private/NIKL_ZA_2025_v1.0.zip \
  --aggregate /private/nikl_geujung_aggregate.json \
  --private-manifest /private/nikl_geujung_hash_only_candidates.json
```
Both outputs are exclusive-create; existing files are not overwritten. The **optional private manifest** has only opaque source-row hashes, document/sentence ordinal, source-context hash and ZA-row count, not raw text; still keep it private and do not publish row identifiers/hashes without custody review. The **aggregate-only JSON** is safe to retain in research metadata (no original sentence copied).

**Actual pinned private-byte readback:** 1,102 documents, 30,346 sentence rows, 50,247 *ZA annotation rows* (not equal to independently verified number of restored zero-pronoun slots); exactly **25 sentence rows with literal `그중`**, and **25 occurrences of `나머지`**. All 25 `그중` rows have a prior sentence in the same document; 17 have one or more ZA annotation rows. An adjacent sentence **does not establish a group antecedent**, and zero-argument annotation **does not label a partitive relation**. The `그중` rows are merely **candidate contexts for independent manual group/referent adjudication**.

This is not an independent test of the existing v0.7 reference grammar and cannot by itself establish Korean writing quality or the necessity of an edit. A rights-cleared manual evaluation would need to record the actual candidate group, antecedent text, inclusion/union, speaker context, ambiguity, and legitimate writer intention. Source text never goes into public CI. Remote read-only CI uses **hand-authored toy documents only** and tests defensive parser semantics.

Dataset roles must remain distinct: StyleKQC = multiple human short-directive realizations, NIKL ZA 2025 = omitted argument annotation + tiny partitive lexical candidate pool, independently adjudicated partitives = STILL MISSING, human writer KEEP/EDIT actions = STILL MISSING. Stage stays G9-P53 OPEN.
