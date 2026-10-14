# KSGT development instructions

## Permanent GitHub authorship rule

User instruction, 2026-10-11: github-actions[bot] may run CI but must never author or commit code, push changes, create tags, or merge pull requests.

Before repository mutations, verify the authenticated human repository actor. Audit both Git author and Git committer identities across the complete reachable active branch, with pagination. Verify both identities on every future commit before moving its branch reference. CI remains read-only; scan workflows for write permissions and repository writeback.

Preserve legitimate human-authored commits. If bot-authored or bot-committed history is found, record and report it in English, stop scientific promotion, and do not rewrite history automatically. The user's no-automatic-rewrite instruction overrides any older automatic-cleanup doctrine.

Keep PR #1 Draft and do not merge into main without explicit user authorization. CURRENT_STAGE remains G9-P60 unless a separate legitimate stage transition is authorized.

Corpus code, tests and engineering documentation must be English. Original synthetic Korean test fixtures are allowed. Never publish licensed corpus prose, private source IDs, private annotation packets, reviewer personal records, local credentials or large derived text datasets.


## Permanent parallel research doctrine — compute and theory are independent lanes

User instruction, 2026-10-14. KSGT research is NOT a serial pipeline of "wait for personal-server export -> write next prompt -> wait again." The server may be available indefinitely. Its purpose is to provide empirical falsification and large-corpus infrastructure while the investigator continuously advances independent linguistic, mathematical and computational theory in parallel. Treat server execution as an asynchronous evidence lane, not as the research controller, stopping rule, or sole source of new research questions.

Maintain these three concurrently active scientific lanes whenever substantive KSGT work is authorized:

1. **Linguistic/theoretical lane:** Independently study original Korean grammar, discourse reference, partitives, information structure, coordination, plurality, quantification, ellipsis, anaphora, negation and quotation. Retrieve and critically read original literature where available; define linguistic contrasts, formal objects, alternative hypotheses, impossibility claims and explicit countermodels. This lane must continue even if the server is busy, inaccessible, or an evaluation cohort is too sparse. Avoid treating surface regex fragments as independently validated Korean syntax or semantics.
2. **Formal/algorithmic lane:** Develop interpretable inference architectures, compositional semantics, typed evidence/provenance calculus, incremental discourse state, algorithms, complexity bounds and original adversarial tests. Advance mathematics and source-only code without awaiting large-corpus measurements when justified. Critically compare simpler competing theories; document where a purported novelty is a standard result. Keep synthetic formal oracles separate from independent human linguistic judgments.
3. **Empirical/server lane:** Freeze and execute authorized corpus experiments, source-custody audits, falsifications, ablations, distribution/transfer tests and SHA-256 receipts. Server outputs may test predeclared theories but may not silently determine post-hoc frozen hypotheses. Preserve null findings, negative controls, source-work identity uncertainty and the distinction between machine proposal rates and semantic truth.

**Scheduling:** Once a long-running server job is handed off, continue immediately with productive theory and linguistic work, prior-art review, non-server adversarial reasoning, or independent code research. Do not send only "waiting for Work Mode" or repeatedly write server prompts in place of scientific progress. One running experiment may continue while multiple independent theory questions are investigated, without altering that experiment's frozen code or unexposed validation material. Clearly label PROSPECTIVE vs POST-EXPOSURE hypotheses; route new hypotheses to fresh development/frozen cohorts as appropriate.

**Deliverables and documentation:** Substantive research turns should, where justified, advance at least one non-server research object (e.g., a formal claim with assumptions and proof/counterexample, an original Korean minimal-pair analysis, a literature-backed linguistic distinction, or a new algorithm with synthetic falsifiers), plus separately report empirical execution if it actually happened. Maintain a concise three-lane status in the existing canonical Notion record and infrastructure README, distinguishing theory established, linguistic hypotheses, source-only CI, and private server measurements. Update README whenever the canonical architecture, active research question or execution state materially changes. Do not claim a source-only test is independent corpus or human validation.

**Long-range progression:** P62/P63 stage transitions must be driven by a defended scientific-theory and evidence boundary, not by how many server runs or GitHub commits were completed. Human validation is reserved for the late frozen confirmatory phase, without blocking machine or theory work. Keep CURRENT_STAGE=G9-P60 and PR #1 Draft until explicit approval. All earlier authorship, privacy, no-history-rewrite and corpus-custody restrictions still apply.
