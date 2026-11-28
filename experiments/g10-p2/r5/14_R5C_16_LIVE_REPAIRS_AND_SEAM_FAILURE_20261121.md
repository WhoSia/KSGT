# G10-P2 R5c — 16 actual GPT-OSS 120B repairs, eight applied edits, and the seam-dependency failure

Date: 2026-11-21 KST. **Researcher source-visible review of actual complete Korean texts; not independent native-reader or semantic gold.** [Frozen-before-model prereg](13_R5C_MINIMAL_SOURCE_WITNESSED_REALIZER_PREREG_20261121.md); [eight frozen 120B draft target quotes](fixtures/r5c_frozen_strong_draft_eight_targets_v01.json); [executable source-aware editor](r5c_source_witnessed_realizer.cjs). Official G10-P2 OPEN.

## 1. Real provider, revision mechanism and immutable bytes

- Native [GitHub Actions #44900323773](https://github.com/WhoSia/KSGT/actions/runs/44900323773) succeeded on its first attempt after correction of the **old cumulative model count snapshot test**. It ran Node 22 R5 tests 34/34 and historical P2 tests 80/80 PASS, verified human author/committer and did not commit from Actions.
- **16/16 new real Groq openai/gpt-oss-120b provider calls**, temperature 0: eight output JSON proposals with source-dependent exact-span constraints, eight free full-document rewritten texts. All 8 original GPT-OSS 120B direct drafts were recovered and SHA-checked from the prior R5b artifact, not counted as new calls.
- **24 whole Korean texts** across 8 previously exposed researcher-authored works (B120 unchanged, PATCH B120, REWRITE B120). This is NOT new heldout or independent human evidence.
- [Canonical Drive raw ZIP](https://drive.google.com/file/d/1hh0u-A-1EUhXxutWdpMon-bNMVWaJ6Ur/view), [evidence folder](https://drive.google.com/drive/folders/1ItG20dAO0NOZWp18w_tMpJDvUwiZF0RT), 46,013 bytes, SHA-256 `fc5b87340ed6b3e4c399547812050b75637b1fd4fd83b54b1d9470cecfc8d733`. GitHub original artifact #14705278734 matched cold Drive download SHA and CRC.
- Exact-span controller: if model reply fails strict schema, original quote identity, uniqueness or newly fabricated numeric token check, **reject and preserve original**. If valid, only the quoted substring is changed, and the surrounding bytes remain identical. It is an actual executable change to Korean finished text, not another prompt-only variation or aesthetic scoring HTML form.

## 2. Real results and complete-call cost

| Outcome / arm | Count or tokens | Proper authority |
|---|---:|---|
| Actual new provider responses | **16** | Verified in original actions receipts |
| Original GPT-OSS 120B direct drafts reused | 8 | Earlier model calls, not rebilled |
| Applied exact-span proposals | **8/8** | Strict JSON/quote/number check only |
| NO_OP | 0 | Would have preserved original |
| Rejected by mechanical guard | 0 | Would have preserved original |
| All whole-text alternatives | 24 | 8 works × 3 arms |
| Old direct B120 tokens | 5,401 | Prior experimental cost |
| New PATCH marginal tokens | 8,637 | 1.60× old one-call DIRECT tokens |
| New free REWRITE marginal tokens | 8,800 | 1.63× old DIRECT tokens |
| All new actual calls | **17,437** | Sum new PATCH + REWRITE |

The marginal FIX vs REWRITE difference was only 163 provider tokens in eight texts. This contradicts a naive expectation that returning a short patch saves most model compute: the PATCH prompt carries the **entire original, facts, diagnosis and instructions**, so input prefill dominates. Neither path is cost-equal with no-op, and the total deployment cost is **original direct call + one new call**.

## 3. Read actual Korean documents: eight success/defect diagnoses

All selected quotes and the exact entire outputs are in the ZIP. Below are source-visible investigator judgments with a conservative authority boundary.

| Work | PATCH result on actual text | Whole-rewrite rival | Credible source+style interpretation |
|---|---|---|---|
| CHAT_ARCHIVE | Changes new request to `위 사항을 참고하여 검토를 진행해 주세요.` | Removes unsolicited final request | **Partial**: still transforms a status update into a command to a coworker; full rewrite is more disciplined on this point |
| CHAT_SOURCE | Restores `내용이 발표 초록과 동일한지는 확인되지 않은 상태` | Keeps omitting that uncertainty | **Locally improved**: exact-span patch preserves a source distinction missing in strong full rewrite, although resulting sentence is long |
| NOTICE_BOOK | Replaces overbroad `목요일 및 다른 요일의 운영 방식은 변함이 없습니다` by `목요일은 변함이 없습니다` | Retains the overbroad other-days claim | **Partial**: removes unlicensed scope but yields awkward ellipsis and still omits the unverified return-box status |
| NOTICE_SHOW | Removes new notification promise: `설치 장소는 아직 배정되지 않았습니다` | Reframes as recipient's later checking without explicit provider promise | **Locally improved**: source fidelity for selected clause, though rest of notice retains redundant procedures |
| SCENE_GARDEN | Deletes unlicensed flowerpot-cleaning action | Deletes explicit touching but adds vague bodily acceptance/ornamental diction | **Harmful to continuity**: leftover `그 순간` loses its temporal antecedent, leading whitespace and hollow imagery remain |
| SCENE_PAPER | Deletes extra 'walked past other exhibits' action | Rewrites paragraph but retains a motion-stop verb | **Harmful to continuity**: `그때` and `나는 발걸음을 멈추고` remain after the movement description was deleted, weakening event coherence |
| SCI_CLOCK | Compresses last conditional from `보다 정확히 규명할 수` to `정확히 규명할 수 있습니다` | Removes final formulaic ending | **Harmful epistemic strengthening**: the patch loses uncertainty even though it passes all lexical source checks |
| SCI_FILM | Replaces long closing summary with `현재 결과는 초기 단계이며, 변수들을 제어한 후에야 정확한 원인 분석이 가능하다` | Leaves original summary essentially unchanged | **Largely cosmetic**: the redundant closure remains and the 'accurate cause' claim can still overreach |

These classifications are **researcher development notes**, not 2/8 statistically independent gold passes. A model can make the targeted string disappear and **worsen** sentence flow, source scope or Korean prose; zero is the scientifically licensed quality-uplift claim.

## 4. The new failure mode that matters: discourse seam dependency

A true local editor must consider how neighboring sentences depend on the original sentence. Formalize a *research hypothesis* (not a complete implemented grammar): the selected edit interval S has neighboring rhetorical/event links E. Deleting the original clause may invalidate lexical or anaphoric cues outside S. Define a minimal continuity closure C(S) such that for every edit-affected edge whose dependent spans mention a former event or premise, all relevant spans belong to C(S); replace within C(S) **without unnecessarily modifying the rest**.

Examples from *actual Korean*:
- SCENE_PAPER originally: `나는 조용히 걸어가며 남은 작품들을 마지막으로 훑어보았다.` → `그때 ... 나는 발걸음을 멈추고`. Deleting the walking action but leaving 'then' and 'stopped walking' breaks event preconditions. A coherent writer might instead present the paper directly through the stationary viewpoint, revise '그때', and remove the now-unmotivated stopping verb. A single exact quote cannot do this, regardless of grammatical validity.
- SCENE_GARDEN: deleting the object-touching event leaves `그 순간` without the same event boundary and a leading blank at the paragraph opening. A surface string replacement succeeded, but the *discourse realization* worsened.
- SCI_CLOCK: short final sentence `정확히 규명할 수` looks economical but changes epistemic modality in context. An edit unit must retain the uncertainty relation from the neighboring discussion about unrecorded temperature.
- NOTICE_BOOK: replacing `목요일 및 다른 요일` with `목요일` removes unsupported scope, but `목요일은 변함이 없습니다` leaves the target noun ('operating hours') implicit and awkward in a public notice.

This points toward a **small generative realization unit** comprising an edit target and its minimum discourse-dependent neighborhood, rather than a permanent reader-state bureaucracy or a large rewrite of the whole document. It remains to identify when such dependency is linguistically necessary and whether a small, executable context-extension policy outperforms direct 120B; earlier graphs and lexical realization theories can be reused as *hypothesis-generating mechanisms*, not automatically winning rules.

## 5. Next R5d design decision
**Do not** declare R5c exact-anchor 8/8 a quality improvement. Register R5d **paragraph-/seam-aware bounded continuation** on a small subset with real discourse breaks (SCENE_PAPER, SCENE_GARDEN, SCI_CLOCK, NOTICE_BOOK) and compare existing KEEP / PATCH / full REWRITE plus a single-source-witnessed coherent local span, under true model budget. Rule of thumb: change the smallest **coherent** neighborhood, not the smallest literal substring. Preserve the rest by executable contract. No new human HTML forms; optional expert owner review of whole texts is welcome but not gating.

Independently source-disjoint human writing revisions and untouched prompts are required for later generalization; repeatedly diagnosing the same eight exposed drafts cannot make a strong statistical claim. If the larger coherent edit still sounds machine-written or costs as much as whole rewrite, retire the added layer rather than invent another stage.
