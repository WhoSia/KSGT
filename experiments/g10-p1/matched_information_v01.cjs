"use strict";
/** G10-P1 R2: five arm, matched source-information, prompt-only comparison.
 * A dry run cannot establish LLM or human quality effects.
 */
const crypto=require("node:crypto");
const {validate,stableOrder}=require("./dependency_contract_v01.cjs");
const ARMS=Object.freeze(["STRONG_DIRECT","GENERIC_OUTLINE","EXPLICIT_EDGE_PROMPT","GRAPH_PLAN","GRAPH_PLAN_ABLATED"]);
function sourcePacket(task){
 validate(task);
 if(typeof task.id!=="string"||typeof task.genre!=="string"||typeof task.audience!=="string"||typeof task.purpose!=="string"||task.facts.some(f=>typeof f.text!=="string"||!f.text.trim()))throw Error("INVALID_TEXT_SOURCE");
 const content={sourceId:task.id,genre:task.genre,audience:task.audience,purpose:task.purpose,
 facts:task.facts.map(f=>({id:f.id,text:f.text})),
 edges:task.edges.map(e=>({before:e.before,after:e.after,type:e.type,evidence:e.evidence}))};
 return JSON.stringify(content);
}
function prompt(task,arm){
 if(!ARMS.includes(arm))throw Error("UNKNOWN_ARM");
 const packet=sourcePacket(task),sourceHash=crypto.createHash("sha256").update(packet).digest("hex");
 const common="주어진 자료만 사용해 독자와 장르에 맞는 자연스러운 한국어 문서 세 문단을 작성하세요. 모든 출처 사실, 미확정 사항, 작성자가 선언한 선행관계를 고려하되 근거 없는 조건·사실·인과관계는 추가하지 마세요. 사실 ID와 계획 설명은 본문에 쓰지 마세요.";
 let instruction=common;
 if(arm==="GENERIC_OUTLINE")instruction+=" 문단을 배경, 핵심 내용, 독자에게 필요한 마무리로 구성하되 장르에 맞게 조절하세요.";
 if(arm==="EXPLICIT_EDGE_PROMPT")instruction+=" 주어진 선행관계를 직접 검토하여 독자가 뒤의 내용을 이해하기 전에 필요한 정보를 적절히 소개하세요. 별도의 외부 정렬안은 없습니다.";
 if(arm==="GRAPH_PLAN")instruction+=" 작성자 승인 선행관계의 안정적인 위상정렬 제안: "+stableOrder(task).join(" → ")+". 이 순서는 비강제적 구성 가설이며 더 자연스러운 장르적 구성이 있다면 조절하세요.";
 if(arm==="GRAPH_PLAN_ABLATED")instruction+=" 외부 정렬안의 정보 의존관계 제거 대조군: "+task.facts.map(f=>f.id).join(" → ")+". 이 순서는 단순 원천 배열이며 의존관계 검토를 대신하지 않습니다.";
 const messages=[{role:"system",content:"정확성과 문서 목적을 중시하는 한국어 작성자"},{role:"user",content:"원천 자료(JSON):\n"+packet+"\n\n작성 지시:\n"+instruction}];
 return {arm,sourceId:task.id,sourceHash,sourcePacket:packet,messages,promptChars:JSON.stringify(messages).length,sourceChars:packet.length,
  evidence:"PROMPT_ONLY_INFORMATION_PARITY_NOT_COMPUTE_MATCHED_NOT_HUMAN_GOLD"};
}
function compare(task){
 const rows=ARMS.map(a=>prompt(task,a));
 if(new Set(rows.map(r=>r.sourceHash)).size!==1||new Set(rows.map(r=>r.sourcePacket)).size!==1)throw Error("SOURCE_INFORMATION_CONFOUND");
 return {schema:"ksgt.g10.p1.r2.matched-information.v01",sourceWork:task.sourceWork||task.id,arms:rows,
  matchedSourceInformation:true,matchedTokenBudget:false,modelOutputs:0,humanRatings:0};
}
module.exports={ARMS,sourcePacket,prompt,compare};
