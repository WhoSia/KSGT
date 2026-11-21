# G10-P2 R5f — Human-Language Realization Retrieval on Unseen Conversation Families (preregistration)

**2026-11-21, prior to any R5f inference.** This is a **small applied-generation development experiment**, not the declaration of a newly trained KSGT neural model. The previous R5c/R5d mandatory patch/seam approach failed; it is frozen as a negative control, NOT extended. Work on actual Korean phrase and pragmatic register realization instead.

## Scientific question
Can a compact, executable **conversation-family-disjoint exemplar retriever** from actual Korean stylistic rewrites improve 120B's complete **5-turn** conversational style transfer over a direct prompt, without inventing content, flattening personae or contaminating evaluation with the same conversation? Under what token cost? Human target variants are **references, not unique literary-quality gold**.

## Genuine dataset and rights
**SmileStyle** from Smilegate AI: https://github.com/smilegate-ai/korean_smile_style_dataset. Git revision **b362299d1ac9a8a0de2f64eb8f55f3b386e97fad**, immutable TSV git-blob SHA-1 **1f666dcb38d4822ff7bb61cf899d568f01c576e8**. README explicitly warns: **toy corpus with typos and style-conversion mistakes**. **CC BY-NC 4.0**, noncommercial research and attribution required; commercial deployment needs separate permission. Cite **Seonghyun Kim (2022), SmileStyle: Parallel Style-variant Corpus for Korean Multi-turn Chat Text Dataset**. No licensed claim extends from this dialogue corpus to fiction, public notices or academic prose.

We opened the actual GitHub blob: UTF-8 17 TSV columns, 3,470 nonblank utterance rows, 235 blank separator rows defining **236 observed nonempty TSV blocks** (upstream README claims 235 conversations; actual boundary mechanism disputed); formal and informal columns 3,470/3,470, gentle 1,703. Row count is not the number of independent conversations; the 236 delimiter-defined blocks are the split unit; neither independently verified conversation identity nor speaker identity is available. README's own examples include unnatural or ungrammatical style realizations. The 3,470 paired utterances are **style variants, not 3,470 independent human preferences**.

Source alone is unsuitable for unrestricted training because SmileStyle may contain artifacts of dialogue collection and editing. Restrict to author-observed safe work and clean attribution. Original TSV is NEVER committed to the public WhoSia/KSGT code repository. At experiment runtime, download pinned public upstream original to the read-only runner, verify git blob SHA, and archive with license attribution in the user's own private Drive research evidence.

## Frozen source family split, sample and model arms
Eight previously **unseen** (with respect to R5a–R5d source works) SmileStyle families; within this family experiment, use five *consecutive actual dialogue utterances* as a unit. The exact TSV row-index windows are fixed in source order before seeing model replies:
- family 8, start row 112, formal→informal
- family 35, start 530, informal→formal
- family 50, start 771, formal→informal
- family 64, start 990, informal→formal
- family 105, start 1637, formal→informal
- family 117, start 1806, informal→formal
- family 169, start 2637, formal→informal
- family 173, start 2701, informal→formal

All target utterances are visible in the public source; these are **pre-exposed development inputs**, not a sealed confirmatory test. Five turns preserve conversational sequence. Read **all five source and human target utterances** verbatim from pinned TSV; do not silently fix human-source mistakes. Do not push the 40 source/target strings into public GitHub commits. Target style is **informal or formal** only; avoid other potentially stereotyped/offensive style columns.

Two arms, both real **Groq GPT-OSS 120B**, temp 0, one call per source and maxTokens=1450:
- **DIRECT**: input five original turns, target formal/informal, explicit intent/personae preservation, natural Korean and exactly five output turns.
- **RETRIEVED**: identical prompt/data/model plus **four real Korean human style pairs** retrieved deterministically from a **frozen pool of other conversations**, direction-matched, ranked by sentence function and lexical/length compatibility. The retrieval code executes rather than asking an LLM to hallucinate examples.

Frozen exemplar candidate corpus row indices: `[0,50,78,129,202,240,295,341,375,606,932,1174,1373,1705]` across distinct other conversation families. They have been manually previewed for domain suitability but **NOT independently gold-rated**. Four examples are selected per case by explicit retrieval function; no exemplar belongs to any of the eight test dialogue families. No other human style pairs in the full dataset are secretly used as nearest-neighbor test leaks.

**New actual provider calls: 8 DIRECT + 8 RETRIEVED = 16.** No old R5a–d calls counted again. No additional human samples are fabricated.

## Methodology of constrained generation
Both arms must output a strict five-element array of Korean utterance strings with the same ordering. A failed JSON parse is a real **generation failure** and is retained with raw bytes, never repaired by hand. Preserve the original propositions, relations, proper names, numbers, speaker turns, requests and level of certainty, but choose natural Korean endings and idioms. Reference-to-output exact match, string length, unchanged speaker count, duplicate phrases and input token counts are **descriptive** and cannot score quality in isolation.

Main developer readback is the entire 5-turn source, human reference, direct model output, retrieved model output together, specifically checking how honorific endings, subject ellipsis, and social stance affect **actual dialogue coherence**. A human reference can be worse than both models when a toy corpus has errors; no automatic BLEU/reference overlap win claim. All token counts include example-rich prompt overhead and are compared across arms without cost normalization rhetoric.

## Kill conditions / novelty
If direct 120B already generates natural Korean and retrieval adds no genuine expressive improvement or copies errors, **reject the retrieved exemplar adapter** instead of demanding more HTML surveys or controller rules. If retrieval only changes formulaic endings but worsens idiomatic cohesion, report it. If more complex author edits are needed to improve scholarly/literary writing, fund a different source corpus rather than using SmileStyle chat as literary style gold.

The concept **retrieval-based example prompting** is standard prior art and not independently novel. The KSGT-specific scientific contribution would require an independently successful, efficient, source-conditional Korean realization principle across genuinely unseen domains, which this study cannot establish.

## Existing recorded source boundaries
- G10-P2 latest actual model calls before R5f = **292**. Only after successful raw provenance checks may increment to 308.
- KoLLA v2.0 original 1,410 double-human-correction sentences: L2 learner grammatical error repair, not native high-literary quality (project R9.3). StyleKQC human formal/informal 3,000 base queries, not verified locally as full dataset. NIKL argumentative writing rubric data are *rated essays*, not direct before/after revisions and have access/use conditions. Do NOT conflate these.
- Source-rights guard: public SmileStyle code only, source strings and derived human-target comparisons archived **privately in Drive** alongside noncommercial license and precise commit. User's own expert Korean judgments valuable later but cannot be promoted to independent population statistics.

## Pre-inference source-layout correction, fixed after failed cold preflight

A reproducible GitHub Actions cold preflight #44902717128 **failed before any model inference** due to the dataset count guard. Exact raw TSV has **3,470 nonblank utterance rows + 235 blank separator rows = 236 nonblank, contiguous delimiter blocks**, not 235 as the upstream README's conversation number suggests. The corpus author may be counting a different conversation unit; that provenance is not established. The test group IDs and five-utterance windows frozen above remain unchanged because indices were already grounded in the actual TSV, not the author-reported count. Changed code expected-block count from 235 to 236, and marked delimiter-block groups as an observed structural split rather than independently authenticated conversation identities. This is a **pre-model source correction**, not a result-driven sample change. The prior CI failure is retained as evidence.
