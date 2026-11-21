# G10-P2 R5f — 16 genuine Korean five-turn dialogues: public style-variant retrieval did not establish a prose-quality advantage


## R5f primary-source authorship ERRATUM — issued after model execution

**The scientific label has been corrected; the historical data, original frozen run and numerical results have not.** A subsequent direct read of the [pinned upstream SmileStyle README](https://github.com/smilegate-ai/korean_smile_style_dataset/blob/b362299d1ac9a8a0de2f64eb8f55f3b386e97fad/README.md) confirmed only that **Smilegate AI built a 17-style parallel Korean dialogue dataset** and warns of typos and conversion errors. Its public README **does not document who wrote, generated or checked individual transformed rows, human annotation protocols or independent human preference labels.**

The earlier phrases **"human-written style references", "human-authored dialogue style pairs", "human example retrieval"** in this R5f document and the frozen preregistration **are NOT established original-source facts**. Read them as historical shorthand for **published Korean style-parallel source variants (per-variant human authorship UNVERIFIED)**. Neither the script's historical variable names `humanReferenceStyleTurns`/`humanReferenceSHA256` nor the workflow title proves annotator identity. Source corpus group separation is at most **236 delimiter-defined nonempty blocks**, not verified independent writers, speakers or humans.

The authentic study, now more narrowly characterized, compared 8 direct-model 5-turn Korean dialogue transformations against 8 otherwise equal transformations with **four retrieved examples from a public style-variant dataset of unverified editing provenance**. All 16 provider receipts, SHA and token totals, exact-reference overlaps, local naturalness observations and mixed/negative conclusion remain valid within that narrower scope. **0 independently verified human style-preference judgments, 0 independent source-semantic gold, 0 evidence for a trained new generator, 0 validated superiority**. The original license, original ZIP and source text hashes remain unchanged; don't rewrite those bytes or backdate this erratum. Before future use as supervised HUMAN-preference material, obtain actual source annotation/production methods from the dataset authors.


Date: 2026-11-21 KST. **Developer experiment completed** with real GPT-OSS 120B provider calls and originally published Korean conversation text. No independent native-reader preference, no novel neural model and no established global or genre-specific writing-quality gain. **Official G10-P2 OPEN / QUALITY_HOLD.**

## 1. Source identity, original human style references and provenance

- Original source: **Smilegate AI, Seonghyun Kim (2022)**, *SmileStyle: Parallel Style-variant Corpus for Korean Multi-turn Chat Text Dataset*, https://github.com/smilegate-ai/korean_smile_style_dataset. **CC BY-NC 4.0**; noncommercial research only without separate permission. Dataset README explicitly says **toy data with typos and style-transfer errors**. It cannot be promoted into polished-Korean editing gold.
- Public upstream Git commit frozen at `b362299d1ac9a8a0de2f64eb8f55f3b386e97fad`; original `smilestyle_dataset.tsv` Git blob SHA-1 `1f666dcb38d4822ff7bb61cf899d568f01c576e8`; cold raw SHA-256 `523ce83d6e9154e2357ca759460b487231aa0853bf98b208d0cb624a8e1e69bf`; **2,357,401 bytes**. Original licensed bytes, attribution and the complete 16 raw provider responses archived **privately in Google Drive**, not reposted as source text in the public KSGT codebase.
- **Actual corpus structural discrepancy**: 3,470 paired nonblank utterances, 235 blank separator rows, and therefore **236 delimiter-defined nonempty text blocks**, whereas the authors' README lists **235 conversations**. Without original conversation IDs, the 236 text blocks cannot be asserted to equal 236 verified independent human conversations or writers. [Original failed preflight #44902717128](https://github.com/WhoSia/KSGT/actions/runs/44902717128) correctly stopped **before any new inference** when the observed count disagreed with the earlier 235 assumption. The experiment index sample was NOT changed after inspection; only the explicitly recorded pre-inference source-count check was corrected.
- Exactly eight 5-utterance windows from different blocks (groups 8, 35, 50, 64, 105, 117, 169, 173) and fourteen pre-inspected exemplar candidate rows in **other delimiter blocks**, source and retrieval chosen with executable fixed ranking. Each test case receives **four** direction-matched human-written style examples or zero examples. No human gold on aesthetics or full-text preference.

## 2. Actual 120B model experiment, output and provider cost

[Successful native GitHub Actions #44902845961](https://github.com/WhoSia/KSGT/actions/runs/44902845961). Read-only Actions, human WhoSia contributor, Node22 native R5 **44/44** + historical G10-P2 **80/80** PASS. **16/16 real Groq GPT-OSS 120B provider calls**, temperature 0, max 1,450; one call per case and arm. Both conditions share exact five source turns and social-register goal. The retrieval condition alone includes four corpus-derived contrastive style examples and may use more input tokens.

| Arm | New provider calls | Complete 5-turn output JSON | Provider tokens (input+output) | Exact utterance matches to noisy human variant |
|---|---:|---:|---:|---:|
| Direct 120B | 8 | 8/8 | **5,712** | **4/40** |
| Source-disjoint human example retrieval 120B | 8 | 8/8 | **7,699** | **5/40** |

All new 16 calls: **13,411 tokens**. Retrieval requires **1,987 more tokens (+34.79%)**, a cost burden before any subjective quality benefit. **Two** of eight entire five-turn outputs are byte-for-byte the same across arms (cases 035 and 169); the six others are largely local stylistic alternations. Exact overlap with human target is **not a quality or preference score**: toy human references can be wrong, redundant, stilted or contain orthographic errors. No independent user responses were collected, and no claim of retrieval superiority is made.

[GitHub original 16-call artifact #14706273926](https://github.com/WhoSia/KSGT/actions/runs/44902845961) → [canonical Google Drive ZIP](https://drive.google.com/file/d/1f-OmbWQnalFIsanaRaQ_EY1GEMCrkPBr/view), [evidence folder](https://drive.google.com/drive/folders/1w43-7MsMI2DaW7Dr9oayCr5HbXOA6Xll). ZIP **510,462 bytes**, SHA-256 `e76598ad63f44839cacd2dc5c3848ad0f29d8c88a25c87754f5500fc4302f498`, verified after Google Drive cold download with ZIP CRC success. It contains the original licensed corpus and attribution, per-call raw attempts/responses/model identities/prompt hashes, a full 16-conversation score and plain Markdown source / human variant / direct / retrieved side-by-side reading packet. Not an HTML survey.

## 3. Source-visible investigator Korean-prose reading of whole five-turn documents

These are concrete developer observations, **not independent human votes**. The actual complete text is in the canonical Drive ZIP.

| Source family | Observed complete-prose comparison | Why it matters for Korean realization |
|---|---|---|
| 008, restaurant-work discussion | Both outputs are mostly natural and similar; retrieved changes one particle construction, yielding the less idiomatic omission of the subject marker in a complaint report | A retrieval example can hurt ordinary Korean grammatical/discourse flow despite offering real human-style text |
| 035, pet-sitting request | **Direct and retrieval identical**; both spontaneously correct the upstream's '오랬동안' and use natural formal address | If the strong writer already repairs sloppy human reference text, noisy in-context examples are unnecessary |
| 050, holidays and exercise | Retrieved opens with `전혀 안 좋아` while direct `전혀 안 좋다`, giving the retrieved version a more conversational initial voice; both amplify fatigue with `확` although the source only says it feels tiring | Some genuine local pragmatic benefit, but source emphasis must be monitored |
| 064, travel and pet care | Both preserve the five-week timeline and undertaking to care for a dog, but both yield the stilted polite question `얼마나 오래 여행을 떠날 예정인지요?` | Neither example prompting nor a strong direct model ensures natural social-register execution |
| 105, cello and piano | Direct first turn becomes `이미 피아노 치는 거 알는데`, which shifts the relation of who knows/plays; retrieved `피아노 이미 할 줄 알잖아` preserves the intended interlocutor's skill more naturally. Retrieved last `어려운 악기야` has a better conversational ending than direct abrupt `어렵다` | One plausible local improvement in proposition perspective and sentence-ending continuity, not a general win |
| 117, broken desk | Retrieved changes `어디서 산 책상이에요?` to smoother `어디서 사신 책상인가요?`, but elevates many other turns to formal `-습니다` where friendly `-요` would suffice | Local improvement can come with excessive formality and voice homogenization |
| 169, book discussion | **Identical** full outputs across arms | Retrieval examples produced zero observable realization effect in this sample, still incur extra tokens |
| 173, fast-food conversation | Retrieved preserves source's uniqueness formulation but outputs `콜라가 무한리필됩니다`, an awkward Korean collocation. Direct is less mechanical overall | Copying the lexical frame of a human source does not automatically produce native idiomatic collocations |

The reference data themselves contain obvious original errors (e.g. '오랬동안', inconsistent politeness); we **do not count moving away from a reference as model failure**. Conversely, similarity to the reference is not a reward.

**Preliminary author-visible decision**: a few source-conditioned contrastive examples sometimes repair a particular phrase, but systematic naturalness across whole dialogues is **not established**, while provider tokens rise ~35%. Do NOT make this adapter mandatory in the deployed Korean writer. It remains an optional narrow conversation-style probe.

## 4. Separate descriptive source-corpus operation census

The frozen upstream 3,470 formal↔informal utterance pairs were compared using Python's **whitespace-token SequenceMatcher**. For each pair, count the sum of max(old-token count, new-token count) over each non-equal opcode. This is **not a linguistic morpheme analysis**, not a validated edit taxonomy or a signal of aesthetically preferable prose.

- **22/3,470** exact duplicates across two registers.
- **1,780/3,470** have at most one changed whitespace token; **2,913/3,470 (83.95%)** at most two.
- **134/3,470** have at least four changed tokens.
- Character SequenceMatcher similarity: **mean 0.8890; median 0.9091**.
- Under raw digit extraction, **0/3,470** pairs have a differing ordered numeric-token sequence; this is a narrow mechanical check, **not meaning-preservation gold**.
- Reproducible, source-pinned, standard-library Python script: [r5f_human_style_operation_census.py](r5f_human_style_operation_census.py).

The corpus predominantly captures **local conversational register realization**, not the lexically rich multi-paragraph informational and literary re-expression originally sought for KSGT. Even if a dialogue style adapter were successful, transfer to technical writing or fiction would require independent evidence.

## 5. Program direction — make strong native Korean writing the actual endpoint

**No new architecture or human-quality claim was earned.** The 8 older R5a–d source briefs were not used as R5f test sources, but R5f's original SmileStyle corpus is public and test windows/exemplars were author-exposed before inference, so this remains exploratory rather than confirmatory.

1. **Do not promote chat-only reference retrieval to KSGT's general theory.** Direct 120B is already a strong rival; the user seeks literary and professional Korean, not flawless formality conversion.
2. For R5g, seek source-licensed, truly edited *native Korean passages* showing changes in information order, referential realization, collocation and sentence cadence, with original author/editor group split. Do not assume Kor-Native GEC, KoLLA L2 corrections, StyleKQC formal/informal directives or SmileStyle toy dialogue constitute polished literary gold.
3. Novelty candidates concern *conditional choice and realization of discourse structure*, not generic few-shot style transfer, a reader-state wrapper or local string patch. Any improved mechanism must produce better **whole Korean prose** than a strong direct model under a transparent quality/cost comparison, and preserve source meaning.
4. The project owner's identified expert Korean reading can provide concrete phrasing and style judgments at low overhead. This evidence is scientifically useful even with n=1 and does **not** require thin HTML forms, recruitment or pretend generalized reader preferences.

Latest validated G10-P2 model-call count before R5f: 292; **new R5f 16 → current verified cumulative total 308**, with 0 new independent native-reader ratings and 0 new independent source-semantic gold. G10-P2 stays OPEN / QUALITY_HOLD.
