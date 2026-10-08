'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {preflight,prompt,run,classify}=require('./run.cjs');
const old=require('../run_baseline_gate.cjs');
const briefs=require('../source_briefs.json').briefs;
test('14B capacity court frozen before any model output',()=>{assert(preflight());});
test('8B and 14B baseline prompts are byte-identical for exposed controls',()=>{
 for(const id of ['SCI01','NAR02']){
  const b=briefs.find(x=>x.id===id);
  assert.deepEqual(prompt(id).messages,old.request(b).messages);
  assert.deepEqual(prompt(id).seed,old.request(b).seed);
 }});
test('only four B outputs with two separately labelled cohorts',async()=>{
 const requests=[];const mocked=async (_url,opts)=>{
 requests.push(JSON.parse(opts.body));return {ok:true,json:async()=>({choices:[{message:{content:'첫 문단입니다. 문장 두 개가 이어집니다.\n\n둘째 문단입니다. 다르게 정리합니다.'}}],usage:{completion_tokens:25}})};};
 const out=await run(mocked,'http://mock');
 assert.equal(out.completed,4);assert.equal(out.writer_superiority,'NOT_ESTABLISHED');
 assert.deepEqual(out.rows.map(r=>r.cohort),['PRIMARY_UNEXPOSED_DEV','PRIMARY_UNEXPOSED_DEV','EXPOSED_8B_CONTROL','EXPOSED_8B_CONTROL']);
 assert(out.rows.every(r=>r.arm==='B'));
 assert(requests.every(r=>r.messages[1].content.includes('/no_think')));
});
test('format flags are not promoted to naturalness or human ratings',()=>{
 const x=classify('한 문단만 있음');assert(x.flags.includes('PARAGRAPH_COUNT_NOT_2'));assert.equal(x.reader_naturalness,'NOT_MEASURED');});
