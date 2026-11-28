# R5n.1 — Evidence-aware Korean writing source-work split preflight

This tool is a **fail-closed candidate partition proposal**, NOT a proof of source-work or author independence. No actual NIKL or private writing texts are read. Input is only explicit external ID/rights/exposure assertions, all of which still require source audit.

## Contract

The `source_work_split.py` tool groups records via **explicit** identical work IDs, identical SHA-256 byte digests, declared parent/child links, and, by default, identical author IDs. It partitions components as TRAIN/DEV/TEST deterministically using a fixed seed and component fingerprint, quarantines an entire component on uncertain ID, rights, previous exposure, malformed revision role, or unresolved parent. It never counts different revisions of the same source as separate test works.

The output field `independence_claim=false` remains false even if all fields are populated because declared IDs cannot establish their own truth, and semantic/near-duplicate relationships are not detectable from this input. Real dataset adoption must independently verify rights, author identities or authenticated pseudonyms, shared work ancestry, multi-edition leakage, annotation overlap, and near-duplicates. Any unproven family relationship must be quarantined manually in the true evaluation set.

## Run

```bash
python source_work_split.py --input rights_cleared_ids_only.json > proposed_partitions.json
python -m unittest -v test_source_work_split.py
```

Input JSON format is an array of objects with `item_id`, `work_id`, optional `author_id`, optional `raw_sha256`, optional `parent_item_ids`, `rights: "APPROVED"`, `exposed: false`, `revision_role: "ORIGINAL"|"EDITED"`. No original text should be put into this file or in a public repo. `APPROVED` is a **caller assertion**, not an automatically verified license.

## Test evidence / limitations

11 synthetic unittest probes pass locally. They include work-version co-grouping, author-group co-grouping, explicit parent linkage, missing parent quarantine, missing author quarantine, previously exposed contamination propagation, rights hold, duplicate IDs, identical source hashes, deterministic input-order invariance, and refusal to assert independence. **0 real original-edited Korean works have been independently admitted.**

This work is upstream of the G10-P2 R3/R4 reader trial and explicitly prevents the project from calling artificial multiple revision rows independent held-out works. The strong direct GPT-OSS 120B baseline remains required once real data are admitted. No model calls, new human ratings, training or corpus data modifications in this experiment.
