# G9-P54 — Context-Grounded Reference Realization / Preceding-Sentence Evidence Court
**Stage question:** When may `그중` be linked to a preceding group, and when must the writer review system abstain?

**Method and limitations.** `source_witness.py` is a bounded standard-library Python reference-evidence probe, not a pretrained Korean coreference model, not an NIKL partitive gold scorer, and not a license to auto-edit. It distinguishes weak lexical group cues in two versus up to five preceding sentence rows, a stricter integer-counter compatibility test, potential spoken right-continuation, unique exact source-quote *caller-declared* witnesses, competing group claims, and declared writer KEEP/CLARIFY/CONTEXTUAL policy.

- A lexical `후보`/`팀` or numeric `5명` is **A1 review context**, never proven antecedent identity.
- A unique `5팀` before `그중 2팀` is a counter-compatible hypothesis; `1팀` before `그중 2팀` is incompatible and multiple `N팀` group cues must abstain. Counters miss Korean number morphology, compound units, ratios, ellipsis and pragmatic bridging.
- Even an exact source group quote with a declared CLARIFY policy yields only `EXACT_QUOTE_CANDIDATE_REVIEW_ONLY`. A quoted expression may be the *wrong* antecedent. True independent writer editing decisions and gold referential labels remain unobserved.
- Missing final punctuation with a following row is only a **possible** rightward-continuation flag. The count is not a linguistic classification of unfinished spoken utterances.
- Source/corpus: **pre-existing private NIKL ZA 2025** original ZIP at [KSGT Drive](https://drive.google.com/file/d/1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2/view), pinned ZIP+member SHA hashes. No raw NIKL text, individual document/row identifiers or private review index is in this public repository or in CI.
- The full 25-row probe was run in a private local sandbox. Results in `artifacts/g9_p54_preceding_source_contact.json` are **aggregate-only**, with no independent coreference gold. A separately verified local implementation passed 17 authored positive/negative tests; public source is a compact equivalent with its own 12-test CI suite. The published CI **never downloads NIKL**, and passes do not prove empirical Korean-writing gains.

Run without external packages:
```bash
python3 -m unittest discover -s experiments/g9-p54/antecedent_evidence_v01/tests -v
python3 experiments/g9-p54/antecedent_evidence_v01/source_witness.py /private/NIKL_ZA_2025_v1.0.zip --out /private/new_aggregate.json
```

**P54 stop rule:** BOUNDED PASS if source-cue and cardinality checks and fail-closed controls are executable and private whole-corpus contact is recorded, with the semantic accuracy and human selection outcomes left HOLD. Do not start neural training or run the friend's server merely to prolong P54. Source alone cannot reach G8 S11 A2/A3 writer preference authority. The next P-stage should define a fresh, narrow question rather than reopening this one.
