"use strict";
/** G9-P60 P2: frozen authored-source and same-work revision-policy contract.
 * CI does not contain the private P53 ZIP, so source/candidate byte evidence
 * is recorded separately; this module must not mint human semantic gold.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const edits=require("./provisional_edits_v01.json");
const policies=require("./policy_pairs_v03.json");
const sourcePath=path.join(__dirname,"../g9-p53/krc_v03/new_briefs.json");
const SOURCE_SHA="722403f11ecdc621c8966e3285184a62e9a945a4263797c9ca107d4d7d948ead";
const BASE_SHA="a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596";
const SHA=/^[a-f0-9]{64}$/;
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
function verifySource(raw=fs.readFileSync(sourcePath)){
 if(sha(raw)!==SOURCE_SHA)throw Error("FROZEN_SOURCE_BYTE_DRIFT");
 const doc=JSON.parse(raw),b=doc.briefs.find(x=>x.id==="EX09");
 if(!b||b.genre!=="science_explainer"||b.facts.length!==5||
  !b.facts[0].includes("두 상자")||!b.facts[2].includes("두 상자")||
  !b.facts[4].includes("측정하지 않았다"))throw Error("FROZEN_FACT_CONTRACT_DRIFT");
 return b;
}
function verifyEdits(rows=edits.candidates){
 if(rows.length!==2||new Set(rows.map(x=>x.candidateId)).size!==2)throw Error("EDIT_COUNT_DRIFT");
 for(const x of rows){
  if(x.originSourceId!=="P53_BRIEF:EX09"||x.componentId!=="P53_WORK:EX09"||
   x.inheritedSplit!=="pilot_train"||x.baseDraftId!=="P53:4B:EX09:K_TYPED_PLAN")throw Error("EDIT_PARENT_SPLIT_ESCAPE");
  if(x.baseParagraphSha256!==BASE_SHA||!SHA.test(x.revisionParagraphSha256))throw Error("EDIT_HASH_DRIFT");
  if(x.sourceLicenseAndMeaning!=="NOT_ADJUDICATED"||x.humanPreference!=="NOT_OBSERVED")throw Error("FAKE_INDEPENDENT_GOLD");
 }
 const clean=rows.find(x=>x.editOperator==="SOURCE_LABEL_REMOVAL");
 const drift=rows.find(x=>x.editOperator==="SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT");
 if(!clean||!drift||clean.revisionParagraphSha256!=="925f378c6f3dbdac0cd66434fe3c93a23cebce4d8a97163bd92e9094a8284709"||
 drift.revisionParagraphSha256!=="365ba48d2003328b93db628dce779d92bc66778af7b43c31cfc7503516875453"||
 drift.protectedFactCountChangedRelativeToDraft!==true)throw Error("UNWITNESSED_DRIFT_MAPPING");
 return {clean,drift};
}
function verifyPolicies(doc=policies){
 const expected=["NO_EDIT","MINIMAL_ATTRIBUTION","ORDINARY_SMOOTH","P59_DISCOURSE"];
 if(doc.schema!=="ksgt.p60.p2.policy-pairs.v03"||doc.privateTextInRepository!==false||
  doc.sourceBrief!=="P53_BRIEF:EX09"||doc.freshHoldout!==false||
  doc.sourceBriefJsonSha256!==SOURCE_SHA||doc.pairs.length!==4)throw Error("POLICY_CONTRACT_DRIFT");
 if(expected.some((x,i)=>doc.pairs[i].policy!==x))throw Error("POLICY_MISSING_OR_ORDER_DRIFT");
 if(doc.pairs[0].sha256!==BASE_SHA)throw Error("NO_EDIT_NOT_ORIGINAL");
 for(const row of doc.pairs){
  if(!SHA.test(row.sha256)||row.sourceWorkId!=="P53_BRIEF:EX09"||
   row.split!=="pilot_train"||row.writerAuthority!=="ASSISTANT_PROVISIONAL_NOT_HUMAN"||
   row.axes?.admissibility!=="HOLD"||row.axes?.defectRepair!=="HOLD"||
   row.axes?.collateralIntegrity!=="HOLD"||row.axes?.readerPreference!=="NOT_OBSERVED")throw Error("UNSUPPORTED_POLICY_AUTHORITY");
 }
 if(new Set(doc.pairs.map(x=>x.sha256)).size!==4)throw Error("DUPLICATE_POLICY_CANDIDATE");
 return true;
}
function main(){
 verifySource();verifyEdits();verifyPolicies();
 const bad=[
  [()=>verifyEdits(edits.candidates.map((x,i)=>i?{...x,inheritedSplit:"pilot_dev"}:x)),"EDIT_PARENT_SPLIT_ESCAPE"],
  [()=>verifyEdits(edits.candidates.map((x,i)=>i?{...x,sourceLicenseAndMeaning:"PASS"}:x)),"FAKE_INDEPENDENT_GOLD"],
  [()=>verifyEdits(edits.candidates.map((x,i)=>i?{...x,revisionParagraphSha256:"bad"}:x)),"EDIT_HASH_DRIFT"],
  [()=>verifyPolicies({...policies,pairs:policies.pairs.slice(1)}),"POLICY_CONTRACT_DRIFT"],
  [()=>verifyPolicies({...policies,pairs:policies.pairs.map((x,i)=>i?x:{...x,sha256:"0".repeat(64)})}),"NO_EDIT_NOT_ORIGINAL"],
  [()=>verifyPolicies({...policies,pairs:policies.pairs.map((x,i)=>i?x:{...x,axes:{...x.axes,readerPreference:"PREFERRED"}})}),"UNSUPPORTED_POLICY_AUTHORITY"],
  [()=>verifyPolicies({...policies,pairs:policies.pairs.map((x,i)=>i?{...x,sha256:policies.pairs[0].sha256}:x)}),"DUPLICATE_POLICY_CANDIDATE"]
 ];
 for(const [fn,error] of bad)assert.throws(fn,new RegExp(error));
 return {stage:"G9-P60",phase:"P2",test:"PASS",negativeControls:bad.length,
  sourceBrief:"EX09",sourceAuthority:"AUTHORED_PRESEALED_P53_BRIEF",protectedCount:"TWO_BOXES",
  countDrift:"SOURCE_CONTRADICTION_IF_PRIVATE_HASH_WITNESS_VALID",
  privateCandidateByteProof:"LOCAL_RECEIPT_ONLY_NOT_REPLAYED_BY_CI",
  otherRevisionAxes:"HOLD",humanPreferences:"NOT_OBSERVED",matchedSourceWorks:1,
  policies:policies.pairs.map(x=>x.policy),historicallyExposed:true};
}
if(require.main===module)console.log(JSON.stringify(main(),null,2));
module.exports={verifySource,verifyEdits,verifyPolicies,main};
