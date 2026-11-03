"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const cohort=require("./fixtures/cohort_v02.json");
const {ARMS,messages,seededOrder,validateCohort,run,args}=require("./paired_runner_v02.cjs");
test("pilot has three independent author-generated source-work components",()=>{
 const v=validateCohort(cohort);assert.equal(v.tasks,3);assert.equal(v.sourceWorks,3);
});
test("all four arms receive exactly same factual/uncertainty literals",()=>{
 for(const task of cohort.tasks)for(const arm of ARMS){
  const t=JSON.stringify(messages(arm,task));
  for(const f of task.facts)assert.ok(t.includes(f),arm+" missing "+f);
  for(const u of task.uncertainties)assert.ok(t.includes(u),arm+" missing uncertainty");
 }
});
test("seeded order is repeatable, all arms present",()=>{
 for(const task of cohort.tasks){
  const a=seededOrder(ARMS,"seed"+task.id),b=seededOrder(ARMS,"seed"+task.id);
  assert.deepEqual(a,b);assert.deepEqual([...a].sort(),[...ARMS].sort());
 }
});
test("dry run reports 15 condition rows and never calls any model",async()=>{
 let calls=0;
 const result=await run(cohort,{mode:"dry-run",maxTokens:400,temperature:0,seed:"12"},
 async()=>{calls++;throw Error("MUST_NOT_CALL_MODEL")});
 assert.equal(calls,0);assert.equal(result.rows.length,15);
 assert.ok(result.rows.every(x=>x.outcome==="NOT_EXECUTED"&&/^[0-9a-f]{64}$/.test(x.promptSha256)));
 assert.equal(result.distinctSourceWorks,3);
});
test("injected run wires actual response rows but no human quality claims",async()=>{
 let calls=0;
 const res=await run(cohort,{mode:"run",model:"TEST_ONLY",maxTokens:500,temperature:0,seed:"0",injected:true},
 async()=>{calls++;return {text:"MOCK_NOT_REAL_KOREAN_OUTPUT",usage:{prompt_tokens:23,completion_tokens:9,total_tokens:32},latencyMs:2}});
 assert.equal(calls,15);assert.ok(res.rows.every(x=>x.outcome==="GENERATED"));
 assert.ok(!JSON.stringify(res).includes("HUMAN_PREFERENCE_PASS"));
});
test("failed arms remain in the denominator, not silently removed",async()=>{
 let count=0;
 const res=await run({tasks:[cohort.tasks[0]]},{mode:"run",model:"TEST_ONLY",maxTokens:500,temperature:0,injected:true},
 async()=>{count++;if(count===1)throw Error("FAKE_NETWORK_ERROR");return {text:"MOCK",usage:{},latencyMs:0}});
 assert.equal(res.rows.length,5);assert.equal(res.rows.filter(x=>x.outcome==="FAILED").length,1);
});
test("cannot treat repeated task ID or missing work as independent",()=>{
 assert.throws(()=>validateCohort({tasks:[cohort.tasks[0],cohort.tasks[0]]}),/DUPLICATE_TASK/);
 assert.throws(()=>validateCohort({tasks:[{...cohort.tasks[0],sourceWork:""}]}),/SOURCE_WORK_REQUIRED/);
});
test("schema rejects invalid cli flags and nonexplicit mode",()=>{
 assert.throws(()=>args(["--input","x.json"]),/EXPLICIT_MODE/);
 assert.throws(()=>args(["--run","--input","x.json"]),/LIVE_REQUIRES_MODEL_OUTPUT/);
 assert.throws(()=>args(["--dry-run","--input","x.json","--nothing"]),/UNKNOWN/);
});

test("annotated discourse information is available to all arms, never only KSGT",()=>{
 for(const task of cohort.tasks){
  const all=ARMS.map(arm=>messages(arm,task)[1].content);
  for(const content of all){
   assert.ok(content.includes("원천에서 명시한 메타정보"));
   for(const rel of task.relations)assert.ok(content.includes("F"+rel.from+" "+rel.type+" F"+rel.to));
   for(const a of task.factAnnotations)assert.ok(content.includes(a.move+" / "+a.evidence));
  }
 }
});

test("v0.3 arm adds possible Korean realization decisions but uses the same source and annotated evidence",()=>{
 const task=cohort.tasks[0],p=messages("KOREAN_REALIZATION_V03",task)[1].content;
 assert.ok(p.includes("주제"));assert.ok(p.includes("ellipsis="));
 for(const f of task.facts)assert.ok(p.includes(f));
 for(const a of task.factAnnotations)assert.ok(p.includes(a.move+" / "+a.evidence));
});
