"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const p=require("./r4a_reader_packet_v01.cjs");
const raw=require("./fixtures/r4a_new_full_prose_12works_v01.json");

function sample(){
  return raw.works.map(w=>({work:w,texts:{
    direct:"후보 A 원문 문단이다. "+w.facts[0],
    rich:"후보 B 원문 문단이다. "+w.facts[1]
  },summary:{executable:{choice:"direct",status:"TIE_KEEP_DIRECT"},
    stateAsText:{valid:true,choice:"rich"}}}));
}
test("four reader forms retain the same twelve unique original source work groups",()=>{
 for(let form=1;form<=4;form++){
   const a=p.formData(sample(),form,false);
   assert.equal(a.mapping.rows.length,12);
   assert.equal(new Set(a.mapping.rows.map(x=>x.id)).size,12);
   assert.ok(a.mapping.rows.every(x=>x.shaA?.length===64&&x.shaB?.length===64));
   assert.ok(a.text.includes("네 개 양식을 별도 48개 표본으로 세지 않습니다"));
 }
});
test("reader stage A never gets literal source fact list or investigator model-choice key",()=>{
 const d=p.formData(sample(),1,false);
 assert.ok(d.text.includes("**후보 A**"));
 assert.ok(d.text.includes("**후보 B**"));
 assert.ok(d.text.includes("가장 먼저 수정할 구절"));
 assert.ok(d.text.includes("읽고 답하기"));
 assert.ok(!d.text.includes("고정된 원천 사실"));
 assert.ok(!d.text.includes("모델 위험 탐지기"));
 assert.ok(!d.text.includes("controller"));
 assert.ok(!d.text.includes("stateAsText"));
 assert.ok(!d.text.includes("원천 충실 / 명백한 원천 위반"));
});
test("independent source audit B actually lists every fact and the fiction detail license",()=>{
 const x=p.formData(sample(),2,true);
 assert.ok(x.text.includes("**고정된 원천 사실:**"));
 for(const w of raw.works)assert.ok(x.text.includes(w.facts[0]));
 assert.ok(x.text.includes(raw.works.find(w=>w.genre==="scene").license));
 assert.ok(!x.text.includes("선택 이유(글에 나온 표현"));
});
test("four forms balance A/B condition by source work while keeping pairing identical",()=>{
 const rows=sample();
 for(const work of rows){
   const arr=[1,2,3,4].map(form=>p.formData(rows,form,false).mapping.rows.find(x=>x.id===work.work.id));
   assert.equal(arr.filter(x=>x.A==="direct").length,2);
   assert.equal(arr.filter(x=>x.A==="rich").length,2);
   assert.equal(arr.every(x=>x.shaA!==x.shaB),true);
 }
});
test("form invalid indexes and missing corpus labels cannot silently create new participants",()=>{
 assert.throws(()=>p.orientation(0,0),/BAD_FORM_NUMBER/);
 assert.throws(()=>p.ordering(sample(),5),/BAD_FORM_NUMBER/);
 assert.deepEqual(p.ordering([1,2,3,4,5,6],1),[1,2,3,4,5,6]);
});
