# R7f — Explicit source projection: modest cost advantage, unresolved fidelity
2026-11-28 KST. G10-P2 OPEN / QUALITY_HOLD / RIGHTS_SCOPE_HOLD; P3 proposal only.

## Execution
Four fresh synthetic practical briefs, 10 source records each, five required PAYLOAD records, optional/context, 3 explicitly irrelevant and noncommunicable INTERNAL records, one CONTROL. DIRECT receives all records and the same role definitions. PROJECTED receives exact 7-record subset after removal of INTERNAL; the source packet and task at pipeline level are identical, model input is deliberately different. No extra model calls; annotation cost is not measured, so this is not full end-to-end cost. No automatic role discovery or real sensitive data. Dependency check fails closed if retained records require omitted internal records, directly or transitively. A caller mislabeling required payload as INTERNAL can still omit it; this negative control passed as expected, not semantic validation. Cyclic dependencies among retained records are tolerated because projection only checks reachability, not discourse order or logical validity.

Run 46122900072, exact head fc55f2d1e07b848c2d3e6b78ce04476ca06c2d4f, job 140911058207 completed success. 6/6 native preflight tests, 8/8 GPT-OSS120B calls temp0 max2400, 5013 tokens. Cumulative 646+8=654.

| Metric | DIRECT | PROJECTED |
|---|---:|---:|
| Input records per work |10|7|
| Mandatory answerability (developer reading) |20/20|20/20|
| Two paragraphs |4/4|4/4|
| Input tokens |2051|1702|
| Completion tokens |631|629|
| Total tokens |2682|2331|
| Median latency ms |426|405|

Input -17.016%, total -13.087%, output -0.317%. All four matched total-token pairs favor projection (673→580, 672→579, 711→618, 626→554). Cost benefit limited to provider token use on explicitly labeled synthetic briefs; no population speed/generalization or preference claim. Required answerability questions were not included in generation prompts. Nonindependent developer judged all five answer fields retained in each text, not independently established source gold. Four author-written works only; no separate reader call.

## Whole-text review
ROOM_NOTICE: both texts convey all five required answers; optional location directions retained, outputs effectively identical except narrow no-break spaces in time. Both retain conventional extra reassurance, not a material new obligation.
BOOK_RETURN: both preserve all five answers and optional student-ID detail. Both assert "안내대 외의 다른 반납 방법은 제공되지 않[는다]" — stronger than the source instruction not to invent other methods. DIRECT also promises separate cost information ("분실 도서에 대한 비용 안내는 별도로 진행됩니다"), unsupported. PROJECTED removes that particular addition but adds redundant instruction; no quality gold.
DATA_NOTE: both retain exact temperature/time, single observation each, missing initial values and interpretation limit. Both refer to possible effect of treatment method despite identical stated treatment, but do not assert causal effect. "측정" vs source "기록" is a slight methodological strengthening; neither resolves it. Further data framed as prerequisite, not scheduled follow-up. No internal meeting/20-minute proposal stated.
MEETING_CHANGE: both retain all five answers. DIRECT ends with undecided order and avoids added promise. PROJECTED adds "그때 보자"/"나중에 얘기하자"; latter introduces future discussion not authorized, violating the specified restraint. Context retained, banmal correct. Source projection cannot guarantee freedom from invented commitments.
Neither arm explicitly recites the 12 internal records; no measured leakage reduction from a ceiling. No independent reader/editing or source-gold evidence. No training.

## Decision
R7f DONE_DEVELOPMENT_COST_SIGNAL_MIXED_FIDELITY. Preserve optional, manually authorized source projection. Do not mandate it or infer semantic extraction ability. Next high-value task is human-facing full prose assessment and source-selection boundary with context-dependent information; no continued automatic expansion merely due to token saving. Prior R6u typed prompt studied layout without removal; R7f deliberately omits information upstream. No claim of general novelty or production acceptance. No new literature intake.

## Custody
Artifact 15254436425 26597B SHA256 a3f6ec0507ffd6ebee91903949d9db420a488c4845000c0561b633fee711a4cf; provider digest, initial local and cold Drive copy equal. ZIP CRC 20 entries, independent Python replay 8/8 source/prompt/attempt/text/model/status and token sum; manifest SHA256 fe1715c877605ad5f11f8571af5e74d2a6188924a32eadaf339d0e5b4fc9b356. Drive https://drive.google.com/file/d/1d4o_abGfJkumul7YJzaivyzYXFHurfaF/view . Wrapper receipts, not raw HTTP.
