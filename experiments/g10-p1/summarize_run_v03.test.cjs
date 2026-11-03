"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {summarize}=require("./summarize_run_v03.cjs");
const cohort=require("./fixtures/cohort_v02.json");
const {ARMS}=require("./paired_runner_v02.cjs");
function report(){
 return {schema:"ksgt.g10.p1.paired-generation.v02",status:"MODEL_REQUESTS_ATTEMPTED",model:"MOCK",
  rows:cohort.tasks.flatMap(t=>ARMS.map(arm=>({
   taskId:t.id,sourceWork:t.sourceWork,arm,outcome:"GENERATED",text:"새로운 17개가 관측되었다.",
   usage:{prompt_tokens:200,completion_tokens:60},latencyMs:10
  })))};
}
test("local report contains only source-linked diagnostics, not raw prose text",()=>{
 const r=summarize(cohort,report(),{promptUsdPerMillion:1,completionUsdPerMillion:3});
 assert.equal(r.diagnostic.returnedConditions,cohort.tasks.length*ARMS.length);
 assert.ok(r.costs.arms.every(x=>x.knownUsageRows===cohort.tasks.length));
 assert.ok(!JSON.stringify(r).includes("새로운 17개가 관측되었다."));
 assert.ok(r.status.startsWith("UNRATED"));
});
test("missing provider usage is unknown rather than free",()=>{
 const x=report();x.rows[0].usage=null;
 const r=summarize(cohort,x,{promptUsdPerMillion:1,completionUsdPerMillion:3});
 assert.equal(r.costs.arms.find(x=>x.arm===ARMS[0]).unknownOrFailedUsageRows,1);
});
test("dry run never qualifies for scientific output inspection",()=>{
 const x=report();x.status="DRY_RUN_NO_MODEL_CALLS";
 assert.throws(()=>summarize(cohort,x),/ACTUAL_MODEL_REPORT/);
});
