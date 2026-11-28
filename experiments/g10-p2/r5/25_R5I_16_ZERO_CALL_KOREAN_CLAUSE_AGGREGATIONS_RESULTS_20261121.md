# G10-P2 R5i — 16 genuine complete Korean paragraphs by source-role clause aggregation, 0 new model calls

**2026-11-21 KST.** This is **post-hoc engineering on the 8 already exposed R5h scenes**, not newly sourced human literary prose or an independently validated Korean style improvement. The research program remains **G10-P2 OPEN / QUALITY_HOLD**.

## 1. Actual original-byte replay, full-text production, preserved evidence

The input was the **real previous R5h `final-score.json`**, 81,417 bytes, whose original-source SHA-256 was fixed before writing the R5i aggregation code: `ed62b1f3a8f1772dad92eb4c14d38b1c6f710f16c577f8c9020cbd294a7b9216`. The source already includes eight 120B direct literary scenes, eight genuine 120B finite-selection compiled scenes, and eight deterministic no-model default compiled scenes; this experiment did **not** rerun or edit their original provider response JSON.

[Actual ZERO-LLM GitHub Actions #44909707851](https://github.com/WhoSia/KSGT/actions/runs/44909707851), SUCCESS. Read-only original artifact download from [R5h run #44909195424](https://github.com/WhoSia/KSGT/actions/runs/44909195424), exact original inner SHA reverified, **68 R5 native tests PASS + 80 G10-P2 historical tests PASS**, 0 new provider calls.

[Original R5i derived evidence ZIP — Google Drive](https://drive.google.com/file/d/1QLoYd1XFDrOtnHHAUD7XjuP1wk1ByCci/view), [same R5h/R5i evidence folder](https://drive.google.com/drive/folders/1wjMpey1QzJMAecNjH0RBNKyQ5ZStCTwC). **9,950 bytes**, ZIP SHA-256 `621be3f09a5dc8440a239a9b69fcd77a9b565fdd3116603ed7fb62945e7b2aec`, GitHub Actions artifact #14709436303, Drive cold download verified original SHA and ZIP CRC **3/3**. Contains exact derived JSON, full **four-way Korean comparative reading packet** (direct120B, R5h selected, R5i selected-aggregated, R5i deterministic-default aggregated), and independent source checksum recount.

## 2. Explicitly implemented syntax-level mechanism

The R5i compiler reads the **immutable source fact-to-actor trace** and retrieves the original researcher-prewritten subjectless predicate from the R5h fixture using `predicateVariant`. It never takes an arbitrary AI generated sentence and applies a vague regex patch.

It maps:
- S1: keep the full setting clause without adding plot;
- S2 + S3: these two facts share source actor **A**. Conjoin source-licensed possession/posture using a small fixed Korean converb grammar, e.g. `손에 쥐고 있었다` → `손에 쥔 채`, `손에 들고 있었다` → `손에 든 채`;
- S4 + S5: two source facts share source actor **B**. Combine posture/looking with source-licensed non-action, e.g. `바라보고 있었다` → `바라보며`, `서 있었다` → `서서`;
- S6: preserve the explicit unresolved closure verbatim.

Subject marking is freshly generated from the **source actor's real Korean name and coda-sensitive topic particle** `은/는`. Unsupported verbal endings or invalid source SHA *refuse or fall back* to original two clauses; unknown actor switch is never joined. Every output is traced to the original six source frame IDs with a hard assertion that `S1,S2,S3,S4,S5,S6` occurs exactly once.

This is a **finite, source-author-supervised Korean clause aggregation mechanism**, not a comprehensive Korean parsing/generation system, morphological lexicon or universal semantics verifier.

## 3. Results — correct frame conservation with improved segmentation

| Distinct quantity | Actual verified value |
|---|---:|
| Original R5h 120B calls reused | **16** |
| **New** R5i 120B/API calls | **0** |
| New completed Korean paragraphs (selected + default) | **8 + 8 = 16** |
| Original R5h strong direct complete texts reused for comparison | 8 |
| Selected-source adjacent same-actor pairs fused | **16/16** |
| Default-source adjacent same-actor pairs fused | **16/16** |
| Original source fact frames per new paragraph | **6/6** |
| Resulting written sentence count per paragraph | **4**, down from 6 |
| New native reader votes / independent source semantic gold | **0 / 0** |

Previously (source R5h 120B selector):
> 유나는 한 장의 접힌 지도를 손에 쥐고 있었다. 기록실 문 가까이에 서 있었다. 서진은 닫힌 서랍을 바라보고 있었다. 서랍 손잡이에는 손을 대지 않았다.

Now (source R5i same text, no new provider request):
> 유나는 한 장의 접힌 지도를 손에 쥔 채 기록실 문 가까이에 서 있었다. 서진은 닫힌 서랍을 바라보며 서랍 손잡이에는 손을 대지 않았다.

The new aggregation sounds less like a series of factual checklist items and maintains which character holds what. This is a **source-visible developer reading**, not a blinded aesthetic preference result. The full paragraph also retains source-only scene setting and explicitly unresolved last clause.

Other new complete Korean paragraphs were examined:
- **Night library**: selected aggregate `하윤은 마른 나뭇잎 모양의 책갈피를 손에 쥔 채 책이 놓인 탁자 앞에 앉아 있었다`, then `민수는 창가에 서서 창문에 길게 번지는 빗방울을 눈으로 좇았다`; correct subject-binding and sensible Korean converb, but source-selected opening `도서관의 밤 창문에는` remains **awkward**.
- **Rehearsal room**: `은서는 아직 펴지 않은 악보를 손안에 둔 채 피아노 옆 의자에 앉아 있었다. 도현은 피아노 맞은편에 서서 건반에 손을 대지 않고 바라만 봤다.` A useful example of whole-clause role-preserving Korean prose aggregation.
- **Greenhouse**: `준서는 김이 낀 유리창을 바라보며 유리창에는 손을 대지 않았다`. This is mechanically faithful but **repeats the same object unnecessarily**, now inside one sentence. Source-role binding and sentence union do NOT supply natural nominal anaphora/collocation choice.
- **Bookshop**: `편지가 담긴 봉투는 닫힌 채였고 두 사람 사이에는 침묵만 있었다` retains an author-created formulaic closure; the 0-call compiler does not generate a distinct literary voice.
- **Restoration room**: source actor, labeled box, empty frame remain well separated, but the selected initial scene `아침빛이 ... 창을 통과해 들어왔다` remains more literal than idiomatic.

## 4. Honest conclusion: better connective syntax, still a fixed-text literary tool

R5i confirms that **structural Korean clause aggregation can improve local naturalness without giving control over the source actor roles back to the free language model**. It also shows that **an overly narrow template system repeats the same subject–gesture–unresolved-ending rhythm in every story**. The new selected aggregated path is not cheaper than the original R5h selector **if run from scratch**, because 14,811 earlier model tokens were used to select its original candidate forms; aggregation added 0 extra tokens only because it reused those already generated outputs. The deterministic default aggregated path uses 0 model tokens but requires prewritten source-specific sentences and cannot compete with the range of strong native Korean free prose.

The strongest whole-text comparator **DIRECT120B** is still competitive or better in natural style, though it can add unsupported flickering lights, hidden mental states or ambiguous gestures. A source-grounded general writer needs both **unrestricted enough expression** and **faithful predicate/argument control**. The next valuable problem is **source-authenticated Korean clause realization plus referential choice** (how to avoid repeated nouns while preserving whose object it is), with natural real-world source texts and independent expert quality review; it is not a fifth prompt-only reader gate.

**Prior art:** Korean zero pronoun generation and centering were already investigated by Roh & Lee (2003), https://aclanthology.org/U03-1.pdf. Hwang (2023), https://doi.org/10.1037/xlm0001166, experimentally studied interclausal subject/action continuity. R5i is a limited engineering demonstration with author-written frame templates; it is **not novel Korean grammatical theory** and not generalizable literary quality gold.

**Stage:** Previous G10-P2 cumulative through R5g = 324 real provider calls; R5h = 16 new; R5i = **0 new**; **verified cumulative G10-P2 real provider calls = 340**. Independent native reader preferences = 0, independent semantic gold = 0, new neural models = 0. **G10-P2 OPEN / QUALITY_HOLD**.
