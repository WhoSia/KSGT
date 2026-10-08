# G9-P56 — Direct Chat-Archive Historical Crosswalk
**Evidence type: direct Drive conversation-export reads, not native human gold.** Six archive files were inspected; the source chronology predates P53–P55.

| Source and stage | Confirmed inherited principle | P56 interpretation |
|---|---|---|
| [KSGT 1 (15–19 Jul 2026)](https://drive.google.com/file/d/1H8V-JIYFOgRXJag9OjTBBxbXNNlUcrVy/view), D05/K05, Prototype 0.2.7 | Referential cohesion; null anaphora vs overt repetition; **SenseSetInvariant** tracks interpretations removed/added by editing | Preserve all hypotheses explicitly present in a bounded frame; reject unjustified disambiguation |
| [KSGT 1](https://drive.google.com/file/d/1H8V-JIYFOgRXJag9OjTBBxbXNNlUcrVy/view), Prototype 0.2.8 | **ArgumentMemory** tracks omitted arguments, topic continuity, competing antecedents, and abstention | P56 group hypotheses, not a new claim to full Korean parser induction |
| [KSGT 2 (20–23 Jul)](https://drive.google.com/file/d/1J87N6VgAhs9_cVTD1SyP8XfIWV2ABb37/view), 0.2.11–0.2.12 / 0.2.62 | Evidence level distinct from action; **Reference Competition with Negation Scope** | A1 source quotation does not equal adjudicated referent, negation scope still not implemented |
| [KSGT 4](https://drive.google.com/file/d/1Z1VNuWD-MFstmxvVyTU-bxvMbXxn1HRr/view), G0.1/0.4 audit | Fixed meaning-evidence graph, candidate support; plan→realization provenance and selective rollback | Do not call this finite witness filter a complete writing generator |
| [KSGT 7 (Sep)](https://drive.google.com/file/d/1HJBd8-ck9LBqusZ5Cjmebe0k8FEWzBjW/view), G8-P2.14 | Internal candidate retention vs selective display; ONE/SELECT/CLARIFY; when no legitimate branch available, abstain | Multiple candidate groups trigger abstention rather than forced first choice |
| [KSGT 13 (Sep)](https://drive.google.com/file/d/13MpNobQVFAUPfSPPtam3RvLXmJbXo185/view), G9-P36-R2 | Identical surface not same structural authority; `antecedent_key`, `local_scope_key`, `attachment_key`, `block_type` preserved in a different proof-of-redundancy setting | **Analogical**, not direct coreference gold: keep separate group IDs, scope/block/attachment tests |
| [KSGT 14 (Oct)](https://drive.google.com/file/d/12f5QO-qfbUjq5uOxq7KsTLtQUPeHAc8p/view), G9-P44 | Surface-return/discourse-state hypotheses often failed; connective detector using JS `\b` with Hangul was invalid. Layer multiplicity ≠ new independent samples | Prohibit interpreting lexical cue as discourse fact or correlated NIKL annotation layers as independently verified gold |

## Typed P56 claim
For the **submitted** evidence frame `F`, let `H(F)` be the IDs of group hypotheses that have a unique exact quotation in the claimed preceding source, matching declared discourse scope, block and attachment, and a compatible strict subset count/unit. `H(F)` is not the true set of antecedents in the Korean text.
- `|H|=0`: abstain; absence of a witnessed hypothesis is not proof that no referent exists.
- `|H|>1`: retain multiple hypotheses and abstain from forced commitment.
- `|H|=1`: one *among supplied eligible hypotheses*, **not independent referent gold** or exhaustive world knowledge.
- `KEEP` always preserves the original. `CLARIFY` plus one submitted candidate gives **review-only**, not a writer-preferred or semantic-certified rewrite.

**Uncertainty calibration:** The existing 25 private NIKL ZA 2025 `그중` contexts contain zero independently adjudicated group antecedent gold. ECE, Brier, empirical accuracy and a numeric posterior are therefore **UNIDENTIFIABLE** from the current observation. A future properly licensed, independently reviewed, source-disjoint referent-label set is necessary. Do not force new human recruitment as an automatic stage dependency: the older G9-P36 chat separately distinguished collection *readiness* from *authorization*.

**Novelty and inheritance:** P56 contributes one tested **typed candidate-set/provenance guard**, plus explicit impossibility of calibration under absent independent labels. The candidate-set, abstention, structural-scope and semantic-preservation principles themselves were already present in 2026 KSGT history; no novelty inflation.
