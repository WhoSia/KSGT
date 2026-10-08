'use strict';
const writer=require('../../krc_v07/intent_writer.cjs');
function portfolio(input){
 const result=writer.decide(input);
 const original={id:'IDENTITY',text:input.text,kind:'KEEP',evidence:'ORIGINAL'};
 if(result.status==='EDIT')return {status:'PLURAL_CANDIDATES',candidates:[original,{id:'OVERT_GROUP',text:result.text,kind:'SOURCE_LICENSED_REWRITE',evidence:result.evidence}],preference:'UNADJUDICATED',source_decision:result.reason};
 return {status:result.status==='ABSTAIN'?'INSUFFICIENT_EVIDENCE':'KEEP_ONLY',candidates:[original],preference:'UNADJUDICATED',source_decision:result.reason};
}
module.exports={portfolio};
