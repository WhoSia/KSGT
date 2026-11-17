# R9.30 — Reader answers improve while intended document effects weaken

2026-11-17 KST · G10-P1 OPEN · Paired development study

[Frozen protocol](R9_30_GENRE_RELATIONS_PROTOCOL_20261117.md) · [Source fragments and work criteria](../fixtures/r930_genre_relations_v01.json) · [Groq run 44035659108](https://github.com/WhoSia/KSGT/actions/runs/44035659108)

| Arm | Strict reader task | Strict intended effect | Ambiguous effect | Material breach | Effect and sources both pass | Three paragraphs | Prompt tokens | Completion tokens | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Strong direct | 4/6 | 2/6 | 0/6 | 4/6 | 1/6 | 6/6 | 1,925 | 1,990 | 3,915 |
| Flat notes | 4/6 | 3/6 | 0/6 | 5/6 | 1/6 | 6/6 | 2,380 | 2,007 | 4,387 |
| Grouped notes | 6/6 | 1/6 | 4/6 | 5/6 | 0/6 | 6/6 | 2,488 | 1,907 | 4,395 |

All 18 responses completed. The work-criterion judgments were made under masked condition labels. A pass on the reader task indicates that the requested answer can be recovered from the text under researcher review. It is not a human reading or recall measure. The two assisted arms got the same memo strings. Grouping, relation labels and order were changed jointly. Their aggregate costs differ by just eight tokens, with 108 more prompt and 100 fewer completion tokens for grouped notes. Provider cost and quality are conditional on this single run per arm and work.

| Work | Direct effect | Flat effect | Grouped effect |
| --- | --- | --- | --- |
| Music-room relocation | Failed | Failed | Ambiguous |
| Library return handoff | Failed | Clear | Ambiguous |
| Ramp timers | Clear | Clear | Clear |
| Flowerpot droplets | Clear | Clear | Ambiguous |
| Folded paper | Failed | Failed | Ambiguous |
| Door handle | Failed | Failed | Failed |

## Source-tethered observations

**Notices.** The grouped music-room version recovers the useful route and correctly says “별관 문이 17시 10분까지 열리지 않는 경우에는 지도교사에게 문자.” The direct version instructs students to request help in advance because the door supposedly remains closed until 17:10. The grouped version still phrases the other condition as “17시 이전에 시작했지만 … 아직 입실하지 않은 경우,” allowing a reading in which a group has already started while still outside. Describe the reservation's scheduled start as a property of its time slot. The flat library notice opens with “먼저 책에 예약표가 있는지 확인하세요” and keeps the labeled route outside the time branch. The grouped text opens with the same exemption but lists labeled books again under each time rule and introduces an unauthorized exception procedure. Showing the two routes once helped more on this example than giving each planning relation a label.

**Explanations.** Every ramp passage supplies the two switch outcomes. The distinguishing outcomes were also in the shared facts, so no added-plan benefit can be identified. Each passage strengthens the inference somewhere. “더 큰 영향을 미친다” asserts a relative magnitude from a pattern that offers support, and “서로 독립적” introduces an untested assumption. The direct flowerpot passage preserves the difference between an increase supporting soil contribution and a similar count leaving that contribution uncertain. The grouped ending describes “이 관측과 비교 실험” as both proposed without measurement, so it folds the observed droplets in with the proposed comparison.

**Scenes.** The briefs this round use fragments, so the models had to compose sentences. The folded-paper grouped text narrows toward the index finger, then describes that very focusing and writes “끝.” It also invents eye movement and paper texture. In the door scene, grouped notes make the task's four-step chain recoverable while repeating travel and adding another metal sound. “그 소리와 함께 문이 닫히며 장면은 끝이 났다” puts an explanation after the intended last sound. A good controlled follow-up would keep the same actions and allow drafting that deliberately stops on the door handle, then compare the whole scene's pacing with a strong one-pass draft. This proposal is distinct from cutting the last sentence as a general rule.

## Decision

No genre meets the frozen continuation rule for grouped notes. R9.29's notice evidence motivates examination of the direct decision route, and R9.30 gives a counterexample to adopting a grouped prompt as that route's default implementation. More answerable prose can still be less effective as prose. A stronger next comparison should hold the semantic content constant while applying the plan to how a paragraph is realized. For notices, test a decision structure that leaves each branch once in the final text. For explanations, maintain the boundary between observed and proposed and tie each possible outcome to the exact level of support it supplies. For scenes, test how to carry a viewpoint movement into the prose and land the ending without an author-side annotation leaking into the text. Whole-document effect, semantic preservation and token costs remain separate outcomes. Keep the competent direct and flat examples as baselines.

The six briefs and genre interventions are researcher-designed, there is one generation per cell and no independent reader data. The genre result does not generalize across the model or genres by itself.

## Custody

Run head 092f315995d66b6b213d2a7fac7475e6f124dda8. Artifact 14307311858, 33,489 bytes. Provider ZIP SHA-256 2c118c32f0a3dcee48854dc7d95f70547481f403672d8c653ee5d587ee9da588. Plan SHA-256 953f129e04d5068a5de6f2ec655c702a6a5209e5edad4200b427781e3aa5edc0. Local paired and regression test set 28/28. Remote tests, generation and archive steps passed. Local verification checked the plan, 18 attempt receipts, 18 result identities and all returned text hashes. The evidence archive preserves the masked review, decode key, derived counts and original provider ZIP.
