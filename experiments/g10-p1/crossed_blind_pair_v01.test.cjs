"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {build}=require("./crossed_blind_pair_v01.cjs");
function data(){
 const arms=["ROLE_AWARE_PLAN_V05","RICH_CHAR_MATCH_V05"];
 const rows=[];
 for(const model of ["openai/gpt-oss-20b","openai/gpt-oss-120b"])
  for(const work of ["X","Y","Z"])for(const arm of arms)
   rows.push({sourceWork:work,sourceTask:work,model,arm,outcome:"GENERATED",
    text:"KOREAN_TEST_"+work+"_"+model+"_"+arm});
 return {schema:"ksgt.g10.p1.crossed-model-architecture.v02",
  status:"MODEL_REQUESTS_ATTEMPTED",rows};
}
test("blinding removes model and arm labels but preserves six real textual pairs",()=>{
 const a=build(data(),()=>0);
 assert.equal(a.publicPacket.pairs.length,6);
 assert.equal(a.privateKey.pairs.length,6);
 const p=JSON.stringify(a.publicPacket);
 assert.ok(!p.includes('"model"'));
 assert.ok(!p.includes('"A_arm"'));
 assert.ok(a.publicPacket.pairs.every(x=>x.readerChoice===null&&x.readerId===null));
});
test("no dry run and no partial pair can claim human comparison",()=>{
 assert.throws(()=>build({...data(),status:"DRY_RUN_NO_MODEL_CALLS"}),/ACTUAL_V05_REPORT/);
 const r=data();r.rows=r.rows.slice(1);
 assert.throws(()=>build(r),/MISSING_OR_REPEATED_PAIR_ARM/);
});
test("every completed blind pair has private provenance and different arm labels",()=>{
 const r=build(data(),()=>1);
 assert.ok(r.privateKey.pairs.every(x=>x.A_arm!==x.B_arm));
 assert.equal(new Set(r.privateKey.pairs.map(x=>x.blindId)).size,6);
});

test("opaque pair IDs change across repeated exports, preventing model-hash guessing",()=>{
 const a=build(data(),()=>0),b=build(data(),()=>0);
 assert.notEqual(a.publicPacket.pairs[0].blindId,b.publicPacket.pairs[0].blindId);
 assert.ok(/^PAIR_[0-9a-f]{24}$/.test(a.publicPacket.pairs[0].blindId));
});
