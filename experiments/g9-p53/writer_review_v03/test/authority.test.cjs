'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {reviewWithAuthority}=require('../review.cjs');
const base=path.resolve(__dirname,'../..');
const briefs=require('../../genre_authority_v01/fixtures/briefs.json');
const draft=fs.readFileSync(path.join(base,'writer_review_v02/examples/nar12_draft.txt'),'utf8');
const ref=require('../../writer_review_v02/examples/nar12_reference.json');
const brief=briefs.find(x=>x.id==='NAR12');
function invoke(policy,options={}){const b=structuredClone(brief);b.W.reference_policy=policy;return reviewWithAuthority({brief:b,draft,referenceInput:ref,...options});}
test('CONTEXTUAL high-level policy prevents lower-level authored flag override',()=>{
 const x=invoke('CONTEXTUAL');assert.equal(x.candidates.length,1);
 assert.equal(x.authority_gate.reference_proposal,'UNRESOLVED_WRITER_CONTEXT');
 assert(x.alerts.some(x=>x.type==='HIGH_LEVEL_REFERENCE_AUTHORITY_HOLD'));
});
test('KEEP high-level policy vetoes local CLARIFY',()=>{
 const x=invoke('KEEP');assert.equal(x.candidates.length,1);assert.equal(x.authority_gate.reference_proposal,'GLOBAL_WRITER_KEEP_VETO');
});
test('explicit matching CLARIFY only licenses a proposal, never a preference',()=>{
 const x=invoke('CLARIFY');assert.equal(x.candidates.length,2);
 assert.equal(x.candidates[1].authority_tier,'A1_LOCAL_CONTEXT_WITNESS_ONLY');
 assert(x.candidates.every(x=>x.automatic_preference_allowed===false));assert.equal(x.selected,null);
});
test('unconfirmed lower directive cannot override author target',()=>{
 const x=invoke('CLARIFY',{referenceInput:{...ref,directive:{...ref.directive,authorConfirmed:false}}});
 assert.equal(x.candidates.length,1);assert.equal(x.authority_gate.reference_proposal,'WRITER_CLARIFY_NOT_CONFIRMED');
});
test('opposed preserve ambiguity directive must not create an edit',()=>{
 const x=invoke('CLARIFY',{referenceInput:{...ref,directive:{...ref.directive,objective:'PRESERVE_AMBIGUITY'}}});
 assert.equal(x.candidates.length,1);assert.equal(x.authority_gate.reference_proposal,'CONFLICTING_WRITER_OBJECTIVE');
});
test('model self attestation cannot become independent human A2/A3 evidence',()=>{
 const x=invoke('KEEP',{referenceInput:null,modelCandidates:[{id:'MODEL_ONE',text:'다른 문장입니다.',verifiedByHuman:true,preferred:true}]});
 assert.equal(x.candidates.length,2);assert.equal(x.candidates[1].authority_tier,'A0_UNVERIFIED_MODEL_PROPOSAL');
 assert.equal(x.candidates[1].human_preference,'NOT_OBSERVED');assert.equal(x.authority_gate.actual_direct_human_action,'NOT_VERIFIED');
});
test('selection remains caller declaration not independently confirmed identity',()=>{
 const x=invoke('CLARIFY',{selection:{id:'KRC_EXPLICIT_REFERENCE',acknowledge:'EXPLICIT_AUTHOR_CHOICE'}});
 assert.equal(x.selected.actual_human_authority,'NOT_AUTHENTICATED');assert.equal(x.selected.automatic_edit,false);
});
test('no six-brief model proposal receives human-preference authority',()=>{
 for(const b of briefs){const x=reviewWithAuthority({brief:b,draft:'한국어 초고입니다.',modelCandidates:[{id:'MODEL_A',text:'대안 문장입니다.'}]});
 assert(x.candidates.every(c=>c.human_preference==='NOT_OBSERVED'));assert.equal(x.independent_writer_quality,'NOT_MEASURED');}
});
