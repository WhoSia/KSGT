"use strict";
/**
 * KSGT G9-P60 P1: provenance-aware Korean paragraph revision court.
 * Source-anchored P53 hashes; all actual human/semantic outcome data UNOBSERVED.
 * No external files downloaded, no judge, no corpus prose redistributed.
 */
const assert=require("node:assert/strict");
const {ledger,components,contrast}=require("./revision_evaluation_v01.cjs");
const edits=require("./provisional_edits_v01.json");
const SHA=/^[0-9a-f]{64}$/;
const verdicts=new Set(["PASS","FAIL","HOLD"]);
const evidenceLevels=new Set(["AUTHOR_TOY","MODEL_SELF","EXTERNAL_SOURCE","INDEPENDENT_KOREAN_READER"]);
function sourceLedger(){
 const base=ledger(),graph=components();
 const workBy=new Map(graph.items.map(x=>[x.componentId,x]));
 const baseBy=new Map(base.records.map(x=>[x.paragraphId,x]));
 const records=edits.candidates.map(e=>{
  const parent=base.records.find(p=>p.baseDraftId===e.baseDraftId&&p.baseParagraphSha256===e.baseParagraphSha256);
  if(!parent)throw Error("MISSING_BASE_PARAGRAPH");
  const work=workBy.get(parent.sourceComponentId);
  if(!work||work.split!==parent.split||e.inheritedSplit!==parent.split||
     e.componentId!==parent.sourceComponentId)throw Error("REVISION_SPLIT_ESCAPE");
  return {id:e.candidateId,kind:"ASSISTANT_PROVISIONAL_REVISION",
   sourceComponentId:parent.sourceComponentId,sourceWorkId:parent.sourceWorkId,
   sourceSplit:parent.split,freshHoldout:false,
   baseParagraphId:parent.paragraphId,baseParagraphSha256:parent.baseParagraphSha256,
   revisionParagraphSha256:e.revisionParagraphSha256,
   operator:e.editOperator,targetedDefect:e.targetedDefect,
   surfaceSourceLabelRemoved:e.attributionRemoved,
   countMutatedRelativeToDraft:e.protectedFactCountChangedRelativeToDraft,
   sourceFactWitness:null,epistemicWitness:null,defectRepairWitness:null,
   independentSemanticAdmissibility:"HOLD",independentHumanPreference:"NOT_OBSERVED",
   humanEvidenceIds:[],epistemicRisk:e.attributionRemoved?"ATTRIBUTION_REMOVAL_UNADJUDICATED":"UNKNOWN",
   evaluationUnit:"P53_SOURCE_BRIEF",historicallyExposed:true};
 });
 if(records.length!==2||baseBy.size!==22)throw Error("BASE_LEDGER_DRIFT");
 return {schema:"ksgt.p60.provisional-revision-court.v02",records,
   distinctSourceWorks:graph.items.length,
   independentHumanPreferenceCount:0,independentSemanticallyAcceptedEdits:0,
   empiricallyValidatedImprovementCount:0};
}
function graphAudit(originals,revisionRows,extraLinks=[]){
 const splitBy=new Map(),hashOwner=new Map();
 const parents=new Map();
 function find(k){if(!parents.has(k))parents.set(k,k);
  const p=parents.get(k);if(p!==k)parents.set(k,find(p));return parents.get(k);}
 function union(a,b){const ra=find(a),rb=find(b);if(ra!==rb)parents.set(ra,rb);}
 for(const p of originals){
  if(!p.sourceWorkId||!p.sourceComponentId||!p.baseParagraphSha256||!SHA.test(p.baseParagraphSha256))throw Error("INVALID_ORIGINAL");
  const k=p.sourceComponentId;
  if(splitBy.has(k)&&splitBy.get(k)!==p.split)throw Error("COMPONENT_SPLIT_LEAK");
  splitBy.set(k,p.split);
  union("work:"+p.sourceWorkId,"paragraph:"+p.baseParagraphSha256);
  const before=hashOwner.get(p.baseParagraphSha256);
  if(before&&before!==k)union("work:"+p.sourceWorkId,"work:"+before);
  hashOwner.set(p.baseParagraphSha256,p.sourceWorkId);
 }
 for(const r of revisionRows){
  if(!SHA.test(r.baseParagraphSha256)||!SHA.test(r.revisionParagraphSha256))throw Error("INVALID_EDIT_HASH");
  const original=originals.find(p=>p.paragraphId===r.baseParagraphId);
  if(!original||original.baseParagraphSha256!==r.baseParagraphSha256)throw Error("UNMATCHED_PARENT");
  if(original.sourceComponentId!==r.sourceComponentId||original.split!==r.sourceSplit)throw Error("REVISION_SPLIT_LEAK");
  union("work:"+r.sourceWorkId,"paragraph:"+r.revisionParagraphSha256);
  union("paragraph:"+r.baseParagraphSha256,"paragraph:"+r.revisionParagraphSha256);
 }
 for(const edge of extraLinks){
  if(!edge||!edge.a||!edge.b||!["VERIFIED_SAME_SOURCE","VERIFIED_NEAR_DUPLICATE"].includes(edge.authority))
   throw Error("UNSUPPORTED_CROSS_WORK_LINK");
  union("work:"+edge.a,"work:"+edge.b);
 }
 const componentSplits=new Map();
 for(const p of originals){
  const root=find("work:"+p.sourceWorkId);
  const present=componentSplits.get(root);
  if(present&&present!==p.split)throw Error("TRANSITIVE_SOURCE_SPLIT_LEAK");
  componentSplits.set(root,p.split);
 }
 return {sourceWorks:new Set(originals.map(x=>x.sourceWorkId)).size,checkedEdges:extraLinks.length,
   status:"SPLIT_INVARIANCE_ONLY_UNKNOWN_EDGES_NOT_CLEARED"};
}
function evidenceReceipt(e){
 if(!e||typeof e!=="object")throw Error("BAD_EVIDENCE");
 if(!evidenceLevels.has(e.level)||!verdicts.has(e.verdict))throw Error("BAD_EVIDENCE_ENUM");
 if(!e.candidateId||!e.sourceComponentId||!e.axis)throw Error("MISSING_EVIDENCE_BINDING");
 if(e.level==="AUTHOR_TOY"||e.level==="MODEL_SELF")
  return {status:"PROXY_ONLY",semanticAuthority:false,humanAuthority:false};
 if(!e.reviewerId||!e.protocolId||!e.sourceWitnessId||!e.reviewerIndependenceAttested)
  throw Error("UNVERIFIED_WITNESS");
 if(e.level==="INDEPENDENT_KOREAN_READER"&&!e.blindedCandidateOrder)
  throw Error("BLINDING_NOT_VERIFIED");
 return {status:"RECEIPT_SCHEMA_PASS_EVIDENCE_NOT_AUTHENTICATED",
  semanticAuthority:false,humanAuthority:false};
}
function candidateGate(row,receipts=[]){
 if(row.independentSemanticAdmissibility!=="HOLD"||row.independentHumanPreference!=="NOT_OBSERVED")
  throw Error("UNSUPPORTED_AUTHORITY_PROMOTION");
 const selected=receipts.filter(x=>x.candidateId===row.id);
 for(const e of selected){
  if(e.sourceComponentId!==row.sourceComponentId)throw Error("MISBOUND_SOURCE_EVIDENCE");
  evidenceReceipt(e);
 }
 return {candidateId:row.id,sourceClaim:"SOURCE_TRUTH_NOT_ADJUDICATED",
  relativeToDraft:row.countMutatedRelativeToDraft?"KNOWN_COUNT_MUTATION_FROM_DRAFT":"NO_KNOWN_COUNT_MUTATION_NOT_SOURCE_PROOF",
  epistemic:row.attributionRemoved?"HOLD_ATTRIBUTION_LOSS":"HOLD_UNCHECKED",
  repairedDefect:"HOLD_NO_INDEPENDENT_REPAIR_WITNESS",
  humanStyle:"NOT_OBSERVED",sourceAdmissibility:"HOLD",
  auditRisk:row.countMutatedRelativeToDraft?"FLAG_DRAFT_FACT_DRIFT":"NONE_KNOWN"};
}
function revisionAxesToy(){
 const cells=contrast().map(x=>({
  surfaceProxy:x.surfaceRepetitionAbsent,sourceCountPreserved:x.typedFactPreservation,
  source:"AUTHOR_SYNTHETIC_CLOSED_TEMPLATE",humanPreference:"NOT_OBSERVED"
 }));
 assert.equal(cells.length,4);
 const falsePolished=cells.find(x=>x.surfaceProxy&&!x.sourceCountPreserved);
 if(!falsePolished)throw Error("MISSING_HARMFUL_SMOOTHING_CONTROL");
 return {cells,polishedFalse:1,
  sourcePass:cells.filter(x=>x.sourceCountPreserved).length,
  surfaceProxyPass:cells.filter(x=>x.surfaceProxy).length,
  humanPreferenceObserved:0};
}
function interval(n,wins,losses){
 if(![n,wins,losses].every(x=>Number.isSafeInteger(x)&&x>=0)||n===0||wins+losses>n)
  throw Error("INVALID_OUTCOME_DENOMINATOR");
 return {lower:wins/n,upper:(n-losses)/n,unknown:n-wins-losses,
  estimand:"PREFERENCE_EVENT_ON_FIXED_EVALUATION_POOL_NOT_CONDITIONAL_WIN_RATE",
  interpretation:"SHARP_MISSING_OUTCOME_BOUNDS_NOT_CONFIDENCE_INTERVAL"};
}
function audit(){
 const draft=ledger(),provisional=sourceLedger();
 const graph=graphAudit(draft.records,provisional.records);
 const outputs=provisional.records.map(x=>candidateGate(x));
 assert.equal(draft.records.length,22);
 assert.equal(provisional.distinctSourceWorks,6);
 assert.equal(outputs.length,2);
 assert.equal(outputs.filter(x=>x.relativeToDraft==="KNOWN_COUNT_MUTATION_FROM_DRAFT").length,1);
 assert.ok(outputs.every(x=>x.sourceAdmissibility==="HOLD"&&x.humanStyle==="NOT_OBSERVED"));
 const negative=[
  ()=>graphAudit(draft.records,[{...provisional.records[0],sourceSplit:"pilot_dev"},provisional.records[1]]),
  ()=>graphAudit(draft.records,provisional.records,[{a:"P53_BRIEF:EX09",b:"P53_BRIEF:EX10",authority:"VERIFIED_SAME_SOURCE"}]),
  ()=>candidateGate({...provisional.records[0],independentSemanticAdmissibility:"PASS"}),
  ()=>candidateGate({...provisional.records[0],independentHumanPreference:"PREFERRED"}),
  ()=>candidateGate(provisional.records[0],[{candidateId:provisional.records[0].id,sourceComponentId:"WRONG",level:"MODEL_SELF",axis:"style",verdict:"PASS"}]),
  ()=>evidenceReceipt({candidateId:"x",sourceComponentId:"c",axis:"fidelity",level:"EXTERNAL_SOURCE",verdict:"PASS"}),
  ()=>interval(0,0,0)
 ];
 const expected=["REVISION_SPLIT_LEAK","TRANSITIVE_SOURCE_SPLIT_LEAK","UNSUPPORTED_AUTHORITY_PROMOTION",
 "UNSUPPORTED_AUTHORITY_PROMOTION","MISBOUND_SOURCE_EVIDENCE","UNVERIFIED_WITNESS","INVALID_OUTCOME_DENOMINATOR"];
 negative.forEach((fn,i)=>assert.throws(fn,new RegExp(expected[i])));
 const toy=revisionAxesToy(),bounded=interval(6,0,0);
 assert.deepEqual([bounded.lower,bounded.upper,bounded.unknown],[0,1,6]);
 return {test:"PASS",stage:"G9-P60",phase:"P1",sourceWorks:6,
  originalDrafts:12,originalParagraphs:22,provisionalEdits:2,
  verifiedSemanticRevisions:0,humanPreferenceScores:0,
  sourceGraph:graph.status,qualityToy:{cells:toy.cells.length,polishedButFalse:toy.polishedFalse},
  negativeControls:negative.length,unknownPreferenceBounds:bounded,
  caveat:"LOCAL_SOURCE_HASHES_ARE_HISTORICAL_RECEIPTS_NOT_REVERIFIED_RAW_ARCHIVES"};
}
if(require.main===module){
 if(process.argv.includes("--emit-revisions"))console.log(JSON.stringify(sourceLedger(),null,2));
 else console.log(JSON.stringify(audit(),null,2));
}
module.exports={sourceLedger,graphAudit,evidenceReceipt,candidateGate,revisionAxesToy,interval,audit};
