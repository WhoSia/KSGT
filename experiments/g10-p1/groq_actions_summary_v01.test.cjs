"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {summarize}=require("./groq_actions_summary_v01.cjs");
test("public CI summary has metadata but never outputs private completion or prompts",()=>{
 const report={schema:"ksgt.g10.p1.paired-generation.v02",model:"llama-3.3-70b-versatile",provider:"groq",
 rows:[{arm:"DIRECT",outcome:"GENERATED",text:"비공개 한국어 원문",prompt:"secret prompt",usage:{prompt_tokens:100,completion_tokens:80},latencyMs:123},
 {arm:"RICH_PROMPT",outcome:"FAILED",failureClass:"PRIVATE_PROVIDER_DETAIL"}]};
 const s=summarize(report);
 assert.ok(s.includes("DIRECT"));assert.ok(s.includes("100"));assert.ok(s.includes("FAILED"));
 assert.ok(!s.includes("비공개 한국어 원문"));assert.ok(!s.includes("secret prompt"));
 assert.ok(!s.includes("PRIVATE_PROVIDER_DETAIL"));
});
test("dry-run metadata not accepted as a generated-prose report",()=>{
 assert.throws(()=>summarize({schema:"other",rows:[]}),/INVALID_REPORT/);
});
