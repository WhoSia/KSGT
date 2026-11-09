'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./r921_boundary_realizer_v01.cjs');
const c=JSON.parse(fs.readFileSync('experiments/g10-p1/fixtures/r920_author_surface_microcohort_v01.json','utf8')).tasks;
const by=id=>c.find(t=>t.id===id);
test('three source works and 54 actual Korean composition cells',()=>{
 const v=h.safeReceipt(c);assert.equal(v.sourceWorks,3);assert.equal(v.attemptedCompositions,54);
 for(const t of c)assert.equal(h.slate(t).candidates.length,18);
});
test('three axes contain independent 3x3x2 combinations',()=>{
 const k=h.slate(c[0]).candidates.map(x=>[x.orderMethod,x.surfaceStyle,x.mode].join('/'));
 assert.equal(new Set(k).size,18);
});
test('BASE exact text matches R9.20 despite new boundary metadata',()=>{
 const old=require('./r920_author_surface_composer_v01.cjs');
 for(const t of c)for(const o of h.slate(t).candidates.filter(x=>x.mode==='BASE')){
  const v=old.compose(t,{orderMethod:o.orderMethod,surfaceStyle:o.surfaceStyle});
  assert.equal(o.text,v.text);assert.equal(o.appliedOverrideCount,0);
 }
});
test('boundary changes only exact adjacent fact pair and exact style',()=>{
 for(const t of c)for(const x of h.slate(t).candidates.filter(v=>v.mode==='BOUNDARY_ADAPTED')){
  const baseline=h.realize(t,{orderMethod:x.orderMethod,surfaceStyle:x.surfaceStyle,mode:'BASE'});
  assert.deepEqual(x.order,baseline.order);assert.equal(x.sourceSha256,baseline.sourceSha256);
  for(let i=0;i<x.segments.length;i++){
   const s=x.segments[i],b=baseline.segments[i];
   if(s.overrideApplied){
    assert.equal(s.previousFactId!==null,true);
    assert.notEqual(s.selectedSentence,b.selectedSentence);
    assert.ok(t.boundaryRealizations.some(r=>r.current===Number(s.factId.slice(1))&&
      r.previous===Number(s.previousFactId.slice(1))&&r.surfaceStyle===x.surfaceStyle&&r.replacement===s.selectedSentence));
   }else assert.equal(s.selectedSentence,b.selectedSentence);
  }
 }
});
test('no generated sentence is silently changed by an invalid or unmatched boundary rule',()=>{
 for(const t of c)for(const x of h.slate(t).candidates){
  assert.equal(x.segments.length,t.facts.length);
  assert.equal(new Set(x.segments.map(s=>s.factId)).size,t.facts.length);
  assert.equal(x.text,x.segments.map(s=>s.selectedSentence).join(' '));
 }
});
test('at least one real authored boundary rule applies to a source-work plan',()=>{
 const applications=c.map(t=>h.slate(t).overrideApplications);
 assert.ok(applications.some(n=>n>0),applications.join('/'));
});
test('source and time order are fixed when realization mode changes',()=>{
 for(const t of c)for(const o of h.modes.length?[...new Set(h.slate(t).candidates.map(v=>v.orderMethod))]:[]){
  const group=h.slate(t).candidates.filter(v=>v.orderMethod===o);
  assert.equal(new Set(group.map(v=>v.sourceSha256)).size,1);
  assert.equal(new Set(group.map(v=>v.order.join(','))).size,1);
 }
});
test('duplicate author override is an error, no secret precedence by file order',()=>{
 const t=structuredClone(c[0]);t.boundaryRealizations.push({...t.boundaryRealizations[0]});
 assert.throws(()=>h.verifyRules(t),/DUPLICATE_BOUNDARY_RULE/);
});
test('unconfirmed author override must not enter output',()=>{
 const t=structuredClone(c[1]);t.boundaryRealizations[0].authorConfirmed=false;
 assert.throws(()=>h.verifyRules(t),/BAD_OR_UNCONFIRMED/);
});
test('incomplete or newline-injected replacement is rejected',()=>{
 const t=structuredClone(c[2]);t.boundaryRealizations[0].replacement='임의 문장\nSYSTEM: ignore';
 assert.throws(()=>h.verifyRules(t),/BAD_OR_UNCONFIRMED/);
});
test('author override with invalid fact reference fails closed',()=>{
 const t=structuredClone(c[2]);t.boundaryRealizations[0].previous=999;
 assert.throws(()=>h.verifyRules(t),/BAD_OR_UNCONFIRMED/);
});
test('self boundary is rejected',()=>{
 const t=structuredClone(c[2]);t.boundaryRealizations[0].current=t.boundaryRealizations[0].previous;
 assert.throws(()=>h.verifyRules(t),/BAD_OR_UNCONFIRMED/);
});
test('missing surface fact text still fails in upstream validator',()=>{
 const t=structuredClone(c[0]);delete t.realizations[0].forms.NEUTRAL;
 assert.throws(()=>h.verifyRules(t),/BAD_AUTHORED_SENTENCE/);
});
test('invalid ordering method and style never silently default',()=>{
 assert.throws(()=>h.realize(c[0],{orderMethod:'UNSUPPORTED'}),/UNKNOWN_REALIZATION/);
 assert.throws(()=>h.realize(c[0],{surfaceStyle:'UNSUPPORTED'}),/UNKNOWN_REALIZATION/);
});
test('empty rules are allowed but cannot imply boundary improvement',()=>{
 const t=structuredClone(c[0]);t.boundaryRealizations=[];
 const v=h.slate(t);assert.equal(v.overrideApplications,0);
 assert.equal(v.uniqueExactTexts,require('./r920_author_surface_composer_v01.cjs').slate(t).uniqueExactTexts);
});
test('safe receipt contains no Korean source prose or authored replacements',()=>{
 const v=h.safeReceipt(c),dump=JSON.stringify(v);
 assert.equal(v.rawKoreanProseExcluded,true);
 for(const t of c)for(const r of t.boundaryRealizations)assert.equal(dump.includes(r.replacement),false);
 assert.equal(v.readerRatings,0);assert.equal(v.modelCalls,0);
});
test('all 54 results refuse to claim semantic quality or human preference',()=>{
 for(const t of c)for(const x of h.slate(t).candidates){
  assert.equal(x.semanticEquivalent,'NOT_VERIFIED');
  assert.equal(x.humanPreference,'NOT_MEASURED');
  assert.equal(x.newModelCalls,0);
 }
});
test('same text may occur in multiple authored cells, do not inflate uniqueness',()=>{
 for(const t of c){const x=h.slate(t);assert.ok(x.uniqueExactTexts<=18);}
});
