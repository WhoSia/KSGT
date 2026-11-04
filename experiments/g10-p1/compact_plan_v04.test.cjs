"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {compact,padBudget}=require("./compact_plan_v04.cjs");
const cohort=require("./fixtures/challenge_cohort_v01.json");
test("source-licensed chronological constraints preserved on shuffled science task",()=>{
 const p=compact(cohort.tasks[0]);
 assert.ok(p.orderedFactIds.indexOf("F3")<p.orderedFactIds.indexOf("F4"));
 assert.ok(p.orderedFactIds.indexOf("F4")<p.orderedFactIds.indexOf("F1"));
 assert.ok(p.planText.includes("TEMPORAL_NEXT"));
 assert.ok(!p.planText.includes("20개씩 심었다"));
});
test("negative control reverses the plan order without corrupting the source",()=>{
 const t=cohort.tasks[0],save=JSON.stringify(t);
 const a=compact(t),b=compact(t,{perturb:true});
 assert.deepEqual(b.orderedFactIds,[...a.orderedFactIds].reverse());
 assert.equal(a.sourceSha256,b.sourceSha256);
 assert.equal(JSON.stringify(t),save);
});
test("source authority is explicit; no invented cause or timing",()=>{
 for(const t of cohort.tasks){
  const p=compact(t);
  assert.equal(p.authority,"AUTHORED_RELATIONS_ONLY_NO_AUTOMATIC_LANGUAGE_UNDERSTANDING");
  assert.deepEqual(p.uncertaintyIds,t.uncertainties.map((_,i)=>"U"+(i+1)));
 }
});
test("length control is exact character-level matching, not falsely token matching",()=>{
 const s=padBudget("한국어",223);
 assert.equal(s.length,223);
 assert.ok(padBudget("이미 긴 문구",2).length>2);
});
