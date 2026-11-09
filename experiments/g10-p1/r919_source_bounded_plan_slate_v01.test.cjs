'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),p=require('./r919_source_bounded_plan_slate_v01.cjs');
const c=JSON.parse(fs.readFileSync('experiments/g10-p1/fixtures/challenge_cohort_v01.json','utf8')).tasks;
const by=id=>c.find(x=>x.id===id);
test('3 authored dev tasks each have exactly 3 source-equal candidate plans',()=>{
 for(const t of c){const s=p.slate(t);a.equal(s.plans.length,3);a.equal(new Set(s.plans.map(x=>x.sourceSha256)).size,1);a.equal(s.actualGenerationCalls,0);}
});
test('science: time facts are ordered as sow -> sprout -> leaves',()=>{
 const x=p.select(by('SCI_SHUFFLED_02'),'TEMPORAL_STABLE').order;
 a.ok(x.indexOf(3)<x.indexOf(4));a.ok(x.indexOf(4)<x.indexOf(1));
});
test('scene: original time constraints override author fact array order',()=>{
 const x=p.select(by('NARR_REFERENTS_02'),'TEMPORAL_STABLE').order;
 a.ok(x.indexOf(2)<x.indexOf(1));a.ok(x.indexOf(1)<x.indexOf(5));a.ok(x.indexOf(5)<x.indexOf(4));
});
test('source ties are deterministic and stable',()=>{
 const t=by('NOTICE_TWO_EVENTS_02');a.deepEqual(p.select(t,'TEMPORAL_STABLE'),p.select(t,'TEMPORAL_STABLE'));
});
test('reader strategy uses only author-provided move tags',()=>{
 const t={...by('SCI_SHUFFLED_02'),relations:[]};const x=p.select(t,'READER_FUNCTION').order;
 a.equal(x[0],3);a.equal(x[1],6);
});
test('unknown and absent move tags do not authorize omission or new facts',()=>{
 const t={...by('SCI_SHUFFLED_02'),factAnnotations:undefined};const x=p.select(t,'READER_FUNCTION');
 a.equal(x.order.length,t.facts.length);a.deepEqual(new Set(x.order),new Set([1,2,3,4,5,6]));
});
test('content is never rewritten by ordering',()=>{
 for(const t of c){const x=p.slate(t);for(const v of x.plans){const q=p.candidatePrompt(t,v);
  const user=JSON.parse(q.messages[1].content);a.deepEqual(user.allOriginalFacts,t.facts);
  a.deepEqual(user.authorDeclaredRelations,t.relations);a.equal(q.sourceSha256,v.sourceSha256);
 }}
});
test('candidate messages have no free-standing source drift',()=>{
 const t=by('NARR_REFERENTS_02'),v=p.select(t,'READER_FUNCTION');
 const revised={...t,facts:t.facts.map((x,i)=>i===0?x+' 진짜':x)};
 a.throws(()=>p.candidatePrompt(revised,v),/PLAN_DRIFT/);
});
test('spoofed manual order is rejected',()=>{
 const t=by('SCI_SHUFFLED_02'),v={...p.select(t,'TEMPORAL_STABLE'),order:[1,2,3,4,5,6]};
 a.throws(()=>p.candidatePrompt(t,v),/PLAN_DRIFT/);
});
test('temporal cycles are detected and are not silently broken',()=>{
 const t={...by('SCI_SHUFFLED_02'),relations:[{from:1,to:2,type:'TEMPORAL_NEXT'},{from:2,to:1,type:'TEMPORAL_NEXT'}]};
 a.throws(()=>p.slate(t),/TEMPORAL_RELATION_CYCLE/);
});
test('self temporal edge is forbidden',()=>{
 const t={...by('SCI_SHUFFLED_02'),relations:[{from:1,to:1,type:'TEMPORAL_NEXT'}]};
 a.throws(()=>p.slate(t),/SELF_TEMPORAL_EDGE/);
});
test('duplicate identical temporal edge is deduplicated',()=>{
 const t={...by('SCI_SHUFFLED_02'),relations:[{from:1,to:2,type:'TEMPORAL_NEXT'},{from:1,to:2,type:'TEMPORAL_NEXT'}]};
 a.equal(p.select(t,'TEMPORAL_STABLE').temporalEdges.length,1);
});
test('non temporal relation cannot assert temporal precedence',()=>{
 const t={...by('SCI_SHUFFLED_02'),relations:[{from:6,to:3,type:'CONTRAST'}]};
 a.equal(p.select(t,'TEMPORAL_STABLE').temporalEdges.length,0);
});
test('fact annotation count mismatch rejected before generation',()=>{
 const t={...by('SCI_SHUFFLED_02'),factAnnotations:[{}]};a.throws(()=>p.slate(t),/ANNOTATIONS_MUST_ALIGN/);
});
test('exact text receipts are NOT quality scores',()=>{
 const x=p.compareCandidateTexts([{planMethod:'a',text:'하나'},{planMethod:'b',text:'하나'},{planMethod:'c',text:'둘'}]);
 a.equal(x.distinctExactTexts,2);a.equal(x.qualityJudge,'NONE');a.equal(x.fidelityJudge,'NONE');
});
test('empty generation cannot masquerade as completed text',()=>{
 a.throws(()=>p.compareCandidateTexts([{planMethod:'a',text:' '}]),/BAD_CANDIDATE/);
});
test('same input can legitimately produce the same ordering for multiple methods',()=>{
 const t={...by('NOTICE_TWO_EVENTS_02'),relations:[],factAnnotations:undefined};const v=p.slate(t);
 a.equal(v.distinctOrders,1);a.equal(v.qualityAdvantage,'NOT_EVALUATED');
});
