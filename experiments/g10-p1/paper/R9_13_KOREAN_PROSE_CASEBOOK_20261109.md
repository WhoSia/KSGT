# KSGT G10-P1 R9.13 — Korean Prose Casebook (existing cross-model blind packet)

**Basis:** Existing Drive file `KSGT_G10-P1_Factorial002_Blinded_Reader_Packet_6pairs_20261105.md`, six A/B pairs based on three synthetic development source works and two GPT-OSS model sizes. No new Groq calls; no native-reader ratings; all judgments below are **researcher-authored diagnostic hypotheses**, not independently annotated gold. A/B policy identities have not been inferred or disclosed.

## Why look at actual Korean prose, not only compliance regex?
The A/B pairs expose real trade-offs in **event coherence, source-condition handling, referential continuity, clause endings and document genre**. A source contract can be preserved while a sentence is awkward; a sentence can be polished while importing an unsupported conclusion. These require reader-centered evidence and local linguistic analysis.

## Case N — narrative: who held the umbrella?
The scene pairs use two referents, Minjae and Yunseo, a folded umbrella, a blue poster, continued rain and Yunseo declining the umbrella. A frequent version says Yunseo **did not accept** the umbrella while also reporting Minjae **received it back**. This tension arises in the *author-authored fact specification itself* (the challenge cohort states both that he handed the umbrella back to himself / got it back and that she did not accept). A careless audit might wrongly attribute an event-logic anomaly to the language model alone. The correct response is to distinguish (a) an inconsistent or underspecified source event, (b) model-added causal inference, and (c) awkward referential realization. Korean output sometimes repeats both names to avoid ambiguity but thereby creates mechanical rhythm. Another candidate introduces a rain-wet environment statement not given as a fact; assess creative license before automatically classifying benign elaboration as hallucination.

**Research prediction:** Korean realization advice should help a reader track the two actors under topic switching, but naive pronoun/ellipsis encouragement may *worsen* accessibility; the value of a discourse plan may depend on the number of competing active referents. Proper measurements: comprehension question 'who refused/held the umbrella?', reader choice of naturalness, and separate fidelity audit on event sequence.

## Case P — public notice: clarity of preparation requirements
A notice A/B pair reports a school portal signup deadline, room and event times, free attendance and some equipment support. One variant concludes that **no separate supplies are needed** merely because the school provides electronic components. But the source separately lists the need for a personal laptop as **not yet announced**. The apparently helpful sentence silently transforms partial support into an unconditional readiness claim. Another variant adds an invitation to contact the school; this may be pragmatically useful but is an *operational recommendation not sourced to the author*.

**Source-bounded illustrative alternative, not a model outcome:**
> 전자회로 실습에 참여하려면 수요일 오후 6시까지 학교 포털의 과학활동 메뉴에서 신청해야 합니다. 실습은 금요일 오후 3시 공학관 203호에서 진행되며, 전자 부품은 학교에서 제공합니다. 개인 노트북이 필요한지는 아직 안내되지 않았습니다. 오리엔테이션은 목요일 오후 5시 본관 301호에서 열리며, 참석 여부는 실습 참가 자격에 영향을 주지 않습니다. 두 행사 모두 무료이고 담당 강사는 아직 공지되지 않았습니다.

The passage is a **researcher-drafted counterexample** illustrating source-condition fidelity and reader-first ordering; no reader has judged it. Its apparent fluency must not be converted into a superiority score.

## Case S — science: explanatory order and uncertainty
A science pair uses the potted-plant challenge with 20 seeds per pot; sprout counts after 7 days (A=11, B=10), leaves after 14 days (A=12, B=9), unchanged daily watering, different pot locations, unmeasured light and soil moisture. One passage prints raw internal tokens such as `(F3)` and `(U1)`, converting the drafting representation into reader-facing text. Another introduces a claim about germination rates from leaf/sprout count comparisons which the supplied uncertainty explicitly disallows; depending on wording, saying they **cannot** be directly compared is accurate, not a new inferential commitment. A well-formed public-facing scientific explanation should progress from setup to observation to source-limited interpretation and omit the planner's fact IDs.

**Research prediction:** A role-aware plan may improve setup→observations→limits ordering, but an independent Korean-realization module may contribute more to cohesive sentences; the interaction can be zero, positive or negative. A reader must answer which variables were measured versus not measured without confusing reported result and cause.

## Testable interactions and reading tasks
- P × K factorial: `ORDER_ONLY`, `KOREAN_ONLY`, `ORDER_PLUS_KOREAN` versus `RICH_BASELINE`; `STRONG_DIRECT` separately.
- Discourse unit: a *whole source work* with author purpose, not fact-span-level pseudo-replication.
- For each source work: comprehension and reference resolution; appropriateness of genre and endings; preference for natural flow; separately graded protected-fact preservation.
- Negative controls: duplicate source information; deliberately perturbed order using only licensed relations; non-informative wordy prompt padding as a cost confound.
- Strong comparator: best predeclared rich prompt on identical source facts and author annotations; if the rich baseline dominates on comparable cost, abandon the broad superiority claim.

## Important limitation
**This packet is selected A/B material, not an exhaustive random sample of six-arm outputs.** The conclusions above are qualitative fault hypotheses and test design leads, not measured population effects. The historical original 2-model × 6-arm provider outputs should be retrieved and tallied separately before claims about overall model generation success or prompt-cost efficiency.

**Next experimental leverage:** favor reader-centered evaluation of already generated prose and a small authentic P×K generation ablation over another cycle of KoLLA boundary validators or selective-repair risk thresholds. KoLLA source authentication remains useful, but it should not define the next main study.
