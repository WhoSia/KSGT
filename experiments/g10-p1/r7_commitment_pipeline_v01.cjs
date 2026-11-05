"use strict";
const crypto=require("node:crypto");
const {validate,sourcePacket}=require("./r6_source_license_v01.cjs");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const ARMS=Object.freeze(["STRONG_DIRECT","GENERIC_DRAFT_REVISE","KSGT_CLAIM_PLAN"]);
const TYPES=Object.freeze(["SOURCE_CLAIM","QUALIFIED_INTERPRETATION","RHETORICAL_BRIDGE"]);
function decodePlan(raw,task){
 validate(task);if(typeof raw!=="string")throw Error("PLAN_NOT_TEXT");
 const s=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
 let p;try{p=JSON.parse(s)}catch{throw Error("UNPARSEABLE_PLAN")}
 if(!p||!Array.isArray(p.units)||p.units.length<4||p.units.length>12)throw Error("INVALID_PLAN_SIZE");
 const valid=new Set(task.facts.map(f=>f.id)),used=new Set();
 const units=p.units.map((u,i)=>{
  if(!u||!TYPES.includes(u.type)||!Array.isArray(u.factIds)||typeof u.content!=="string"||!u.content.trim()||u.content.length>320)throw Error("INVALID_CLAIM_UNIT");
  if(u.factIds.some(id=>!valid.has(id))||new Set(u.factIds).size!==u.factIds.length)throw Error("UNWITNESSED_FACT_REFERENCE");
  if(u.type==="SOURCE_CLAIM"&&!u.factIds.length)throw Error("SOURCE_CLAIM_NEEDS_WITNESS");
  if(u.type==="QUALIFIED_INTERPRETATION"&&(!u.factIds.length||u.qualified!==true))throw Error("UNQUALIFIED_INFERENCE");
  if(u.type==="RHETORICAL_BRIDGE"&&(u.factIds.length||u.addsWorldFact!==false))throw Error("BRIDGE_ASSERTS_FACT");
  const k=u.type+":"+u.factIds.join(",")+":"+u.content;if(used.has(k))throw Error("DUPLICATE_UNIT");used.add(k);
  return {position:i,type:u.type,factIds:[...u.factIds],content:u.content,qualified:u.qualified===true,addsWorldFact:u.addsWorldFact===true};
 });
 return {schema:"ksgt.g10.p1.r7.commitments.v01",sourceWork:task.sourceWork,units,sourceSha256:sha(sourcePacket(task)),warning:"WITNESSED_IDS_NOT_ENTAILMENT_GOLD"};
}
function messages(task,arm,phase,context=""){
 validate(task);if(!ARMS.includes(arm))throw Error("UNKNOWN_R7_ARM");
 const packet=sourcePacket(task),base="원천의 정확한 값, 부정, 미정 상태, 인과 불확실성과 허용된 창작 범위를 지키면서 자연스러운 한국어 완성문 세 문단을 작성하세요. 본문에는 사실 ID, 계획 설명, 소제목을 넣지 마세요.";
 let instruction;
 if(arm==="STRONG_DIRECT"&&phase==="final")instruction=base;
 else if(arm==="GENERIC_DRAFT_REVISE"&&phase==="draft")instruction=base+" 먼저 초안을 작성하세요.";
 else if(arm==="GENERIC_DRAFT_REVISE"&&phase==="final")instruction=base+" 아래 초안을 원천과 비교해 근거 없는 내용을 고치고 문장 연결을 개선한 최종본만 작성하세요.\n초안:\n"+context;
 else if(arm==="KSGT_CLAIM_PLAN"&&phase==="plan")instruction='문서의 주장·해석·수사적 연결을 계획하세요. JSON 객체 하나만 응답: {"units":[{"type":"SOURCE_CLAIM","factIds":["F1"],"content":"원천에 있는 명제"},{"type":"QUALIFIED_INTERPRETATION","factIds":["F2"],"qualified":true,"content":"가능성으로 명시한 해석"},{"type":"RHETORICAL_BRIDGE","factIds":[],"addsWorldFact":false,"content":"새 세계 사실 없는 연결"}]} 형식. 총 units 4~12개. SOURCE_CLAIM은 직접 지지되는 원천 ID 필수, QUALIFIED_INTERPRETATION은 출처와 가능성 표시 필수, RHETORICAL_BRIDGE는 새로운 행동·사건·상태를 주장하면 안 됩니다. 해석이 필요 없으면 생략 가능. 창작 허용 범위를 절대 넘기지 마세요.';
 else if(arm==="KSGT_CLAIM_PLAN"&&phase==="final")instruction=base+" 다음 주장의 근거 분류 및 순서를 참고하되, 새로운 사건이나 사물 상태를 덧붙이지 않고 문장·문단을 자연스럽게 실현하세요. 근거 없는 계획 내용은 본문에 넣지 마세요.\n승인된 계획 JSON:\n"+context;
 else throw Error("INVALID_PHASE");
 const result=[{role:"system",content:"한국어 작가. 원천 진술과 서술자의 해석을 구별하고, 최종 독자 문서만 출력하세요."},{role:"user",content:"원천 JSON:\n"+packet+"\n\n요청:\n"+instruction}];
 return {messages:result,promptSha256:sha(JSON.stringify(result)),sourceSha256:sha(packet),sourceWork:task.sourceWork,arm,phase};
}
function preflight(c){if(c?.schema!=="ksgt.g10.p1.r6.dev-cohort.v01"||c.authority!=="AUTHOR_AUTHORED_EXPOSED_DEVELOPMENT_NO_EXTERNAL_HOLDOUT"||!Array.isArray(c.tasks)||c.tasks.length!==6)throw Error("INVALID_EXPOSED_COHORT");const s=new Set();for(const t of c.tasks){validate(t);if(s.has(t.sourceWork))throw Error("DUPLICATE_WORK");s.add(t.sourceWork)}return {schema:"ksgt.g10.p1.r7.preflight.v01",sourceWorks:6,arms:[...ARMS],providerCallsMaximum:30,sourceDisjointExternal:false,matchedTokens:false,independentReaders:0,authority:"EXPOSED_AUTHOR_DEVELOPMENT_ONLY"}}
module.exports={ARMS,TYPES,decodePlan,messages,preflight};
