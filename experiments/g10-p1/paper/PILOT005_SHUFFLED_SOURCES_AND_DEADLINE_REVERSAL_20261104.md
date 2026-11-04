# G10-P1 Pilot 005 — Unordered Sources, Referential Continuity and Deadline Polarity (2026-11-04)

**Live Groq output verified. Author-created challenge development corpus only; no human reader ratings.**

## Experiment / bytes
- [GitHub Actions #41779573803](https://github.com/WhoSia/KSGT/actions/runs/41779573803) SUCCESS; WhoSia trigger SHA `5281c24b0d9b2ee55ad4fcbb796827ffdc9db528`.
- `openai/gpt-oss-120b` hosted on Groq, temp=0.2, 1500-token completion cap, low reasoning effort.
- 3 specifically authored challenges: SCI_SHUFFLED_02, NARR_REFERENTS_02, NOTICE_TWO_EVENTS_02; 5 policy arms per original work; **15/15 real completions**, all finishReason=stop.
- [Original GitHub artifact ID 13298840751](https://github.com/WhoSia/KSGT/actions/runs/41779573803/artifacts/13298840751) ZIP SHA-256 `520631bc312254e8f3604d4c2aed1bf13ad50ac756516144755c543b595c28c3`. Immutable research raw ZIP [Drive](https://drive.google.com/file/d/1cEOfHc5XY2WkmzHtG95NFBaTkS183L6D/view). The exact prompts and completions remain in the ZIP; this log records only limited excerpts and inspected outcomes.
- The challenge facts were deliberately **not ordered chronologically**; each arm saw the same original source order, facts, uncertainty clauses, and *author-given relation annotations*. This is methodological development, not an independent test corpus.

## Actual token consumption — three shuffled source works per arm

| Method | Provider-reported total tokens |
| --- | ---: |
| DIRECT | 2,455 |
| RICH_PROMPT | **2,560** |
| DISCOURSE_GUIDED | 4,204 |
| LICENSED_PLAN_V02 | 3,486 |
| KOREAN_REALIZATION_V03 | **4,786** |

The v0.3 condition costs **~1.87× total tokens** relative to RICH_PROMPT in this development batch. User-facing token charge additionally depends on current input/output rates. A shorter prompt does not automatically imply higher reader preference.

## Concrete per-source discoveries

### SCI_SHUFFLED_02 — planning may actually help when source order is misleading
The brief lists day-14 leaf counts first, then measurement limits, then initial sowing and day-7 sprouts, and later the location/watering data. `DISCOURSE_GUIDED` v0.1 largely repeats this unnatural information sequence. In contrast, `LICENSED_PLAN_V02` outputs a compact account:
- 20 seeds planted in each pot and respective locations;
- day-7 A=11/B=10 sprouts;
- day-14 A=12/B=9 leaves;
- explicit non-measurement of illumination/soil moisture; no causal claim.

That is a **visibly coherent factual progression** achieved by the source-licensed temporal edges. A strong RICH_PROMPT also produces broadly chronological order, but incorrectly introduces the unsupported phrase `관찰은 7일째에 시작되었습니다` (the fact is a day-7 observation, not necessarily the first observation). This contrast motivates an experiment on unordered input complexity, but **one example cannot establish a general advantage or its causal origin**.

### NARR_REFERENTS_02 — referent hints remain limited
The plan manages two named people (민재/윤서) and a folded umbrella. DIRECT, RICH, v0.2 and v0.3 all mostly preserve actor identity in this example. v0.2 adds `얼마 뒤`, specifying an otherwise unknown delay. The v0.3 heuristic does not exhibit a distinctive breakthrough in referential naturalness. Source labels are not an automatic Korean coreference parser.

### NOTICE_TWO_EVENTS_02 — a serious content reversal in v0.3
The source explicitly states that the applicant must apply **by Wednesday 18:00** to participate in Friday's electronics lab. The `KOREAN_REALIZATION_V03` completion instead says, after stating the deadline:

> 신청 마감 이후에는 금요일 오후 3시 공학관 203호에서 진행되는 전자회로 실습에 참여할 수 있습니다.

This **reverses the practical conditional meaning**: it implies a person can participate *after* the application closes. Here the problem is not a subtle disagreement over stylistic quality, but a source-grounded deadline contradiction. The DIRECT, RICH_PROMPT and LICENSED_PLAN_V02 outputs did not show that same reversal in this single run. v0.2 and RICH sometimes add assumptions such as a `추후 공지` about the lecturer; these are lower-certainty extrapolations, not directly present in the source.

Do **not** generalize from one stochastic output that v0.3 systematically causes deadline reversals. Repeated paired samples and blinded review would be required to identify any effect attributable to the realized instructions.

## Scientific lesson — prose matters

The correct next hypothesis is not a philosophical 'authority to edit' theory. **Source-driven Korean information ordering can improve readable explanation when the source brief is badly ordered, while a verbose syntactic realization layer may introduce redundancy or even change commitments.**

A useful new prototype must: (a) encode event order and the *conditional dependency* between deadline and eligibility; (b) put this information into a **compact, writer-useful paragraph plan**, not a giant annotation dump; (c) retain strong RICH prompting and ordinary direct generation as rival arms; and (d) be judged on the real Korean text and total input/output cost.

## Status and caution

Generation X G10-P1 OPEN. This is a bounded actual-output engineering pilot on synthetic tasks. Existing G8 human paraphrases and G9 contracts are development assets, not evidence of human preference for these new paragraphs. Reader panel, independent semantic review, new naturally sampled source-work-disjoint tasks and paper-ready statistical evidence remain outstanding.
