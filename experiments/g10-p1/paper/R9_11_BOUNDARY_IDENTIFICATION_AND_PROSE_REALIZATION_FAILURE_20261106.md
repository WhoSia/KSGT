# KSGT G10-P1 R9.11 — Essay Boundary Partial Identification and Prose Realization Failure

**Status (2026-11-06):** New actual source-linked boundary-gap census + original Groq R8 surface-format audit. **No certified original essay partition, no external reader preference and no new model calls. G10-P1 OPEN.**

## 1. Question A: how much of the original KoLLA essay partition is identified?

### Source evidence
- Sealed KoLLA v2 ZIP SHA-256: `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`.
- Original M2 source blocks: 1,418.
- Upstream UD Korean-KSL dev/test source sentence rows: 122 + 124 = 246, independently read from source, not inferred from IDs alone.
- Exact source-string evidence is **normalized NFC + Unicode whitespace removal + SHA-256**, yielding 180 unique source-position matches, 62 missing and 4 ambiguous. The external candidate labels define 59 candidate groups; these labels do **not** establish original essay identity.

### New calculated partial identification
Order the 59 candidate-group spans by matched M2 positions; no span intersections and no inversions among 279 strictly comparable within-group ordinal pairs (three tied ordinals excluded). Between each consecutive pair of candidate spans, suppose the last observed A anchor is at position `a`, the first observed B anchor is at position `b > a`. Conditional on both groups being authentic, contiguous, distinct and adjacent, the boundary may fall after any of `a,a+1,...,b-1`; therefore the set has `b-a` elements. This **conditional** result must not assign the intervening `b-a-1` sentences.

| Measure | Measured value |
|---|---:|
| Candidate group spans | 59 |
| Consecutive candidate span gaps | 58 |
| Single-position conditional boundaries | **1** |
| Multi-position conditional boundaries | **57** |
| Maximum conditional boundary candidates in one gap | **59** |
| Sum of unanchored M2 block positions between consecutive spans | **636** |
| Original essay boundaries independently authenticated | **0** |

That 1/58 number is **not** a certified essay-boundary detection rate. If there are unseen intervening original essays, the set of possible original partitions is even larger. The 636 count covers only between-group-span positions, not all unanchored M2 positions in the corpus. An individual row's exact normalized-text match is not a license to use the external prefix as an original author/essay ID. No learner text or direct individual ID-to-source-position mapping is exported in this public report.

**Code:** `r911_boundary_identification.py`, with synthetic and original-byte-blocking tests. Exact rerun requires private/local legal copies of the KoLLA ZIP and the upstream UD source-text receipt. It must not publish or rehost the learner-original text.

## 2. Question B: where does discourse accountability damage the final Korean prose?

Replayed the sealed actual R8 Groq ZIP SHA-256 `4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9`. For six investigator-authored development source works, both revisers consumed precisely the same base draft. No new Groq calls. Deterministic surface probes deliberately **do not** pretend to adjudicate entailment or style.

| Surface observation | Count |
|---|---:|
| Exactly identical final pairs | 2/6 |
| KSGT final shorter in characters | 3/6 |
| KSGT final longer in characters | 1/6 |
| At least one paragraph deficit under KSGT | 1/6 |
| Generic final has narrow audit-meta marker | 1/6 |
| KSGT final has narrow audit-meta marker | 1/6 |

The text-identical outputs have zero character length difference. One notice's final public-facing paragraph includes the phrase **‘정확히 보존되어 있습니다’** and explains whether a weekly-recurrence claim was supplied. Both arms emit it. This is an illustrative **audit-to-prose boundary leak**: a quality-control instruction appears as reader-visible metacommentary rather than being internalized into ordinary useful prose. Not every mention of uncertainty in a public notice is a leak; the defect is talking *about compliance with the writing brief* instead of using the uncertain fact appropriately.

The **scene corridor** case shows a distinct mechanism: KSGT reduces a 397-character, three-paragraph generic output to 181 characters and two paragraphs. It protects a list of observed actions but degrades connective realization, paragraph pacing and the stipulated three-paragraph structure. The generic output also introduces descriptive details beyond the supplied fact list; therefore the correct scientific evaluation is a **two-dimensional source-fidelity versus naturalness** comparison rather than asserting either arm's general superiority.

These are exposed developer observations, not independent human ratings or validated hallucination counts. Rule-based audit-meta regexes may produce false negatives and positives. Two outputs agreeing does not establish that the shared artifact is good.

## 3. Research hypothesis: hidden accountability, reader-visible realization

An explicit discourse/proposition plan is a computation tool, not an extra information source. The realization stage should condition on the plan but **must not quote the plan's checking vocabulary**. A source-faithful architecture needs to distinguish:
1. **Internal source contract:** claims, references, prohibited assertions, uncertainty and creative licenses.
2. **Discourse design:** reader-relevant order, topical continuity, rhetorical relations and Korean anaphora/ellipsis and endings.
3. **Realization:** ordinary prose, without compliance jargon or mechanical fact enumeration.
4. **Selective repair:** evidence-linked minimal intervention when an unsupported fact, contradiction, omission of a protected fact, or format violation is detected; otherwise preserve the draft.

A potential selective-action decision under explicitly *estimated* parameters is `act iff p(error) × expected(error loss avoided by repair) > repair cost + expected stylistic loss`. The terms cannot be estimated from these six exposed works alone, and choosing them post hoc would be invalid. Compare an always-revise KSGT arm with a **risk-gated** KSGT arm using the *same* complete information as a strong generic draft-and-revise comparator.

### Counterfactual protocol R9.12
- Pre-register and freeze a genuinely new source-work-disjoint cohort, genres and target audience; no reuse of R5–R8 works as held-out data.
- Strong DIRECT and RICH_PROMPT single-call comparators; paired common draft for generic revision, all-revise KSGT and **selective** KSGT; optionally two draft conditions D0/D1 to test whether self-auditing in the initial draft mediates the revision effect.
- A source-protected **semantic adjudicator** records supported assertions, unsupported added events, unjustified certainty shifts, missing protected facts, and uncertainty handling. Human Korean readers, independently blinded, assess naturalness, coherence, reference clarity, sentence endings, genre, and readability. Do not allow one aggregate aesthetic score to substitute for a source fidelity verdict.
- Evaluate failures and absent outputs intention-to-treat. Primary statistical unit is source-work, not sentence, LLM call or reader-rating row. Report clustered uncertainties, tie counts, and actual prompt/reasoning/completion tokens and latency. Document whether extra constraints or extra planning computation were granted to only one arm.
- No claim of quality superiority before real ratings. No running the API based only on a synthetic protocol test.

## 4. Evidence custody

Store read-only aggregate JSON and Python testable source on GitHub; **Drive stores the raw-source-byte archive and SHA receipts** as canonical byte evidence. The original KoLLA and Groq source ZIPs are already sealed in Drive; new aggregate contains no learner text. Notion is the semantic research ledger. Original essay boundaries: HOLD. G10-P1: OPEN.
