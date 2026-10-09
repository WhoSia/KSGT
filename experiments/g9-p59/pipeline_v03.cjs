"use strict";
/* G9-P59 v0.3: deterministic data/critic/adversarial interface; not a human judge. */
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const {items}=require("./reader_state_v02.cjs");
const ACTIONS=Object.freeze(["KEEP","EXPLICIT","RESTRUCTURE","ABSTAIN"]);
const sha=x=>crypto.createHash("sha256").update(JSON.stringify(x)).digest("hex");
function makeDataset(rows=items){
 const seen=new Set();
 return rows.map((r,i)=>{
  if(seen.has(r.id)) throw Error("DUPLICATE_ID");
  seen.add(r.id);
  const {id,target,order,readerKnowledge,facts,briefing,keep,explicit,sourceCount,selectedCount}=r;
  if(![facts,briefing,keep,explicit].every(x=>typeof x==="string"&&x.length)) throw Error("MISSING_TEXT");
  if(!(Number.isInteger(sourceCount)&&Number.isInteger(selectedCount)&&selectedCount>0&&selectedCount<sourceCount)) throw Error("BAD_CARDINALITY");
  const item={schema:"ksgt.p59.item.v03",id,provenance:{source:"AUTHORED_SYNTHETIC",license:"PROJECT_AUTHORED",humanGold:false},
   context:{facts,briefing,readerKnowledge,order},target:{id:target,sourceCount,selectedCount,authority:"AUTHOR_INTENTION_ONLY"},
   alternatives:[{action:"KEEP",text:keep},{action:"EXPLICIT",text:explicit}],split:i%4===0?"heldout":"development"};
  return {...item,sha256:sha(item)};
 });
}
function structuralCritic(entry,candidate){
 const violations=[];
 if(!ACTIONS.includes(candidate.action)) violations.push("UNKNOWN_ACTION");
 if(typeof candidate.text!=="string"||!candidate.text.trim()) violations.push("EMPTY_TEXT");
 if(candidate.action==="KEEP"&&candidate.text!==entry.alternatives[0].text) violations.push("KEEP_CHANGED");
 if(candidate.action==="EXPLICIT"&&candidate.text!==entry.alternatives[1].text) violations.push("EXPLICIT_CHANGED");
 if(candidate.action==="RESTRUCTURE") violations.push("UNVERIFIED_RESTRUCTURE_MEANING");
 if(candidate.action==="ABSTAIN"&&candidate.text!=="[ABSTAIN]") violations.push("INVALID_ABSTAIN");
 return {status:violations.length?"HOLD":"STRUCTURAL_PASS",violations,
  semanticFidelity:"NOT_INDEPENDENTLY_VALIDATED",humanPreference:"NOT_OBSERVED"};
}
const generators={
 keep(entry){return {action:"KEEP",text:entry.alternatives[0].text};},
 explicit(entry){return {action:"EXPLICIT",text:entry.alternatives[1].text};},
 abstain(){return {action:"ABSTAIN",text:"[ABSTAIN]"};}
};
function adversary(entry,kind){
 const base=generators.explicit(entry);
 if(kind==="wrong_count") return {...base,text:base.text.replace(entry.target.selectedCount+"명",entry.target.selectedCount+1+"명")};
 if(kind==="unlicensed_restructure") return {action:"RESTRUCTURE",text:"그 밖의 학생들은 모두 다른 발표를 했다."};
 if(kind==="changed_keep") return {action:"KEEP",text:base.text};
 throw Error("UNKNOWN_ATTACK");
}
function evaluate(rows=makeDataset()){
 const records=[];
 for(const e of rows){
  for(const [label,gen] of Object.entries(generators)){
   const candidate=gen(e),critic=structuralCritic(e,candidate);
   records.push({id:e.id,generator:label,candidate,critic});
  }
  for(const attack of ["wrong_count","unlicensed_restructure","changed_keep"]){
   const candidate=adversary(e,attack);
   records.push({id:e.id,attack,candidate,critic:structuralCritic(e,candidate)});
  }
 }
 return {version:"P59-v0.3",status:"SYNTHETIC_ONLY",datasetHash:sha(rows),rows:rows.length,records,
  authority:{nativeHumanGold:0,independentSemanticValidation:false,qualityImprovement:"NOT_CLAIMED"}};
}
function test(){
 const ds=makeDataset();assert.equal(ds.length,8);
 assert.equal(new Set(ds.map(x=>x.id)).size,8);
 assert.equal(new Set(ds.map(x=>x.sha256)).size,8);
 assert.ok(ds.every(x=>x.provenance.humanGold===false));
 assert.ok(ds.some(x=>x.split==="heldout")&&ds.some(x=>x.split==="development"));
 assert.deepEqual(makeDataset(),ds);
 const e=ds[0];
 assert.equal(structuralCritic(e,generators.keep(e)).status,"STRUCTURAL_PASS");
 assert.equal(structuralCritic(e,generators.explicit(e)).status,"STRUCTURAL_PASS");
 assert.equal(structuralCritic(e,adversary(e,"wrong_count")).status,"HOLD");
 assert.equal(structuralCritic(e,adversary(e,"unlicensed_restructure")).status,"HOLD");
 assert.equal(structuralCritic(e,adversary(e,"changed_keep")).status,"HOLD");
 const result=evaluate(ds);
 assert.equal(result.records.length,48);
 assert.equal(result.records.filter(x=>x.critic.status==="HOLD").length,24);
 assert.throws(()=>makeDataset([items[0],items[0]]),/DUPLICATE_ID/);
 console.log(JSON.stringify({test:"PASS",items:8,cases:48,adversarialHolds:24,hash:result.datasetHash,
  caveat:"Synthetic guards only; no human language preference or semantic accuracy"}));
}
if(require.main===module) test();
module.exports={ACTIONS,makeDataset,structuralCritic,generators,adversary,evaluate,test};
