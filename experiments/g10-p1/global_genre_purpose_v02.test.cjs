"use strict";
const t=require("node:test"),a=require("node:assert/strict");
const cohort=require("./fixtures/global_document_dev_v01.json");
const {map}=require("./global_genre_purpose_v02.cjs");
t("genre-level ends have distinct rhetorical functions",()=>{
 const x=cohort.tasks.map(v=>map(v));
 a.ok(x[0].paragraphRoles[2].includes("측정 한계"));
 a.ok(x[1].paragraphRoles[0].includes("신청"));
 a.ok(x[2].paragraphRoles[2].includes("마지막 관찰"));
 a.ok(x[2].prompt.includes("해설적 결말은 쓰지 마세요"));
});
t("reader-purpose map includes all source fact identifiers without extra content",()=>{
 for(const task of cohort.tasks){
  const p=map(task),facts=p.sections.flat();
  a.equal(facts.length,task.facts.length);
  a.equal(new Set(facts).size,task.facts.length);
  a.ok(p.prompt.includes(task.purpose));
 }
});
t("no pretend semantic inference or generated quality judgments",()=>{
 const p=map(cohort.tasks[0]);
 a.equal(p.limitation,"AUTHOR_SYNTHETIC_SHALLOW_GLOBAL_PLANNING_NO_HUMAN_QUALITY_CERTIFICATION");
});
