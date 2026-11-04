"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const cohort=require("./fixtures/challenge_cohort_v01.json");
const {ARMS,armMessages,validateRequest,run,safeSummary}=require("./factorial_runner_v01.cjs");
const req={schema:"ksgt.g10.p1.factorial-request.v01",requestId:"FACTOR_20261104_01",
 cohort:"experiments/g10-p1/fixtures/challenge_cohort_v01.json",
 models:["openai/gpt-oss-20b","openai/gpt-oss-120b"],maxTokens:1200,temperature:0.2,seed:"factor-A"};
test("same underlying source annotations exposed in every treatment arm",()=>{
 for(const task of cohort.tasks){
  const outputs=ARMS.map(a=>armMessages(task,a)[1].content);
  for(const s of outputs){
   for(const f of task.facts)assert.ok(s.includes(f));
   for(const u of task.uncertainties)assert.ok(s.includes(u));
   for(const rel of task.relations)assert.ok(s.includes("F"+rel.from+" "+rel.type+" F"+rel.to));
  }
 }
});
test("char-matched rich rival and compact plan have exactly same user message length",()=>{
 for(const task of cohort.tasks){
  const rich=armMessages(task,"RICH_CHAR_MATCH");
  const plan=armMessages(task,"COMPACT_PLAN_V04");
  assert.equal(rich[1].content.length,plan[1].content.length);
  assert.notEqual(rich[1].content,plan[1].content);
 }
});
test("bad ordering is negative control rather than an extra source-information advantage",()=>{
 const t=cohort.tasks[0];
 const base=armMessages(t,"COMPACT_PLAN_V04")[1].content;
 const distorted=armMessages(t,"ORDER_PERTURBED_V04")[1].content;
 assert.notEqual(base,distorted);
 for(const f of t.facts)assert.ok(distorted.includes(f));
});
test("strict request allows only two distinct target models, fixed public synthetic work and budgets",()=>{
 assert.equal(validateRequest(req).models.length,2);
 assert.throws(()=>validateRequest({...req,models:[req.models[0],req.models[0]]}),/TWO_ALLOWED_DISTINCT/);
 assert.throws(()=>validateRequest({...req,models:["retired","qwen/qwen3.8-27b"]}),/TWO_ALLOWED_DISTINCT/);
 assert.throws(()=>validateRequest({...req,cohort:"secret.json"}),/ONLY_FIXED_SYNTHETIC/);
});
test("dry run schedules 3 sources x 2 models x 4 arms without external requests",async()=>{
 let calls=0;
 const r=await run(cohort,req,{dryRun:true,invoke:async()=>{calls++;throw Error("NEVER_CALLED");}});
 assert.equal(calls,0);assert.equal(r.rows.length,24);
 const groups=new Set(r.rows.map(x=>x.sourceWork+":"+x.model+":"+x.arm));
 assert.equal(groups.size,24);
 assert.ok(r.rows.every(x=>x.outcome==="NOT_EXECUTED"));
});
test("injected real-like responses remain unrated and raw prose excluded from safe summary",async()=>{
 const r=await run(cohort,req,{dryRun:false,invoke:async()=>({
  text:"PRIVATE_KOREAN_OUTPUT_NOT_HUMAN_GOLD",
  usage:{prompt_tokens:12,completion_tokens:8},latencyMs:2})});
 assert.equal(r.rows.length,24);assert.equal(r.rows.filter(x=>x.outcome==="GENERATED").length,24);
 const sum=safeSummary(r);assert.equal(sum.assigned,24);
 assert.equal(sum.generated,24);assert.ok(!JSON.stringify(sum).includes("PRIVATE_KOREAN_OUTPUT"));
 assert.equal(sum.humanPreference,"NOT_MEASURED");
});
test("failed model arms kept in original assignment denominator",async()=>{
 let n=0;
 const r=await run(cohort,req,{dryRun:false,invoke:async()=>{
  if(++n===5)throw Error("PROVIDER_HTTP_429");
  return {text:"MOCK",usage:{prompt_tokens:10,completion_tokens:6}};
 }});
 assert.equal(r.rows.length,24);assert.equal(safeSummary(r).failed,1);
});
