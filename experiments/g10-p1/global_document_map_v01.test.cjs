"use strict";
const t=require("node:test"),a=require("node:assert/strict");
const cohort=require("./fixtures/global_document_dev_v01.json");
const {map}=require("./global_document_map_v01.cjs");
t("all source facts assigned exactly once",()=>{
 for(const task of cohort.tasks){
 const v=map(task),ids=v.sections.flatMap(s=>s.factIds);
 a.equal(v.sections.length,3);a.equal(ids.length,task.facts.length);
 a.equal(new Set(ids).size,task.facts.length);
 }
});
t("ablated plan preserves fact multiset but changes paragraph placement",()=>{
 for(const task of cohort.tasks){
  const x=map(task),y=map(task,{ablate:true});
  a.deepEqual(x.sections.flatMap(s=>s.factIds).sort(),y.sections.flatMap(s=>s.factIds).sort());
  a.notDeepEqual(x.sections.map(s=>s.factIds),y.sections.map(s=>s.factIds));
 }
});
t("unknown source conditions remain explicit",()=>{
 const p=map(cohort.tasks[1]);
 a.ok(p.sections[2].factIds.includes("F6"));
 a.ok(p.prompt.includes("미확인"));
});
t("implementation describes its linguistic limits truthfully",()=>{
 a.ok(map(cohort.tasks[0]).epistemicLimit.startsWith("SHALLOW_LEXICAL"));
});
