# KSGT

KSGT (Korean Stylistic Generation Theory) studies meaning-preserving, context-sensitive, set-valued expressive Korean generation.

## Repository role

This repository is the **executable evidence layer** for KSGT. It is not the historical archive.

- **Notion** is the canonical research narrative, adjudication record, and lineage history.
- **Google Drive** stores papers, corpora, large source files, and historical research artifacts.
- **GitHub** stores only the compact artifacts needed to execute, verify, or replay the **current research lineage**.

Typical repository content:

- `experiments/` — current prospective preseals and stage-local executable packets
- `manifests/` — compact selections, hashes, and reconstruction metadata when needed
- `receipts/` — current execution and verdict receipts
- `scripts/` — replay, selection, hashing, and metric code when code is actually needed

Directories should exist only when they contain something useful. Do not create empty structure for appearance.

## Main-first workflow

`main` is the canonical working branch. Routine research updates go directly to `main`.

Create a temporary branch only when the work is genuinely risky: a substantial refactor, destructive schema change, or experiment that should not touch the current executable state until it passes. Merge or discard that branch promptly. Do **not** create one branch per stage, generation, court, snapshot, or historical checkpoint.

Scientific freezes are identified by commit SHA and, when useful, a tag. Branches are not archival snapshots.

## Repository hygiene — keep the live lineage, not the museum

**Continuously clean this repository. Keep only experiments and supporting artifacts that remain part of the current executable genealogy or are directly required to replay it.**

When an experiment, receipt, manifest, or script has been superseded and is no longer needed by the current lineage, remove it from `main`. Do not preserve obsolete stage trees merely because they are historically interesting or because they once supported a result.

Historical continuity is already preserved in **Notion + Google Drive**. Git commit history and tags may identify important executable freezes, but the working tree itself should stay small, legible, and current.

Practical rule:

> If deleting an old artifact would not prevent reproduction or interpretation of the current active lineage, it probably should not remain in the repository.

Audit this at every stage transition. Prefer a clean current-state repository over an accumulating genealogy dump.

## Data policy

Do not commit large corpora, PDFs, copyrighted source texts, private material, API keys, provider credentials, or redundant historical exports.

Store only compact identifiers, hashes, selection manifests, derived small tables, replay instructions, and stage-local evidence needed to reconstruct the current result. References to Notion/Drive are preferred over copying archival material into GitHub.

## Current active generation handoff

G9-P50 closed as **enabling infrastructure only**, without a PIA, trained SLM, or governor-effect verdict. Its retired 43-file source tree has been verified and stored in Drive under KSGT / 01_ARCHIVE_LEGACY / G9-P50. Git history retains source commit `9dfff80c2781a3e0e265b03cb47663f3c9e64716`.

**Current stage: G9-P51**, returning to a finite source-conditioned Korean revision candidate-set / matched U-vs-K governor experiment. Only stage-local executable files live in `experiments/g9-p51/`.
