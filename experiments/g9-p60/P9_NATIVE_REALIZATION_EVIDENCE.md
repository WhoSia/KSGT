# Native Korean referential realization — evidence bridge (exploratory P9-P34)

**Authority:** research bridge to official `G9-P60`; **not** a formal stage promotion, a human preference leaderboard, or an implemented semantic judge. The canonical official stage remains `G9-P60`.

## Three primary papers — canonically stored in Research OS

1. Choe (2021), *Interpretation and Processing of Null and Overt Pronouns in Korean*, DOI [10.15718/discog.2021.28.1.289](https://doi.org/10.15718/discog.2021.28.1.289). Original multiple-choice antecedent identification, **133 recruited, 125 analyzed**. Subject-antecedent response percentages: SOV/null **91%**, SOV/overt **73%**, OSV/null **67%**, OSV/overt **58%**. This is **reference interpretation**, not writer production-choice preference.
2. Choe (2022), *Online Resolution of Subject Pronouns in Korean*, DOI [10.15718/discog.2022.29.1.113](https://doi.org/10.15718/discog.2022.29.1.113). **34 participants analyzed**; self-paced reading and comprehension. Very high reported comprehension accuracy and reading-time analysis restricted to correct responses (about **3.3%** trials excluded). Processing and comprehension do not establish a surface generation ranking.
3. Kwon & Lee (2026), *From Null Pronouns to Full NPs: Exploring Accessibility Markers in Korean*, DOI [10.1017/S0022226726101194](https://doi.org/10.1017/S0022226726101194). Experiments **n = 39, 52, 38**, comparing null, overt `kyay`, and full NP. Experiment 1 naturalness means **6.41, 6.18, 6.23** on a 7-point scale; Experiment 2 reports context-conditioned naturalness and an object-antecedent null comprehension error rate **39.7%** versus **7.1%** under subject bias; Experiment 3 naturalness means **5.3, 5.3, 5.4** even though antecedent choice differed. Experiment 2 naturalness includes correct-response-trial restriction; report this selection boundary. Study explicitly links [OSF data and code](https://osf.io/8mv2w/files/osfstorage?view_only=53a39b26ad5840469cb969a942c521c3) in its PDF, but project file access and independent model replication are **not verified in this program**.

**Crucial cross-paper non-equivalence:** Choe uses overt `그녀`; Kwon & Lee use overt `kyay` (걔). Designs, tasks, ambiguity and respondent measures differ. Never pool their percentages as identical estimands.

## Evidence gate for any generator implementation

- **`SCHEMA_VALID` is not `SEMANTIC_PRESERVED`.** A role-reversal or inconsistent fact may remain schema-valid while meaning is unverified or contradicted.
- **`REFERENT_RESOLVED` is not `NATIVE_SURFACE_PREFERRED`.** Reading-time advantage, comprehension, naturalness rating and writer edit choice are separate variables.
- **`KEEP`, `CONCISE`, `EXPLICIT` are candidate actions; `HOLD` is epistemic authority, not a fourth edit.** A sourced task may rationally retain the original.
- A correctly answered subset can be **post-treatment selected** when referring form itself affects correctness. Pre-register marginal outcomes and disclose conditional analyses; do not infer an unconditional effect from the correct-only slice.
- A work-family ID supplied by the evaluator is **not proof of independent source provenance**. Verify work/edition witnesses separately and prevent train/test component leakage.
- A locator supplied in a record is **not verified** until checked against a cited source registry. Human scores require an independent receipt; generated or self-declared scores are not human evidence.
- New genre-specific preference or stylistic law needs a held-out native-reader residual beyond **precommitted** existing information-structure, reference and discourse variables (Harvest XIII H13-K10). Authorial revision is not automatically pure preference (Harvest XII H12-K1).

## External Work Mode P26 receipt (reported; code not imported)

The user's separate **Windows Python 3.14.5** execution reported **8/8 original tests**, **25/25 repaired regression tests**, and **10 synthetic adversarial cases**. It reports local registry, work-split, purpose-vocabulary, action/authority separation and independent human-receipt gates. The complete working tree and 36-file manifest were **not independently opened or executed through this GitHub change**. Consequently this document **does not mark P26 code as merged or remotely CI-verified**, does not assert semantic equivalence and does not promote G9/P64/P9.

## Next executable contract

An independent KSGT harness integration must first receive the verified Work P26 archive, compare files/hash receipts, and map its tests to `experiments/g9-p60` without exposing private inputs. Then build a source-disjoint, pre-registered `KEEP/CONCISE/EXPLICIT` comparison, collecting distinct measures of semantic fidelity, referent choice, naturalness and blinded preference. **Current human outcome: NOT_OBSERVED.**

Research notes: [KSGT P64 Notion](https://app.notion.com/p/3fcef561cf9281b6a3dde2126a19ff21).
