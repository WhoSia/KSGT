"use strict";
/** Prospective external KoLLA essay-ID bridge. NEVER assumes corpus identity from shared dataset label alone. */
const crypto=require("node:crypto");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
function normalize(s){if(typeof s!=="string")throw Error("NOT_TEXT");return s.normalize("NFC").replace(/\s+/gu,"");}
function parseUD(s){
 if(typeof s!=="string")throw Error("UD_NOT_TEXT");const rows=[];
 for(const b of s.replace(/\r\n/g,"\n").split(/\n\s*\n/g)){
  const id=b.match(/^# sent_id = (KL-(?:fb|fi|hb|hi)-\d+-\d+)$/m);
  if(!id)continue;
  const text=b.match(/^# text = (.*)$/m);if(!text)throw Error("KL_SENT_TEXT_MISSING");
  const parts=id[1].match(/^KL-(fb|fi|hb|hi)-(\d+)-(\d+)$/);
  rows.push({id:id[1],group:parts[1]+"-"+parts[2],sentenceNo:Number(parts[3]),text:text[1]});
 }
 return rows;
}
function bridge(sourceTexts,udText){
 if(!Array.isArray(sourceTexts)||sourceTexts.some(t=>typeof t!=="string"))throw Error("INVALID_M2_TEXTS");
 const ix=new Map();for(const [i,s] of sourceTexts.entries()){const key=normalize(s),a=ix.get(key)||[];a.push(i);ix.set(key,a);}
 const rows=parseUD(udText),seen=new Map(),mapping=[],collisions=[];
 for(const r of rows){
  const matching=ix.get(normalize(r.text))||[];
  if(seen.has(r.id)){collisions.push({type:"UD_ID_REPEAT",id:r.id});continue}seen.set(r.id,true);
  if(matching.length===1)mapping.push({sourceBlockIndex0:matching[0],udId:r.id,essayGroupCandidate:r.group,udSentenceNo:r.sentenceNo,matchType:"UNICODE_NFC_SPACE_IGNORED",sourceStringSHA256:sha(sourceTexts[matching[0]])});
  if(matching.length>1)collisions.push({type:"M2_SOURCE_NOT_UNIQUE",id:r.id,possibleBlockCount:matching.length});
 }
 const perSource=new Map();for(const x of mapping){const k=x.sourceBlockIndex0,arr=perSource.get(k)||[];arr.push(x.essayGroupCandidate);perSource.set(k,arr);}
 for(const [i,groups] of perSource)if(new Set(groups).size>1)collisions.push({type:"M2_LINKS_MULTIPLE_ESSAYS",sourceBlockIndex0:i,groups:[...new Set(groups)]});
 const groups=new Map();for(const x of mapping){const a=groups.get(x.essayGroupCandidate)||[];a.push(x.sourceBlockIndex0);groups.set(x.essayGroupCandidate,a);}
 return {schema:"ksgt.g10.p1.r9.3.ud-external-essay-bridge.v01",udKoLLARecords:rows.length,exactUniqueMatches:mapping.length,matchedUniqueM2Blocks:perSource.size,essayGroupCandidates:groups.size,collisions,ambiguityCount:collisions.length,
  sourceWorkVerified:false,documentHold:true,evidence:"EXTERNAL_UD_SENT_IDS_ARE_CANDIDATE_NOT_ORIGINAL_M2_ESSAY_AUTHORITY",mapping};
}
module.exports={normalize,parseUD,bridge};
