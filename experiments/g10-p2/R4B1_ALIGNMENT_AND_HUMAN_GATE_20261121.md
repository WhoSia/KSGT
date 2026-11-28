# G10-P2 R4b.1 — Real-model minimal editing, post-hoc alignment and the independent human gate

**Date:** 2026-11-21. **Scientific status:** EXPOSED_DEVELOPMENT_EDIT_ENGINEERING, not evidence of independent writing-quality improvement. 20 actual model calls (10 one-span PATCH, 10 full REWRITE) originated in R4b; R4b.1 added **zero** provider calls.

## Original raw source and failure must not be erased

- [Original R4a 60-call full Korean prose artifact](https://drive.google.com/file/d/1bkxWgjehdnoXq3nJKwDwTcr5kwf4tfEC/view): all original text and source facts were SHA checked before R4b.
- [Frozen first R4b protocol](R4B_LOCAL_REPAIR_PREREG_20261121.md) and [strict original results](R4B_STRICT_REPAIR_RESULTS_20261121.md). Ten exposed R4a generated text cases, eight unique original source work groups, six researcher-flagged targeted suspect spans, four NO_TARGET controls. Neither author-selected targets nor no-target controls are independent semantic gold.
- [Initial R4b Actions #44895132995](https://github.com/WhoSia/KSGT/actions/runs/44895132995) failed **after all 20 model requests completed** because the old shared harness misrouted the condition named PATCH through an incompatible 3-paragraph parser. First result: ten full rewrites marked GENERATED, ten actual JSON patch replies wrongly marked INVALID_PATCH by the wrapper. Preserve the original failed run, response bytes and original raw-artifact SHA.
- [Read-only recovered results #44895329911](https://github.com/WhoSia/KSGT/actions/runs/44895329911) reopened all original model bytes, verified the original request and response SHA, and parsed one-span patch JSON. **67/67 Node checks passed**, no extra provider calls. [Drive archived recovery](https://drive.google.com/file/d/1Eci4qhiyIz1GGVa1GghOmpxHA3O2OtXi/view), ZIP SHA-256 **a417546e40e3fbc102ede1b13d681b272528115481a74532334a7c54a0c4db1d**.

## Quantitative evidence

| Quantity | PATCH strict | PATCH with post-hoc edge-space aligner | REWRITE |
| --- | ---: | ---: | ---: |
| Underlying real model calls | 10 | **Same original 10** | 10 |
| Model total tokens | 8,147 | **No extra model tokens** | 8,839 |
| Author-flagged exact suspect span absent in output | **3/6** | **6/6** | **6/6** |
| Non-flagged original texts kept byte-identical (four NO_TARGET cases) | **4/4** | **4/4** | **4/4** |
| Blinded native reader/source auditor ratings received | 0 / 0 | 0 / 0 | 0 / 0 |

The three additional aligner successes are **entirely due to model before quotes dropping one leading or trailing space** on CHAT_UPLOAD rich, NOTICE_CHEM rich and SCENE_NOTE rich. [Read-only R4b.1 Actions #44895612941](https://github.com/WhoSia/KSGT/actions/runs/44895612941), **74/74 Node tests pass**, original downloaded ZIP SHA verified. The adapter requires a unique pre-registered original target, exact content equality after trimming only the edges, exact original outside-prefix/suffix preservation, and a single replacement. Internal space/content modifications and duplicate target occurrences are rejected. All 6 accepted outputs are labeled **APPLIED_UNVERIFIED** — not semantically certified. [R4b.1 Drive evidence](https://drive.google.com/file/d/1WUQF_-moxtIuswzNru0T2ZGNcCwgAe4i/view), SHA-256 **a2f06fbca1f9f0d68ac72958a4bf12d953a52b2a9707af75e7311dab6a317b43**.

### Concrete real-text counterexample to whole-text rewrite superiority

R4a NOTICE_CHEM direct invented a deadline submission **place** (과학실 담당 교실에), which was not licensed by the source. R4b full REWRITE removed that *literal original phrase*, but added a new unsupported **recipient** (과학실 담당자에게). The localized edit simply removed the suspect venue phrase and preserved the rest. Both could still retain other originally unsupported claims such as a new safety-instruction event. Thus 6/6 suspect-string disappearance is an unambiguous software/string result but **not** 6/6 source-fidelity repair. The former R4a model self-auditor had incorrectly labeled both contaminated notice variants CLEAR. A quoted substring in a source-fidelity packet is not a truth oracle.

### Research-director interpretation

1. A reliable *small* post-realization edit operator can prevent unrelated rewriting, and the actual raw model replies exposed a measurable exact-quote whitespace boundary defect. This is useful engineering but hardly a Transformer alternative.
2. The reference target and the source-law license are post-hoc developer supplied. The model has **not** shown it can independently find those six unauthorized relations; in R4a it missed key ones. The 6/6 result is not extraction precision, independent human perception or global prose correctness.
3. With only 10 patch cases and eight source groups the observed 8,147 vs 8,839 model tokens is a small illustrative token difference, not demonstrated Pareto superiority once source extraction, additional auditor effort and reader outcomes are counted.
4. Do not extend more self-labeled toy data solely to increase acceptance. Source-work-disjoint, independent source fidelity and native reader usability are the next scientific gate.

## Human assessment instruments now ready — do not fake ratings

[Read-only R4b masked forms workflow #44895859483](https://github.com/WhoSia/KSGT/actions/runs/44895859483) completed **80/80 Node regression tests**, verified R4a and R4b raw prior text SHA, then prepared FOUR **A-stage reader** forms and FOUR distinct **B-stage independent source-auditor** forms. A sees Korean text pairs, intended reader/purpose, comprehension and first-edit questions, but no list of original facts or method identity. B sees the exact original source facts and assesses every *whole* output, not just the one suspect span; both are blinded to whether A/B is PATCH or REWRITE. The private method key is stored **separately** and must not be sent to either participant type.

- [A-stage reader ZIP](https://drive.google.com/file/d/1EAskMB6CNFN2gIWG93C5oYjro52YdwcU/view), SHA-256 b86d1b531f43f66e9f799c1c74b29a2b877ba0211e0943b6bd59ed6f0b83fd33.
- [B-stage source auditor ZIP](https://drive.google.com/file/d/1B86V5qG0VLwDu6g3zayjvVmRwuzC-WqM/view), SHA-256 0bd14a808485323375669714a2def276d82fb14f9c16134956cc2d946c03658f.
- Investigator-only key ZIP, SHA-256 e1390a20b0bb1c7e604c37e2498caacd1f7f22e5b1b7d18acd7c640aa7c13f18, not for distribution. All Drive ZIPs were downloaded back, and complete ZIP CRC test passed. The R4b source and reader folder is [here](https://drive.google.com/drive/folders/1ew7WEpiYdxxZ9KX9IFqgLAEQ0kQNYVWO).

Two panel identities P/Q use two original candidate variants for the same CHAT_UPLOAD and NOTICE_CHEM source works, while SCI_SEED and SCENE_NOTE also repeat. **The corpus contains four unique source works and six distinct originally generated case texts; four forms per stage are only counterbalanced presentations, not 16 independent experimental source works.** A participant should complete exactly one assigned form. Independent auditors should not be exposed to the reader task answers or investigator method key.

**HUMAN GATE / no further automated model research claim:** obtain external, blinded Korean reader choices + comprehension/first-edit passages and separate source auditor judgments on exact quoted offending claims. Use pseudonymous respondent codes, no unnecessary identifying information. More than one independent reviewer per form improves error detection but does not turn these four source works into a powered confirmatory trial. After responses arrive, analyze source-work cluster dependence and actual quality/cost trade-offs; until then G10-P2 remains OPEN and full-prose quality gain unproven.
