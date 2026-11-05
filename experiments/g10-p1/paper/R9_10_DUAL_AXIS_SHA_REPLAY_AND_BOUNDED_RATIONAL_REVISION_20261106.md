# KSGT Generation X G10-P1 — R9.10: Verified SHA-256 Corpus Bridge and Bounded-Rational Prose Revision

**Decision (2026-11-06):** The KoLLA–UD dev/test source-string bridge is now independently reproduced with SHA-256; original essay boundaries remain uncertified. A blinded exploratory R8 evaluation packet is constructed; no actual independent Korean reader preference has yet been collected. The primary G10 research goal remains generating **better**, source-faithful, natural Korean documents, not the formal validation infrastructure alone. **G10-P1 OPEN.**

## I. Independent KoLLA–UD SHA-256 cold replay

### Source custody
- Original KoLLA v2 archive: **358,800 bytes**; SHA-256 `d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7`.
- Archived `KoLLA_multi-refs.m2`: SHA-256 `d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4`; **1,418** sentence blocks.
- UD-KSL `ko_ksl-ud-dev.conllu` Git blob `eff8a689c1dad1231ac5d342ebb78742f6327fa3` and `ko_ksl-ud-test.conllu` Git blob `637d4405a89b41439b63cc175ec20ae666227905`; **122** and **124** eligible `KL-(fb|fi|hb|hi)` rows, respectively. Neither the other UD source families nor UD train were included.
- Cross-source linkage: SHA-256 of UTF-8 text after Unicode NFC normalization and Unicode whitespace removal, supplemented by normalized codepoint length. A source fingerprint can have multiple positions; such a row remains **ambiguous**.

### Cold-replayed results

| Metric | R9.10 SHA-256 reproduced |
|---|---:|
| UD dev/test candidate rows | 246 |
| Unique source-position matches | 180 |
| Missing | 62 |
| Ambiguous | 4 |
| Candidate external group spans | 59 |
| Interleaved candidate-group spans | 0 |
| Comparable within-group ordered pairs | 279 |
| Ordering inversions | 0 |
| Same-ordinal suffix pairs excluded | 3 |
| Validated original essay boundaries | 0 |
| New independent reader ratings | 0 |

The previous R9.4 FNV receipt recorded **282** within-group pairs, including **three same-ordinal suffix variants**. For ordinal-based inversion tests those three do not define a strict relative order; we now explicitly exclude them. This does *not* negate historical R9.4 data. It sharpens the comparison domain.

### What cannot be inferred
This result verifies a source-string relation, not a source-document equivalence relation. External `KL-...` prefixes may reflect annotation projects and group identifiers, but no independent original author-scoped essay map is certified. Order-consistent, non-interleaving anchors admit multiple legal partitions of unobserved intervening sentences. No unobserved source sentence is assigned to an essay merely because it is situated between two anchors. **PARTITION-AUTHORITY HOLD.**

The published KoLLA v2 paper reports 100 essays and 1,418 segmented sentences, while its introduction also discusses a historical 1,419-sentence precursor. The sealed file's directly counted 1,418 blocks are the applicable analysis denominator. KoLLA v2 is multi-reference GEC and AES, not a free-standing strong Korean prose generator or independently validated document preference benchmark.

The original KoLLA v1 homepage explicitly says it offers a lawful original learner-corpus tarball: `https://cl.indiana.edu/~kolla/` (retrieval of the tarball and original essay-ID verification are pending). Do not invent a tarball URL or assume dataset-level license implies arbitrary republishing of learner text.

## II. R8 actual generation history: experimental contrast, not a winner

The Groq R5–R8 archive demonstrates **75 real provider calls and 63 final development documents** under the model `openai/gpt-oss-20b` across repeated, author-written source works. The R8 same-draft protocol gives six direct generic-versus-KSGT revision contrasts, two of which produced byte-identical final prose. In the other four, relative source fidelity and reader preference are *unknown* until adjudicated.

An independently reviewed description of one R8 common draft (`NOTICE_CONDITION_A`) shows that a factually unsupported weekly recurrence and a corrective explanatory clue coexisted in the **same draft**. Both revisers removed the unsupported recurrence. This makes the draft's prior error information a plausible mediator and challenges attributing that repair to the KSGT policy alone. The sample is exploratory rather than an independently blinded qualitative annotation.

R8 revision-stage usage:
- Generic: prompt **5,264**, completion **2,150**, of which reasoning **485**, total **7,414**.
- KSGT: prompt **5,780**, completion **1,585**, of which reasoning **137**, total **7,365**.
- A six-work difference of **+516** prompt, **−565** completion (**−348** reasoning), **−49** total tokens; source-work prompts differed by exactly +86 input tokens.

Budget is not controlled, and cost per real reader-accepted document is not observed. `include_reasoning=false` on Groq hides reasoning text rather than disabling reasoning. Groq's official `reasoning_effort` values for GPT-OSS are `low`, `medium`, and `high`. Account-specific rate limits must be read from the account, not inferred from a generic documentation table.

## III. Main theoretical thesis: what does discourse planning actually add?

Let `S` denote **all authoritative input** including facts, author purpose, creative permissions and genuinely supplied reader requirements. Let a plan `Z=f(S)` be a deterministic transformation of S. Then:

\[
I(Y;Z\mid S)=0,
\]

where `Y` is any target judged from the same information. Planning **cannot create new author-grounded information** when Z is fully determined by S. If a planning layer improves output, the explanation must involve **finite computation, attention allocation, representation-dependent inductive bias, constraint management, or allocation of a bounded revision budget**, not mystical information creation. If the planner elicits *new* author information, that must be measured as an information-source intervention, not compared as if both arms saw the same S.

This yields a stronger research question: **under which information, genre and uncertainty regimes does an explicit plan improve the achievable source-fidelity/naturalness frontier for a finite-capacity Korean generator, after accounting for prompts, reasoning and revisions?**

A selective accountability gate is consequently an *architectural hypothesis*, not a new gold label: the system should propose constrained edits only when a particular unsupported/contradicted/omitted claim is evidence-linked to the authoritative source. The generic baseline must receive the same information, including the protected constraints; otherwise policy gains are confounded with disclosure of stronger instructions.

## IV. R9.10 reader packet and next R9.11 confirmatory design

A **private** exploratory R8 reader packet was produced from the sealed ZIP plus the publicly committed author-written R6 cohort. Six pairs were checked; two identical final-text pairs were assigned the structural status `TEXT_IDENTICAL_STRUCTURAL_TIE`. Four non-identical pairs were pseudonymized and A/B policy names omitted. An independently stored researcher arm key holds the hidden correspondence. Both are stored in separate Drive folders, **not** claimed to have different access permissions. The packet includes author-specified source facts, protected truth conditions, intended reader and purpose, three-paragraph format, and **empty** evaluation fields; no simulated human scores.

R9.11 must compare:
1. One-call strong direct generation with the full authoritative source packet.
2. D0 and D1 shared drafts, each revised by a strong generic editor and by selective KSGT accountability, with both reviewers receiving matched source information.
3. A source-work-clustered fidelity annotation (unsupported assertions, contradictions, omitted protected claims, unjustified certainty shifts) **separate from** blind Korean prose naturalness/coherence ratings and actual tokens/latency.

Primary estimand for matched per-work data: the interaction

\[
\tau=E[(U_{D0,K}-U_{D0,G})-(U_{D1,K}-U_{D1,G})],
\]

with predeclared `U` and work-level confidence intervals, not independent-call-as-unit testing. Format failures and partial outputs must remain in intent-to-treat analysis, not be silently dropped. Source-work leakage and shared-claim leakage require independent checks. Randomization and order controls must be recorded, and external blind native Korean readers recruited before confirmatory claims.

**Gates:** 20/20 local Python regression tests passing across both new modules; 246-source SHA replay successful. No new Groq provider calls, no new human evaluation, no certified original essay map. Full R9.10 aggregate is stored in Drive and public GitHub without learner text; the A/B reader packet and answer key are **Drive-private only**.

## References / source authority
- Original KoLLA homepage: https://cl.indiana.edu/~kolla/
- KoLLA v2 dataset record: https://zenodo.org/records/15287129
- KoLLA v2 research publication: https://doi.org/10.1007/s10579-025-09882-9
- UD Korean-KSL repository: https://github.com/UniversalDependencies/UD_Korean-KSL
- Groq reasoning documentation: https://console.groq.com/docs/reasoning
- Groq rate-limit documentation: https://console.groq.com/docs/rate-limits

**Official stage: G10-P1 OPEN.**
