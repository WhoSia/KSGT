'use strict';
// G9-P53: author-intent authority guard above non-destructive v0.2.
// G8-S11: A0 source -> abstain; A1 context -> review, not auto-edit.
const {review}=require('../writer_review_v02/review.cjs');
const {compile}=require('../genre_authority_v01/src/genre_contract.cjs');
function reviewWithAuthority(input={}){
 const compiled=compile(input.brief),policy=compiled.common.W.reference_policy,ref=input.referenceInput??null;
 let admissible=ref,reason='NO_PARTITIVE_REQUEST';
 if(ref!==null){
  if(policy==='KEEP'){admissible=null;reason='GLOBAL_WRITER_KEEP_VETO';}
  else if(policy==='CONTEXTUAL'){admissible=null;reason='UNRESOLVED_WRITER_CONTEXT';}
  else if(policy==='CLARIFY'){
   if(ref?.directive?.objective!=='CLARIFY'){admissible=null;reason='CONFLICTING_WRITER_OBJECTIVE';}
   else if(ref?.directive?.authorConfirmed!==true){admissible=null;reason='WRITER_CLARIFY_NOT_CONFIRMED';}
   else reason='DECLARED_CLARIFY_ELIGIBLE_TO_PROPOSE_NOT_TO_PREFER';
  }
 }
 const original=review({...input,referenceInput:admissible});
 const candidates=original.candidates.map(c=>({...c,
  authority_tier:c.id==='KEEP_ORIGINAL'?'A0_PROTECTED_NO_OP':c.channel==='KRC_SOURCE_WITNESS'?'A1_LOCAL_CONTEXT_WITNESS_ONLY':'A0_UNVERIFIED_MODEL_PROPOSAL',
  human_preference:'NOT_OBSERVED',human_edit_provenance:'NOT_VERIFIED',
  externally_validated_semantics:false,automatic_preference_allowed:false
 }));
 const alerts=original.alerts.slice();
 if(ref!==null&&admissible===null)alerts.push({type:'HIGH_LEVEL_REFERENCE_AUTHORITY_HOLD',reason});
 return {...original,schema:'ksgt.g9p53.writer-review.authority.v0.3',candidates,alerts,
  authority_gate:{high_level_policy:policy,reference_proposal:reason,
   mode:'SOURCE_ONLY_ABSTAIN_FROM_INTERVENTION',
   actual_direct_human_action:'NOT_VERIFIED',
   same_context_human_comparison:'NOT_COLLECTED',
   observed_writer_edit_decision:'NOT_COLLECTED',
   permissible_action:'DISPLAY_CANDIDATES_WITHOUT_AUTOMATIC_RANKING',
   promotion_rule:'A2 needs independently recorded same-context human comparison; A3 needs independently recorded direct human action; model/caller claims supply neither.',
   scientific_status:'NO_HUMAN_WRITER_BENEFIT_AND_NO_AUTOMATED_SEMANTIC_JUDGE'},
  selected:original.selected&&{...original.selected,actual_human_authority:'NOT_AUTHENTICATED',automatic_edit:false}};
}
module.exports={reviewWithAuthority};
