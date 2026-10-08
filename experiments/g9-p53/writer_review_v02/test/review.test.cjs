'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {review,minimalChange}=require('../review.cjs');
const briefs=require('../../genre_authority_v01/fixtures/briefs.json');
const folder=path.join(__dirname,'../examples');
const draft=fs.readFileSync(path.join(folder,'nar12_draft.txt'),'utf8');
const ref=JSON.parse(fs.readFileSync(path.join(folder,'nar12_reference.json'),'utf8'));
const nar=briefs.find(b=>b.id==='NAR12');
test('actual Korean draft yields a protected original and a distinct source-witnessed alternative',()=>{
 const r=review({brief:nar,draft,referenceInput:ref});
 assert.equal(r.candidates.length,2);
 assert.equal(r.candidates[0].id,'KEEP_ORIGINAL');
 assert.equal(r.candidates[1].id,'KRC_EXPLICIT_REFERENCE');
 assert(r.candidates[1].text.includes('풍경 사진이 있는 엽서 두 장 중 한 장을'));
 assert.equal(r.candidates[1].semantic_status,'NOT_ADJUDICATED');
 assert.equal(r.selected,null);
 assert.equal(r.review_questions.facts.length,5);
 assert.equal(r.review_questions.unknowns.length,2);
 assert(r.alerts.some(x=>x.type==='OVERT_REFERENCE_MAY_BE_REPETITIVE'));
});
test('writer KEEP higher than local CLARIFY',()=>{
 const b=structuredClone(nar);b.W.reference_policy='KEEP';
 const r=review({brief:b,draft,referenceInput:ref});
 assert.equal(r.candidates.length,1);assert(r.alerts.some(x=>x.type==='WRITER_REFERENCE_KEEP'));
});
test('missing source draft correspondence prevents reference suggestion',()=>{
 const r=review({brief:nar,draft,referenceInput:{...ref,text:ref.text+'x'}});
 assert.equal(r.candidates.length,1);assert(r.alerts.some(x=>x.type==='REFERENCE_SPAN_SOURCE_MISMATCH'));
});
test('untrusted proposal label is never accepted as independent semantic truth',()=>{
 const text='풍경 사진이 있는 엽서를 한 장 접었다.';
 const r=review({brief:nar,draft,modelCandidates:[{id:'MODEL_1',text,verified_meaning:true,human_rating:5}]});
 assert.equal(r.candidates[1].proof_status,'UNVERIFIED_PROPOSAL');
 assert.equal(r.candidates[1].semantic_status,'NOT_ADJUDICATED');
 assert(r.alerts.some(x=>x.type==='MODEL_SELF_ATTESTATION_IGNORED'));
});
test('unselected candidates never replace original',()=>{
 const r=review({brief:nar,draft,referenceInput:ref});
 assert.equal(r.mode,'LOCAL_WRITER_INSPECTION_NO_AUTO_REWRITE');assert.equal(r.selected,null);
});
test('explicit caller choice returns separate text but not inferred author identity',()=>{
 const r=review({brief:nar,draft,referenceInput:ref,selection:{id:'KRC_EXPLICIT_REFERENCE',acknowledge:'EXPLICIT_AUTHOR_CHOICE'}});
 assert(r.selected.text.includes('풍경 사진이 있는 엽서 두 장 중 한 장을'));
 assert.equal(r.selected.selection_provenance,'CALLER_DECLARATION_NOT_AUTHENTICATED');
 assert.equal(r.selected.fact_correctness,'NOT_ADJUDICATED');
});
test('invalid or forged selection is rejected',()=>{
 for(const s of [{id:'KRC_EXPLICIT_REFERENCE',acknowledge:'YES'},{id:'NONEXISTENT',acknowledge:'EXPLICIT_AUTHOR_CHOICE'}])
   assert.throws(()=>review({brief:nar,draft,referenceInput:ref,selection:s}),/INVALID_EXPLICIT_SELECTION/);
});
test('identity is always available even when source is already natural enough',()=>{
 const b=briefs.find(x=>x.id==='SCI12');
 const r=review({brief:b,draft:'물기가 남아 있었다. 두께는 기록하지 않았다.'});
 assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].delta.removed_codepoints,0);
 assert.equal(r.review_questions.genre_risk,'UNMEASURED_CAUSALITY_OR_RATE');
});
test('minimal delta preserves multibyte Korean and emoji character boundaries',()=>{
 const d=minimalChange('나는 😃꽃을 보았다.','나는 😃나무를 보았다.');
 assert.equal(d.removed,'꽃을');assert.equal(d.inserted,'나무를');
});
test('candidate duplicate text cannot fake alternative plurality',()=>{
 const r=review({brief:nar,draft,modelCandidates:[{id:'MODEL_1',text:draft}]});assert.equal(r.candidates.length,1);
});
test('oversized and invalid inputs are rejected before echoing any raw text',()=>{
 assert.throws(()=>review({brief:nar,draft:'a'.repeat(100001)}),/INVALID_DRAFT/);
 assert.throws(()=>review({brief:nar,draft,modelCandidates:[{id:'BAD',text:'v'}]}),/INVALID_MODEL_ID/);
});
test('writer audit questions exist but never claim independent quality',()=>{
 for(const b of briefs){const r=review({brief:b,draft:'한국어 입력이다.'});
 assert.equal(r.independent_writer_quality,'NOT_MEASURED');
 assert(r.review_questions.facts.every(x=>x.verdict==='NOT_ADJUDICATED'));
 assert.equal(r.review_questions.true_writer_revision_burden,'NOT_COLLECTED');}
});
