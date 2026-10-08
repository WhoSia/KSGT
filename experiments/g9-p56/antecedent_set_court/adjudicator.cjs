'use strict';
const crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const str=x=>typeof x==='string'&&x.length>0;
const pos=n=>Number.isSafeInteger(n)&&n>=1;
const S=['scope_key','block_key','attachment_key'];
function adjudicate({target,sources,groups,writer_policy='CONTEXTUAL',independent_labels=[]}={}){
 if(!target||!str(target.text)||!str(target.anaphor)||!target.text.includes(target.anaphor)||!pos(target.turn)||!str(target.unit)||!pos(target.selected_count)||S.some(k=>!str(target[k]))||!Array.isArray(sources)||sources.some(x=>!x||!str(x.id)||!str(x.text)||!pos(x.turn)||S.some(k=>!str(x[k])))||!Array.isArray(groups)||groups.some(x=>!x||!str(x.id)||!str(x.quote)||!str(x.source_id)||!str(x.unit)||!pos(x.cardinality))||!['KEEP','CONTEXTUAL','CLARIFY'].includes(writer_policy)||!Array.isArray(independent_labels))throw Error('INVALID_TYPED_INPUT');
 if(new Set(sources.map(x=>x.id)).size!==sources.length||new Set(groups.map(x=>x.id)).size!==groups.length)throw Error('DUPLICATE_ID');
 const lookup=new Map(sources.map(s=>[s.id,s])),audits=[],candidate_ids=[];
 for(const g of groups){let s=lookup.get(g.source_id),reasons=[];
  if(!s)reasons.push('SOURCE_NOT_IN_FRAME');
  else{if(s.turn>=target.turn)reasons.push('NOT_PRECEDING');
   for(const k of S)if(s[k]!==target[k])reasons.push('DECLARED_'+k.toUpperCase()+'_MISMATCH');
   let n=s.text.split(g.quote).length-1;if(n!==1)reasons.push(n===0?'QUOTE_ABSENT':'QUOTE_NOT_UNIQUE_IN_ROW');
  }
  if(g.unit!==target.unit)reasons.push('COUNTER_MISMATCH_NO_BRIDGE');
  if(g.cardinality<=target.selected_count)reasons.push('NOT_STRICT_SUBSET');
  const a={id:g.id,source_id:g.source_id,source_quote_hash:hash(g.quote),eligible_in_submitted_frame:reasons.length===0,reasons};
  audits.push(a);if(a.eligible_in_submitted_frame)candidate_ids.push(g.id);
 }
 const disposition=writer_policy==='KEEP'?'KEEP_ONLY':candidate_ids.length===0?'ABSTAIN_NO_SOURCE_WITNESS':candidate_ids.length>1?'ABSTAIN_MULTIPLE_WITNESSED_HYPOTHESES':writer_policy==='CONTEXTUAL'?'REVIEW_UNRESOLVED_WRITER_INTENT':'REVIEW_SINGLE_SUBMITTED_HYPOTHESIS_NOT_GOLD';
 return {schema:'ksgt.g9p56.antecedent-set-court.v1',frame:{target_hash:hash(target.text),source_rows:sources.length,submitted_group_hypotheses:groups.length},candidate_ids,excluded_hypotheses:audits.filter(a=>!a.eligible_in_submitted_frame),source_witnesses:audits.filter(a=>a.eligible_in_submitted_frame),ambiguity:{multiple_in_submitted_frame:candidate_ids.length>1,unique_in_submitted_frame_only:candidate_ids.length===1,frame_exhaustiveness_unverified:true,other_possible_referents_unexcluded:true,forced_commitment_risk:candidate_ids.length>1||writer_policy!=='CLARIFY'},writer_policy,disposition,original_preserved:true,automatic_rewrite:false,probabilities:null,confidence_label:'NOT_CALIBRATED',calibration:{status:'UNIDENTIFIABLE_WITHOUT_INDEPENDENT_ANTECEDENT_GOLD',submitted_label_claims_ignored:independent_labels.length,verified_reference_gold:0,eligible_for_population_accuracy_claim:false,minimum_future_contract:'Rights-cleared source contexts, independent group adjudication, provenance, disputes, negative controls, source-disjoint split'},evidence_ceiling:'A1_EXACT_SOURCE_QUOTE_AND_DECLARED_LOCAL_SCOPE_ONLY_NOT_TRUE_COREFERENCE'};
}
module.exports={adjudicate};
