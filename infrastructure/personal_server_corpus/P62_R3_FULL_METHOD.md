# P62-R3 full frozen-cohort machine court — execution contract

This is a machine-only extension to P62_R3_METHOD.md. It is not independent human semantic validation and does not change CURRENT_STAGE (G9-P60) or authorize merging Draft PR #1.

p62_r3_full_court.py processes the immutable P62 frozen source census: 886,879 JSON structures, 10,698,118 paragraphs and 19,255 literal targets, retaining documents with zero targets. It compares inherited structural/lexical rankings to pre-target-accessibility/recency/repetition proposals and eight synthetic post-target suffix edits per target. Prefix choices are required to remain invariant under those edits. Legacy choice flips are an instrument-dependence measurement, not a measure of reference correctness.

The program reads the P62 frozen replication-source SQLite, the frozen P62 private work-key SQLite and compressed paragraph shards. It does not write to any of them or to the live ingestion database. It creates a separate directory, seals both source database SHA-256 digests plus all executing code digests, and uses SQLite per-shard atomic checkpoints with exact SHA-256 verification on resume. It refuses an existing output directory for first execution, modified code/input on resume, changed committed shard, and less than 60 GiB free space.

Private first invocation:
python p62_r3_full_court.py --root C:/KSGT_SERVER --out C:/KSGT_SERVER/80_EXPORT/p62_referential_grounding_20261011/R3_FULL_NEW --max-new-shards 1

Private continuation:
python p62_r3_full_court.py --root C:/KSGT_SERVER --out C:/KSGT_SERVER/80_EXPORT/p62_referential_grounding_20261011/R3_FULL_NEW --resume

First verify the existing active corpus ingestion controller, storage/I-O budget and source SHA. Do not start a competing ingestion controller. Inspect one-shard receipts before removing the bounded shard limit.

Final completion checks exact census and writes a result SHA-256 manifest. Fractional mechanical outcomes use document-equal means with clustered bootstrap resampling by recorded source-work components. This is a previously exposed, nonrandom development corpus; no true antecedent recovery, source-work independence, or human-preference claim follows. A complete private execution is NOT ESTABLISHED by source-only CI.

Code and tests in this commit may be shared publicly. All source prose, private identifiers, annotation packets, source databases and computed private result files remain on the user's approved personal server. Human evaluation stays final-stage.
