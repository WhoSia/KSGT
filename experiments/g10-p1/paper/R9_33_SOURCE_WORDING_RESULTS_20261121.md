# R9.33 — Finite Source Clauses in Generation and Revision

Six synthetic Korean scene briefs, two wording conditions, two modes, and two runs on the same cohort. The generation pair received identical prompts except one source fact. The revision pair additionally received the same full draft. Scope covers one source line per work. Spelling out the line jointly changes morphology, lexical interpretation and prompt tokens. GATE and KEY are exposed R9.31 drafts; CURTAIN and LID are constructed analogues. STAMP and COAT have clean revision drafts.

## Execution and review

- Initial protocol and code: 8fe959bd3be0647214456ad94ec49eac1e15c892da.
- Initial run [44780743596](https://github.com/WhoSia/KSGT/actions/runs/44780743596). The parity rule put compact first in every generation pair and explicit first in every revision pair. Treat it as an exposed diagnostic. Artifact 14650719797, 35,788 bytes, SHA-256 39cafd85097e66d408a3fdc6a1a5b8ddc1e41622aefffcd6f58acd354f5fc728.
- Corrected code and order test: ab7fa7b22b46d64f9031d310923dc92d049678d2.
- Balanced run [44781047854](https://github.com/WhoSia/KSGT/actions/runs/44781047854). Each wording went first in three of six pairs in each mode. Artifact 14650912125, 35,750 bytes, SHA-256 b3c52b080371157d1765d2fa2e72c1a2b8260894568a84892aea71267f50cf7e.
- Both runs returned 24/24 stop completions using Groq GPT-OSS 20B. Both remote safe plans match local bytes. Per-result attempt, prompt, revision-input and output hashes verify. Identical prompt hashes across all 24 matched cells. Twenty output texts were byte-identical across the two runs. Balanced-run plan hash 204d8bd4c0a85420d0c3fbaaa9718683b06ae479a4481bdf45579f5f27c0b310. Local selected-suite tests 34/34.
- The investigator reviewed A/B outputs and reused the same rating for identical strings. First-round masking had an accidental 11-to-1 A-slot imbalance. Second-round slots were balanced within mode. The reviewer had seen the first round and distinctive word choice could reveal the arm. No independent ratings.

## Balanced run

| Endpoint | Generate compact | Generate explicit | Revise compact | Revise explicit |
| --- | ---: | ---: | ---: | ---: |
| Target event grammatical and faithful | 4/6 | 6/6 | 3/6 | 4/6 |
| Entire scene faithful with no conspicuous grammar fault | 1/6 | 1/6 | 3/6 | 4/6 |
| Uncertain entire-scene judgment | 0/6 | 2/6 | 0/6 | 0/6 |
| Clean draft returned byte-for-byte | — | — | 1/2 | 2/2 |
| Input tokens, sum | 1,788 | 1,795 | 2,472 | 2,479 |
| Completion tokens, sum | 752 | 749 | 629 | 810 |

Initial-run target counts were 3/6 vs. 6/6 for generation and 3/6 vs. 4/6 for revision. Entire-scene counts were unchanged in the balanced rerun. The first run is not a second sample of works.

In both runs, spelling out the target in GATE repaired the opening-and-holding action when generating from scratch, while leaving the malformed final sound intact. In revision, it removed the noisy interpretation but introduced an action of putting a hand inside instead of holding the door. In KEY the full source clause removed the copied 문을 엶 in both modes. KEY's revised scene passed all checks; its generated scene retained an uncertain wait/arrival order. Both wording conditions could generate the CURTAIN target faithfully, yet both failed to repair the planted noise in the draft. LID's unchanged first fact appeared as 앞으로 감 in both generation arms. STAMP likewise shows that making one line finite does not ensure the model converts nearby notes into prose.

## Decision

A finite clarification of a genuinely ambiguous source line can be a useful optional input preparation step. Retain both source forms and their explicit identity. This pilot supports no mandatory rewrite of raw notes or general prose gain. Whole-draft evaluation on unseen work should have priority over further tuning this fixture family. Rate source fidelity separately from usability for the intended reader, with genuine ties and no-edit choices.
