"use strict";
/* KSGT P60-P2 claim-unit contract, NOT automated Korean entailment gold.
   The public metadata intentionally stores hashes, not private original text. */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const doc=require('./claim_alignment_v04.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const SHA=/^[0-9a-f]{64}$/;
const sourcePath=path.join(__dirname,'../g9-p53/krc_v03/new_briefs.json');
const sourceBytes=fs.readFileSync(sourcePath);
const policyOrder=['NO_EDIT','MINIMAL_ATTRIBUTION','ORDINARY_SMOOTH','P59_DISCOURSE'];
const claimOrder=['F1','F2','F3','F4','F5','U1','U2','U3'];
const interpretations=new Set(['SUPPORTED','PARTIAL','NOT_MENTIONED','GUARDED','POTENTIAL_OVERSTATEMENT']);
const stamp={origin:'AUTHOR_ANNOTATION_NOT_INDEPENDENT_GOLD',admissibility:'HOLD_INCOMPLETE_INDEPENDENT_SEMANTIC_REVIEW'};
function frozenSourceAudit(packet=doc,raw=sourceBytes){
 if(packet.sourceBriefJsonSha256!==sha(raw))throw Error('FROZEN_SOURCE_SHA_MISMATCH');
 const parsed=JSON.parse(raw);
 const b=parsed.briefs.find(x=>x.id==='EX09');
 if(!b||b.facts.length!==5||b.uncertainties.length!==3)throw Error('SOURCE_CLAIM_CARDINALITY');
 if(!b.facts[0].includes('두 상자')||!b.facts[4].includes('측정하지 않았다'))throw Error('SOURCE_PROTECTED_FACT_CHANGED');
 const items=[...b.facts,...b.uncertainties];
 if(packet.sourceClaims.length!==8||packet.sourceClaims.some((x,i)=>x.claimId!==claimOrder[i]||x.contentSha256!==sha(items[i])||x.claimAuthority!=='P53_PREGEN_AUTHORED_SCENARIO_NOT_WORLD_OBSERVATION'))throw Error('CLAIM_WITNESS_MISMATCH');
 if(packet.writerIntent!=='DISTINGUISH_OBSERVED_SPROUT_COUNT_FROM_UNCERTAIN_CAUSE'||packet.licenseToInventFacts!=='NONE_UNDER_P53_GENERATION_PROMPT')throw Error('SOURCE_LICENSE_CHANGED');
 return b;
}
function policyAudit(packet=doc){
 if(packet.schema!=='ksgt.p60.p2.claim-alignment.v04'||packet.sourceWorkId!=='P53_BRIEF:EX09'||packet.sourceComponentId!=='P53_WORK:EX09'||packet.split!=='pilot_train'||packet.freshHoldout!==false||packet.historicallyExposed!==true)throw Error('SOURCE_WORK_IDENTITY');
 if(packet.measurementAuthority.independentKoreanReaderRatings!==0||packet.measurementAuthority.independentSemanticAcceptanceCount!==0||packet.measurementAuthority.validatedPolicySuperiority!==false)throw Error('UNWITNESSED_EVALUATION_PROMOTION');
 if(packet.policyRecords.length!==4||policyOrder.some((k,i)=>packet.policyRecords[i]?.policy!==k))throw Error('POLICY_SEQUENCE');
 const hashes=new Set();
 for(const [i,r] of packet.policyRecords.entries()){
  if(!SHA.test(r.paragraphSha256)||hashes.has(r.paragraphSha256))throw Error('POLICY_HASH_DUPLICATE_OR_INVALID');
  hashes.add(r.paragraphSha256);
  if(r.parentParagraphSha256!==packet.baseParagraphSha256||r.componentId!==packet.sourceComponentId||r.split!==packet.split)throw Error('POLICY_PARENT_OR_SPLIT_LEAK');
  if(r.policyOrigin!=='ASSISTANT_PROVISIONAL_EDIT_OF_ONE_P53_DRAFT')throw Error('FALSELY_INDEPENDENT_REVISION');
  if(r.axes.sourceAdmissibility!==stamp.admissibility||r.axes.collateralIntegrity!=='HOLD'||r.axes.nativeReaderPreference!=='NOT_OBSERVED'||r.axes.namedDefectRepair!==(i===0?'FAIL':'MECHANICAL_ONLY'))throw Error('UNSUPPORTED_AXIS_PASS');
  if(r.alignment.length!==8||claimOrder.some((id,j)=>r.alignment[j]?.claimId!==id))throw Error('MISSING_CLAIM_ALIGNMENT');
  if(!SHA.test(r.alignmentWitnessSha256))throw Error('INVALID_ALIGNMENT_COMMITMENT');
  for(const a of r.alignment){
   if(!interpretations.has(a.analystInterpretation)||a.judgmentAuthority!==stamp.origin||!Number.isSafeInteger(a.spanCount)||a.spanCount<0||a.spanCount>8)throw Error('FALSE_CLAIM_GOLD');
  }
  if((i===0)!==(r.mechanicalSignals.labelCount===4)||r.mechanicalSignals.targetSurfaceRepair!==(i===0?'FAIL':'MECHANICAL_PASS'))throw Error('TARGET_REPAIR_PROXY_INCONSISTENT');
 }
 if(packet.policyRecords[0].paragraphSha256!==packet.baseParagraphSha256)throw Error('NO_EDIT_NOT_IDENTITY');
 return {policies:4,alignedClaimCells:32,independentSourceWorks:1};
}
function targetedCanary(text){
 if(typeof text!=='string')throw Error('TEXT_REQUIRED');
 if(/세 상자라고 주장하는 것은 사실이 아니다/.test(text))return 'NEGATED_MENTION_MANUAL_HOLD';
 if(/세 상자에 .*심었다/.test(text))return 'EXPLICIT_COUNT_CONTRADICTION';
 if(/빛이 .*원인.*입증되었다/.test(text))return 'UNLICENSED_CAUSAL_CERTAINTY';
 if(/두 상자.*같은 양의 물/.test(text))return 'CONSISTENT_WITH_SELECTED_FACTS_NOT_ENTAILMENT';
 return 'NO_CLOSED_PATTERN_HOLD';
}
function main(){
 frozenSourceAudit();const p=policyAudit();
 const bad=[
 [()=>policyAudit({...doc,sourceWorkId:'P53_BRIEF:EX10'}),'SOURCE_WORK_IDENTITY'],
 [()=>policyAudit({...doc,measurementAuthority:{...doc.measurementAuthority,independentKoreanReaderRatings:1}}),'UNWITNESSED_EVALUATION_PROMOTION'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.slice(1)}),'POLICY_SEQUENCE'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.map((r,i)=>i?{...r,paragraphSha256:doc.policyRecords[0].paragraphSha256}:r)}),'POLICY_HASH_DUPLICATE_OR_INVALID'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.map((r,i)=>i?{...r,split:'pilot_dev'}:r)}),'POLICY_PARENT_OR_SPLIT_LEAK'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.map((r,i)=>i?{...r,axes:{...r.axes,nativeReaderPreference:'PREFERRED'}}:r)}),'UNSUPPORTED_AXIS_PASS'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.map((r,i)=>i?{...r,alignment:r.alignment.map((a,j)=>j?a:{...a,judgmentAuthority:'INDEPENDENT_HUMAN'})}:r)}),'FALSE_CLAIM_GOLD'],
 [()=>policyAudit({...doc,policyRecords:doc.policyRecords.map((r,i)=>i?{...r,alignment:r.alignment.slice(1)}:r)}),'MISSING_CLAIM_ALIGNMENT'],
 [()=>frozenSourceAudit({...doc,sourceBriefJsonSha256:'0'.repeat(64)}),'FROZEN_SOURCE_SHA_MISMATCH'],
 ];
 for(const [fn,error] of bad)assert.throws(fn,new RegExp(error));
 assert.equal(targetedCanary('세 상자에 씨앗을 심었다.'),'EXPLICIT_COUNT_CONTRADICTION');
 assert.equal(targetedCanary('세 상자라고 주장하는 것은 사실이 아니다.'),'NEGATED_MENTION_MANUAL_HOLD');
 assert.equal(targetedCanary('빛이 변화의 원인임이 입증되었다.'),'UNLICENSED_CAUSAL_CERTAINTY');
 assert.equal(targetedCanary('두 상자에 같은 양의 물을 주었다.'),'CONSISTENT_WITH_SELECTED_FACTS_NOT_ENTAILMENT');
 return {test:'PASS',stage:'G9-P60',phase:'P2-CLAIM_UNIT',...p,negativeControls:bad.length+4,originalClaimCount:8,epistemicRisks:'U2_POTENTIAL_OVERSTATEMENT_IN_NO_EDIT_AND_MINIMAL',semanticGold:0,humanPreference:0,remotePrivatePacketRequired:true};
}
if(require.main===module)console.log(JSON.stringify(main(),null,2));
module.exports={frozenSourceAudit,policyAudit,targetedCanary,main};
