# G9-P53 — Offline Writer Intent Authority Gate v0.3
**OPEN / ENGINEERING PROBE / NOT HUMAN PREFERENCE OR KSGT SUPERIORITY.** This is a new v0.3 guard **above** historically preserved `writer_review_v02`; do not retroactively overwrite v0.2's tests or claims.

**Bug fixed:** The v0.2 reviewer could accept a low-level `directive.authorConfirmed:true, objective:CLARIFY` from a caller and offer an explicit `그중` replacement even when the high-level `W.reference_policy` was only `CONTEXTUAL` (not a writer's actual clarity preference). That flag is caller-provided and not identity proof. The v0.3 gate now refuses the override. High-level `KEEP` vetoes a lower CLARIFY. High-level `CONTEXTUAL` => keep-only plus an authority-hold warning. Only a high-level `CLARIFY` plus matching lower directive and exact group/source quote yields a **proposal**, never automatic PREFER or human-quality judgment.

**G8 S11 authority ladder conserved:** A0 visible source alone does not license intervention, A1 context/source witness permits local proposals/review, A2 same-context independent human comparative preference remains uncollected, and A3 actual human editing/choice remains unverified. Model self-reported quality/human labels and `authorConfirmed` flags cannot promote to A2/A3. A user-selected alternate remains a caller declaration; no independent identity verification is performed.

Run from repository root without installing anything:
```sh
node experiments/g9-p53/writer_review_v03/cli.cjs \
 --briefs experiments/g9-p53/genre_authority_v01/fixtures/briefs.json \
 --id NAR12 \
 --draft experiments/g9-p53/writer_review_v02/examples/nar12_draft.txt \
 --reference experiments/g9-p53/writer_review_v02/examples/nar12_reference.json
```
NAR12 has `W.reference_policy=CONTEXTUAL`: v0.3 returns **only KEEP_ORIGINAL**. To see an explicit alternate, *make a separately documented brief copy* declaring `W.reference_policy=CLARIFY`, while retaining the source-group witness. `--out` contains private full text locally and must be deliberately chosen; stdout contains hashes/IDs only. `--select` and `--ack EXPLICIT_AUTHOR_CHOICE` create a **new** selected file; never overwrite original.

`node --test experiments/g9-p53/writer_review_v03/test/*.test.cjs`

No new remote LLM calls, no personal real-writing sample, no borrowed server, no external Python/npm, and no automatic Korean semantic/naturalness evaluator. See G9-P53 canonical Notion and `writer_review_v02` README for full limits.
