# R7i — Writing discovery versus planning, development result
2026-11-28 KST. Natural revision evidence: three pre-2022 Korean technical blog commits, no author-private draft or population quality gold. Galbraith's writing theory and Ahn's historical revision study support the research question, not an empirical conclusion about our system.
Run 46140003400 at 0b14c058: first PLAN call truncated at 1200 completion tokens, 1519 total, zero complete output, retained. R7i2 run 46140099362 at 870d271a4334ebc8cba706b59d32ec86e4849c27: 16/16 provider responses, 8 finals, 3/3 native tests; 14305 total tokens. 4 authored works x 2 arms x 2 stages, same GPT-OSS120B, temperature 0, same 2400 first/final caps, 250–400 character intermediate guidance not enforced. Not information-matched, no single-call arm, no equal realized token claim.
|Work|PLAN tokens|DRAFT tokens|PLAN final nonspace chars|DRAFT final nonspace chars|
|---|---:|---:|---:|---:|
|FILTER|2247|2087|627|744|
|RETURN|1687|1348|354|340|
|SCALE|1906|1771|494|553|
|TILE|1673|1586|429|363|
|Total|7513|6792|1904|2000|
DRAFT 9.60% fewer total tokens, 5.04% more final nonspace characters, four paired token reductions. Prompt 4231 vs 3828, completion 3282 vs 2964; serial summed latency 7938 vs 7656ms. No quality equivalence. FILTER draft-first distinguishes recovered water from absorption; plan-first propagates wrong calculation. RETURN both preserve unsupported claims from intermediate artifact; SCALE both compute correctly, scope problems; TILE draft-first loses key return despite initial draft containing it. No general winner. See per-work audits. 
Custody: failed ZIP 6351 bytes SHA e68e15eb455b4aaee816c689dd761305c845645c969a6d553c0c916cbc577727, Drive 1YghGRaIyBPgwEU8LUb9isUwD7PlcxuaQ; R7i2 ZIP 44913 bytes SHA 359ade8806e768a09dfb4420e595335fa6dd08a5dd5bf28fcb29cb73c60760b1, Drive 14pfTFtDnlL_OyHg82j4FZcHc08WCTmNb. Cold read both matches artifact digests, ZIP CRC pass 5/36 entries; Python independently replayed 1+16 receipt source/prompt/text and final dependency, 1519+14305 tokens. Wrapper-level not raw HTTP. Count real calls including truncated 1: 666+17=683. No human ratings, no training, no quality/rights promotion. Keep PLAN/DRAFT as optional experimental strategies, prioritize reversible authority and actual writing traces.
