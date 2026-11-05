"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {plan,run,validateRequest,cohortGate}=require("./r3_paired_runner_v01.cjs");
const cohort=require("./fixtures/r2_matched_information_dev_v01.json");
const req=require("./fixtures/r3_development_request_v01.json");
test("preflight identifies only an actual order intervention",()=>{
 const p=plan(cohort,req);
 assert.equal(p.sourceWorks,3);assert.equal(p.identifiableOrderPairs,1);
 assert.equal(p.noOrderContrastPairs,2);assert.equal(p.assignedEligibleCalls,2);
 assert.equal(p.matchedPromptCharacters,true);assert.equal(p.matchedProviderTokens,false);
});
test("preflight never counts generated texts or human preferences",()=>{const p=plan(cohort,req);assert.equal(p.modelOutputs,0);assert.equal(p.humanRatings,0)});
test("dry run does not call provider",async()=>{
 let calls=0;
 const r=await run(cohort,req,{dryRun:true,invoke:async()=>{calls++;throw Error("MUST_NOT_CALL")}});
 assert.equal(calls,0);assert.equal(r.generated,0);assert.equal(r.records.filter(x=>x.status==="NOT_EXECUTED").length,2);
 assert.equal(r.records.filter(x=>x.status==="NO_INTERVENTION").length,2);
});
test("injected mock execution preserves pair and metadata",async()=>{
 let calls=0;
 const r=await run(cohort,req,{dryRun:false,invoke:async input=>{calls++;return {text:"한국어 문서",usage:{prompt_tokens:17,completion_tokens:9},responseModel:input.model,latencyMs:1}}});
 assert.equal(calls,2);assert.equal(r.generated,2);assert.equal(r.failures,0);
 assert.equal(new Set(r.records.filter(x=>x.status==="GENERATED").map(x=>x.sourceHash)).size,1);
 assert.ok(r.records.filter(x=>x.status==="GENERATED").every(x=>x.usage.prompt_tokens===17));
});
test("mock provider failure remains in the denominator",async()=>{
 let calls=0;
 const r=await run(cohort,req,{dryRun:false,invoke:async()=>{calls++;if(calls===1)throw Error("SIMULATED_PROVIDER_FAILURE");return {text:"ok",usage:null}}});
 assert.equal(r.records.filter(x=>x.status==="FAILED").length,1);
 assert.equal(r.records.filter(x=>x.status==="GENERATED").length,1);
 assert.equal(r.failures,1);
});
test("invalid request provider or unfrozen parameters rejected",()=>{
 assert.throws(()=>validateRequest({...req,provider:"unknown"}),/INVALID_R3_REQUEST/);
 assert.throws(()=>validateRequest({...req,maxTokens:1}),/INVALID_R3_REQUEST/);
});
test("cohort duplication and fake holdout rejected",()=>{
 assert.throws(()=>cohortGate({...cohort,evidence:"INDEPENDENT_HOLDOUT"}),/INVALID_R3_COHORT/);
 assert.throws(()=>cohortGate({...cohort,tasks:[cohort.tasks[0],cohort.tasks[0]]}),/INVALID_R3_COHORT/);
});
test("no graph effect is claimed on preordered science source",()=>{
 const p=plan(cohort,req);assert.equal(p.pairs[1].planOrderChanged,false);assert.equal(p.pairs[2].planOrderChanged,false);
});
