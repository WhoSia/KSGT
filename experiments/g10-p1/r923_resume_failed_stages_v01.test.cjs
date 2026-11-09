'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {run}=require('./r923_actual_role_pipeline_v01.cjs');
const {resume}=require('./r923_resume_failed_stages_v01.cjs');
const make=()=>({schema:'ksgt.g10.p1.global-dev-cohort.v01',tasks:['A','B','C'].map(sourceWork=>({
 sourceWork,genre:'public_notice',audience:'학생',purpose:'공지',
 facts:['실습은 목요일이다.','참가는 무료이다.'],uncertainties:['추가 일정 미정']}))});
const mock=async()=>({text:'모의 응답입니다.',finishReason:'stop',
 usage:{prompt_tokens:60,completion_tokens:10,total_tokens:70},responseModel:'mock',latencyMs:2});
async function initial(){
 const cohort=make(),d=await run(cohort,{invoke:mock});
 d.calls[2].status='INCOMPLETE';d.calls[3].status='SKIPPED_DEPENDENCY';
 d.records[0].critique=null;d.records[0].contextual=null;d.newModelCalls=11;
 return {d,cohort};
}
test('resumes ONLY two unfinished stages, never successful old calls',async()=>{
 const {d,cohort}=await initial();let calls=0;
 const x=await resume(d,cohort,{invoke:async()=>{calls++;return mock();}});
 a.equal(calls,2);a.equal(x.retryCalls,2);a.equal(x.newModelCalls,13);
 a.equal(x.finalStageSlots,12);a.equal(x.calls.length,14);
 a.equal(x.calls[2].status,'INCOMPLETE');a.equal(x.originalFailedAttemptsRetained,true);
 a.deepEqual(x.records[1],d.records[1]);
});
test('source drift is fatal, never silently reuses a revision',async()=>{
 const {d,cohort}=await initial();cohort.tasks[0].facts[0]='다른 사실';
 await a.rejects(resume(d,cohort,{invoke:mock}),/SOURCE_DRIFT/);
});
test('missing earlier generic success stops before any retry',async()=>{
 const {d,cohort}=await initial();d.records[0].generic=null;
 await a.rejects(resume(d,cohort,{invoke:mock}),/PRIOR_SUCCESS/);
});
test('a repeated truncation is preserved, not upgraded to success',async()=>{
 const {d,cohort}=await initial();
 const x=await resume(d,cohort,{invoke:async()=>({...await mock(),finishReason:'length'})});
 a.equal(x.finalStageSlots,10);a.equal(x.retryCalls,1);
 a.equal(x.calls.at(-1).status,'INCOMPLETE');
});
test('reject a fake prior dry-run or missing raw source',async()=>{
 const {d,cohort}=await initial();d.mode='DRY_RUN';
 await a.rejects(resume(d,cohort,{invoke:mock}),/FIRST_RUN_AND_COHORT_REQUIRED/);
});
