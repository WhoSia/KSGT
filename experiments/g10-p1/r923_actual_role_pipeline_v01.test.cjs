'use strict';
const test=require('node:test'),a=require('node:assert/strict'),m=require('./r923_actual_role_pipeline_v01.cjs');
const source={sourceWork:'DEV_1',genre:'public_notice',audience:'학생',purpose:'행사 안내',facts:['실습은 금요일이다.'],uncertainties:['준비물은 미정이다.']};
const cohort={schema:'ksgt.g10.p1.global-dev-cohort.v01',tasks:[source,{...source,sourceWork:'DEV_2'},{...source,sourceWork:'DEV_3'}]};
test('all stages see identical authored source packet',()=>{
 for(const stage of m.STAGES){const x=m.messages(source,stage,{draft:'실제 초안',diagnosis:'미확정 비평'});
  a.deepEqual(JSON.parse(x[1].content).source,m.packet(source));}
});
test('generic and contextual revision use the EXACT same text of initial draft',()=>{
 const d=m.messages(source,'GENERIC_REVISION',{draft:'동일한 원문'});
 const c=m.messages(source,'CONTEXT_REVISION',{draft:'동일한 원문',diagnosis:'검토'});
 a.equal(JSON.parse(d[1].content).exactSharedDraft,JSON.parse(c[1].content).exactSharedDraft);
});
test('dependency-less diagnostic rewrite never fabricates a draft',()=>{
 a.throws(()=>m.messages(source,'GENERIC_REVISION'),/EXACT_SHARED_DRAFT_REQUIRED/);
 a.throws(()=>m.messages(source,'CONTEXT_REVISION',{draft:'글'}),/DIAGNOSIS_REQUIRED/);
});
test('unknown stages rejected',()=>a.throws(()=>m.messages(source,'PREFERENCE_GOLD',{draft:'글'}),/UNKNOWN_STAGE/));
test('dry-run requires no real provider and creates no simulated completions',async()=>{
 const d=await m.run(cohort,{dryRun:true,invoke:async()=>{throw Error('BAD')}});a.equal(d.newModelCalls,0);
 a.equal(d.calls.filter(c=>c.status==='NOT_EXECUTED').length,3);
 a.equal(d.calls.filter(c=>c.status==='SKIPPED_DEPENDENCY').length,9);
});
test('twelve mocked generation calls make nine model-text slots plus three critiques; no human gold',async()=>{
 let calls=0;const d=await m.run(cohort,{invoke:async()=>{calls++;return {text:'모의 출력 '+calls+'.',finishReason:'stop',
 usage:{prompt_tokens:60,completion_tokens:20,total_tokens:80},responseModel:'mock',latencyMs:1}}});
 a.equal(calls,12);a.equal(d.calls.length,12);a.equal(d.calls.filter(x=>x.status==='GENERATED').length,12);
 a.equal(d.readerQualityRatings,0);a.equal(d.trainingUpdates,0);a.equal(d.records.length,3);
 a.ok(m.summary(d).works.every(w=>w.sameDraftForBothEditors));a.equal(m.summary(d).rawTextIncluded,false);
});
test('failed draft skips its dependent editing calls instead of inventing evidence',async()=>{
 const d=await m.run(cohort,{invoke:async()=>{throw Error('SIMULATED_HTTP')}});a.equal(d.calls.filter(x=>x.status==='FAILED').length,3);
 a.equal(d.calls.filter(x=>x.status==='SKIPPED_DEPENDENCY').length,9);
});
test('non-stop truncations are retained as INCOMPLETE and not used as the shared draft',async()=>{
 const d=await m.run(cohort,{invoke:async()=>({text:'글.',finishReason:'length',usage:{total_tokens:70}})});
 a.equal(d.calls.filter(x=>x.status==='INCOMPLETE').length,3);
 a.equal(d.calls.filter(x=>x.status==='SKIPPED_DEPENDENCY').length,9);
});
test('safe summary cannot expose raw model prose or critic text',async()=>{
 const d=await m.run(cohort,{invoke:async()=>({text:'비공개 교정 내용입니다.',finishReason:'stop',usage:{total_tokens:70}})});
 a.equal(JSON.stringify(m.summary(d)).includes('비공개 교정 내용입니다.'),false);
});
