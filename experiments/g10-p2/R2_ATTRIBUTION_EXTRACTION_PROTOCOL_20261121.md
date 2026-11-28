# G10-P2 R2 — Attribution versus endorsement in post-realization Korean reader state

**Frozen before provider calls: 2026-11-21 KST.** Research status: investigator-authored exposed **development** data, not native-Korean reader gold and not a hidden corpus. No claims of an independent writing-quality gain are possible from this instrument.

## Scientific question

A proposition can enter the reader's **discourse access** without becoming an **asserted fact**. In particular, "나래가 문을 열었다고 말했다" can make the *claim* available for later "그 주장" but does not establish that 나래 opened the door. The R1 `known: ['F1']` ledger collapses lexical exposure and narrator/source commitment. R2 must distinguish the two rather than silently treating quotations, denials and questions as no discourse history at all.

## Fixed design and author-side labels

Eight independently authored synthetic work briefs (two chat, two science, two notice, two literary scene); five variants of the same target proposition per work = **40 realized Korean snippets**. Each work has one proposition P1 and five statuses:

- **ASSERTED**: the narrator/writer presents P1 as established (not externally verified truth).
- **DENIED**: the narrator/writer explicitly asserts its negation; P1 itself is not established.
- **ATTRIBUTED**: another speaker/source is reported as claiming P1 without narrator endorsement.
- **QUESTION**: P1 is questioned or uncertain but not established.
- **ABSENT**: P1 is not meaningfully presented in the snippet.

The corpus is investigator-authored; labels are **not** independently adjudicated. The benchmark is adversarial and small; the unit is source work, not 40 independent situations. The proposition P1 is shown to the model as an *analysis query*, not as content the reader has encountered. The model must use only the actual snippet for evidence.

## Same-input model contrast

One GPT-OSS 20B model at temperature 0, identical API/settings, two arms per snippet (80 requests):

1. **BINARY**: asks if the snippet asserts P1, returning `ASSERTED`/`NOT_ASSERTED`/`UNKNOWN`, with a verbatim excerpt from the snippet.
2. **ATTRIBUTION**: distinguishes `ASSERTED`, `DENIED`, `ATTRIBUTED`, `QUESTION`, `ABSENT`, `UNKNOWN`, with the same excerpt requirement.

A and B request order must alternate across successive work×variant cells. Freeze the literal prompt and all 80 prompt hashes in the published plan *before* calls. The difference between instructions is deliberate, so any gain supports **task framing**, not a new architecture. Both arms receive precisely the same proposition/snippet and have identical model settings. The model never receives the author-side variant ID, gold label or output choices beyond the documented task-category vocabulary.

## Analysis (all outputs, no cherry-picking)

- Record every provider attempt and final response with original prompt hash, actual response hash, model name, usage and failure/finish reason; no hidden deletion of failed attempts.
- Parse JSON strictly. Invalid/extra text counts as invalid, not a repaired success.
- Compute **binary assertion** accuracy for both arms and multi-class accuracy for ATTRIBUTION; show confusion per status and the work-level distribution. All denominator values include malformed and unknown.
- Check whether the evidence is an **exact unique substring of the actual snippet**; return the output span or an unsupported flag. This is a provenance/quotation check, **not a semantic entailment oracle**.
- Track raw assertion false positives and false negatives, abstention, evidence support among assertions, provider prompt/completion tokens and elapsed time. Do not equate text mention with writer commitment. Do not claim model confidence is calibrated.
- Test the two-ledger state interface: an attributed/denied/questioned P1 is **mentioned** but not **endorsed**; an absent P1 is not mentioned. Inference about which pronoun a human reader can resolve requires independent reading data.

## Stop/next decision

The controlled state interface may only move beyond authored prose when the extractor can return evidence spans on unseen language and its unsupported assertions remain acceptably low under independent annotation. If model taxonomy only shifts labels without validated evidence, revert to conservative abstention. **Never relabel these 40 snippets as withheld test cases after reading outputs.**

P2's main scientific target remains *complete, useful Korean prose*, including intended source truth and rhetorical purpose. This diagnostic gate is necessary but not sufficient; R3 must run identical-state-as-text and executed-controller comparisons on full new texts, with independent reader/auditor judgments and all costs.
