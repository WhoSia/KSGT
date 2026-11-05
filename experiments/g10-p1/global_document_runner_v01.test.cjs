"use strict";
const t=require("node:test"),a=require("node:assert/strict");
const cohort=require("./fixtures/global_document_dev_v01.json");
const x=require("./global_document_runner_v01.cjs");
const req={schema:"ksgt.g10.p1.global-document-request.v01",id:"GLOBALDOC_20261105_01",
cohort:"experiments/g10-p1/fixtures/global_document_dev_v01.json",maxTokens:1700,temperature:0.2};
t("all four arms see identical source facts and uncertainty statements",()=>{
 for(const task of cohort.tasks)for(const arm of x.ARMS){
  const p=JSON.stringify(x.messages(task,arm));
  for(const fact of task.facts)a.ok(p.includes(fact));
  for(const u of task.uncertainties)a.ok(p.includes(u));
  a.ok(p.includes("세 문단"));
 }
});
t("36 source/model/arm cells in offline pilot",async()=>{
 let called=0;
 const r=await x.run(cohort,req,{dryRun:true,invoke:async()=>{called++;}});
 a.equal(called,0);a.equal(r.rows.length,36);
 a.equal(new Set(r.rows.map(v=>v.sourceWork+v.model+v.arm)).size,36);
});
t("global plan and perturbation preserve source words but differ in structure",()=>{
 const task=cohort.tasks[0];
 const good=x.messages(task,"GLOBAL_MAP")[1].content;
 const bad=x.messages(task,"GLOBAL_MAP_ABLATED")[1].content;
 a.notEqual(good,bad);
 for(const fact of task.facts)a.ok(bad.includes(fact));
});
t("real-like injection never prints private Korean text in public summaries",async()=>{
 const r=await x.run(cohort,req,{invoke:async()=>({text:"첫 문단.\n\n둘째 문단.\n\n셋째 문단.",usage:{prompt_tokens:100,completion_tokens:80}})});
 a.equal(x.summary(r).generated,36);
 a.ok(x.summary(r).rows.every(y=>y.observedParagraphs===3));
 a.ok(!JSON.stringify(x.summary(r)).includes("첫 문단"));
 a.equal(x.summary(r).humanRatings,0);
});
