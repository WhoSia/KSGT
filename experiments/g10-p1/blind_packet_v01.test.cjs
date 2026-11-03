"use strict";
const test=require("node:test");const assert=require("node:assert/strict");
const {packet}=require("./blind_packet_v01.cjs");
function data(){
 return {schema:"ksgt.g10.p1.paired-generation.v02",status:"MODEL_REQUESTS_ATTEMPTED",
  rows:["DIRECT","RICH_PROMPT","DISCOURSE_GUIDED","LICENSED_PLAN_V02","KOREAN_REALIZATION_V03"].map((arm,i)=>({
   taskId:"X",sourceWork:"ONE_WORK",arm,outcome:"GENERATED",text:"문단 "+(i+1)
  }))};
}
test("blind packet contains no arm or model metadata and blank human ratings",()=>{
 const out=packet(data(),()=>0),p=JSON.stringify(out.publicPacket);
 assert.equal(out.publicPacket.rows.length,5);
 assert.ok(!p.includes("DIRECT"));assert.ok(!p.includes("PLAN_V02"));
 assert.ok(out.publicPacket.rows.every(x=>x.independentReaderRating===null));
 assert.equal(new Set(out.privateMapping.rows.map(x=>x.arm)).size,5);
});
test("never treats synthetic dry runs as genuine reader data",()=>{
 assert.throws(()=>packet({...data(),status:"DRY_RUN_NO_MODEL_CALLS"}),/ACTUAL_GENERATION_REPORT/);
 assert.throws(()=>packet({...data(),rows:data().rows.slice(1)}),/MISSING_ARM/);
 assert.throws(()=>packet({...data(),rows:data().rows.map((r,i)=>i===1?{...r,outcome:"FAILED"}:r)}),/CANNOT_BLIND/);
});
test("source-work collision and empty prose forbidden",()=>{
 assert.throws(()=>packet({...data(),rows:data().rows.map((r,i)=>i===2?{...r,sourceWork:"SECOND_WORK"}:r)}),/SOURCE_WORK_SPLIT/);
 assert.throws(()=>packet({...data(),rows:data().rows.map((r,i)=>i===3?{...r,text:""}:r)}),/CANNOT_BLIND/);
});
