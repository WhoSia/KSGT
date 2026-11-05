"use strict";
/** KoLLA M2 authority replay. Never print learner text or create human-quality gold. */
const fs = require("node:fs"),crypto=require("node:crypto");
const {parseCsv,COLUMNS}=require("./r9_kolla_packet_audit_v01.cjs");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
function parseM2(raw){
 if(typeof raw!=="string")throw Error("M2_NOT_TEXT");
 const blocks=raw.replace(/\r\n/g,"\n").trimEnd().split(/\n\n+/).filter(Boolean);
 return blocks.map((block,i)=>{
  const lines=block.split("\n");
  if(!lines[0].startsWith("S "))throw Error("M2_SOURCE_MISSING_"+i);
  const source=lines[0].slice(2), edits={0:[],1:[]};
  for(const line of lines.slice(1)){
   const p=line.split("|||");
   if(p.length!==6||!p[0].startsWith("A ")||!["0","1"].includes(p[5]))throw Error("INVALID_M2_ANNOTATION_"+i);
   const startEnd=p[0].slice(2).split(" ").map(Number);
   if(startEnd.length!==2||startEnd.some(n=>!Number.isInteger(n)))throw Error("INVALID_M2_OFFSETS");
   edits[Number(p[5])].push({start:startEnd[0],end:startEnd[1],replacement:p[2],kind:p[1]});
  }
  return {source,edits};
 });
}
function replay(block,annotator){
 if(![0,1].includes(annotator))throw Error("UNKNOWN_ANNOTATOR");
 const edits=block.edits[annotator];if(!edits.length)throw Error("ANNOTATOR_NOT_PRESENT");
 const tokens=block.source.split(" ");
 const e=edits.filter(x=>!(x.start===-1&&x.end===-1));
 for(const x of e)if(x.start<0||x.end<x.start||x.end>tokens.length)throw Error("EDIT_SPAN_OUT_OF_BOUNDS");
 const sorted=e.slice().sort((a,b)=>b.start-a.start||b.end-a.end);
 for(let i=1;i<sorted.length;i++)if(sorted[i].end>sorted[i-1].start&&sorted[i].start!==sorted[i].end)throw Error("OVERLAPPING_EDITS");
 for(const x of sorted)tokens.splice(x.start,x.end-x.start,...(x.replacement?x.replacement.split(" "):[]));
 return tokens.join(" ");
}
function audit(m2,packet){
 const blocks=parseM2(m2),[header,...rows]=parseCsv(packet);
 if(JSON.stringify(header)!==JSON.stringify(COLUMNS))throw Error("CSV_SCHEMA");
 let matched=0,sourceMatched=0,otherMatched=0,hiddenMatched=0,missingSecond=0,edits=0;
 const failures=[], strata={};
 for(const b of blocks){if(!b.edits[1].length)missingSecond++;for(const a of [0,1])edits+=b.edits[a].filter(x=>x.start!==-1).length;}
 for(const r of rows){
  if(r.length!==COLUMNS.length)throw Error("CSV_FIELD_COUNT");
  const item=Object.fromEntries(header.map((k,i)=>[k,r[i]]));const idx=Number(item.row_index0),hidden=Number(item.hidden_annotator);
  if(!Number.isInteger(idx)||idx<0||idx>=blocks.length||![0,1].includes(hidden))throw Error("INVALID_ROW_INDEX_OR_ANNOTATOR");
  const src=blocks[idx].source,notHidden=1-hidden;
  const srcOK=src===item.source&&Number(item.m2_block_1based)===idx+1;
  const otherOK=replay(blocks[idx],notHidden)===item.visible_ref;
  const hiddenOK=replay(blocks[idx],hidden)===item.candidate;
  matched+=(srcOK&&otherOK&&hiddenOK)?1:0;sourceMatched+=srcOK;otherMatched+=otherOK;hiddenMatched+=hiddenOK;
  if(!(srcOK&&otherOK&&hiddenOK))failures.push({id:item.challenge_id,sourceOK:srcOK,visibleIsOtherHuman:otherOK,candidateIsHiddenHuman:hiddenOK});
  const k=item.risk_stratum;if(!strata[k])strata[k]={rows:0,hiddenHumanKept:0,visibleHumanKept:0};
  strata[k].rows++;strata[k].hiddenHumanKept+=item.candidate===item.source;strata[k].visibleHumanKept+=item.visible_ref===item.source;
 }
 return {authority:"EXISTING_TWO_HUMAN_REFERENCES_NOT_KSGT_GENERATION",blocks:blocks.length,firstAnnotatorBlocks:blocks.filter(b=>b.edits[0].length).length,secondAnnotatorBlocks:blocks.length-missingSecond,missingSecondAnnotator:missingSecond,nonNoopEdits:edits,
 packetRows:rows.length,packetSourceMatched:sourceMatched,visibleReferenceReplayedFromOtherHuman:otherMatched,candidateReplayedFromHiddenHuman:hiddenMatched,fullTripleIdentityRows:matched,strata, failures,
 corpusSHA256:sha(m2),essayIdsAvailable:false,independentEssayCount:"UNIDENTIFIED",modelWins:0,actualNewHumanRatings:0};
}
if(require.main===module){
 try{if(process.argv.length!==4)throw Error("USAGE_M2_PACKET");const result=audit(fs.readFileSync(process.argv[2],"utf8"),fs.readFileSync(process.argv[3],"utf8"));console.log(JSON.stringify(result,null,2));if(result.failures.length)process.exitCode=1}
 catch(e){console.error("R9_M2_REPLAY_FAILED:"+e.message);process.exitCode=1}
}
module.exports={parseM2,replay,audit};
