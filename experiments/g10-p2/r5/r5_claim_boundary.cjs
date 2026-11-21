"use strict";
/** Small evidence-authority firewall for R5 reporting.
 * This module deliberately cannot certify a person from a JSON string.
 * Human independence and adjudication require separate external checks.
 */
const TYPES=new Set(["FINITE_FIXTURE","MODEL_SELF_AUDIT","AUTHOR_REVIEW","SOURCE_AUDIT_CLAIM",
                     "READER_RATING_CLAIM","NATIVE_MODEL_OUTPUT","MECHANICAL_EDIT"]);
function classifyEvidence(row){
 if(!row||typeof row!=="object"||!TYPES.has(row.kind))throw Error("UNKNOWN_EVIDENCE_KIND");
 if(typeof row.source_work_id!=="string"||!row.source_work_id.trim())throw Error("MISSING_SOURCE_WORK");
 if(row.kind==="SOURCE_AUDIT_CLAIM"||row.kind==="READER_RATING_CLAIM"){
  // An observed response could be genuinely human, but no untrusted
  // field supplied by a caller cryptographically establishes independence.
  return {kind:row.kind,source_work_id:row.source_work_id,
   automaticQualityAuthority:false,disposition:"EXTERNAL_ATTESTATION_REQUIRED"};
 }
 return {kind:row.kind,source_work_id:row.source_work_id,
  automaticQualityAuthority:false,disposition:"DEVELOPMENT_OR_MECHANICAL_ONLY"};
}
function qualityClaimGate(rows){
 if(!Array.isArray(rows))throw Error("EVIDENCE_NOT_ARRAY");
 const classified=rows.map(classifyEvidence);
 const counts=Object.fromEntries([...TYPES].map(k=>[k,classified.filter(x=>x.kind===k).length]));
 const independentReaderClaimCount=counts.READER_RATING_CLAIM,
       independentSourceClaimCount=counts.SOURCE_AUDIT_CLAIM;
 // Evidence presented through this interface has NOT been independently
 // corroborated, even if "human": true, "verified": true or a UUID exists.
 return {schema:"ksgt.r5.quality-authority-boundary.v1",counts,
  records:classified.length,independentReaderClaims:independentReaderClaimCount,
  independentSourceClaims:independentSourceClaimCount,
  externallyVerifiedIndependentReaders:0,externallyVerifiedIndependentSourceAudits:0,
  completedProseQualityAdvantage:"UNESTABLISHED",
  claimAdmissible:false,
  reasons:["NO_EXTERNAL_IDENTITY_ATTESTATION","NO_INDEPENDENT_SOURCE_ADJUDICATION",
    "NO_HUMAN_PREFERENCE_ESTIMATE","NO_COMPUTE_MATCHED_CAUSAL_ESTIMATE"]};
}
function mechanicalTargetReport({oldText,newText,target}){
 if(typeof oldText!=="string"||typeof newText!=="string"||
    typeof target!=="string"||!target.length)throw Error("INVALID_TARGET_REPORT");
 const before=oldText.includes(target),after=newText.includes(target);
 return {targetExistsInOriginal:before,targetStillPresent:after,
  targetRemoved:before&&!after,wholeDocumentSourceFaithfulness:"UNASSESSED",
  readerUsability:"UNASSESSED",semanticRepairEstablished:false};
}
module.exports={classifyEvidence,qualityClaimGate,mechanicalTargetReport};
