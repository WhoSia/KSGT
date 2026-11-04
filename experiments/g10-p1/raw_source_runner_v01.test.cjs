"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const cohort=require("./fixtures/challenge_cohort_v01.json");
const x=require("./raw_source_runner_v01.cjs");
const req={schema:"ksgt.g10.p1.raw-source-request.v01",id:"RAWAUTO_20261105_01",
 cohort:"experiments/g10-p1/fixtures/challenge_cohort_v01.json",
 maxTokens:1150,temperature:0.2,seed:"raw-chron-A"};
test("raw-source arm must not see any human-provided discourse/entity annotations",()=>{
 for(const t of cohort.tasks){
  const source=x.strip(t);
  assert.equal(source.factAnnotations,undefined);
  assert.equal(source.relations,undefined);
  for(const a of x.ARMS){
   const txt=JSON.stringify(x.messages(t,a));
   assert.ok(!txt.includes("원천에서 명시한 메타정보"));
   for(const f of t.facts)assert.ok(txt.includes(f));
  }
 }
});
test("raw v06 is a separate plan over same source and abstains for narrative/notice",()=>{
 const a=x.messages(cohort.tasks[0],"RAW_CHRONOLOGY_V06")[1].content;
 assert.ok(a.includes("권장 사실 순서"));
 for(const t of cohort.tasks.slice(1))assert.ok(x.messages(t,"RAW_CHRONOLOGY_V06")[1].content.includes("기계적 재배열을 하지 않습니다"));
});
test("offline design contains 27 unique source-model-arm assignments",async()=>{
 let calls=0;
 const d=await x.run(cohort,req,{dryRun:true,invoke:async()=>{calls++;}});
 assert.equal(calls,0);assert.equal(d.rows.length,27);
 assert.equal(new Set(d.rows.map(r=>r.sourceWork+r.model+r.arm)).size,27);
 assert.equal(d.sourceAnnotationsUsed,false);
});
test("private completions omitted from public summary",async()=>{
 const d=await x.run(cohort,req,{invoke:async()=>({text:"RAW_MODEL_COMPLETION_PRIVATE",usage:{prompt_tokens:10,completion_tokens:20}})});
 assert.equal(x.summary(d).generated,27);
 assert.ok(!JSON.stringify(x.summary(d)).includes("RAW_MODEL_COMPLETION_PRIVATE"));
});
