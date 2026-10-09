"use strict";
/* G9-P59 internal §v0.9. Writing-quality benchmark contract; NOT a human quality scorer. */
const assert=require("node:assert/strict");
const {makeRows,hash}=require("./dataset_v05.cjs");
const AXES=Object.freeze(["source_fidelity","referential_recovery","discourse_coherence","korean_naturalness","genre_register","revision_utility"]);
const TASKS=Object.freeze(["REFERENT_CHOICE","PARAGRAPH_COHESION","EVIDENCE_GROUNDED_REVISION","REGISTER_REALIZATION"]);
function suite(){
 const rows=makeRows();
 return rows.map(r=>({id:r.id,sourceFamily:r.source.family,split:r.split,
   provenance:{source:"AUTHOR_SYNTHETIC",humanGold:false,nativeWritingGold:false},
   task:"REFERENT_CHOICE",source:r.source.fact,meaning:r.intent,readerState:r.readerState,
   candidates:r.alternatives,genre:r.source.genre,
   requiredEvidence:{sourceTruth:"AUTHORED_FRAME",referent:"AUTHOR_INTENT",humanPreference:"NONE"},
   qualityAxes:AXES}));
}
function inspect(item,pred){
 if(!item||!pred||typeof pred.text!=="string")throw Error("INVALID_CANDIDATE");
 if(pred.claimedHumanGold===true||pred.claimedJudgeVerified===true)throw Error("GOLD_LAUNDERING");
 const result=(structural,codes=[])=>({structural,codes,
   independentMeaning:"NOT_VERIFIED",humanNaturalness:"NOT_OBSERVED",qualityRanking:"WITHHELD"});
 if(pred.action==="ABSTAIN")return result(pred.text==="[ABSTAIN]"?"ABSTAIN":"REJECT",pred.text==="[ABSTAIN]"?[]:["BAD_ABSTAIN"]);
 if(!["KEEP","EXPLICIT","RESTRUCTURE"].includes(pred.action))return result("REJECT",["UNKNOWN_ACTION"]);
 if(pred.action==="RESTRUCTURE")return result("HOLD",["FREE_REVISION_NEEDS_SEMANTIC_ADJUDICATION"]);
 if(pred.text===item.candidates.EXPLICIT && pred.action==="EXPLICIT")return result("STRUCTURAL_PASS",["AUTHOR_TEMPLATE_ONLY"]);
 if(pred.text===item.candidates.KEEP && pred.action==="KEEP"){
  return item.readerState.accessibleRefs.length===1?
   result("STRUCTURAL_PASS",["AUTHOR_CUE_ONLY"]):
   result("HOLD",["UNRESOLVED_REFERENCE"]);
 }
 const original=/^(.*명 중 )(\d+)(명은 .+\.)$/u.exec(item.candidates.EXPLICIT);
 const proposed=/^(.*명 중 )(\d+)(명은 .+\.)$/u.exec(pred.text);
 if(pred.action==="EXPLICIT"&&original&&proposed&&original[1]===proposed[1]&&original[3]===proposed[3]&&original[2]!==proposed[2])
  return result("REJECT",["COUNT_CHANGED_IN_CLOSED_TEMPLATE"]);
 return result("HOLD",["OUTSIDE_CLOSED_TEMPLATE"]);
}
function compareWritingQuality(item,a,b){
 const ra=inspect(item,a),rb=inspect(item,b);
 return {decision:"NO_HUMAN_QUALITY_RANK",a:ra,b:rb,
  reason:"Structural validity is a prerequisite, not evidence of stylistic improvement"};
}
function test(){
 const rows=suite();
 assert.equal(rows.length,32);
 assert.equal(new Set(rows.map(r=>r.sourceFamily)).size,4);
 assert.ok(rows.every(r=>r.provenance.humanGold===false));
 assert.deepEqual([...AXES].sort(),[...new Set(AXES)].sort());
 let observed={STRUCTURAL_PASS:0,HOLD:0,REJECT:0};
 for(const row of rows){
  const all=[
   {action:"EXPLICIT",text:row.candidates.EXPLICIT},
   {action:"KEEP",text:row.candidates.KEEP},
   {action:"EXPLICIT",text:row.candidates.EXPLICIT.replace(
     " "+row.meaning.subsetCount+"명은"," "+(row.meaning.subsetCount+1)+"명은")},
   {action:"RESTRUCTURE",text:"새롭게 재구성한 문장입니다."}
  ];
  for(const c of all){const v=inspect(row,c);observed[v.structural]++;
   assert.equal(v.humanNaturalness,"NOT_OBSERVED");assert.equal(v.qualityRanking,"WITHHELD");}
  assert.equal(compareWritingQuality(row,all[0],all[1]).decision,"NO_HUMAN_QUALITY_RANK");
  assert.throws(()=>inspect(row,{...all[0],claimedHumanGold:true}),/GOLD_LAUNDERING/);
  assert.equal(inspect(row,{action:"KEEP",text:"무관한 문장"}).structural,"HOLD");
 }
 assert.deepEqual(observed,{STRUCTURAL_PASS:48,HOLD:48,REJECT:32});
 assert.equal(TASKS.length,4);
 assert.deepEqual(suite(),rows);
 console.log(JSON.stringify({test:"PASS",section:"P59/v0.9",items:32,candidates:128,
  counts:observed,sourceFamilies:4,potentialWritingTaskTypes:TASKS,
  humanQualityScores:0,leaderboard:"FORBIDDEN_NO_HUMAN_GOLD",fingerprint:hash(rows)}));
}
if(require.main===module)test();
module.exports={AXES,TASKS,suite,inspect,compareWritingQuality,test};
