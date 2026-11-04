"use strict";
/** v0.6 conservative Korean chronological planner.
 * Operates on RAW source facts only: NO human discourse annotations needed.
 * High-precision cue extraction, defers to original order if uncertain.
 * Not a general Korean semantic parser.
 */
const crypto=require("node:crypto");
const sciDay=/(?:관찰\s*)?(\d{1,3})\s*일(?:째|차)/u;
function classify(fact){
 const s=String(fact);
 const day=s.match(sciDay);
 if(/(?:측정하지|확인되지|알\s*수\s*없|미확인|알려지지|단정할\s*수\s*없)/u.test(s))
  return {role:"LIMITATION",day:null,confidence:"LEXICAL"};
 if(/(?:심었|파종|배치|주었|놓았|놓여|두었|설치|준비\s*단계)/u.test(s))
  return {role:"SETUP",day:null,confidence:"LEXICAL"};
 if(day&&/(?:관찰|세어|셌|잎|싹|확인)/u.test(s))
  return {role:"DATED_OBSERVATION",day:Number(day[1]),confidence:"EXPLICIT_DAY_CUE"};
 return {role:"UNRESOLVED",day:null,confidence:"ABSTAIN"};
}
function plan(task){
 if(!task||typeof task!=="object"||!Array.isArray(task.facts)||!task.facts.length||
  task.facts.some(f=>typeof f!=="string"||!f.trim()))throw Error("INVALID_SOURCE_FACTS");
 const rows=task.facts.map((fact,i)=>({id:"F"+(i+1),index:i,...classify(fact)}));
 const science=task.genre==="science_explainer";
 const count=rows.filter(x=>x.role==="DATED_OBSERVATION").length;
 const reliable=science&&count>=2;
 const rank={SETUP:0,DATED_OBSERVATION:1,UNRESOLVED:2,LIMITATION:3};
 const ordered=reliable?[...rows].sort((a,b)=>{
  const d=rank[a.role]-rank[b.role];if(d)return d;
  if(a.role==="DATED_OBSERVATION")return a.day-b.day||a.index-b.index;
  return a.index-b.index;
 }):rows;
 const abstentions=rows.filter(x=>x.role==="UNRESOLVED").map(x=>x.id);
 const explanation=reliable?
  "과학 설명의 명시적 관측 일차에 따라 배경/설정→관측→측정 한계 순서로 구성하십시오.":
  "원천에서 충분히 명시된 시간 관계가 없어 기계적 재배열을 하지 않습니다.";
 const text=[
  explanation,
  "권장 사실 순서: "+ordered.map(x=>x.id).join(" > "),
  "원천의 부정, 신청 기한, 조건, 관찰과 추론의 구분을 유지하십시오.",
  "실제 한국어 문단만 작성하고 F번호는 출력하지 마십시오."
 ].join("\n");
 return {schema:"ksgt.g10.p1.raw-chronology.v06",sourceId:task.id,
  factOrder:ordered.map(x=>x.id),abstained:!reliable,
  detectedObservationDays:rows.filter(x=>x.day!==null).map(x=>({factId:x.id,day:x.day})),
  lexicalUnresolved:abstentions,
  sourceFactsHash:crypto.createHash("sha256").update(JSON.stringify(task.facts)).digest("hex"),
  prompt:text,
  authority:"SOURCE_TEXT_LEXICAL_CUES_ONLY_NO_HUMAN_ANNOTATIONS_NO_SEMANTIC_PARSER"};
}
module.exports={classify,plan};
