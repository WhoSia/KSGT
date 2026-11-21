# G10-P2 R5b — Lexical Orchestra / Genre Realizer: 24 new actual writer calls, 32 complete texts

Date: 2026-11-21 KST. Official phase remains **G10-P2 OPEN**. **Development intervention complete**, no independently demonstrated writing-quality superiority. **Do not confuse a genre-conditioned prompt with a new neural architecture or learned Korean Realizer.**

## 1. Exact originals, authentic provider receipts, and source status

- [R5b pre-registered design](10_R5B_KOREAN_REALIZER_PREREG_20261121.md) at commit ad0ef11d, before any new model call. Eight earlier R5a **researcher-authored exposed** source works; reuse, not newly independently sampled sources. Two per genre (chat, science, notice, fiction), each with sourceFacts and a reader-facing purpose.
- 8 old R5a GPT-OSS 20B DIRECT generated outputs are **reused**, not counted as R5b new calls. Each old provider output SHA and exact input prompt SHA is fixed in [frozen original manifest](fixtures/r5b_frozen_r5a_direct_sha_manifest.json), and [R5b native run](https://github.com/WhoSia/KSGT/actions/runs/44899223057) recovered the R5a raw GitHub artifact and validated 8/8 old identity matches and the original 4,995 token total before new inference.
- **24/24 new actual Groq model calls succeeded**: 8 K20 (20B original prompt + genre-realization policy), 8 B120 (120B **identical bytes** to original 20B DIRECT prompt, model identity changed **outside** input), 8 K120 (120B same craft instructions as K20 byte-for-byte). Temperature 0, maxTokens 1450, same source facts and tasks for all four arms. **32 complete real Korean texts** including 8 historical B20.
- [Live runner #44899223057](https://github.com/WhoSia/KSGT/actions/runs/44899223057), successful on first attempt at commit eb7d943f, native Node 22 tests **26/26 R5 + 80/80 prior G10-P2**. Current contributor was human WhoSia and workflow read-only. A broken historical-stage snapshot test was updated to preserve R4b's 208 calls while admitting newer proven R5a calls, rather than hiding failed runs.
- [Cold-preserved original Drive ZIP](https://drive.google.com/file/d/1gIPzK5yUwvy-_J7DShDfs_zZ_M9iwFDs/view) under [R5b Drive folder](https://drive.google.com/drive/folders/1wHtjjU6RrDtbkGMVCC5GVHexQDrszGw6). Actions artifact #14704893961, ZIP **49,810 bytes** SHA-256 `11b227026dc70effc5c4748ebf6eb445f073366de6aa269cc9fa1429b0af0157`. Contains 24 provider replies with SHA, prompts identity, model metadata, usage, cold score and **plain Markdown 32-text reading packet**; no HTML-based human study.

## 2. Actual model compute and text lengths

| Actual arm | Number of finished texts | Provider model | Total tokens (8 texts) | Korean output characters (8 texts) |
|---|---:|---|---:|---:|
| B20 (historic unmodified DIRECT) | 8 | openai/gpt-oss-20b | 4,995 | 2,781 |
| K20 (genre craft) | 8 | openai/gpt-oss-20b | 6,997 | 2,009 |
| B120 (unmodified DIRECT) | 8 | openai/gpt-oss-120b | 5,401 | 3,271 |
| K120 (genre craft) | 8 | openai/gpt-oss-120b | 7,057 | 2,100 |

The **actual 24 new calls** used **19,455** total provider tokens; historic 20B B20 used 4,995 (previous run, never paid twice). Prompt policy increases prompt overhead while shortening text ~28% in K20 vs B20 and ~36% in K120 vs B120. Shorter output can reflect better concision **or missing licensed facts**. Token usage does not establish currency, performance cost at quality parity, or human preference.

## 3. PI readback on real full Korean texts: source-witnessed objections (development, not blind source-gold)

The exact paragraphs are available in the original ZIP; selected fragments below are small evidence anchors. This is a first investigator reading, **not** externally independently scored source fidelity or human naturalness.

| Source work | Real candidate | What full text reveals |
|---|---|---|
| R5A_CHAT_SOURCE | K20 | Explicitly retains the distinct facts: journal metadata found, full PDF missing, abstract present, abstract/final-text identity unverified, ledger marked missing. The B120 and K120 shorter texts **omit the uncertainty about equivalence of the abstract and final full article**. Output brevity can delete relevant nuance. |
| R5A_CHAT_ARCHIVE | B20 / K20 / K120 | B20 promises `제출 여부가 확정되면 바로 알려드리겠습니다` although no communication commitment exists; K20 omits the new promise and remains simple. **K120 restores an unsupported commitment** to settle submission and proceed if needed, even when the craft policy tells it not to. |
| R5A_SCI_FILM | B120 | Adds surface condition and optical inhomogeneity as source-unspecified causal candidates, and broad theory explanation at unnecessary length. K20/K120 also add possible measuring error or specific new optical subconditions. The scientific elegance problem is not solved by lexical rephrasing. |
| R5A_SCI_CLOCK | K20 / B120 / K120 | K20 makes the stronger `가능성이 크며` claim about faster stirring without isolating effects; B120 and K120 also introduce stirring as the likely causal explanation. Source only proves stirring differed and temperature was not logged. Apparent fluency still shifts epistemic strength. |
| R5A_NOTICE_BOOK | B20 / K20 / B120 / K120 | B20 **invents absolute clock times** for periods 4/5; K20 avoids fabricated hours and keeps return-box status unknown. B120 omits the unknown return-box status entirely. K120 adds an unapproved staff inquiry instruction, plus unnatural `이용을 삼가해` phrasing. |
| R5A_NOTICE_SHOW | K20 | Makes up an online submission cutoff of `23:59까지`, and promises individual notification absent from the source, despite an explicit craft instruction not to invent either. B20's invented 14–17h installation hours were previously noted; B120/K120 preserve the afternoon but have additional procedural assumptions. |
| R5A_SCENE_GARDEN | B120 / K20 / K120 | B120 introduces a new action `화분 위에 머무는 빗방울을 가볍게 닦아냈다` and lengthy atmospheric clichés. K20 adds a sigh and a narrative meta-ending `수진은 아직 문턱에 머물러 있는 동안 장면은 끝났다`. K120 suppresses much ornament but remains a flat synopsis rather than high-literary prose. |
| R5A_SCENE_PAPER | K20 / B120 / K120 | K20 has the narrator walk around the room, and B120 browse remaining works, both absent from the closed event outline. K120 avoids picking up the forbidden paper but ends with clumsy meta-temporal phrasing `손을 뻗기 전 그 순간을 멈춘다`. All still fail ambitious literary generation. |

**A constructive positive signal, bounded:** K20 often produces more usable *immediate chat and notice* prose, e.g. CHAT_SOURCE retains the abstract-equivalence uncertainty omitted by larger shorter outputs and NOTICE_BOOK avoids invented class-clock times. **A negative signal:** the same genre craft policy may add serious invented deadlines and unlicensed story events. This is a mixed developmental outcome, not a preference win.

**Attribution by factor:** More capable 120B does not automatically protect source meaning and may elaborate additional fictional action; a simple craft policy generally reduces length but does not reliably suppress hallucinations. An abstract "reader state" can neither explain nor fix these output-level failures. The promising target is to choose **which facts to expose, which inferences to leave open, and which concrete Korean expressions to realize** without losing useful nuance. This is a generation problem, not a form-UI project.

## 4. Scientific redirection in light of owner feedback and KSGT origin

Re-read originals in official Chat Archive KSGT 1, 4, 5, 15–18, 23–25. Specific durable anchors:

- **2026-07-15 KSGT 1:** warning against vacuous translated contrasts, demand sophisticated register control and lexical diversity, human literary ambition, distinct style from quality, retain controlled imperfection, prototypes must write actual text. No universal ban on legitimate contrast.
- **KSGT 4:** even in 2026-07-30 user worried that elaborate human survey deployment could reveal half-baked underlying theory and that expensive participation setup precedes generator readiness; by Aug 29 explicitly preferred public human text/revisions over recruitment.
- **2026-10-08 KSGT 17:** wanted a *compact theory-enhanced generator attached to strong pretrained LLM*, not gigabytes rebuilt from scratch.
- **2026-10-07 KSGT 16:** all rejected purely rule-based drafts with translationese, incomplete text and incoherent science; confirms base generation floor is key.
- **2026-11-09 KSGT 24:** user directly judged one science paragraph better despite evaluators, emphasizing correct *information order* and avoidance of repeated uncertainty and preachy endings; politeness ending was not a confound once purpose fixed.
- **2026-11-17 KSGT 25:** practical goal is human-like language production, not piling up audits to prove abstract elegance.
- **2026-11-21 owner comment:** expert Korean writer can serve as identified human critic; do not let thin HTML forms, fake "reader models", repetitive survey integrity checks or recruitment obstruct concrete generation advances.

Adopt **three parallel scientific lanes** instead of serial pilot gates:

1. **Prose craft / realization — PRIORITY:** actual whole Korean prose across four registers, lexical choice, sentence rhythm, disciplined omission, genre licensed sensory detail. Revive the "Lexical Orchestra / Korean Realizer" terms as *research components*, not claims already implemented beyond a prompt.
2. **Source and discourse semantics — a thin guard:** fix documented invented facts and condition changes using source-aware optional local interventions; no bloated mandatory reader-state feedback loop until costs and benefit shown.
3. **Existing human revisions / owner expert insight — evidence, not gating:** derive lexical/syntactic operator hypotheses from already observed genuinely human edits, user can read selected **ordinary Korean A/B prose** when useful; no poorly formed HTML, no inflated human sample claims.

Novel architecture research remains open: a small **source-conditioned realization policy** could choose surface constructions and omit redundant propositions with measurable native naturalness, but existing prompts are NOT a new algorithm. Contrast with 20B/120B strong base, matched instructions, and cost/quality endpoints. If the best direct strong writer already wins, accept that result; if an intervention helps only one genre, claim narrow scope.

## 5. Provenance and next synthesis

This is deliberate exploratory reuse of eight prior author-exposed source works. No new independent human votes or independent source gold. The owner (identified skilled Korean expert) is available for **critical reading without false population inference**, but the research must not stop until a survey is run. Stronger next action: choose two or three concrete failure cases (e.g. fabricated 23:59 deadline, fact-omitting article summary, mechanical narrative ending), implement a **local realization option** that changes actual Korean without adding facts, run it against the strongest 120B direct with equal provider budget, and examine actual final prose. Do not merely count '삼가다', '그저' or form checkboxes and declare victory.
