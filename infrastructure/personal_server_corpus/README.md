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


The optional `context_surfaces_bounded.py` uses indexed metadata lookups instead of an all-document Python dictionary and writes separate `_BOUNDED` reports and annotations. Its measurement definitions are unchanged. Final registry status and checkpoint hashes are checked by the receipt integration regression. A local continuation controller may orchestrate verified cohort expansion; consult actual local phase receipts before treating any planned expansion as executed.

## Proposed P61 directional evidence

`p61_directional.py` requires a private predeclaration and frozen completed-cohort SQLite inputs. It checkpoints paragraph shards in a separate private run and verifies their SHA-256 on continuation. It preserves exact source structures and adds NFC/whitespace-normalized SHA-256, SHA-512 and byte-length lineage diagnostics. Conservative linked-source components prevent known-key split leakage; repeated titles never establish identity. Content equality is not certification of a real-world source work.

The primary two/five-unit past-minus-equidistant-future estimand averages target differences within each eligible document, then gives each document equal weight. Numeric cue presence, counter-compatible candidate proxies, lexical persistence, topic-balanced and central-position views, and non-target pseudoanchors remain distinct diagnostics. Cluster bootstrap uncertainty moves linked source versions together. Rule-generated candidate packets contain source offsets and null ground truth; independently adjudicated semantic accuracy remains unavailable.

`p61_segmentation.py` implements a separately declared, bounded paired source/orthographic-proxy sensitivity. `test_p61_directional.py` covers synthetic positive, reversed and negative controls, exact document weighting, source normalization, conditional denominators, null gold and interrupted checkpoint continuation. P61 is proposed; CURRENT_STAGE.json remains P60 and no stage closure or independent human validation is implied.

## Proposed P62 span grounding

P62 adds systematic frozen-source lineage audit, precise candidate spans, a private prediction-blind A/B review instrument and predeclared document-equal directional diagnostics. See [P62_METHOD.md](P62_METHOD.md). Use p62_annotation.py for strict reviewer admission; self-attestation never establishes independent human gold. Inferred omissions have no observed span. All actual semantic validation remains HOLD until independently evidenced judgments exist.

The private execution exposed circular compatibility controls: the post-target quantity defining a counter can also become its own future cue. Anchor exclusion and particle-boundary sensitivities preserve these falsifiers rather than promoting another proxy. Original P61/P62 outcomes remain separate. CURRENT_STAGE remains P60 and PR #1 remains Draft.



## P62-R2 independence and annotation readiness

See [P62_R2_METHOD.md](P62_R2_METHOD.md) for the exhaustive outside-graph CSV audit, duplicate-target contract, revised pseudoanchor admission, sealed source-work review split and private 64-work pilot. Human-ground-truth fields remain null; independently qualified semantic validation is HOLD. Use p62_r2_response.py with an exact frozen packet binding, and retain all earlier P62 falsifications. Read the repository root AGENTS.md for the permanent human-only Git author/committer rule.


## P62-R3 typed provenance and large-cohort machine falsification

Read [P62_R3_METHOD.md](P62_R3_METHOD.md) and [P62_R3_FULL_METHOD.md](P62_R3_FULL_METHOD.md). Source-only components include p62_r3_identity.py (typed exact-text relations, unique Unicode span transport and conservative split-exclusion), p62_r3_inference.py (three suffix-blind pre-target candidate policies), p62_r3_machine_court.py (sealed 2,254-item R2 development-packet diagnostic), and p62_r3_full_court.py (read-only, resumable 886,879-structure / 10,698,118-paragraph / 19,255-literal-target frozen cohort court).

New original synthetic tests test Unicode, boundary and repeated-subset failure, post-target noninterference, inherited-policy leakage, source-graph non-equivalence, private packet custody and the single-document full-cohort measurement kernel. Passing GitHub CI does not execute the private full cohort: local private input SHA-256 checks, controller and disk checks, and the final R3 machine receipt are required. All actual semantic recovery and independent human validation remain HOLD. Final human evaluation is intentionally reserved for a much later frozen confirmatory phase. CURRENT_STAGE stays G9-P60; PR #1 remains Draft; follow root AGENTS.md for permanent human-only Git authorship.
