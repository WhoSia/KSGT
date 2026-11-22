# KSGT G10-P2 — R5m/R5m.1 artifact custody reconciliation (2026-11-23)

## Correction and scope

The earlier R5m response offered a sandbox ZIP and stated that the source was not yet on GitHub or Drive. That was correct **then** and is now superseded by the verified uploads below. The user explicitly required all generated work to be archived. This reconciliation audits the **actual files visible in this conversation's container and generated-file inventory**, not inaccessible historical sandboxes from other chats. No unverified historic storage is marked complete.

## Google Drive readback

- [Original R5m folder](https://drive.google.com/drive/folders/1vGOnNQX0KHLlTMU8uChPq7KKUAioz-NF): ZIP, `cp5_verify.py`, `test_cp5_verify.py`, README, original CP5 manifest, original development receipt. **6/6 actual files uploaded**, all six metadata byte sizes confirmed by both Drive connector and Library re-list. ZIP size **7,174**; local ZIP SHA-256 `2289aa8e357965fb9f6433a7f25474759d17dbd9087e5d7990c51fe00972fef6`.
- [Hardened R5m.1 folder](https://drive.google.com/drive/folders/1aX_XB82o6Czw2q7DdHLPivlyf0ru-_qM): updated verifier, updated 13-test suite, README, original manifest, development receipt, ZIP and this separate custody JSON receipt. **7/7 actual files uploaded**. ZIP size **8,192**, local SHA-256 `bb60a54e51a2d9ea85e8ff690b307b3b63ab08e9e38ccbb4e1ba9aab4ec77972`. Custody JSON local SHA-256 `7163f43a3f797362d49330f2a0ed7f6100f69527e691b39da9eea673a965a4e7`.
- Original existing P45 CP5 **10 large data fragments** already present in a separate Drive folder; no attempt to copy 857MB into GitHub or create unnecessary archive duplicates.
- Drive readback here establishes **object existence and file-size metadata**, not complete cold-download SHA for every remote item. The local file hashes in receipts are source-side values. Never claim remote byte hashes checked unless cold-retrieved and rehashed.

## GitHub human-identity source custody

The original local source was committed under `experiments/g10-p2/r5/` on `research/g10-p2-reader-state-coupled`:
- `cp5_verify.py`, GitHub verified blob SHA `d649dd40e0150bdd7e65539aa54125be27448868`, matching exact local `git hash-object` before hardening;
- `test_cp5_verify.py`, original blob `bb8c6a15f734e45588f126ead2c851e60f355cc9`, also matched local.
- Hardened GitHub `cp5_verify.py`: blob SHA **`4285660db9b7644bd017d10550b2c354131cfc32`** equals the new exact local file git blob SHA.
- Hardened GitHub `test_cp5_verify.py`: blob SHA **`362a1ec092dd5341e9592b3b9b3ff52e8d88e483`**, likewise byte-identical to local.
- [CP5 verifier README](CP5_VERIFIER_README.md) and prior [R5m report](30_R5M_CP5_STREAMING_VERIFIER_MANIFEST_AND_SYNTHETIC_REGRESSION_20261123.md) retained; no source-corpus payload or restricted original Korean text on GitHub.
- All writes are human account `WhoSia`, not `github-actions[bot]`. No branches created, no main rewrite, no automatic bot commits.

## Hardened engineering tests and residual risks

`python -m unittest -q test_cp5_verify.py`: **13/13 PASS on synthetic gzip/jsonl**, including missing part, corruption, out-of-order sequence, filename traversal, wrong SHA, incorrect row total, boolean-manifest type, oversized row, symlinked part and receipt path nested under source directory. The verifier caps JSONL line reads at **64 MiB** and rejects receipts anywhere under the source part root. Byte-exact local code duplication checked by git blob SHA.

**Residual:** when `--rows` is used, the same 10 files are opened a second time after hash verification. An external process could mutate them between the two passes; for scientific use, run against immutable snapshots and retain original receipt. No actual CP5 original part downloaded by this chat or verified. Historical total 12,352,778 representation records is a manifest assertion, **not 12m rows freshly parsed**.

## Epistemic and operational decision

G10-P2 stays **OPEN / QUALITY_HOLD**, 340 historical actual model calls, 0 new calls, 0 human ratings, 0 training. Source evidence server audit completed separately, but the five Windows-local report paths are not automatically accessible here. R5m and R5m.1 do **not** establish quality improvement in full Korean prose; CP5 EDF data are descriptive register/genre surface features, not natural collocation gold or coreference gold.

**NEXT:** Full CP5 remote fragment hash and streaming data readback on a genuinely authorized machine; source-disjoint real Korean original→revision admission with separate meaning/fidelity and blind native reader evaluations. Avoid more ad hoc semantic-rule guards merely to manufacture perfect toy pass scores.
