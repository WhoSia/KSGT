# KSGT G9-P59 v0.4 — Reproducible Local Verification Receipt

Date: 2026-10-09 (Asia/Seoul). Status: **LOCAL_SYNTHETIC_CONTRACT_PASS / REMOTE_CI_UNCONFIRMED / HUMAN_WORLD_CONTACT_HOLD**.

## Exact Git blob verification
All four local files had the same `git hash-object` SHA-1 as their GitHub originals:
- `reader_state_v02.cjs`: `63f9f6fe60947c1cda775bdda6e2e224376597e0`.
- `pipeline_v03.cjs`: `c832ee61862d1425b5ca8e156ffe1a4ab61de4a0`.
- `semantic_critic_v04.cjs`: `2c32d773438b596a79625839aa7cc4ae19c945a9`.
- `split_audit_v04.py`: `4dedf7a56f3971696eeeaef15de6225c25683519`.

Environment: Node.js v22.16.0, Python 3.13.5, Python standard-library sqlite3. No friend server, GPU, global package installs, or model calls.

## Actual commands and outputs

```sh
node experiments/g9-p59/pipeline_v03.cjs
# PASS — items=8, cases=48, adversarialHolds=24
node experiments/g9-p59/semantic_critic_v04.cjs
# PASS — rows=8, checkedCandidates=48, TYPED_CONTRACT_PASS=12, HOLD=4, REJECT=32
node experiments/g9-p59/semantic_critic_v04.cjs --emit-dataset | python3 experiments/g9-p59/split_audit_v04.py
# PASS — rows=8, scene_families=1, development=8, human_gold=0
```

Python independently verifies the Node-generated per-row SHA-256 JSON payloads and uses an in-memory SQLite query to detect source-scene overlap across splits. Its negative self-test mutates one item to heldout and expects a rejection, not a spurious pass.

## Empirical authority ceiling
- No general Korean semantic parser; only a fully specified limited Korean construction is accepted.
- A declared antecedent ID and authored 'full' briefing cannot be promoted into independent reader gold.
- There is exactly **one** source-scene family among the eight synthetic rows. All are `development`. There is **no valid heldout corpus**.
- No participant, naturalness judgment, writer revision, trained model, or comparison against a Transformer was executed.
- Remote GitHub Actions result is **not established** by local tests, nor by a GitHub status endpoint returning `statuses:[]` or a PR-scoped workflow lookup returning no runs.
- v0.4 contributes a typed contract and a meaningful data-leakage correction, not a new result in human style generation.

## Polyglot decision
[Research OS Polyglot Atlas](https://app.notion.com/p/3e9ef561cf9281008219e330bcce1b55): data-flow contract crosses JavaScript -> JSON -> Python/SQLite. Independent recomputation of SHA-256 verifies boundary integrity. A solver/logic language is deferred pending a specific expressiveness or verification bottleneck.

## Canonical links
- [P59 Notion](https://app.notion.com/p/3f4ef561cf928163a7a8c13d6481855e)
- [P59 code](../experiments/g9-p59/semantic_critic_v04.cjs)
- [Python/SQLite audit](../experiments/g9-p59/split_audit_v04.py)
- [Read-only CI](../.github/workflows/ksgt-g9-p59-v03.yml)

**Next experiment:** independently licensed source-scene families, explicit pragmatics/antecedent competition, reader knowledge manipulation with lexical-length matched controls, and a genuine model competitor before any naturalness claim.
