# G9-P53 — KSGT Writer Review v0.2 (local, no-model prototype)

**Purpose:** Put the original KSGT-GENERATOR writing goal, existing KRC v0.7 partitive mechanism, and G8 protected-no-op human-paraphrase findings into an actually runnable **writer-facing candidate inspection**. It runs without a model, new corpus, Python, npm install, GPU, rented server or network. **Stage remains G9-P53 OPEN.**

## Run in repository root (Node.js 22+)

```bash
node experiments/g9-p53/writer_review_v02/cli.cjs \
  --briefs experiments/g9-p53/genre_authority_v01/fixtures/briefs.json \
  --id NAR12 \
  --draft experiments/g9-p53/writer_review_v02/examples/nar12_draft.txt \
  --reference experiments/g9-p53/writer_review_v02/examples/nar12_reference.json
```

This **prints only** document hashes, candidate IDs, changed character counts, caution labels and no quality claim. Full original text is not echoed to stdout. It returns protected **KEEP_ORIGINAL** and, if the supplied source group and declared writer intent warrant it, **KRC_EXPLICIT_REFERENCE**. The example uses **author-written synthetic Korean**, not human-naturalness gold; KRC's group ID and `authorConfirmed` are caller declarations, not author authentication. Exact source quotation only shows evidence of surface provenance, not referent truth.

To save an audit JSON, add `--out review.json`. **The audit contains your complete draft and candidates**, so choose a private local output path. To save a selected alternative, explicitly add `--select KRC_EXPLICIT_REFERENCE --ack EXPLICIT_AUTHOR_CHOICE --selected-out my_selected.txt`. The CLI refuses overwriting any existing output; you make the selection, not KSGT. `--models model_proposals.json` can import outputs created elsewhere; those proposals have **no automatic semantic or human-quality authority**, even if their data contains claims of human verification.

`review_questions` enumerates every fact F, unknown E, creativity license L, writer goal W, and genre risk. Answers are **UNADJUDICATED**; no fake automated claim-level correctness. `minimalChange` is a Unicode *code-point* edit span, not a morphological analyzer; particle agreement and naturalness still require human judgment. Neither preservation nor writing improvement can be inferred from lexical diff alone.

Run the tests without network or external packages:

```bash
node --test experiments/g9-p53/writer_review_v02/test/*.test.cjs
```

## Scientific significance and limit

The substantive contribution is a practical **non-destructive writing revision protocol**: preserve the original as a meaningful candidate; optionally construct one source-licensed group-reference alternate; show the exact edit to a writer; separate source evidence, explicit user choice, and independent sentence quality. The previous G8 S10 source-only KEEP/EDIT/ABSTAIN predictor failed (2/9); the v0.2 CLI does not pretend it learned when edits are beneficial. A future full generator can inject competent pretrained LLM proposals through an external adapter, while keeping source facts F, epistemic uncertainty E, creative permission L and writer intent W explicit and preserving human review.

No private corpus bytes, friends' servers, global npm/Python, or model downloads were involved. The six supplied briefs are **development samples**, not a blinded, natural-writing benchmark. Real writing benefit and correction precision are **NOT ESTABLISHED**.
