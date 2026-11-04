"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {plan,classify}=require("./raw_chronology_plan_v06.cjs");
const challenge=require("./fixtures/challenge_cohort_v01.json");
test("extract Korean 7일째 and 14일째 without manual annotations",()=>{
 assert.equal(classify("관찰 7일째에는 A 화분에서 싹을 관찰했다.").day,7);
 assert.equal(classify("14일째에는 B 화분의 잎이 세어졌다.").day,14);
 const t=structuredClone(challenge.tasks[0]);delete t.factAnnotations;delete t.relations;
 const p=plan(t);
 assert.equal(p.abstained,false);
 assert.ok(p.factOrder.indexOf("F4")<p.factOrder.indexOf("F1"));
 assert.ok(p.factOrder.indexOf("F3")<p.factOrder.indexOf("F4"));
 assert.ok(p.factOrder.indexOf("F1")<p.factOrder.indexOf("F2"));
 assert.equal(p.authority,"SOURCE_TEXT_LEXICAL_CUES_ONLY_NO_HUMAN_ANNOTATIONS_NO_SEMANTIC_PARSER");
});
test("non-chronological narrative and notice abstain instead of inventing chronology",()=>{
 for(const task of challenge.tasks.slice(1)){
  const x=structuredClone(task);delete x.factAnnotations;delete x.relations;
  const p=plan(x);
  assert.equal(p.abstained,true);
  assert.deepEqual(p.factOrder,task.facts.map((_,i)=>"F"+(i+1)));
 }
});
test("dates or quantities without observed day marker do not become chronological edges",()=>{
 assert.equal(classify("각각 20개씩 씨앗을 심었다.").day,null);
 assert.equal(classify("수요일 오후 6시까지 신청한다.").day,null);
});
