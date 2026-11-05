"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {decodePlan}=require("./r7_commitment_pipeline_v01.cjs");
const cohort=require("./fixtures/r6_cohort_v01.json");
const corridor=cohort.tasks.find(t=>t.sourceWork==="SCENE_CORRIDOR_B");
const notice=cohort.tasks.find(t=>t.sourceWork==="NOTICE_CONDITION_A");
function base(t){return {units:[{type:"SOURCE_CLAIM",factIds:["F1"],content:t.facts[0].text},{type:"SOURCE_CLAIM",factIds:["F2"],content:t.facts[1].text},{type:"SOURCE_CLAIM",factIds:["F3"],content:t.facts[2].text},{type:"RHETORICAL_BRIDGE",factIds:[],addsWorldFact:false,content:"이어서 다음 내용을 살핀다"}]}}
test("source ID laundering of invented chime still passes structural checking",()=>{
 const p=base(corridor);p.units[0].content="복도 시계가 정각에 종을 울렸다";
 const v=decodePlan(JSON.stringify(p),corridor);
 assert.equal(v.units[0].factIds[0],"F1");
 assert.match(v.warning,/NOT_ENTAILMENT_GOLD/);
});
test("bridge claiming a new character action can falsely label itself addsWorldFact=false",()=>{
 const p=base(corridor);p.units[3].content="태호는 게시판에서 새 공지를 읽고 웃었다";
 assert.equal(decodePlan(JSON.stringify(p),corridor).units[3].addsWorldFact,false);
});
test("source fact turned into weak hypothesis cannot be rejected by schema alone",()=>{
 const p=base(corridor);p.units[1]={type:"QUALIFIED_INTERPRETATION",factIds:["F2"],qualified:true,content:"유나가 우산을 세워두었을 가능성이 있다"};
 assert.equal(decodePlan(JSON.stringify(p),corridor).units[1].qualified,true);
});
test("plan can omit a protected source fact without violating ID validation",()=>{
 const p=base(notice);assert.equal(decodePlan(JSON.stringify(p),notice).units.some(u=>u.factIds.includes("F6")),false);
});
