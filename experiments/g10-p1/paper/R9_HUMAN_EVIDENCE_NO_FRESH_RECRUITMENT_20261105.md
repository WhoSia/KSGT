# KSGT G10-P1 R9 — Historical Human-Evidence Authority and No-Fresh-Recruitment Recovery Audit (2026-11-05)

**Scientific decision:** KEEP G10-P1 OPEN. **NO_FRESH_RECRUITMENT_BY_DEFAULT / EXISTING_HUMAN_DATA_FIRST / EXPERIMENT_READY_DOES_NOT_AUTHORIZE_RECRUITMENT.** This is an archival/authority recovery, not a new model improvement result. R5–R8 remain development-only and not independently reader-validated.

## 1. Original research question and the repeated wrong turn

The origin in [KSGT 1.md](https://drive.google.com/file/d/1H8V-JIYFOgRXJag9OjTBBxbXNNlUcrVy/view) is producing natural, accurate, context-sensitive Korean prose, not growing a verification taxonomy or collecting evaluation packets as ends in themselves.

- **July, 0.2.61–0.2.81:** protocols, blank participant packets, synthetic multi-role reader simulations. The [KSGT 3.md archive](https://drive.google.com/file/d/1u9NRH6m27HVzOK1zDo4-Sveqio4IVbo9/view) explicitly labels simulations `synthetic_multi_role_ai`. They do NOT count as recruited humans or actual reader preference.
- **Sept 1, G8-P1.3-R2bc:** `PANEL-V` for independent meaning validity was offered as a next step but the user explicitly redirected: "그래 사람 필요 없는 걸로 더 하고 ... 사람 필요한 건 대기(수동 감사)에 넣어놔" ([KSGT 6.md](https://drive.google.com/file/d/1bb4HI5RijYpuE2A_RrD-CZgr9L_nBBCs/view)). Human validity authority is claim-specific; it does not halt mainline Korean generation.
- **Sept 19–24, G9-P24/P25:** formal `HUMAN-RECRUITMENT=HOLD / DATA-FIRST-EXHAUSTION-REQUIRED` and world contact with existing revision traces ([KSGT 11.md](https://drive.google.com/file/d/1NZPY-aX6IZR9oqPLujV8hKyIU53a_TcP/view), [12.md](https://drive.google.com/file/d/1UhwbBb9t8R100OpIUIRwFE8aA_8AgzY1/view)).
- **Sept 29, G9-P36-R11:** the assistant incorrectly decided "이제 인간을 모집하시오" for a blind native speaker preference trial. The user directly rejected it: "인간을 왜 모집함? 너 왜 계속 이런 실수를, KSGT 계보 내내 반복하는 거야?" ([KSGT 14.md](https://drive.google.com/file/d/12f5QO-qfbUjq5uOxq7KsTLtQUPeHAc8p/view)). The assistant corrected R11 into **Existing-Human Provenance Preference Reconstruction** with no new human recruitment. The user clarified: "우리의 산출물 일단 인간 없이 극한으로 가고 야심차게 다 한 다음에도 뭔가 떨어지면 그때 메꾸는 거야." This is the strongest direct user research constitution.
- **Oct 8, G9-P53:** a proposed human reader evaluation for KRC v0.1 was **cancelled** after the actual Korean prose failed basic task, source accuracy and language formation; asking people to judge obviously malformed examples would confound model competence with novel KSGT writing. ([KSGT 16.md](https://drive.google.com/file/d/1RWFqOH_djtCfZ8IV9_JSg_5uHKsS3iNw/view)).
- **Nov 5, R5–R8:** real Groq GPT-OSS development experiments yielded 9 +18+18+18 model final texts on **author-created exposed source works**, but only author/assistant exploratory source audits. Automatically asking for new native readers next, while ignoring earlier human corpora and recruitment decisions, would repeat the documented historical mistake.

**Lineage guard:** `HUMAN_COLLECTION_INSTRUMENT_READY=true` never implies `NEW_HUMAN_RECRUITMENT_AUTHORIZED=true`. Default authorization=false. A future, independently specified claim may require human preference; such unmeasured claim stays HOLD, not an automatic experiment/recruitment assignment.

## 2. Actual EXISTING human-derived evidence already in the KSGT record

### A. StyleKQC: human plural realization, NOT a general preference panel
[Original S9 Court Notebook](https://docs.google.com/document/d/1XlBDlcNPSqHOwQT4uqtAJdqUGT0a1Yq78-gfo6PyN0w/edit): prospective human paraphrase anchor reveal after presealed candidate roles, 36 nominal anchors, 28 admitted under strict meaning/speech-act constraints. Mean normalized character edit distances (smaller closer to the *human references*): identity/source only **0.526259**, forced three edits **0.480643**, protected four including identity **0.451793**. KEEP candidate was nearest 10/28; forced edits all worse than KEEP 9/28. This does not establish human aesthetic superiority. [Original S10 Court](https://docs.google.com/document/d/1Lk8GS1rF98OcA6cSbVc6j3N-1yOp6pW4ixNcidVnHKg/edit) shows source-only KEEP/EDIT/ABSTAIN exact class only **2/9**; data-conditioned intervention prediction failed. Historical S9/S10 figures read from archival notebook, **not freshly replayed from StyleKQC raw bytes in this round**.

### B. KoLLA: actual human correction divergence, NOT candidate semantic validity
[Original R2at KoLLA/AES Court](https://docs.google.com/document/d/1iNgmbNeJxEFUqmwo5h0q85DrAQD0LO-5JHVN27e-hcI/edit): `KoLLA_multi-refs.m2` 1,418 blocks, two human correction strings identical on **440/1418 = 31.03%**. Human corrections and KEEP actions constitute human revision behavior. Separate paired trained AES rubric panels had reproduced subgroup Cohen kappa ~.77–.88, on **different scoring tasks**. PANEL-C (correction production), PANEL-Q (AES rubric judgment), PANEL-V (independent fixed-candidate meaning validity) are not interchangeable. Neither high inter-rater agreement nor a professional correction confers source truth. Historical byte hashes available in the Court; no fresh KoLLA raw byte replay claimed here.

### C. WMT24++: real human translation post-edit action, NOT original Korean writer truth
[G8-P2.1 original court](https://docs.google.com/document/d/1BKNTb4QA2QCuIIuYoJcX0D6BATaRUUPeWxWXPBLhHt4/edit) froze ten segment IDs BEFORE reveal, observed four KEEP/six INTERVENE with documented human post-edit context. Importantly several professionally post-edited/unchanged targets were **not** source-meaning correct (examples 497,597,897), directly refuting `HUMAN_EDITED => MEANING_GOLD`. English→Korean post-edit evidence is not original-Korean authorial revision evidence. Court reports its raw JSONL was not yet mirrored at that time; must check current custody before claiming current-byte verification. 4/10 and 6/10 are descriptive only.

### D. Other existing reservoirs with restricted authority
- KLUE STS (graded human similarity) and NLI (directional entailment), [source receipt](https://docs.google.com/document/d/1LwQ9MYrEnfVVe1VQiUX0C_eB2-mS4LnGK9wagGMQdkk/edit), are task-grounded Korean meaning constraints, **not** a directly transferable full-document stylistic preference label.
- NIKL naturally written/news/spoken source corpora, publicly sourced Korean writer correction histories and literary references can identify human usage and discourse support, subject to license, vintage, writer identity and AI contamination constraints. [KSGT Data Room governance](https://docs.google.com/document/d/1zqhLclzoZztv_CgS-rZfh5asPHeT_GMScvl7VQSYXHQ/edit) defines **default recruitment=0** and existing public human traces first.
- Existing published Korean native-speaker experiments have claim-local domains: null/overt realization, honorifics, referential accessibility. `native-original Korean` in KSGT historical terminology means **originally composed in Korean**, NOT proof that an individual was a native L1 speaker ([KSGT 6.md](https://drive.google.com/file/d/1bb4HI5RijYpuE2A_RrD-CZgr9L_nBBCs/view)).

## 3. Scientific authority matrix: what each can and cannot prove

| Evidence | Can inform | Cannot automatically establish |
|---|---|---|
| Original naturally authored Korean text | Distribution of human usage, genre and variation | Pairwise preference between new KSGT and LLM outputs |
| Human edits / multi-references | Observed intervention and legitimate surface alternatives | Edit necessity, correctness or optimality |
| Human translation post-edit | Human action under cross-language task/context | Native-original Korean authorial intent |
| Existing preference ratings | Preference within the measured specific stimuli, raters, instructions and population | Unseen R8 outputs' blind win rate |
| KLUE STS/NLI and reference data | Task-local semantic approximation/inference | Overall Korean literary naturalness |
| KSGT internal synthetic multi-role judges | Pipeline robustness, adversarial scenarios | Independent human judgment |
| Independent new native reader panel (currently unauthorised) | If ever necessary, current-condition response to the chosen exact output pair | Universal Korean writing excellence or automatic semantic truth |

**Decision:** A future claim specifically about the probability that a target population of Korean L1 readers prefers the *new exact R8 output pairs* may require independent human observations or an existing, task-equivalent independently judged dataset. **That claim may remain UNIDENTIFIED/HOLD indefinitely without blocking mainline scientific analysis.** The model can still be studied on pre-existing human revision traces and authored texts.

## 4. What R9 should do *without recruiting anyone*

1. **Data inventory before another generation experiment:** revive and verify available original bytes/rights, revisions, query/document IDs and row-level provenance for StyleKQC, KoLLA, WMT24++, KLUE and natural Korean corpora. Distinguish repo/Drive bytes held from merely identified published results. No automatic duplication or ingestion of copyrighted data into public repo.
2. **Freeze independent source-work-group splits BEFORE outputs**: StyleKQC by core query, KoLLA by essay and correction context, WMT24++ by source document/segment connections, NIKL by document and source lineage. Avoid reuse of any exposed R5–R8 synthetic tasks as new blind test.
3. **Run a human-trace replay evaluation:** compare no edit / strong generic revision / KSGT targeted revision on authentic permitted inputs. Reveal existing historical human edits only after precommitting candidates. Measure KEEP retention, supported edit-region overlap, protected fact/action consistency, and type-specific divergence. Do not score simple string similarity as human preference.
4. **Quantify the unidentifiable questions:** retain three separate lanes `OBSERVED_HUMAN_ACTION`, `SOURCE_MEANING_ADMISSIBILITY`, and `READER_PREFERENCE`; each has its own source/protocol and unknown/HOLD state. Published experiment claims can be reanalysed within their measured strata; never transport a single global Korean "native preference".
5. **Preregister falsification:** if generic ordinary revision matches or exceeds KSGT on existing human action/meaning-sensitive tasks with equal or lower cost, discontinue the expensive specialist revision branch. Keep independent reader preference unmeasured rather than initiating recruitment by inertia.
6. **New human work is a special exception, not the automatic next node:** it needs a clearly defined unresolved estimand, explicit proof the existing evidence cannot identify it, an analysis showing information value, and explicit human authorization / institutional research safeguards where applicable. `HUMAN_COLLECTION_READY` and `HUMAN_COLLECTION_AUTHORIZED` must remain separate.

This distinction also applies to source integrity: provenance/created-by-human does not entail correct semantic content. Standard source corpus metadata and legal usage/consent terms are independent gates.

## 5. Research OS custody and canon

[Research Chat Archive Protocol](https://docs.google.com/document/d/1gqzYreWnyFvel5dxBDYZAGa2zSDCwj5Pjzsvh8b-kG0/edit): chat archives recover history; latest canonical receipts decide truth. [Cross-Lab Source Byte Doctrine](https://docs.google.com/document/d/1GK7OrfZfr4nBEfpHEszzmp8LCPFYAxP_g46YVek-rlc/edit): GitHub human-authored code, Drive canonical original bytes, Notion interpretation, no bot commits, no undeclared human judgment.

**Evidence verification in this audit:** the named Drive original S9, S10, R2at, WMT24++ P2.1, KLUE receipt, Research Chat Archive Protocol, cross-lab doctrine, Data Room, and KSGT archived 1/3/6/11/12/14/16/22 were fetched and relevant passages compared. Archived study results were not all numerically rerun against original corpora, and **no model/API/reader data were collected in this archival turn**.

**R9 immediate disposition:** NO_NEW_HUMAN_RECRUITMENT; DATA_FIRST_HISTORICAL_HUMAN_EVIDENCE; CLAIM_SPECIFIC_HUMAN_AUTHORITY_HOLD; proceed with authentic existing trace reuse and strong computational baselines.