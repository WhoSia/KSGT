# KSGT Generation IX G9-P62-R3 — Typed Source Identity, Prefix-Only Referential Proposals & Falsification

Status: PROPOSED P62 extension / machine-only synthetic validation. CURRENT_STAGE=G9-P60 unchanged, PR #1 Draft, no main merge, independent semantic evaluation HOLD. Never publish licensed prose, private source IDs, or human packet material.

## Scientific questions and typed evidence

Observable surface agreement does not prove authorship, identical intellectual work, or semantic reference. Let X=(x_0,...,x_(n-1)) be an ordered list of original Unicode units.

1. Strict structural equality: X =u Y exactly when ordered source-unit sequences are identical.
2. Directed contiguous-unit containment: X <=u Y when the full shorter list occurs contiguously in the longer list. Keep every candidate placement; different-unit containment is not a symmetric equivalence.
3. Segmentation quotient: X =c Y when concatenated Unicode code-point streams are equal. This is a weaker text equivalence than unchanged unit structure; one source span may become cross-unit after resegmentation.
4. Normalized-only match: NFC plus whitespace folding compares lossy proxies. It is diagnostic, not a certificate for Unicode source-span transport.
5. Unresolved or shared weak metadata: titles, years, identifiers and approximate semantic similarity never create exact-text or same-work identity.

The code in p62_r3_identity.py returns oriented proof types and admits nonempty source spans only when the exact Unicode code-point mapping has a unique placement and fits inside one target unit. Repeated-subset ambiguity, cross-unit spans, out-of-subset positions and normalization-only equality trigger explicit HOLD. Even strict text identity never proves same author or same underlying work.

An exact-surface exclusion graph may place text-connected records in one conservative dependency component for train/test leakage prevention. Transitivity of this EXCLUSION constraint must not be promoted to transitivity of same-work semantic identity. Weak metadata matches are separately quarantined. The reference court is quadratic and for small, preselected comparisons; full-corpus work requires indexed joins, source manifests and separately tested witness provenance.

## New pre-target mechanisms

Three machine-only policies use only pre-target source characters. PREFIX_ACCESSIBILITY prioritizes plural numerical groups and near discourse units, with lexical recurrence as a tie-breaker; PREFIX_RECENCY prioritizes distance; PREFIX_REPETITION prioritizes candidate bigram reoccurrence in OTHER preceding text, excluding the candidate itself. These transparent heuristics are not calibrated or validated semantic antecedent models.

The intended falsifiable noninterference invariant is F(prefix,suffix_1) = F(prefix,suffix_2) for unchanged prefix and arbitrary altered future content, subject to fixed target indices and source windows. It follows from the prefix-only input contract. It does NOT imply segmentation invariance, semantic correctness, improved generation, or human preference. The inherited structural baseline may use after-target counters and the inherited lexical baseline reads later text.

## Frozen machine-falsification court

F1: Eight synthetic after-target suffix attacks per admitted observed target. Prefix signatures and top-1 outputs MUST remain invariant. Count legacy structural/lexical flips separately on the same frozen candidate inventory.

F2: Record differences among three prefix policies, inherited structural-versus-lexical policies, and prefix-versus-inherited policies. Stratify mechanically by family/year and report denominators, abstentions and selection limits. Disagreement is not accuracy.

F3: Deliberately change only source-unit segmentation of an unchanged concatenated text and test representation-induced feature changes; retain P61 target-unit exclusion distinct from the P62 intra-unit estimand.

F4: Adversarial Unicode source identity: repeated containment, nested placement, cross-unit mapping, NFC, whitespace and weak source IDs. Refuse ungrounded span transport.

F5: Preserve all previous adverse R2 evidence: 146 repeated views (1,845 unique targets), 57 target-unit pseudoanchor contaminations, 109 context-only demonstratives, 243 screened-clear pseudoanchors, seven normalized-only matches in quarantine, the P62 circular-anchor sign reversal and the inconclusive +2.99 pp inter-unit proxy [-0.49, +6.44]. Neither synthetic negatives nor screened pseudoanchors become independent human gold.

## Private development-only run

The file p62_r3_machine_court.py expects the private R2 UNIQUE_REVIEW_PACKET.private.jsonl.gz, its independently calculated exact SHA-256, 2,254 unique review items and 1,845 observed targets. It refuses input mismatch, any existing output folder and any non-null ground truth/independent response. Use --packet, --out, --expected-sha256, and optionally --expected-items. Write only aggregate JSON and SHA-256 manifest to a NEW private directory. Do not run against an allegedly untouched final held-out sample. Preserve original private R2 files and the existing ingestion controller untouched. Machine-provisional outputs cannot support claims of reference recovery.

Run the existing unittest discovery suite on the infrastructure/personal_server_corpus directory. The new synthetic cases cannot substitute for an actual full private R3 execution. A full-cohort or source-work independence audit beyond this selected R2 packet requires another frozen declaration and safe single-controller resource checks.

## Research sequencing and governance

Prioritize data ingestion, formal evidence constraints, machine theory/model invention and falsification. Actual qualified human evaluation belongs near the end of the research program after freezing independent material and analysis plans. It is not an immediate engineering gate.

Follow root AGENTS.md: no GitHub Actions bot authorship, commit, push, tag or merge; verify both Git author and committer; no automated history rewrite; no contributor spoofing by mailmap; no merger of Draft PR #1; CURRENT_STAGE unchanged until explicit authorized transition.

No unpublished private corpus measurements, semantic accuracy or writing benefit may be invented. Source-only code + synthetic tests may PASS while full private-population P62-R3 results remain NOT EXECUTED from GitHub alone.
