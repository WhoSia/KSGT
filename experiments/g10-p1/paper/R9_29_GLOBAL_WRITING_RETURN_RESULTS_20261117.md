# R9.29 — Whole-document writing gains concentrated in practical notices

2026-11-17 KST · G10-P1 OPEN · Author-side development study

[Protocol frozen before the run](R9_29_GLOBAL_WRITING_RETURN_PROTOCOL_20261117.md) · [Six briefs and scoring criteria](../fixtures/r929_global_writing_v01.json) · [Groq run 44033126001](https://github.com/WhoSia/KSGT/actions/runs/44033126001)

## Results

All 18 calls returned complete provider responses. Full-document structure was checked separately from provider completion. The author-side review was recorded under masked condition labels before decoding against the six frozen work criteria. No independent audience assessments were collected.

| Condition | Strict reader task | Strict positive effect | Material factual or license breach | Three paragraphs | Input tokens | Completion tokens | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Strong direct | 3/6 | 2/6 | 4/6 | 5/6 | 2,400 | 1,826 | 4,226 |
| Flat notes | 4/6 | 2/6 | 5/6 | 5/6 | 2,904 | 2,044 | 4,948 |
| Paragraph map | 4/6 | 4/6 | 5/6 | 6/6 | 3,006 | 1,744 | 4,750 |

Ambiguous positive effects were 0/6, 1/6, 1/6 respectively. Ambiguous task answers were 2/6, 1/6, 1/6. A work can satisfy an effect criterion and still violate source facts. The map used 198 fewer total tokens than flat notes (−4.0%) and 524 more than strong direct (+12.4%). Map input tokens were 102 above flat notes. One run per cell is insufficient for a cost or latency generalization.

| Work | Strong direct | Flat notes | Paragraph map |
| --- | --- | --- | --- |
| Lab relocation | Fails | Fails | Clear |
| Print handoff | Fails | Ambiguous | Clear |
| Lamp measurement | Fails | Fails | Fails |
| Water tray | Fails | Clear | Clear |
| Train tickets | Clear | Fails | Ambiguous |
| Bicycle bell | Clear | Clear | Clear |

The secondary reader-task counts are work-criterion pass counts. They do not record actual recall. These six works were authored for this intervention, and the positive effect criteria in some cases reward information placement that the shared brief requested. The measured effect is therefore task-specific.

## What each example contributes

- **Lab.** The map opens with the new destination, puts the already-started exception in the middle and gives the conditional text deadline at the end. Flat notes and direct repeat or broaden routes in their closing paragraphs. All three leave “오후 4시 이후에 … 예약” open to a booking-time reading. That ambiguity is already possible in the authored source sentence. The map also claims the main lab is temporarily unavailable despite the allowance for ongoing sessions. These are actionable findings about both the source brief and its realization.
- **Print.** The map distinguishes the workbench pile from the handoff-bin pile and identifies the morning worker's check. The direct output sends the morning worker to the wrong piles. Flat notes invent a right-hand side and morning printing duties. The map itself implies morning tidying in addition to the stated check and leaks an editorial sentence about joining the two paths in one paragraph.
- **Lamp.** All three supply the measured values and fail to tell the reader that swapping positions helps distinguish a sensor reading difference from a position effect. In the map output the swap survives, but the setup gains a second 10 cm distance and a lamp attachment, and the ending focuses only on position. The tool needs a way to carry a semantic relation across the whole text. The presence of a closing question is too weak.
- **Tray.** Both note conditions connect the photo and the two pathways, then ask a two-path question. The direct output makes an unsupported statement about a missing droplet trace at the window. The flat version invents extra photographs by the fountain. The map changes weighing at the start and end to weighing at the start only. Equal strict effect on this work coexists with different errors.
- **Tickets.** Strong direct stays close to the source and ends on the shut door, without explaining anyone's feelings. The map adds a shadow, pocket sound and reflected light before an extra closing sentence about silence. Flat notes also invent metallic tickets. The strong-direct text is a positive production example. Because its language nearly repeats the source sentences, it warrants a later task in which good rhythm requires active composition from factual notes rather than near-verbatim copying.
- **Bell.** All three preserve the passage and end on doorframe contact. The map alone places the final contact in its own third paragraph. The current marks establish a format difference. There is no demonstrated preference between the two paragraphings.

## Direction and decision

The map meets the +2 strict-effect count versus flat notes. Both gains are in one genre, and material breaches are 5/6 versus 4/6 for strong direct. The frozen advancement rule therefore fails. Keep paragraph maps as a practical-notice development candidate. Do not promote this map to a cross-genre default.

The diagnostic and local-edit work remains useful as a way to protect meaning and local rhythm. The program instead chooses complete prose as the primary comparison and records positive mechanisms, strong comparator examples, costs, and counterexamples in the same study. Two distinct generation hypotheses follow from these texts. For notices, arrange information around the decisions the reader must make and encode the timetable as start-time, scope and condition, with the same clear facts for both comparators. For narrative, preserve a separately chosen expressive effect and give the generator genuine freedom over syntax, pacing and focus within an explicit, work-specific license. Compare direct generation against that realization intervention using sources whose wording cannot be copied into a finished scene. For explanatory prose, a minimal follow-up should put competing interpretations and the observation that separates them in the same plan relation. Reserve any local preference query for a difference that remains meaningful after reading the complete document.

## Evidence custody

Run head e1ead61946e7baaa3cbbab87096df0064bde2d26. Provider artifact 14305539157, 32,830 bytes, SHA-256 b4985da7f918ec0939ad8a18b1583959ecc2162e7a71934a57fb78e8fa4ac142. Plan SHA-256 ee70b722ebe3b920123ce6aaefd5d195ed0f739d5db30c730e46f51e5968c4f6. Plan structure, all 18 attempt/result pairs and returned text hashes checked. Local paired and regression tests passed 26/26, and the remote regression step passed. Raw outputs and the per-cell review live in the evidence ZIP outside the repository.
