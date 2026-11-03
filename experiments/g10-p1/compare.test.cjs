"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {MODES,validateTask,buildPlan,makeMessages,parseArgs,compare}=require("./compare.cjs");
const task={id:"T1",genre:"science_explainer",audience:"고등학생",purpose:"관측과 추론을 구별한 산문",
 facts:["상자 두 개가 있다.","둘 다 같은 물을 받았다.","한 곳에서 발아가 더 많았다.","조도를 재지 않았다."],
 uncertainties:["빛이 원인인지 미확정"]};
test("the plan never invents additional fact IDs and covers all facts exactly once",()=>{
 const p=buildPlan(task);
 const ids=p.moves.flatMap(x=>x.factIds);
 assert.deepEqual(ids,["F1","F2","F3","F4"]);
 assert.equal(p.unresolved.length,1);
});
test("all three arms receive identical source facts and uncertainty statements",()=>{
 for(const mode of MODES){
  const text=makeMessages(mode,task)[1].content;
  for(const fact of task.facts)assert.ok(text.includes(fact),mode);
  for(const u of task.uncertainties)assert.ok(text.includes(u),mode);
 }
});
test("only guided arm has an explicit inspectable planning object",()=>{
 assert.ok(makeMessages("DISCOURSE_GUIDED",task)[1].content.includes("담화 계획"));
 assert.ok(!makeMessages("DIRECT",task)[1].content.includes("담화 계획"));
 assert.equal(buildPlan(task).schema,"ksgt.g10.p1.plan.v01");
});
test("cannot silently run without explicit mode and input",()=>{
 assert.throws(()=>parseArgs(["--input","x.json"]),/CHOOSE_EXACTLY_ONE/);
 assert.throws(()=>parseArgs(["--run","--input","x.json"]),/RUN_REQUIRES_OUTPUT_AND_MODEL/);
 assert.throws(()=>parseArgs(["--dry-run","--input","x.json","--temperature","5"]),/TEMPERATURE_OUT_OF_RANGE/);
});
test("dry run never invokes any model endpoint",async()=>{
 let calls=0;
 const r=await compare(task,{model:"MOCK",run:false,maxTokens:400,temperature:0},async()=>{calls++;throw Error("NETWORK_CALLED");});
 assert.equal(calls,0);assert.equal(r.modeOutputs.length,3);
 assert.ok(r.modeOutputs.every(x=>x.execution==="DRY_RUN_NO_MODEL_OUTPUT"));
});
test("mock neural runner wiring is complete but proves no prose-quality gain",async()=>{
 let calls=0;
 const r=await compare(task,{model:"FAKE",run:true,maxTokens:400,temperature:0},
  async()=>{calls++;return {text:"STUB_OUTPUT_NOT_KOREAN_WRITING_EVIDENCE",usage:{total_tokens:10},elapsedMs:0};});
 assert.equal(calls,3);
 assert.ok(r.modeOutputs.every(x=>x.text==="STUB_OUTPUT_NOT_KOREAN_WRITING_EVIDENCE"));
});
test("malformed source task is rejected",()=>{
 assert.throws(()=>validateTask({...task,facts:[]}),/NONEMPTY_FACT/);
 assert.throws(()=>validateTask({...task,uncertainties:null}),/UNCERTAINTIES_ARRAY/);
});
