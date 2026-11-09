'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const h=require('./r922_paragraph_state_v01.cjs'),old=require('./r921_boundary_realizer_v01.cjs');
const tasks=JSON.parse(fs.readFileSync('experiments/g10-p1/fixtures/r920_author_surface_microcohort_v01.json','utf8')).tasks;
const books=JSON.parse(fs.readFileSync('experiments/g10-p1/fixtures/r922_paragraph_context_rules_v01.json','utf8')).rulebooks;
const get=(w)=>{const t=tasks.find(x=>x.sourceWork===w),b=books.find(x=>x.sourceWork===w);return {t,b}};
test('three original works 54 actual composition slots from 3x3x2 design',()=>{
 const s=h.slate(tasks,books);a.equal(s.attemptedCompositions,54);a.equal(s.records.length,3);
});
test('BASE mode EXACTLY equals R9.21 boundary-adapted result for every condition',()=>{
 for(let i=0;i<tasks.length;i++){
  for(const o of ['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY'])
   for(const style of ['NEUTRAL','READER_DIRECT','RHYTHM_VARIED']){
    const v=h.realize(tasks[i],books[i],{orderMethod:o,surfaceStyle:style,mode:'BASE'});
    const earlier=old.realize(tasks[i],{orderMethod:o,surfaceStyle:style,mode:'BOUNDARY_ADAPTED'});
    a.equal(v.text,earlier.text);a.deepEqual(v.order,earlier.order);a.equal(v.changeCount,0);
   }
 }
});
test('new context rulebook is explicitly source-work and exact-facts bound',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');const drift=structuredClone(t);drift.facts[3]+=' 상상으로';
 a.throws(()=>h.realize(drift,b),/RULEBOOK_SOURCE_MISMATCH/);
});
test('rewrites keep fact ID trace, length of segments, and temporal plan unchanged',()=>{
 for(let i=0;i<tasks.length;i++){
  for(const o of ['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY'])
   for(const style of ['NEUTRAL','READER_DIRECT','RHYTHM_VARIED']){
    const v=h.realize(tasks[i],books[i],{orderMethod:o,surfaceStyle:style});
    const base=h.realize(tasks[i],books[i],{orderMethod:o,surfaceStyle:style,mode:'BASE'});
    a.deepEqual(v.order,base.order);a.equal(v.sourceSha256,base.sourceSha256);
    a.deepEqual(v.segments.map(s=>s.factId),base.segments.map(s=>s.factId));
    for(let k=0;k<v.segments.length;k++)
     if(!v.segments[k].paragraphAdapted)a.equal(v.segments[k].selectedSentence,base.segments[k].selectedSentence);
   }
 }
});
test('Science: repeated seventh-day cue removed ONLY when exactly licensed by previous fact text',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');
 const candidates=['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY'].map(orderMethod=>
  h.realize(t,b,{orderMethod,surfaceStyle:'RHYTHM_VARIED'}));
 const chosen=candidates.find(x=>x.changeCount>0);
 a.ok(chosen,'an actual temporally valid order should match a rule');
 const prev=chosen.segments.findIndex(s=>s.paragraphAdapted);
 a.ok(prev>0);
 a.match(chosen.segments[prev-1].selectedSentence,/7일째/u);
 a.doesNotMatch(chosen.segments[prev].selectedSentence,/7일째/u);
 a.match(chosen.segments[prev].selectedSentence,/조도와 토양 수분/u);
});
test('a valid but differently ordered science plan does not get an unwarranted science rewrite',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');
 const x=h.slate([t],[b]).records[0].candidates.filter(v=>v.surfaceStyle==='RHYTHM_VARIED'&&v.mode==='CONTEXT_WINDOW');
 a.ok(x.some(v=>v.changeCount===0));
});
test('rulebook with duplicated matching conditions must abort rather than choose by file order',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');
 const dup=structuredClone(b);dup.rules.push({...dup.rules[0],replacement:'그 차이는 확정할 수 없다.'});
 const v=['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY'];
 a.ok(v.some(o=>{try{h.realize(t,dup,{orderMethod:o,surfaceStyle:'RHYTHM_VARIED'});return false}catch(e){return /AMBIGUOUS_PARAGRAPH_RULES/.test(e.message)}}));
});
test('corrupted source-text criterion cannot invoke a guessed rewrite',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');
 const bad=structuredClone(b);bad.rules[0].previousTextIncludes='존재하지 않는 표현';
 for(const o of ['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY'])
  a.equal(h.realize(t,bad,{orderMethod:o,surfaceStyle:'RHYTHM_VARIED'}).changeCount,0);
});
test('invalid unapproved and multiline replacement refused',()=>{
 const {t,b}=get('AUTHOR_R920_COMMUNITY_NOTICE_01');
 const x=structuredClone(b);x.rules[0].authorConfirmed=false;
 a.throws(()=>h.realize(t,x),/INVALID_AUTHOR_CONTEXT_RULE/);
 const y=structuredClone(b);y.rules[0].replacement='문장이다.\n다음 줄';
 a.throws(()=>h.realize(t,y),/INVALID_AUTHOR_CONTEXT_RULE/);
});
test('unrecognized paragraph mode rejected',()=>{
 const {t,b}=get('AUTHOR_R920_LIBRARY_LIGHT_01');
 a.throws(()=>h.realize(t,b,{mode:'MAGIC'}),/UNKNOWN_PARAGRAPH_MODE/);
});
test('source-independent semantically identical-looking text is not certified',()=>{
 const x=h.slate(tasks,books);for(const r of x.records)for(const c of r.candidates){
  a.equal(c.semanticFidelity,'NOT_VERIFIED');a.equal(c.readerQuality,'NOT_MEASURED');
  a.equal(c.modelCalls,0);a.equal(c.trainingUpdates,0);
 }
});
test('safe receipt excludes all author-written Korean passages',()=>{
 const s=h.safeReceipt(h.slate(tasks,books)),v=JSON.stringify(s);
 a.equal(s.rawProseIncluded,false);a.equal(s.attemptedCompositions,54);
 for(const b of books)for(const r of b.rules)a.equal(v.includes(r.replacement),false);
});
test('source fact mutability is not hidden by same sourceWork name',()=>{
 const {t,b}=get('AUTHOR_R920_MUSEUM_SCENE_01');
 const q=structuredClone(t);q.facts[0]='다른 활동을 했다.';
 a.throws(()=>h.realize(q,b),/RULEBOOK_SOURCE_MISMATCH/);
});
test('all 3 genre rulebooks exercise at least one real match',()=>{
 const x=h.slate(tasks,books);
 a.ok(x.records.every(r=>r.appliedParagraphChanges>0),x.records.map(r=>r.appliedParagraphChanges).join('/'));
});
