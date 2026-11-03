"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {inspect}=require("./output_inspection_v01.cjs");
const {ARMS}=require("./paired_runner_v02.cjs");
const task={id:"A",sourceWork:"WORK_A",genre:"science_explainer",audience:"학생",purpose:"설명",
 facts:["표본은 12개다."],uncertainties:["원인은 알려지지 않았다."]};
const cohort={tasks:[task]};
function report(){return {schema:"ksgt.g10.p1.paired-generation.v02",status:"MODEL_REQUESTS_ATTEMPTED",
 rows:ARMS.map(arm=>({taskId:"A",sourceWork:"WORK_A",arm,outcome:"GENERATED",text:"13개 표본으로 기록했다."}))};}
test("full assigned denominator and source-linked suspicious-number audit",()=>{
 const v=inspect(cohort,report());
 assert.equal(v.assignedConditions,ARMS.length);assert.equal(v.returnedConditions,ARMS.length);
 assert.ok(v.rows.every(r=>r.suspiciousNumericMentions.includes("13개")));
 assert.ok(v.rows.every(r=>r.humanNaturalness===null&&r.humanSourceFidelity===null));
});
test("failed generations still count, no silent survivor-only evaluation",()=>{
 const r=report();r.rows[0]={...r.rows[0],outcome:"FAILED",text:undefined};
 const v=inspect(cohort,r);assert.equal(v.returnedConditions,ARMS.length);
 assert.equal(v.bySourceWork[0].generatedRows,ARMS.length-1);
});
test("must not fabricate a missing arm or misattribute a source work",()=>{
 const r=report();r.rows.pop();assert.throws(()=>inspect(cohort,r),/UNREPORTED_ASSIGNED_ARM/);
 const q=report();q.rows[0].sourceWork="OTHER";assert.throws(()=>inspect(cohort,q),/SOURCE_OR_ARM_MISMATCH/);
});
test("no dry-run report becomes an output review",()=>{
 assert.throws(()=>inspect(cohort,{...report(),status:"DRY_RUN_NO_MODEL_CALLS"}),/ACTUAL_MODEL_REPORT/);
});
