# G10-P2 R4a — Full Korean Prose Candidate Selection: 60 Real Calls, Cost and Reader Gate

**2026-11-21 KST. Disposition:** EXPLORATORY NEW-WORK DEVELOPMENT COMPLETE; full-prose writer-quality benefit **UNPROVEN**. This study makes *complete reader-facing Korean texts* its evaluation unit again, but does not yet test a learned reader state, an improved neural generator or an independent human response.

## 1. Frozen original evidence and design

- [Pre-execution R4a protocol](R4A_FULL_PROSE_SELECTION_PROTOCOL_20261121.md), [12 newly authored briefs](fixtures/r4a_new_full_prose_12works_v01.json): three chat, three scientific explanations, three school notices and three literary scenes. All 12 are new source works relative to P1 R9.34 and P2 R1/R2, though they remain **researcher-authored exposed development** and never become fresh heldout again.
- One source/audience/purpose packet per work and two matched GPT-OSS 20B first-stage complete Korean texts: `DIRECT` (strong prompt) and `RICH` (same facts with general genre writing guidance). The two arms have different instructions by design, not privileged source facts; source risk and literary-detail license appear in both.
- The same model audits *each fully written text* for unsupported source relations, using quoted output spans and original-source sentence spans. These risk packets, exact same candidates and original source information are then available to `STATE_AS_TEXT` (one more LLM selecting A or B) and to the zero-extra-model-call `EXECUTABLE_SELECTOR` (choose fewer model-reported risks, keep DIRECT on ties and abstain/keep DIRECT when the audit is invalid or uncertain).
- **Important difference:** executable selector is a deterministic chooser among two real, completed candidates, **not** a new per-sentence Korean text generator. Its ability to detect risk depends on the fallible same-model audit. `STATE_AS_TEXT` has an extra selection call; no compute-matched iterative control in R4a. The experiment cannot attribute a quality gain to executable state control without independent reader/auditor outcomes.
- [Live workflow #44883541327](https://github.com/WhoSia/KSGT/actions/runs/44883541327), raw Actions artifact #14698104554, original ZIP **112,648 bytes** SHA-256 `06a89aed5ed3794aa85c6697cd290ff5abc282434af25f237f2e01ef4f691051`. [Drive original](https://drive.google.com/file/d/1bkxWgjehdnoXq3nJKwDwTcr5kwf4tfEC/view), byte-identical after cold download and ZIP CRC verification (129 archived entries). Provider settings were GPT-OSS 20B via Groq at temperature 0, original response/attempt SHA and all call failures retained, no provider output text committed to Git. CI 50/50 before live experiment.

## 2. Actual quantitative outcomes, not invented human preferences

| Observed quantity | Result |
| --- | ---: |
| New source works / source-disjoint from R9.34 | **12 / 12** |
| Actual model calls = writer D/R + auditor D/R + text-state chooser | **24 + 24 + 12 = 60** |
| Completed provider responses / requested | **60/60** |
| Candidate full texts identical byte-for-byte within work | **0/12** |
| Model risk packets valid for both candidates | **11/12** |
| Executable controller selected RICH | **1/12** |
| Executable controller kept DIRECT | **11/12** (includes one audit-abstention) |
| State-as-text LLM selected RICH | **3/12** |
| State-as-text and executable controller agreed on choice | **10/12** |
| Independent Korean reader ratings / independent source-fidelity judgments | **0 / 0** |

### Tokens: any benefit must overcome an expensive pipeline

| Calls | Actual combined prompt+completion tokens |
| --- | ---: |
| 12 DIRECT writer calls | **6,963** |
| 12 RICH writer calls | **7,729** |
| 12 DIRECT self-auditor calls | **11,243** |
| 12 RICH self-auditor calls | **11,740** |
| 12 state-as-text chooser calls | **12,303** |
| **Entire 60-call experiment** | **49,978** |

A direct-writing-only workflow for these 12 sources would have required 6,963 recorded tokens. Producing both candidates and auditing them for the executable chooser cost 37,675 tokens (**5.41×** direct alone); adding the model-based plain-state chooser brought the experimental total to **49,978 tokens (7.18×)**. The ratios compare model tokens, **not** currency, quality-equivalent output or run time; the experimental total includes research arms that a deployed system might not run. About 46% of recorded tokens went to the pair of risk auditors.

### Per-work selection, fully traceable in raw artifact

| New work | D/R self-audit risk counts | Executable | State as text | Note |
| --- | --- | --- | --- | --- |
| CHAT_SHIFT | 0/0 | DIRECT | RICH | Format/conciseness preference not represented by risk-count selector |
| CHAT_UPLOAD | 0/0 | DIRECT | DIRECT | Both texts contain extra rapid follow-up promises **missed by both risk audits** |
| CHAT_SURVEY | 0/1 | DIRECT | DIRECT | RICH introduces a reservation-confirmation request beyond source |
| SCI_WIRE | 1/1 | DIRECT | DIRECT | Both science explanations extrapolate from voltage settings; audit count tie says little |
| SCI_LED | 1/1 | DIRECT | DIRECT | Both contain new testing detail; some audit flags concern prospective rather than completed actions |
| SCI_SEED | 0/1 | DIRECT | DIRECT | RICH says it will control `only` water when source licenses equalizing light |
| NOTICE_CHEM | 0/0 | DIRECT | RICH | **Both invent a submission room/location absent from source**, audits mark clear |
| NOTICE_RETURN | 0/0 | DIRECT | DIRECT | Operational facts largely preserved; politeness register alternates within texts |
| NOTICE_ROOM | 0/0 | DIRECT | DIRECT | Same place/time branching; RICH is more repetitive |
| SCENE_RIBBON | 0/0 | DIRECT | DIRECT | Both shift tense and use a potentially distracting pronoun for 해인 |
| SCENE_NOTE | invalid/4 | DIRECT (ABSTAIN) | DIRECT | An audit quote does not exactly match original; RICH includes note unfolding as added event |
| SCENE_STOP | 1/0 | RICH | RICH | Both have explicit scene-ending metacommentary; whether reaching for glove violates endpoint is arguable |

These case notes are an **investigator reading of 24 visible outputs** after the live run, not blinded inter-rater judgments and not an objective score of source faithfulness. In particular, the final SCENE_STOP reaching action may still occur before physical contact, so calling it a definitive new event is too strong without independent adjudication. SCI_WIRE also overstates when Ohm's law requires fixed parameters. R4a does **not** establish that selecting the RICH scene is a quality improvement.

## 3. Mechanistic conclusion — model self-audits are not reliable fact authority

An exact cited phrase *exists* in the candidate, but this does not certify that the accusation is true. CHAT_UPLOAD adds unsupported promises to contact the recipient immediately after verification yet is marked CLEAR twice; NOTICE_CHEM invents both a drop-off location and a task at the gathering and is also marked CLEAR twice. SCI_LED's audit calls proposed measurement actions harmful additions despite future measurement being an appropriate possible extension of the source. These are consequential false-negative and false-positive patterns, but we do **not** calculate numeric precision/recall without a blinded, source-licensed human annotation set.

The executable selector chose DIRECT on most ties and one unknown audit; that is primarily the **KEEP fallback rule**, not proof of preference or substantive causal control. The LLM plain-state chooser selected RICH in two cases the executable chooser tied and kept DIRECT; neither decision is validated by independent readers. Source-provenance spans and model-produced semantic relations must not be conflated.

**Director go/no-go:**
- **PASS** R4a full-text provider pipeline, source-work isolation, receipt validation, reader-stage instrument production and all original SHA/CRC custody.
- **HOLD** any end-to-end writing superiority claim, all independent reader preference claims and the "lightweight" cost claim. The observed overhead is substantial and every gain must justify it.
- **CHANGE** R4b priority from expanding self-audited rule cases to getting *independent source-auditor and blind-reader decisions* on these complete texts; use their corrections to identify limited high-risk relations before proposing more control. If both candidate passages fail facts, choosing between them is insufficient: a later architecture must allow a source-authorized bounded repair and an explicit no-op/abstention gate.
- **DO NOT PROMOTE** these 12 works to a confirmatory unseen set; next independent source-work suite should be newly authored and independent of this study.

## 4. Already created reader/auditor assessment instruments (zero votes so far)

[Reader packet workflow #44883956488](https://github.com/WhoSia/KSGT/actions/runs/44883956488), **55/55** hermetic tests PASS, original archived text recovered and SHA-verified before forms were produced. Four condition-masked **A-stage forms** show the same 12 source works in balanced A/B order and omit original fact lists; four **B-stage source audit forms** disclose original facts separately. The private investigator mapping includes the answer keys and identities, for the investigator only. The four repeated forms are not 48 independent source works; no participants have yet returned assessments.

| Evidence pack | Drive link | SHA-256 |
| --- | --- | --- |
| Reader A forms (4) | [Only reader task content](https://drive.google.com/file/d/1hCk2DI2Mcd9UGqOCv6IhYtL2mBjNP9dt/view) | `887d18fca3bd5ce0184a3d00d700b129fed184564728fb37e6865beecb67609d` |
| Auditor B forms (4) | [Full original source facts](https://drive.google.com/file/d/12pcwQmNJ6ZAv0ltv88bMsFCaqqXnfX_n/view) | `4f1ce4e2aeb76b4c0d5dfc80db57fef979c0da4314599e5a28494db5c037c8d6` |
| Investigator mapping | Restricted to investigator; do not send to readers | `af68bf72df97d825a941c1e8165b13d653481bc3fb3bc9f419870eac52625b0a` |

All four ZIPs (three form packs + original model evidence) were downloaded after Drive upload and compared byte-for-byte against the Actions originals; ZIP CRC checks all passed. The private mapping archive must not be shared with either reader or auditor.

## Final R4a disposition

The project has returned to complete Korean writing rather than tautological finite-state success scores. **It has not yet shown that executable state control helps**, and current costs are hard to justify on purely engineering grounds. Independent source fidelity and reader use are the gating evidence for any next architectural claim. Preserve source writings and the source-audit false negatives as counterexamples.
