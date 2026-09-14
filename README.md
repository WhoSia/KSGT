# KSGT

KSGT (Korean Stylistic Generation Theory) studies meaning-preserving, context-sensitive, set-valued expressive Korean generation.

## Repository role

This repository is the executable evidence layer for KSGT. The canonical research narrative and adjudication record remain in Notion; large source files and corpora remain in Drive.

The repository keeps only compact, replayable artifacts:

- `experiments/` — prospective preseals and stage-local manifests
- `receipts/` — compact execution and verdict receipts
- `scripts/` — replay, selection, hashing, and metric code when code is actually needed

## Workflow

`main` is the canonical working branch. Routine research updates go directly to `main`. Temporary branches are used only for risky experiments or substantial refactors and are merged or discarded promptly.

Scientific freezes are identified by commit SHA and, when useful, a tag. Branches are not used as archival snapshots.

## Data policy

Do not commit large corpora, PDFs, private material, API keys, or provider credentials. Store only identifiers, hashes, selection manifests, derived small tables, and replay instructions needed to reconstruct a result.
