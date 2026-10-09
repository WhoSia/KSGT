"use strict";
/* KSGT G9-P59 v0.4: closed-construction typed semantics, not general Korean NLU. */
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const {makeDataset}=require("./pipeline_v03.cjs");
const {groups}=require("./reader_state_v02.cjs");
const predicate="직접 제작한 장치를 소개했다.";
const names=new Map(groups.map(g=>[g.name,g]));
const sha=x=>crypto.createHash("sha256").update(JSON.stringify(x)).digest("hex");
function datasetV04(){
 const base=makeDataset();
 // Eight rows describe one source scene. Pretending to hold out rows leaks that scene.
 return base.map(({split,sha256,...x})=>{
  const row={...x,schema:"ksgt.p59.item.v04",sceneId:"school-fair-synthetic-001",
   split:"development",holdoutEligible:false,
   authority:"AUTHOR_INTENT_NOT_HUMAN_GOLD"};
  return {...row,sha256:sha(row)};
 });
}
function parseClosedConstruction(text){
 if(typeof text!=="string")return null;
 const anaphor=/^그중 ([0-9]+)명은 직접 제작한 장치를 소개했다\.$/u.exec(text);
 if(anaphor)return {mode:"anaphor",selected:Number(anaphor[1]),polarity:"positive"};
 const explicit=/^(과학 동아리 학생|수학 동아리 학생) ([0-9]+)명 중 ([0-9]+)명은 직접 제작한 장치를 (소개했다|소개하지 않았다)\.$/u.exec(text);
 if(explicit)return {mode:"explicit",name:explicit[1],sourceCount:Number(explicit[2]),
  selected:Number(explicit[3]),polarity:explicit[4]==="소개했다"?"positive":"negative"};
 return null;
}
function candidateReferents(row){
 // Constructed cue is not a human disambiguation gold label.
 const group=groups.find(g=>g.id===row.target.id);
 if(!group)return {ids:[],authority:"INVALID_GROUP"};
 if(row.context.readerKnowledge==="full" && row.context.briefing.includes(group.name))
  return {ids:[group.id],authority:"AUTHOR_CUE_ONLY"};
 return {ids:groups.map(g=>g.id),authority:"AUTHOR_CUE_ONLY"};
}
function inspect(row,candidate){
 const fail=(status,codes,details={})=>({status,codes,details,
  semanticAuthority:"CLOSED_TEMPLATE_AUTHORED_FRAME_ONLY",humanPreference:"NOT_OBSERVED"});
 if(!row||!candidate||typeof candidate!=="object")return fail("REJECT",["INVALID_INPUT"]);
 if(candidate.action==="ABSTAIN")return candidate.text==="[ABSTAIN]"?
  fail("ABSTAIN",[]):fail("REJECT",["MALFORMED_ABSTAIN"]);
 if(candidate.action==="RESTRUCTURE")return fail("HOLD",["FREE_RESTRUCTURE_UNPARSED"]);
 if(!["KEEP","EXPLICIT"].includes(candidate.action))return fail("REJECT",["INVALID_ACTION"]);
 const parsed=parseClosedConstruction(candidate.text);
 if(!parsed)return fail("HOLD",["OUTSIDE_CLOSED_GRAMMAR"]);
 if(candidate.action==="KEEP"&&parsed.mode!=="anaphor"||
    candidate.action==="EXPLICIT"&&parsed.mode!=="explicit")
  return fail("REJECT",["ACTION_SURFACE_MISMATCH"]);
 const faults=[];
 if(parsed.polarity!=="positive")faults.push("POLARITY_REVERSAL");
 if(parsed.selected!==row.target.selectedCount)faults.push("SUBSET_COUNT_CHANGED");
 if(!Number.isSafeInteger(parsed.selected)||parsed.selected<=0)faults.push("INVALID_COUNT");
 if(parsed.mode==="explicit"){
  const group=names.get(parsed.name);
  if(!group||group.id!==row.target.id)faults.push("WRONG_REFERENT");
  if(!group||parsed.sourceCount!==group.count)faults.push("SOURCE_CARDINALITY_CHANGED");
  if(!Number.isSafeInteger(parsed.sourceCount)||parsed.selected>=parsed.sourceCount)
    faults.push("INVALID_SUBSET");
 }
 if(faults.length)return fail("REJECT",faults,{parsed});
 const referents=candidateReferents(row);
 if(parsed.mode==="anaphor"&&referents.ids.length!==1)
  return fail("HOLD",["UNRESOLVED_READER_REFERENT"],{referents});
 return fail("TYPED_CONTRACT_PASS",[],{parsed,referents,
  qualification:"Not independent Korean semantic entailment or preference"});
}
function attack(row,kind){
 const valid=row.alternatives[1].text;
 const explicit={action:"EXPLICIT",text:valid};
 switch(kind){
  case "count":return {...explicit,text:valid.replace(" "+row.target.selectedCount+"명은"," 5명은")};
  case "source_count":return {...explicit,text:valid.replace(" "+row.target.sourceCount+"명 중"," 99명 중")};
  case "polarity":return {...explicit,text:valid.replace(predicate,"직접 제작한 장치를 소개하지 않았다.")};
  case "referent":{
   const rival=groups.find(g=>g.id!==row.target.id);
   return {...explicit,text:rival.name+" "+rival.count+"명 중 "+row.target.selectedCount+"명은 "+predicate};
  }
  default:throw Error("UNKNOWN_ATTACK");
 }
}
function test(){
 const rows=datasetV04();
 assert.equal(rows.length,8);
 assert.equal(new Set(rows.map(x=>x.sha256)).size,8);
 assert.ok(rows.every(r=>r.split==="development"&&!r.holdoutEligible));
 const tally={TYPED_CONTRACT_PASS:0,HOLD:0,REJECT:0};
 for(const row of rows){
  const keep=inspect(row,{action:"KEEP",text:row.alternatives[0].text});
  const overt=inspect(row,{action:"EXPLICIT",text:row.alternatives[1].text});
  tally[keep.status]++;tally[overt.status]++;
  assert.equal(overt.status,"TYPED_CONTRACT_PASS");
  assert.equal(keep.status,row.context.readerKnowledge==="limited"?"HOLD":"TYPED_CONTRACT_PASS");
  for(const kind of ["count","source_count","polarity","referent"]){
   const result=inspect(row,attack(row,kind));tally[result.status]++;
   assert.equal(result.status,"REJECT",row.id+" "+kind+": "+result.codes.join(","));
  }
  assert.equal(inspect(row,{action:"RESTRUCTURE",text:"다른 문장"}).status,"HOLD");
  assert.equal(inspect(row,{action:"EXPLICIT",text:"새로운 언어 표현"}).status,"HOLD");
 }
 assert.deepEqual(tally,{TYPED_CONTRACT_PASS:12,HOLD:4,REJECT:32});
 assert.equal(inspect(rows[0],{action:"KEEP",text:rows[0].alternatives[1].text}).status,"REJECT");
 assert.equal(inspect(rows[0],{action:"ABSTAIN",text:"[ABSTAIN]"}).status,"ABSTAIN");
 assert.deepEqual(datasetV04(),rows);
 console.log(JSON.stringify({test:"PASS",version:"v0.4",rows:8,checkedCandidates:48,tally,
  notes:["One underlying scene: all development, no fake heldout","Only closed construction and authored target checked",
  "Limited-reader anaphora remains HOLD; no human evidence"]}));
}
if(require.main===module){
 if(process.argv.includes("--emit-dataset"))console.log(JSON.stringify({schema:"ksgt.p59.dataset.v04",
  rows:datasetV04(),authority:"SYNTHETIC_ONLY"}));
 else test();
}
module.exports={datasetV04,parseClosedConstruction,candidateReferents,inspect,attack,test};
