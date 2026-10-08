'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {preflight,request,mechanical,run}=require('./run_baseline_gate.cjs');
const {packet,form}=require('./generate_packet.cjs');
const sources=require('./source_briefs.json');
test('sealed gate two B subjects and 18 future paired candidates',()=>{assert.equal(preflight(),true);const p=packet();assert.equal(p.prompts,18);assert.equal(new Set(p.items.map(i=>i.id+'|'+i.arm)).size,18);});
test('B prompt preserves five source facts and excludes typed K plan',()=>{
 for(const b of sources.briefs){const p=request(b).messages[1].content;
 assert(p.startsWith(form(b,'B')));for(const f of b.facts)assert(p.includes(f));
 assert(!p.includes('KSGT 유형화 계획'));assert(!p.includes('평범한 문단 계획'));}
});
test('mechanical checker flags think leak but never grades quality',()=>{
 const r=mechanical('<think>analysis</think>한 문단');assert(r.flags.includes('SCAFFOLD_OR_THINK_LEAK_REVIEW'));assert.equal(r.naturalness_verdict,'NOT_ADJUDICATED');
});
test('mock API only B and no false superiority',async()=>{
 const reqs=[];const mock=async(u,o)=>{reqs.push(JSON.parse(o.body));return {ok:true,json:async()=>({choices:[{message:{content:'첫 문단입니다. 실험 조건을 정리했다.\n\n둘째 문단입니다. 관찰한 범위 안에서만 기록했다.'}}],usage:{completion_tokens:24}})}};
 const r=await run(mock,'http://mock');assert.equal(r.completed,2);assert.equal(r.writer_superiority,'NOT_ESTABLISHED');assert(reqs.every(x=>x.messages[1].content.includes('/no_think')));
});
test('API failure is never upgraded',async()=>{
 const r=await run(async()=>({ok:false,status:503}),'http://mock');
 assert.equal(r.completed,0);assert(r.results.every(x=>x.status==='FAILED'));assert.equal(r.competent_korean,'PENDING_INDEPENDENT_MANUAL_REVIEW');
});