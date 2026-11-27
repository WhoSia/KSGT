# R7b — Target decomposition gives no label advantage on explicit status cases

2026-11-28 KST. G10-P2 OPEN / QUALITY_HOLD / RIGHTS_SCOPE_HOLD; P3 prelude only.

## Results
Actual run 46030432309, exact head 110df21db9a7cfa06cc275cb13f4abef4966d187, job 140612544862 success. 24/24 GPT-OSS120B single calls, temp0 max900, 11326 total tokens. 12 paired synthetic texts from four families, three predeclared statuses each. Direct and resolved share the identical strong NLI instructions, text, and query; resolved additionally supplies manually authored target subject/time/modal operator/content, not the answer or source decomposition.

| Metric | DIRECT | RESOLVED |
|---|---:|---:|
| strict JSON |12/12|12/12|
| author-label agreement |12/12|12/12|
| SUPPORTED |4/4|4/4|
| CONTRADICTED |4/4|4/4|
| UNSETTLED |4/4|4/4|
| nonempty exact evidence |10/12|9/12|
| prompt tokens |3260|3698|
| completion tokens |2285|2083|
| total tokens |5545|5781|
| median latency ms |547|475.5|

Paired gains0/losses0/ties12. Resolved total tokens +4.256%; no speed generalization from small trial. All 5 non-exact evidence responses are empty strings on UNSETTLED (DIRECT2, RESOLVED3), allowed by instruction when no evidence; they are not fabricated quotes. Ambiguity in instruction: explicit uncertainty statement can justify UNSETTLED but is not positive/negative evidence about target truth. Two DIRECT reasons are in English despite Korean passage; language not enforced by schema. Correct label alone is not calibrated reader competence. COLOR contradicted assumes a single relevant color-change event: multiple transitions could defeat unrestricted reading. Preserve that caveat, do not treat synthetic labels as unquestionable independent truth.

## Custody
Native artifact 15214062252, 51017 B, SHA256 a0745839ba50e6fc34aefc9915e918056dafac6786563e22abf337eabdfe0468. Drive https://drive.google.com/file/d/1ZgXHles7WC3ZGlPYVKkWupv5v0AvF1tE/view. Original local and re-fetched Drive ZIP digest match provider digest; 52 ZIP entries CRC pass. Independent local Python replay of 24 exact attempts, source/prompt/response hashes, model, status and token count. Manifest SHA256 ad8fda55aca669bd2a1506d5f45a9f48a0dec6f5e01e8ef6c59acd09af18c8c7. Normalized provider wrapper receipts, not raw HTTP. No private source sent. Previous recorded cumulative566 +24 =590, includes writer and reader calls.

## Interpretation and next
Explicit uncertainty clause is present in all UNSETTLED conditions and direct baseline already reaches ceiling. R7a errors arose in less explicit passages; R7b does NOT establish that those errors are fixed. Do not mandate target decomposition or infer no effect across natural Korean. Next R7c: test missing evidence WITHOUT explicit uncertainty clauses, then contrast with explicit limitation, same target, direct and resolved on exact same passage. Use explicit evidence availability separate from status and preserve actual word choices. No independent human reader or independent semantic gold, no training. R7b DONE_DEVELOPMENT_NULL_CEILING.

Separate optional closed typed observation ledger implemented: exact axis/subject/time/proposition keys, no unauthorized cross-axis transfer, TRUE/FALSE conflict -> CONFLICT_HOLD, UNKNOWN never false. Manual tags are not semantic extraction; forged same-key values are still accepted, and valid entailment from other keys (e.g. factive knowledge, quantitative implication) is deliberately not implemented. Tests separate. Formal P3 name not accepted yet; no automatic stage change.
