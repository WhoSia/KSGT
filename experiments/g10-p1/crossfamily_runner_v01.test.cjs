"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const cohort=require("./fixtures/challenge_cohort_v01.json");
const x=require("./crossfamily_runner_v01.cjs");
const request={schema:"ksgt.g10.p1.crossfamily-request.v01",id:"CROSSFAM_20261105_01",
 cohort:"experiments/g10-p1/fixtures/challenge_cohort_v01.json",
 maxTokens:1250,temperature:0.2,seed:"crossfam-v01"};
test("three models and meaningful prose comparator across three works",async()=>{
 assert.equal(x.MODELS.length,3);assert.equal(x.ARMS.length,3);
 let calls=0;
 const d=await x.run(cohort,request,{dryRun:true,invoke:async()=>{calls++;}});
 assert.equal(d.rows.length,27);assert.equal(calls,0);
 assert.equal(new Set(d.rows.map(r=>r.sourceWork+r.model+r.arm)).size,27);
});
test("all arms preserve identical source facts and annotations",()=>{
 for(const t of cohort.tasks)for(const arm of x.ARMS){
  const c=x.message(t,arm)[1].content;
  for(const fact of t.facts)assert.ok(c.includes(fact));
  for(const r of t.relations)assert.ok(c.includes("F"+r.from+" "+r.type+" F"+r.to));
 }
});
test("injected outputs are not fake human preference; raw text excluded from public summary",async()=>{
 const d=await x.run(cohort,request,{invoke:async()=>({text:"PRIVATE_KOREAN_PROSE",usage:{prompt_tokens:123,completion_tokens:99},latencyMs:2})});
 const s=x.safeSummary(d);
 assert.equal(s.generated,27);assert.equal(s.assigned,27);
 assert.ok(!JSON.stringify(s).includes("PRIVATE_KOREAN_PROSE"));
 assert.equal(s.independentHumanQuality,"NOT_MEASURED");
});
test("arbitrary private source and oversized model usage forbidden",()=>{
 assert.throws(()=>x.validate({...request,cohort:"/private.txt"}),/PUBLIC_DEVELOPMENT/);
 assert.throws(()=>x.validate({...request,maxTokens:10000}),/INVALID_TOKEN/);
});
