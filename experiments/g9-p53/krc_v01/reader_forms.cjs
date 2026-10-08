"use strict";
/* Three preallocated six-brief blind forms. No participant data or fictitious ratings. */
const fs=require("node:fs");
const crypto=require("node:crypto");
const briefs=require("../natural_writing_pilot_briefs.json");
const protocol=require("./reader_court_protocol.json");
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const armPairs=[["K_TYPED_PLAN","B_GENERIC"],["K_TYPED_PLAN","A_SURFACE_ABLATION"],["A_SURFACE_ABLATION","B_GENERIC"]];
function assemble(raw){
 if(raw.schema!=="ksgt.krc.v0.1.controlled-generation.v1"||raw.documents.length!==18)
  throw Error("INCOMPLETE_MODEL_CORPUS");
 const docs=new Map(raw.documents.map(x=>[x.brief+"|"+x.arm,x]));
 const forms=[],secret=[];
 for(let f=0;f<3;f++){
  const trials=[];
  for(let i=0;i<6;i++){
   const source=briefs.briefs[i],pair=armPairs[(i+f)%3];
   const leftRight=hash("KRC-READER-LEFT-"+source.id+"-"+f).charCodeAt(0)%2===0?pair:[pair[1],pair[0]];
   const arms=leftRight.map(arm=>docs.get(source.id+"|"+arm));
   const trial_id=hash("KRC-READER-TRIAL-"+f+"-"+source.id).slice(0,16);
   secret.push({form:"FORM_"+(f+1),trial_id,brief_id:source.id,left_arm:leftRight[0],right_arm:leftRight[1]});
   const complete=arms.every(a=>a?.status==="COMPLETED"&&typeof a.text==="string");
   trials.push({trial_id,
     brief_id:source.id,genre:source.genre,audience:source.audience,
     evidence_facts:source.facts,unknowns:source.unknown,
     left_text:complete?arms[0].text:null,right_text:complete?arms[1].text:null,
     status:complete?"READY_FOR_HUMAN":"MISSING_MODEL_OUTPUT",
     empty_response_schema:{left_naturalness:null,right_naturalness:null,prose_flow_left:null,
       prose_flow_right:null,preference:null,abstained:null,fact_warnings:[],linguistic_reason:null}});
  }
  forms.push({id:"FORM_"+(f+1),trials});
 }
 const blinded={schema:"ksgt.krc.v0.1.balanced-human-forms.v1",
   participant_data:"NONE",rating_status:"UNFILLED",
   do_not_use_as_AI_detector:true,
   direction:"Judge which passage sounds more contextually idiomatic, meaning-faithful and genre-fitting. Tie and abstention are valid.",
   scoring:"Naturalness 1-7 independently per left/right plus left|right|tie|abstain preference; never automatic LLM scores.",
   forms};
 const mapping={schema:"ksgt.krc.v0.1.separate-allocation-key.v1",
   visibility:"DO_NOT_SHARE_WITH_BLINDED_READERS",entries:secret};
 return {blinded,mapping};
}
if(require.main===module){
 const [input,blindPath,keyPath]=process.argv.slice(2);
 if(!input||!blindPath||!keyPath)throw Error("USAGE node reader_forms.cjs raw.json blind_forms.json private_key.json");
 const r=assemble(JSON.parse(fs.readFileSync(input)));
 fs.writeFileSync(blindPath,JSON.stringify(r.blinded,null,2)+"\n",{flag:"wx"});
 fs.writeFileSync(keyPath,JSON.stringify(r.mapping,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({forms:r.blinded.forms.length,
   total_pairs:r.blinded.forms.reduce((n,x)=>n+x.trials.length,0),
   usable:r.blinded.forms.flatMap(x=>x.trials).filter(t=>t.status==="READY_FOR_HUMAN").length,
   ratings:"NONE"}));
}
module.exports={assemble};
