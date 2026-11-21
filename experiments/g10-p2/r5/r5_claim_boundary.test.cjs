"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {classifyEvidence,qualityClaimGate,mechanicalTargetReport}=require("./r5_claim_boundary.cjs");
test("empty real-rating history is not a quality win",()=>{
 const g=qualityClaimGate([]);assert.equal(g.claimAdmissible,false);
 assert.equal(g.externallyVerifiedIndependentReaders,0);
 assert.equal(g.completedProseQualityAdvantage,"UNESTABLISHED");
});
test("model self-audit and developer flags never count as human",()=>{
 const g=qualityClaimGate([
  {kind:"MODEL_SELF_AUDIT",source_work_id:"NOTICE_CHEM",score:"CLEAR"},
  {kind:"AUTHOR_REVIEW",source_work_id:"NOTICE_CHEM",score:"UNLICENSED_PLACE"},
  {kind:"MECHANICAL_EDIT",source_work_id:"NOTICE_CHEM",status:"TARGET_REMOVED"}]);
 assert.equal(g.independentReaderClaims,0);
 assert.equal(g.claimAdmissible,false);
});
test("self-asserted human=verified is untrusted until external attestation",()=>{
 const g=qualityClaimGate([
  {kind:"READER_RATING_CLAIM",source_work_id:"w1",human:true,verified:true,choice:"A"},
  {kind:"SOURCE_AUDIT_CLAIM",source_work_id:"w1",human:true,verified:true,verdict:"PASS"}]);
 assert.equal(g.independentReaderClaims,1);
 assert.equal(g.independentSourceClaims,1);
 assert.equal(g.externallyVerifiedIndependentReaders,0);
 assert.equal(g.externallyVerifiedIndependentSourceAudits,0);
 assert.equal(g.claimAdmissible,false);
 assert.equal(classifyEvidence({kind:"READER_RATING_CLAIM",source_work_id:"w1"}).disposition,
   "EXTERNAL_ATTESTATION_REQUIRED");
});
test("replacing one invented location with a different invention remains unverified",()=>{
 const v=mechanicalTargetReport({
  oldText:"과학실에 제출하세요.",newText:"과학실 담당자에게 제출하세요.",target:"과학실에"});
 assert.equal(v.targetRemoved,true);
 assert.equal(v.semanticRepairEstablished,false);
 assert.equal(v.wholeDocumentSourceFaithfulness,"UNASSESSED");
});
test("no absent target credit and no phantom response kinds",()=>{
 const v=mechanicalTargetReport({oldText:"원천 사실.",newText:"원천 사실.",target:"없는 구절"});
 assert.equal(v.targetRemoved,false);
 assert.throws(()=>qualityClaimGate([{kind:"INDEPENDENT_HUMAN_GOLD",source_work_id:"w1"}]),
  /UNKNOWN_EVIDENCE_KIND/);
 assert.throws(()=>qualityClaimGate([{kind:"AUTHOR_REVIEW"}]),/MISSING_SOURCE_WORK/);
});
