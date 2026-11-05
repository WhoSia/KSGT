# KSGT G10-P1 R8 — Shared-Draft Provenance Revision: Real Pilot and Counterexample Audit (2026-11-05)

**Disposition:** REAL API PASS / SAME-DRAFT CONTRAST CONFIRMED / NEW WRITING QUALITY ADVANTAGE NOT IDENTIFIED / SOURCE-ACCOUNTABLE REPAIR INCOMPLETE / FORM TRADE-OFF OBSERVED / G10-P1 OPEN.

## 1. What was frozen and what ran

[Preregistration](R8_SHARED_DRAFT_PREREG_20261105.md) preceded the live pilot and specified six **previously exposed, author-synthetic** source works and three outputs per work:
1. BASE_DRAFT (one live model call).
2. GENERIC_REVISION of precisely that draft with original source JSON available (one additional live call).
3. SOURCE_ACCOUNTABLE_REVISION of **the identical draft** with identical full source JSON, but an instruction to change only unsupported claims and retain natural Korean (one additional live call).

All use Groq `openai/gpt-oss-20b`, temperature=0, max 900 completion tokens per call, one attempt per cell. The source and draft strings are SHA-256 matched within each paired revision. **Instruction lengths and model tokens are not matched**; the difference may be simple prompting or salience, not a unique causal mechanism. No external human-origin, source-disjoint holdout, no independent Korean preference or independent source fidelity gold.

- Initial workflow [run 41987454634](https://github.com/WhoSia/KSGT/actions/runs/41987454634): Node tests **235/235 PASS**, but CLI mistakenly treated intended dry-run `unattemptedCells=18` as failure. **Zero provider calls** on this failed first attempt. The defect was repaired by [exit-code fix](https://github.com/WhoSia/KSGT/commit/e1601f468bb3fffe5adf298a98e59ea21bd7e875), and the identical experiment parameters were retriggered.
- Corrected live [run 41987543928](https://github.com/WhoSia/KSGT/actions/runs/41987543928), job 127111778910: SUCCESS, **235/235 Node 22 PASS**, **18/18 actual provider calls**, 18 generated outputs, zero failures, no unattempted cells.
- Original GitHub artifact [13396178526](https://github.com/WhoSia/KSGT/actions/runs/41987543928/artifacts/13396178526), ZIP **7,105 bytes**, SHA-256 `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9`; inner `r8_output.json` **35,098 bytes**, SHA-256 `016290ef9837fb0ef1acdb3e08d919753016bf5d97053201426f75e1ef4455e2`.
- [Durable Google Drive RAW original](https://drive.google.com/file/d/12fGj9tz26ImJkff0W1sRzaxNxaHT7L3A/view), ID `12fGj9tz26ImJkff0W1sRzaxNxaHT7L3A`: after upload, retrieved it again and independently compared its bytes to the original GitHub artifact with `cmp` and SHA-256; **exact-byte identity PASS**, both 7,105 bytes. Actions role read-only, no bot commits or pushes.

## 2. Actual token costs for six shared original drafts

| Policy cell | Provider calls | Prompt tokens | Completion tokens | Total tokens | Three-paragraph form |
| --- | ---: | ---: | ---: | ---: | ---: |
| BASE_DRAFT | 6 | 3286 | 1750 | **5036** | **6/6** |
| GENERIC_REVISION | 6 | 5264 | 2150 | **7414** | **6/6** |
| SOURCE_ACCOUNTABLE_REVISION | 6 | 5780 | 1585 | **7365** | **5/6** |

- Source-accountable revision consumes **516 more input tokens** than generic revision across six sources (+9.80%), but **565 fewer completion tokens**, for **49 fewer total revision-step tokens (-0.66%)**. Including the same six shared first-stage drafts: generic pathway **12,450** total provider tokens; source-accountable pathway **12,401** (-0.39%). These minute differences do **not** demonstrate cheaper workflow in money, annotation labor, or effectiveness.
- Six direct drafts are genuinely shared between arms: this controls for draft variation but **not** for different revision instructions, stochastic provider variation or length effects.
- SOURCE_ACCOUNTABLE collapsed `SCENE_CORRIDOR_B` from 3 paragraphs to **2 paragraphs** (while both base and generic versions retain 3). Literal format degradation matters separately from claim fidelity.

## 3. Entire output examined — researcher-only illustrative source fidelity observations

**NOTICE_CONDITION_A:** BASE_DRAFT falsely claims `매주 금요일` for a source specifying Friday 15:00 without recurrence. Both GENERIC_REVISION and SOURCE_ACCOUNTABLE_REVISION remove the word `매주`. More importantly, the two revised texts are **identical after whitespace normalization**, hence this is NOT a KSGT-exclusive correction.

**SCIENCE_LIMIT_A:** Both revisions are effectively identical to the shared base after whitespace normalization. The source-aware policy produced no substantive new repair and no improvement warranting a scientific claim.

**SCENE_UNORDERED_A:** Both revision policies modify text. SOURCE_ACCOUNTABLE deletes some unsupported scenery and movement detail, but retains `그녀의 시선은 창밖으로 ... 차분한 독서의 순간을 즐기고 있었다`: the original author source records sitting, inserting bookmark and rain, not reading or enjoyment. It also retains summary comments about emotional effect, whose literary acceptability requires independent genre-aware adjudication.

**PUBLIC_NOTICE_B:** BASE_DRAFT asserts `매주 토요일`, guarantees unchanging time/venue, and promises that walk-in registration status will later be separately announced, none licensed by the source. GENERIC_REVISION is whitespace-equivalent to the base. SOURCE_ACCOUNTABLE revises the introductory phrasing but **retains all three unwarranted commitments**. This is a direct counterexample to the claim that explicit claim-accountability instructions *reliably* repair a previously visible source drift.

**SCIENCE_CALIB_B:** Both revisions are substantively the same base text after whitespace normalization. That base suggests possible measurement errors and external conditions; these are conditional explanations whose acceptability must be assessed against the explicit BOUNDED_EXPLANATORY_INFERENCE license, not automatically classified as falsifications.

**SCENE_CORRIDOR_B:** BASE_DRAFT invents wall-clock chime/time, empty bulletin board content, umbrella angle/light and an extra Yuna movement. GENERIC_REVISION removes the unobserved exact clock time and blank-page assertion, but retains invented clock sound, umbrella angle/light, cup properties and new destination movement. SOURCE_ACCOUNTABLE deletes more ungrounded world detail (clock sound, umbrella angle, blank-paper contents, tactile cup property) **but still asserts** `그녀는 컵을 들고 복도 끝으로 향했다`, an action absent from source despite NO_NEW_EVENTS. It also collapses the output to two paragraphs. Thus selective correction occurs at a cost to completeness/format, and the absolute guarantee remains false.

These are **non-exhaustive single-investigator observations** of actual text, not a source-error prevalence score, blinded semantic annotation, reader preference or a statistical win rate. Any unflagged passage may contain errors.

## 4. Scientific assessment

- **Controlled factor improved:** both revision policies begin with one *identical* first-stage Korean draft and the exact same source packet; six paired source-work contrasts can be inspected without cross-draft selection confounding.
- **Meaning repair not established:** some repairs are achieved by BOTH baselines; source-accountable policy also misses substantial ungrounded claims.
- **Potential cost–quality tradeoff:** provenance revision can delete unsupported prose yet weaken the document's flow and paragraph requirement. Strict constraints and fluency may not align automatically.
- **No unique algorithmic novelty proven:** the accountable arm is an instruction-based revision and can be explained as ordinary LLM prompting rather than a formally grounded Korean realization mechanism.
- **Strong next gate:** obtain independent native Korean readers, source-fidelity adjudicators and source-work-disjoint human-origin materials. Compare with ordinary generic revision; report paired semantic errors, legitimate literary elaboration, naturalness, completeness, reader decisions, and total expense. If generic revision is equally accurate and easier, retire the specialized branch.

**Terminal R8 scientific state:** G10-P1 OPEN, actual provider engineering PASS, shared-draft pairing PASS, independent semantic / reader evidence 0, superiority HOLD.