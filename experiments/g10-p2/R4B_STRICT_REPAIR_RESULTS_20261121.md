# G10-P2 R4b — Real full-prose local edit vs one-call rewrite: first strict result

**2026-11-21 | Post-hoc investigator-selected exposed development | No independent human source or prose gold.**

## Source custody and first-run failure

R4a upstream original 60-call artifact #14698104554 was cold read and response-SHA validated. [Frozen R4b preregistration](R4B_LOCAL_REPAIR_PREREG_20261121.md) chose ten actual prior model candidate texts: six with one investigator-flagged target span and four NO_TARGET controls (not necessarily globally correct). Each case used matched original candidate, exact original source and the same error cue for one GPT-OSS 20B **PATCH_MODEL** request and one **FULL_REWRITE** request, 20 actual provider responses.

The initial [Actions #44895132995](https://github.com/WhoSia/KSGT/actions/runs/44895132995) called the model 20 times. Its legacy harness mistakenly classified all ten actual JSON model patch replies as INVALID_PATCH because the condition name patch triggered an incompatible old three-paragraph parser. Each raw reply was still marked provider GENERATED with original SHA, finishReason and usage and archived. The workflow failed instead of falsely reporting success. The [read-only recovered score #44895329911](https://github.com/WhoSia/KSGT/actions/runs/44895329911) verified the original SHA and 20 request/response SHA pairs and re-parsed these raw replies using the declared one-span R4b protocol, **with zero additional provider calls**. CI **67/67 PASS**. [Drive original+recovery ZIP](https://drive.google.com/file/d/1Eci4qhiyIz1GGVa1GghOmpxHA3O2OtXi/view) SHA-256 a417546e40e3fbc102ede1b13d681b272528115481a74532334a7c54a0c4db1d.

## Verified mechanical results

| Measured, not semantic quality | Local exact-span patch | Full-text rewrite |
| --- | ---: | ---: |
| Actual provider calls | 10 | 10 |
| Total provider tokens | **8,147** | **8,839** |
| Author-chosen target quote removed (six flagged texts) | **3/6** | **6/6** |
| Four NO_TARGET original texts kept byte-identical | **4/4** | **4/4** |
| Independent quality or source-fidelity gold | **0** | **0** |

The strict local patch model removed three of six targets. Three were rejected **solely** because model before quotes differed in a leading or trailing space from investigator-flagged exact target: CHAT_UPLOAD rich, NOTICE_CHEM rich and SCENE_NOTE rich. The fixed source-span guard was not a semantic model; its purpose was preventing unrelated changes. The full rewrite removed all six original quoted targets, but this is no guarantee of semantic correction: NOTICE_CHEM direct replaced an invented school-room submission location with **another invented recipient, '과학실 담당자에게'** absent from source; CHAT_UPLOAD retains another immediate delivery promise after its clearly unsupported 'notify again' pledge was deleted. SCI_SEED and SCENE_NOTE show similar residual unsupported statements that require separate audit.

## Director decision

Preserve strict original results **3/6**, never retroactively change the preregistered success count. A separate explicitly post-hoc zero-provider-call whitespace-adapter may align a model quote with the already unique frozen target if and only if leading/trailing whitespace is the sole difference; it cannot shift source content or touch other sentences. Report its result separately as engineering rescue, not a newly trained model or improved writing. Human reader and independent source-auditor judgment on whole text remain mandatory before quality claims. The current R4b source works are reused exposed development materials, not a fresh holdout.
