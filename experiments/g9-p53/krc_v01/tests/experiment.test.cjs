"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const P=require("../planner.cjs"),G=require("../generate.cjs"),V=require("../critic.cjs");
test("Frozen model, budget and pre-registered complete schedule",()=>{
 a.equal(G.frozenCheck(),true);
 a.equal(P.order().length,18);
});
test("One inference call carries fixed temperature, seed, facts, and no judge feedback",async()=>{
 let received=null;
 const fake=async(url,options)=>{
  received=JSON.parse(options.body);
  return {ok:true,json:async()=>({choices:[{message:{content:"첫 문단입니다.\n\n둘째 문단입니다."},finish_reason:"stop"}],usage:{completion_tokens:19}})};
 };
 const r=await G.callModel("http://mock.local",{brief:"EX01",arm:"K_TYPED_PLAN"},fake);
 a.equal(r.status,"COMPLETED");a.equal(r.text,"첫 문단입니다.\n\n둘째 문단입니다.");
 a.equal(received.seed,6400);a.equal(received.temperature,0.65);
 a.equal(received.top_p,0.9);a.equal(received.max_tokens,640);
 a(received.messages[1].content.includes("KRC에서 형식 검증"));
 a(!JSON.stringify(received).includes("critic_score"));
});
test("Eighteen mocked runs keep exactly one output per arm without retry or feedback",async()=>{
 let calls=0;
 const fake=async(_url,options)=>{
  calls++;const req=JSON.parse(options.body);
  const txt="같은 조건을 명확히 밝힙니다. "+req.seed+".\n\n별도 결과를 설명하고 불확실성을 구분합니다.";
  return {ok:true,json:async()=>({choices:[{message:{content:txt},finish_reason:"stop"}],usage:{completion_tokens:34}})};
 };
 const {raw,blinded}=await G.run("http://mock.local",fake);
 a.equal(calls,18);a.equal(raw.documents.length,18);a.equal(blinded.documents.length,18);
 a.equal(raw.n_completed,18);
 const obs=V.run(raw);
 a.equal(obs.observations.length,18);
 a.equal(obs.fact_semantic_validity,"NOT_ADJUDICATED");
 a.equal(obs.natural_korean_readers,"NOT_COLLECTED");
 a.equal(obs.K_beats_B,"NOT_DETERMINED");
 a.equal(blinded.no_arm_labels,true);
 for(const d of blinded.documents){
  a(!Object.hasOwn(d,"arm"));
  a(!Object.hasOwn(d,"prompt"));
  a(!Object.hasOwn(d,"plan"));
 }
});
test("Independent critic rejects mixed checkpoints, incomplete and repeated arms",()=>{
 const demo={schema:"ksgt.krc.v0.1.controlled-generation.v1",model:{sha256:"H"},documents:[]};
 a.throws(()=>V.run(demo),/INCOMPLETE_18_ARM_MATRIX/);
});
test("Separate evidence cues cannot be treated as semantic truth",()=>{
 const r=V.describe({id:"EX04_B_GENERIC",brief:"EX04",arm:"B_GENERIC",status:"COMPLETED",
   text:"약속에 일찍 온 나는 무척 슬퍼했다. 누군가는 기다림을 위로받았다고 했다.\n\n이러한 사연이 결국 감정의 근원을 증명했다."});
 a.equal(r.semantic,"NOT_ADJUDICATED");
 a(r.cues.includes("POSSIBLE_UNOBSERVED_AFFECT_REVIEW"));
 a.equal(r.reader,"NOT_OBSERVED");
});
