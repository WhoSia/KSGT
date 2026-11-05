"use strict";
const t=require("node:test"),a=require("node:assert/strict");
const {census}=require("./r9_kolla_full_human_census_v01.cjs");
const m=[
"S 원본 한 문장 .\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||1",
"S 다른 한 문장 .\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\nA 1 2|||R:PART|||수정|||REQUIRED|||-NONE-|||1",
"S 세 번째 문장 .\nA 1 2|||R:PART|||새로운|||REQUIRED|||-NONE-|||0\nA 1 2|||R:PART|||수정한|||REQUIRED|||-NONE-|||1",
"S 안내형 반복 원천 .\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0",
"S 안내형 반복 원천 .\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0"
].join("\n\n");
t("missing references never counted as human agreement",()=>{const c=census(m);a.equal(c.blocks,5);a.equal(c.bothAnnotated,3);a.equal(c.missingSecond,2);a.equal(c.pairExact,1);a.equal(c.pairedExactRate,1/3)});
t("source-to-source keep is counted only among real pairs",()=>{const c=census(m);a.equal(c.bothKeep,1);a.equal(c.firstOnlyKeeps,1);a.equal(c.bothEditDifferent,1);a.equal(c.bothEdit,1)});
t("missing second references share a distinct repeated fingerprint",()=>{const c=census(m);a.equal(c.missingSecondDistinctSourceSHA,1);a.deepEqual(c.missingSecondRepeatedFingerprintCounts,[2]);a.deepEqual(c.missingSecondPositions,[3,4])});
t("cannot present human corpus as model accuracy",()=>{const c=census(m);a.equal(c.newModelOutputs,0);a.equal(c.newHumanRatings,0);a.match(c.distinction,/REAL_HUMAN/)});
t("invalid source block fails",()=>a.throws(()=>census("Q invalid"),/M2_SOURCE_MISSING/));
