"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {realize,brief}=require("./korean_realization_v03.cjs");
function task(entities){
 return {id:"T",genre:"science_explainer",audience:"학생",purpose:"설명",
  facts:entities.map((_,i)=>"사실 "+(i+1)),
  uncertainties:["근거 없는 추론 금지"],
  factAnnotations:entities.map(x=>({move:"OBSERVATION",evidence:"OBSERVED",entity:x}))};
}
test("one unambiguous repeated author-tagged referent receives a cautious optional ellipsis hint",()=>{
 const r=realize(task(["화분","화분"]));assert.equal(r.trace[0].ellipsisHint,"DO_NOT_FORCE_ELLIPSIS");
 assert.equal(r.trace[1].ellipsisHint,"ELLIPSIS_MAY_BE_LICENSED_CHECK_CONTEXT");
 assert.equal(r.trace[1].confidence,"HEURISTIC_NOT_HUMAN_VALIDATED");
});
test("multiple antecedent labels block automatic omission even if most recent matches",()=>{
 const r=realize(task(["학생","교사","학생","학생"]));
 assert.equal(r.trace[3].ellipsisHint,"DO_NOT_FORCE_ELLIPSIS");
});
test("explicit topic is not inferred from a source lacking annotations",()=>{
 const x=task(["화분"]);delete x.factAnnotations;
 const r=realize(x);assert.equal(r.trace[0].topicalityHint,"UNSPECIFIED");
 assert.equal(r.trace[0].ellipsisHint,"NO_EVIDENCE");
});
test("human annotator relation remains read only",()=>{
 const x=task(["화분","화분"]);
 x.relations=[{from:1,to:2,type:"ELABORATION"}];
 const r=realize(x);assert.equal(r.trace[1].discourseLinks[0].type,"ELABORATION");
 assert.equal(x.relations[0].type,"ELABORATION");
 assert.ok(brief(x).includes("위 값은 문장 생성 선택을 돕는 가능성"));
});
test("no semantic or naturalness PASS label is emitted",()=>{
 const s=JSON.stringify(realize(task(["사건","사건"])));
 assert.ok(!s.includes("NATURALNESS_PASS"));assert.ok(s.includes("NOT_CORRECTNESS_LABELS"));
});
