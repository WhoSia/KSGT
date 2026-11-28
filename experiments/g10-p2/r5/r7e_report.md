# R7e — Relation-conditioned revision: bounded mutation is not bounded semantic drift
2026-11-28 KST. G10-P2 OPEN / QUALITY_HOLD / RIGHTS_SCOPE_HOLD; P3 proposal only.

## Actual trial
R4b (2026-11-21) already compared exact-span patch with full rewrite on ten exposed drafts using GPT-OSS20B; strict 3/6 target-quote removal vs 6/6, posthoc whitespace rescue 6/6, neither established quality. R7e differs: four fresh investigator-written drafts, each paired with two source authorizations; same draft, target relation and source within LOCAL/FULL arms; no oracle target sentence/span. Numbered slots in both prompts; LOCAL permits up to two slot replacements/deletions, FULL entire text, both instructed to keep exact original when no repair required. Target-authorized controls not independently certified globally clean. Source order and precise timing are distinct from causal adjacency. BUBBLE residual "기체가 발생" is a possible source extrapolation in all arms including no-op, not newly repaired or validated.

Exact run 46122629391, HEAD befed5962bf8ba057004db9524a60ad85e6acec5, job 140910240239 completed success. 7/7 native preflight tests, 16/16 actual GPT-OSS120B calls temperature0 max2400, 10806 tokens. Cumulative 630+16=646. All originals and outputs read by nonindependent developer.

| Metric | LOCAL | FULL |
|---|---:|---:|
| authorized exact original retained |4/4|4/4|
| unauthorized changed |4/4|4/4|
| valid bounded patch |4/4|N/A|
| two paragraphs |8/8|8/8|
| focal unsupported commitment removed without opposite assertion (developer judgment) |2/4|4/4|
| input tokens |4346|4026|
| output tokens |1134|1300|
| total tokens |5480|5326|
| median latency ms |514|535.5|

LOCAL total +2.8915%; shorter response does not imply cheaper pipeline. Six actual slot mutations across four unauthorized cases (1,1,2,2); one sentence deleted. No-op baseline 0 new calls retains four target-authorized and all four target-unauthorized drafts unchanged, not a correction. Do not treat author label counts as independent gold or infer statistical preference.

| case | LOCAL | FULL |
|---|---|---|
| MAP | changed visited to "직접 가 본 적은 없지만" — unsupported negation, not removal of unknown | "그곳에 대해 기억은 있지만" — past location knowledge supports some recall but phrase ambiguous; visit commitment removed, no explicit negative |
| BUBBLE | observation instead of onset, but exact observation time weakened to "약 6분 정도"/"약 8분 정도" | observation time preserved; focal onset removed |
| BOX | deletes unsupported shortfall, retains count and closing; concise | removes unsupported plan and shortfall, adds meta "계획된 이동 수량은 제시되지 않아 비교할 수 없었다" |
| WINDOW | removes approach, leaves unsupported "발소리가 멈추자" | removes approach/stop, introduces "발소리가 들리자" immediate temporal link beyond plain sequence; not necessarily causal but strength uncertain |

All 8 authorized outputs exact no-op, no blind rating. LOCAL target correction criterion accepts BUBBLE with time precision caveat, BOX only; MAP opposite assertion and WINDOW residual stop fail. FULL removes focal positive target in all four, but whole-text quality/fidelity still unestablished. Full rewrite was instructed to limit changes and in fact largely did so; free full-text output is not necessarily broad rewriting. Local edit safety mechanical only; one valid slot can contain unsupported meanings, two allowed slots can miss dependent meanings. Do not force a patch, blacklist cues, or use edit-count as quality. Scope-aware local repair remains optional; deprioritize as primary architectural bet. No independent human or source-gold evaluation, no training.

## Custody
Artifact 15254770014 39879B SHA256 765e4495f9736e6e6a60c4a6b2c9258ad65418d9cb928510c13b2864a63e777b; provider digest, initial local SHA, Drive cold re-fetch SHA identical. 36 entries CRC pass; independent Python replay 16/16 exact attempts, source/prompt/response hashes, model, status and stop; manifest SHA256 56bfcf765695df5c8144c542aa80f7a42e596c1405644cc1eac5aed9f75d825e. Drive https://drive.google.com/file/d/1AG2uA634BvdxLREAVSM4EEU3Z2VpQiHf/view . Wrapper receipts, not raw HTTP. No private text sent.
