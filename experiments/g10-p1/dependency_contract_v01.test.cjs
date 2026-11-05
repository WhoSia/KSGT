"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {audit,stableOrder,validate}=require("./dependency_contract_v01.cjs");
const notice={facts:[{id:"F1"},{id:"F2"},{id:"F3"},{id:"F4"}],edges:[
 {before:"F2",after:"F1",type:"READER_PREREQUISITE",evidence:"AUTHOR_DECLARED"},
 {before:"F3",after:"F4",type:"READER_PREREQUISITE",evidence:"AUTHOR_DECLARED"}]};
test("raw source order can breach reader prerequisite",()=>{
 const r=audit(notice,["F1","F2","F3","F4"]);assert.equal(r.pass,false);
 assert.deepEqual(r.violations.map(x=>x.after),["F1"]);
});
test("stable topological order satisfies all declared prerequisites",()=>{
 const order=stableOrder(notice);assert.equal(audit(notice,order).pass,true);
 assert.equal(order.indexOf("F2")<order.indexOf("F1"),true);
});
test("edge ablation removes structural discrimination, not semantic doubt",()=>{
 const ablated={...notice,edges:[]};
 assert.equal(audit(ablated,["F1","F2","F3","F4"]).pass,true);
 assert.match(audit(ablated,["F1","F2","F3","F4"]).epistemicLimit,/NOT_SEMANTIC/);
});
test("unwitnessed relation is not promoted to source evidence",()=>{
 assert.throws(()=>validate({...notice,edges:[{before:"F1",after:"F4",type:"READER_PREREQUISITE",evidence:"MODEL_GUESSED"}]}),/UNLICENSED_EDGE/);
});
test("directed cycles fail closed",()=>{
 assert.throws(()=>stableOrder({...notice,edges:[...notice.edges,{before:"F1",after:"F2",type:"READER_PREREQUISITE",evidence:"AUTHOR_DECLARED"}]}),/DEPENDENCY_CYCLE/);
});
test("duplicates or unknown facts fail closed",()=>{
 assert.throws(()=>audit(notice,["F1","F2","F2","F4"]),/ORDER_NOT_A_PERMUTATION/);
 assert.throws(()=>audit(notice,["F1","F2","F3","F9"]),/ORDER_NOT_A_PERMUTATION/);
});
test("with no edges stable plan keeps original order",()=>{
 assert.deepEqual(stableOrder({facts:[{id:"F1"},{id:"F2"}],edges:[]}),["F1","F2"]);
});
