# R9.24 — Anchored Edit Notes for Single-Call Korean Revision

2026-11-16 KST · G10-P1 OPEN · Three previously exposed, author-synthetic development works.

## Replayed evidence

The original R9.23 provider archive (GitHub Actions artifact 13717104325, run 42715847103) was downloaded again. The ZIP is 11,579 bytes, SHA-256 `25ac4ffac1b0d0f71e09569f5ddc8a78e7e746df5066432d834077cce3eddb11`. It matches the R9.23 audit. The extracted `r923_complete.json` SHA-256 is `844284c907fdffdcdb8f696e6d70aaca37397b035a1f7d941127c5fc0e55073d`.

All three archive source and draft hashes match the replay inputs. All three regenerated generic **prompt hashes** also match the actual R9.23 generic requests. The original drafts and R9.23 outputs remain in their original archive. There is no change to the historical 196 + 63 + 36 count.

## What the long critique got wrong

| Work | Check against source and original draft | Why it matters |
| --- | --- | --- |
| Water | The critique called unknown upstream change unsupported (item 1), although U2 states it. Item 4 grouped the unlicensed promise of improved causal identification with the warranted limitation in F9 and treated the whole statement as additional interpretation. The draft also states the causal limit near both the opening and closing. | Editing by sentence alone can delete the warranted uncertainty or keep an unsupported inference. State the causal limitation once and close on the documented next-year monitoring plan. |
| Notice | All five critique items affirmed source facts. The conclusion missed that the closing asks “event” participants generally to use the portal and check future school notices. The source requires the portal for the circuit lab, permits orientation visitors without applying, and specifies no follow-up channel. | A correct list of details can coexist with a misleading instruction to the reader. |
| Scene | Item 1 objected to “비가 내리는 오후” despite F10 specifying continuing rain. Item 5 claimed the exact same sentence about walking toward different shelves occurred twice. It occurs once, with a looser paraphrase later. Both R9.23 edits retained a chronology that places the pointing before Hyunwoo's entrance or leaves its recipient unstated. F4 specifies Eunji pointing the board out to Hyunwoo. | Two distinct anchors can substantiate conceptual repetition. Preserving the recipient of an action matters even when individual actions survive. |

F and U refer to the 1-based positions in the existing fixture's facts and uncertainties. The table is a targeted author-side audit. It makes no estimates of overall critic error rates.

## One-call comparison

Each editor receives the entire original source and draft, the R9.23 generic system role and instructions, a 1450-token output cap, and temperature 0 with GPT-OSS 20B on Groq. The anchored arm additionally sees up to three notes. Each carries a kind, unique exact draft quotation(s), source IDs, a reader consequence and a revision proposal. For repetition two non-overlapping spans are required. Empty notes yield the same prompt. The compiler validates spans and references. It cannot decide whether an edit is semantically warranted.

The eight replay notes (3 water, 2 notice, 3 scene) were written by this session's assistant during development. The notes require preparation effort and disclose case-specific corrections. A comparison with generic editing measures the impact of adding this particular annotated assistance. It cannot separate the benefit of the format from the information added. A third arm that gives the same advice as plain Korean prose at a similar input budget would test the format increment. A source-disjoint set would test whether the method transfers.

Each executed arm records prompt/draft/source hashes and provider usage. Failed and truncated cells are retained individually, and the other arm runs independently. A completed response with a different paragraph count remains visible as a form deviation. Raw responses and prompts go to the supplied local output directory.

## What ran

- Exact-source dry run completed for 3 works and 6 planned revision calls. Actual R9.24 Groq calls and provider token counts are **zero and unmeasured**, respectively. The local attempt stopped at `GROQ_API_KEY_REQUIRED` before an API request.
- Ten regression tests passed locally, including simulated completion, interruption, and missing usage. A dry run and an injected provider are engineering checks.
- The eight note objects serialize to 847, 460, and 944 Unicode characters by work. The corresponding R9.23 critiques were 1545, 1083, and 1504 characters. These counts exclude the note wrapper, common prompt and completion and cannot estimate Groq token savings.
- This ChatGPT session manually authored three contextual revisions and preserved them with the notes. Copy was not produced by the CLI, paired with freshly generated generic controls, or blind-rated. The science example removes the unlicensed mechanism and states the causal warning once, the notice scopes the portal to the lab, and the scene places the pointing after the entrance and ends on continuing rain. Readability and comparative quality remain unmeasured.

## Replay

Use the original R9.23 run artifact and privately preserved R9.24 notes. R9.23 already exposes the developer source fixture in Git. The actual draft bytes and full notes remain in the research bundle.

```bash
node --test experiments/g10-p1/r924_anchored_revision_v01.test.cjs
node experiments/g10-p1/r924_anchored_revision_v01.cjs --dry-run r923_complete.json r924_anchored_notes.json
node experiments/g10-p1/r924_anchored_revision_v01.cjs --execute r923_complete.json r924_anchored_notes.json NEW_OUTPUT_DIR
```

The last command requires Groq credentials in the process environment. Compare factual strength, reader action or actor tracking, transition and ending, and revision-step prompt/completion tokens per work. Preserve R9.23 outputs as a historical reference. There were no new reader ratings.
