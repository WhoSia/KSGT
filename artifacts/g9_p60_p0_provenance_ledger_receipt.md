# G9-P60 P0 — Actual P53 Origin, Graph Partition, Paragraph Ledger and Separate Writing Axes
**Date:** 2026-10-09 (Asia/Seoul). **Authority:** locally verified historical P53 ZIP bytes and native Python self-tests; GitHub Node CI pending independent remote run.

## Source truth, not inflated samples
Original **three** P53 Drive ZIPs were directly read and their twelve output-text SHA-256 hashes recomputed: **12/12 match**; 12 distinct output text hashes. Per-source linkage uses original brief and (where available) per-brief source SHA. Qwen3-4B has no separately verified per-brief source SHA; do not pretend its global frozen source SHA is the per-brief one.

| Prior original | Generated outputs | Original briefs | Archive SHA-256 |
|---|---:|---|---|
| [Qwen3-4B](https://drive.google.com/file/d/1vDGd3R_32J9EwbSK_ZyuvOBMossq8wu4/view) | 6 | EX09, EX10 | `e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46` |
| [Qwen3-8B B-only](https://drive.google.com/file/d/1pqDMGMt8drbz0pG3LiXbGMudiXi9gGCb/view) | 2 | SCI01, NAR02 | `57a7af352b9328f1ad5682e7fae3a893b5ef2948bfcc01e41437558ed0348951` |
| [Qwen3-14B B-only](https://drive.google.com/file/d/1o1iThI6yZ73fwKQvtO4fJ06MmwTBRVJR/view) | 4 | SCI01, NAR02, SCI02, NAR01 | `aad15005ad97ec5b9211798d783efb49deca1646ab804ccc22f5e377d3a3ce72` |

**Graph:** 6 source components. The archival Python component graph contains six SAME_BRIEF links plus two additional SAME_SOURCE_SHA links for SCI01 and NAR02. No exact duplicate text output or exact duplicate paragraph hashes were found among the twelve outputs/twenty-two paragraphs. This does *not* exclude semantic/near-duplicate contamination outside the audit.

**Retrospective partition:** pilot_train 3 components, pilot_dev 2, reserved_reaudit 1. All historical material exposed; `reserved_reaudit` is **not a genuinely fresh test sample**. Per-model outputs and paraphrases of the same source cannot straddle partitions.

## Paragraph ledger and actual new candidate edits

22 true paragraph hashes, derived by splitting twelve actual model outputs, are preserved in a metadata-only ledger. The original outputs themselves are **generations**, not validated before-after edits.

**Two provisional new edits** anchor to actual P53 Qwen3-4B EX09 K_TYPED_PLAN first paragraph (SHA-256 `a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596`):
1. `SOURCE_LABEL_REMOVAL`: four visible internal source-label introductions removed; new hash `925f378c6f3dbdac0cd66434fe3c93a23cebce4d8a97163bd92e9094a8284709`. **Epistemic support HOLD** because attribution removal might remove needed evidence.
2. `SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT`: same edit followed by authored, deliberate `두 상자` -> `세 상자` mutation; new hash `365ba48d2003328b93db628dce779d92bc66778af7b43c31cfc7503516875453`. **Explicit source-relative factual-drift negative control**; no preference claim.

The provisional candidates' full text remains in a private local reproducibility packet, not the GitHub repository. The [public hashed candidate manifest](../experiments/g9-p60/provisional_edits_v01.json) records their source base, editing operation and uncompromised evidence limitations. Actual independently admitted revision cases: **0**; independent human Korean writing preferences: **0**.

## Independent toy-factorial falsifier
Four authored candidates cross protected typed subset count 4/5 and a repeated-connective surface proxy. Counts: 2 typed-fact-preserving, 2 surface-proxy-smoothed, including **1 polished-looking but count-damaging** control. The surface proxy **does not measure human style quality**. No fact-vs-style correlation, preference change, or model superiority is inferred.

## Test results and their precise scope
- Local, full stdlib Python ZIP auditor: **PASS** (12 actual outputs; 6 components; 22 paragraphs, five invented negative controls, no real revisions/human labels). It was re-run against mounted Drive ZIPs.
- Local paragraph court and provisional-edit builder: **PASS** (4 synthetic factorial cells, 2 provisional real-P53-anchored edits, deliberate quantity-drift negative control). Full private text stayed local.
- GitHub [P60 Node implementation](../experiments/g9-p60/revision_evaluation_v01.cjs) and [read-only CI](../.github/workflows/ksgt-g9-p60.yml) are committed, but **the exact committed Node code has NOT independently produced a remote success receipt yet**. Do not claim the Python PASS certifies that Node execution. Later Actions success must be read before upgrading CI status.
- KoSEnd actual public original blob inspection from inherited P59: easy/intermediate/hard JSON **15,000 rows each**, with `usage_type`, `sentence_options`, `sentence_answer`, `usage_options`, `usage_answer`; no independent per-row annotator provenance. GOLEMcoref Korean work split 24/3/3; distinct *task authority*, not human paragraph preference.

**Official line:** G9-P60 OPEN, G9-P59 research inheritance retained, G9-P58 last formally CLOSED. Friend's server not used; local `C:\\KSGT` archives not opened.
