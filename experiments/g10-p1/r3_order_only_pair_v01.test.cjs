"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {ARMS,pair,make}=require("./r3_order_only_pair_v01.cjs");
const cohort=require("./fixtures/r2_matched_information_dev_v01.json");
test("pair has two uniquely identified arms",()=>assert.deepEqual(ARMS,["SOURCE_ORDER_PLAN","DEPENDENCY_ORDER_PLAN"]));
test("same source and equal serialized prompt characters on all development works",()=>{
 for(const task of cohort.tasks){const p=pair(task);assert.equal(p.sameSource,true);assert.equal(p.equalSerializedPromptChars,true);assert.equal(p.arms[0].sourceHash,p.arms[1].sourceHash);}
});
test("notice prerequisite changes order but nothing else in prompt",()=>{
 const p=pair(cohort.tasks[0]);assert.equal(p.planOrderChanged,true);
 const a=p.arms[0].messages[1].content,b=p.arms[1].messages[1].content;
 assert.equal(a.split("참고 사실 ID 순서: ")[0],b.split("참고 사실 ID 순서: ")[0]);
 assert.notEqual(a,b);
});
test("science edges already in source order can be nonbinding",()=>{
 const p=pair(cohort.tasks[1]);
 assert.equal(p.planOrderChanged,false);
});
test("edge-free narrative is an identical-prompt negative control",()=>{
 const p=pair(cohort.tasks[2]);assert.equal(p.planOrderChanged,false);
 assert.equal(p.arms[0].promptSha256,p.arms[1].promptSha256);
});
test("same information does not mean equal provider token budget",()=>{
 const p=pair(cohort.tasks[0]);assert.equal(p.tokenBudgetMatched,false);
 assert.equal(p.independentReaderRatings,0);assert.match(p.caveat,/NO_TOKEN_EQUIVALENCE/);
});
test("unknown policy fails closed",()=>assert.throws(()=>make(cohort.tasks[0],"SECRET_GRAPH"),/UNKNOWN_R3_ARM/));
test("model invented edge rejected for both arms",()=>{
 const z={...cohort.tasks[0],edges:[{...cohort.tasks[0].edges[0],evidence:"MODEL_GUESSED"}]};
 assert.throws(()=>pair(z),/UNLICENSED_EDGE/);
});
test("dependency cycles rejected before any prompt can be emitted",()=>{
 const t=cohort.tasks[0],z={...t,edges:[...t.edges,{before:"F1",after:"F2",type:"READER_PREREQUISITE",evidence:"AUTHOR_DECLARED"}]};
 assert.throws(()=>pair(z),/DEPENDENCY_CYCLE/);
});
