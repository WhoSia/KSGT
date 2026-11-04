"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const cohort=require("./fixtures/challenge_cohort_v01.json");
const m=require("./factorial_runner_v02.cjs");
const request={schema:"ksgt.g10.p1.factorial-request.v02",requestId:"ROLE_20261104_A",
 cohort:"experiments/g10-p1/fixtures/challenge_cohort_v01.json",
 models:["openai/gpt-oss-20b","openai/gpt-oss-120b"],maxTokens:1100,temperature:0.2,seed:"role-v05"};
test("six-arm v05 has specific equal-char rich comparator",()=>{
 assert.equal(m.ARMS.length,6);
 for(const t of cohort.tasks){
  const a=m.armMessages(t,"ROLE_AWARE_PLAN_V05")[1].content;
  const b=m.armMessages(t,"RICH_CHAR_MATCH_V05")[1].content;
  assert.equal(a.length,b.length);
 }
});
test("source facts remain shared by every candidate",()=>{
 for(const t of cohort.tasks)for(const a of m.ARMS){
  const text=m.armMessages(t,a)[1].content;
  for(const f of t.facts)assert.ok(text.includes(f));
 }
});
test("dry-run factorial grid has thirty-six distinct cells",async()=>{
 let count=0;
 const r=await m.run(cohort,request,{dryRun:true,invoke:async()=>{count++;}});
 assert.equal(count,0);assert.equal(r.rows.length,36);
 assert.equal(new Set(r.rows.map(x=>x.sourceWork+x.model+x.arm)).size,36);
});
test("mock outputs never create a human preference score",async()=>{
 const r=await m.run(cohort,request,{dryRun:false,invoke:async()=>({
  text:"MOCK",usage:{prompt_tokens:100,completion_tokens:10},latencyMs:1
 })});
 assert.equal(r.rows.filter(x=>x.outcome==="GENERATED").length,36);
 assert.equal(m.safeSummary(r).humanPreference,"NOT_MEASURED");
});
