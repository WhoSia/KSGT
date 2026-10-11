# KSGT development instructions

## Permanent GitHub authorship rule

User instruction, 2026-10-11: github-actions[bot] may run CI but must never author or commit code, push changes, create tags, or merge pull requests.

Before repository mutations, verify the authenticated human repository actor. Audit both Git author and Git committer identities across the complete reachable active branch, with pagination. Verify both identities on every future commit before moving its branch reference. CI remains read-only; scan workflows for write permissions and repository writeback.

Preserve legitimate human-authored commits. If bot-authored or bot-committed history is found, record and report it in English, stop scientific promotion, and do not rewrite history automatically. The user's no-automatic-rewrite instruction overrides any older automatic-cleanup doctrine.

Keep PR #1 Draft and do not merge into main without explicit user authorization. CURRENT_STAGE remains G9-P60 unless a separate legitimate stage transition is authorized.

Corpus code, tests and engineering documentation must be English. Original synthetic Korean test fixtures are allowed. Never publish licensed corpus prose, private source IDs, private annotation packets, reviewer personal records, local credentials or large derived text datasets.
