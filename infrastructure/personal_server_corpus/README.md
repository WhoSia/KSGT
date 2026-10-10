# KSGT personal-server corpus infrastructure

This directory contains private-data streaming tools for the owner-authorized
Windows research server. Public repository contents are source code and synthetic
tests only. Never commit corpus prose, document IDs, metadata, local receipts,
SQLite files or corpus shards.

## Run and storage

Use the existing interpreter. No global installation is required.

```powershell
python pipeline.py --root C:/KSGT_SERVER --out C:/KSGT_SERVER/70_RUNS/NEW_RUN --fraction .01
python pipeline.py --root C:/KSGT_SERVER --out C:/KSGT_SERVER/70_RUNS/NEW_RUN --fraction .1
python source_dependence.py --run C:/KSGT_SERVER/70_RUNS/NEW_RUN
```

The first run requires the fresh archive hash ledger produced by audit.py in
70_RUNS/corpus_sprint_20261011_integrity. Review corpus rights before invoking
text ingestion. The owner confirmed approved private KSGT use in this sprint;
this is not an independently read signed agreement or redistribution permission.

Outputs reside under 40_CORPUS/documents, paragraphs and sentences, segregated by
run. JSON forms are preserved unchanged once per strict text structure in each
run. Documents contain metadata and all original unit IDs. Sentence shards retain
Unicode-codepoint offsets for JSON and source sentence IDs for CSV. Orthographic
segmentation is a proxy, not linguistic or source sentence gold. CSV text is not
duplicated in sentence shards.

SQLite records occurrences, source variants, complete-member checksums and shard
checksums. 70_RUNS holds private manifests, logs, checkpoints and descriptive
experiments. Larger fractions may extend a completed cohort with unchanged code,
inputs and limits; committed members are skipped. Interrupted uncommitted members
are replayed. Do not change configuration or source inputs within a run.

## Safety and reproducibility

Original ZIPs are opened read-only; there is no full archive extraction or cleanup.
Processing uses one worker, 64 KiB parsing reads, 16 MiB source-object limits and a
60 GiB system-volume reserve. The reserve is provisional. Output shard sizes follow
members; small written-source members create many small shards, a known packaging
limitation. The small real pilot verified forced process interruption and logical
restart equality; power-loss and reboot durability are not demonstrated.

The full archive SHA-256 ledger is fresh. Restart checks file size and mtime against
that ledger; it does not rehash every source archive on each invocation. Complete
members reach ZIP EOF and validate CRC, with SHA-256 over decompressed bytes.
Partial capped pilots do not claim full member integrity.

Strict identity hashes the unchanged list of forms, preserving source boundaries.
A separate cross-format diagnostic applies NFC, removes Unicode whitespace and
concatenates units while retaining HTML and punctuation. This diagnostic can merge
different boundary structures and must never be called semantic equivalence.
Same-ID variants remain available; metadata-only similarity never licenses merge.

## Measurement limits

The source-dependence experiment compares literal reference surfaces and
orthographic endings under four duplication policies. Selection uses smallest
members first within each release. Fractions refer to declared data-member bytes;
complete members can exceed the requested fraction. These are nonrandom engineering
cohorts, not population estimates.

Use actual document date metadata, preserve partial dates, and never substitute a
filename year. HTML removal is an explicit feature view; original forms remain
unchanged. No antecedent gold, recoverability score, human preference, writing
model, causal AI effect or evaluation holdout is created.

## Tests

```text
python -m unittest discover -s infrastructure/personal_server_corpus -p "test_*.py" -v
```

Synthetic tests cover genuine incremental JSON objects, CSV grouping, missing IDs,
truncation, escaped strings, trailing bytes, boundary variants, changed-text and
markup negative controls, and source-custody offsets. Private verify_restart.py
performs a separate bounded real-data interruption test. G9-P59/P60 remain open.

