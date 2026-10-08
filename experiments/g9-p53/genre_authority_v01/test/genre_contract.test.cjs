'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {compile,packet,shared}=require('../src/genre_contract.cjs');
const briefs=require('../fixtures/briefs.json');
const portfolio=require('../src/partitive_portfolio.cjs').portfolio;
const change=(obj,fn)=>{const x=structuredClone(obj);fn(x);return x;};
test('six independent development documents yield exactly eighteen inputs',()=>{let x=packet(briefs);assert.equal(x.n_briefs,6);assert.equal(x.n_prompts,18);assert.equal(new Set(x.entries.map(e=>e.id+'|'+e.arm)).size,18);});
test('each arm keeps identical F/E/L/W source and license digest',()=>{let x=packet(briefs);for(const b of briefs){const v=x.entries.filter(x=>x.id===b.id);assert.equal(new Set(v.map(x=>x.common_sha256)).size,1);assert.equal(new Set(v.map(x=>x.creative_mode)).size,1);assert.equal(new Set(v.map(x=>x.source_ids.join('|'))).size,1);}});
test('plain plan and typed KSGT plan have identical semantics manifest',()=>{let x=packet(briefs);for(const b of briefs){const v=x.entries.filter(x=>x.id===b.id);assert.equal(new Set(v.map(x=>x.plan_sha256)).size,1);assert.notEqual(v[1].prompt,v[2].prompt);assert(v[1].prompt.includes('보통말'));assert(v[2].prompt.includes('KSGT 구조화'));}});
test('B receives the same author permissions without the additional plan',()=>{for(let b of briefs){const x=packet([b]).entries;const c=compile(b);assert(x[0].prompt===shared(c));assert(x[1].prompt.startsWith(x[0].prompt));assert(x[2].prompt.startsWith(x[0].prompt));}});
test('facts cannot vanish from or duplicate inside the plan',()=>{let b=briefs[0];for(let corrupt of [x=>x.plan.sections[1].facts.pop(),x=>x.plan.sections[1].facts.push('F1'),x=>x.plan.sections[1].facts.push('MISSING')])assert.throws(()=>compile(change(b,corrupt)),/FACT_PLAN/);});
test('duplicate factual identity rejected',()=>{assert.throws(()=>compile(change(briefs[0],x=>x.F[1].id=x.F[0].id)),/PROTECTED/);});
test('genre-incompatible creative permission rejected',()=>{assert.throws(()=>compile(change(briefs[0],x=>x.L.mode='SCENE_TEXTURE')),/CREATIVE/);assert.throws(()=>compile(change(briefs[2],x=>{x.L.mode='NONE';})),/NONE_MODE/);});
test('unknown writer authority rejected',()=>{assert.throws(()=>compile(change(briefs[0],x=>x.W.declared=false)),/WRITER_OBJECTIVE/);});
test('marked science hypothesis cannot be silently invented',()=>{assert.throws(()=>compile(change(briefs[0],x=>x.E.hypotheses=[])),/LICENSED_HYPOTHESIS/);});
test('unknown source ID in plan rejected',()=>{assert.throws(()=>compile(change(briefs[0],x=>x.plan.sections[1].facts[0]='Z9')),/FACT_PLAN/);});
test('unknown prompt arm rejected',()=>{const {planText}=require('../src/genre_contract.cjs');assert.throws(()=>planText(compile(briefs[0]),'X'),/UNKNOWN_ARM/);});
test('partitive generator keeps original plus evidence-licensed alternate instead of one-best',()=>{
 const input={text:'빨간 컵 두 개를 씻었다. 파란 컵 두 개도 씻었다. 그중 한 컵을 옮겼다.',groups:[{id:'R',kind:'CUP',size:2,accessible:true,quote:'빨간 컵 두 개'},{id:'B',kind:'CUP',size:2,accessible:true,quote:'파란 컵 두 개'}],query:{anaphor:'그중 한 컵',kind:'CUP',count:1,targetGroupId:'B'},directive:{authorConfirmed:true,objective:'CLARIFY'}};
 const r=portfolio(input);assert.equal(r.status,'PLURAL_CANDIDATES');assert.equal(r.candidates.length,2);assert.equal(r.candidates[0].kind,'KEEP');assert(r.candidates[1].text.includes('파란 컵 두 개 중 한 컵'));assert.equal(r.preference,'UNADJUDICATED');
});
test('writer ambiguity retention keeps only original',()=>{
 const input={text:'빨간 컵 두 개를 씻었다. 파란 컵 두 개도 씻었다. 그중 한 컵을 옮겼다.',groups:[{id:'R',kind:'CUP',size:2,accessible:true,quote:'빨간 컵 두 개'},{id:'B',kind:'CUP',size:2,accessible:true,quote:'파란 컵 두 개'}],query:{anaphor:'그중 한 컵',kind:'CUP',count:1,targetGroupId:'B'},directive:{authorConfirmed:true,objective:'PRESERVE_AMBIGUITY'}};
 const r=portfolio(input);assert.equal(r.status,'KEEP_ONLY');assert.equal(r.candidates.length,1);});
test('missing source quote cannot produce invented overt reference',()=>{const r=portfolio({text:'그중 한 컵을 옮겼다.',groups:[],query:{anaphor:'그중 한 컵',kind:'CUP',count:1,targetGroupId:'B'},directive:{authorConfirmed:true,objective:'CLARIFY'}});assert.equal(r.status,'INSUFFICIENT_EVIDENCE');assert.equal(r.candidates.length,1);});
