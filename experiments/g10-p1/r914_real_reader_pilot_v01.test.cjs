'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const p=require('./r914_real_reader_pilot_v01.cjs');
const cohort=JSON.parse(fs.readFileSync('experiments/g10-p1/fixtures/challenge_cohort_v01.json','utf8'));
test('three source works and fifteen assignments',()=>assert.equal(p.validate(cohort).plannedCompletions,15));
test('different arms are permutation of five policies',()=>assert.deepEqual(new Set(p.shuffle(p.ARMS,'fixed')),new Set(p.ARMS)));
test('randomized order reproducible from seed',()=>assert.deepEqual(p.shuffle(p.ARMS,'fixed'),p.shuffle(p.ARMS,'fixed')));
test('dry-run actually uses no provider',async()=>{const x=await p.execute({cohort,dryRun:true,invoke:()=>{throw Error('CALLED');}});assert.equal(x.actualCalls,0);assert.equal(x.rows.length,15);assert.equal(x.rows.filter(r=>r.status==='NOT_EXECUTED').length,15);});
test('injected mock can exercise all 15 rows without remote calls',async()=>{
 let calls=0;
 const x=await p.execute({cohort,invoke:async()=>{calls++;return{text:'실험용 모의 문장입니다.',usage:{prompt_tokens:11,completion_tokens:7,total_tokens:18},finishReason:'stop',latencyMs:1,responseModel:p.MODEL};}});
 assert.equal(calls,15);assert.equal(x.rows.filter(r=>r.status==='GENERATED').length,15);
 const safe=p.summary(x);assert.equal(safe.generated,15);assert.equal(safe.rows.every(r=>!('text' in r)),true);
 assert.equal(new Set(x.rows.map(r=>r.workId)).size,3);
});
test('errors are preserved and not confused with generated passages',async()=>{
 const x=await p.execute({cohort,invoke:async()=>{throw Error('PROVIDER_HTTP_429');}});
 assert.equal(x.rows.filter(r=>r.status==='FAILED').length,15);
 assert.equal(p.summary(x).failed,15);assert.equal(x.readerRatings,0);
});
test('model-finished-by-length is not counted as success',async()=>{
 const x=await p.execute({cohort,invoke:async()=>({text:'문장',usage:{prompt_tokens:2,completion_tokens:2,total_tokens:4},finishReason:'length'})});
 assert.equal(x.rows.filter(r=>r.status==='INCOMPLETE').length,15);assert.equal(p.summary(x).incomplete,15);
});
