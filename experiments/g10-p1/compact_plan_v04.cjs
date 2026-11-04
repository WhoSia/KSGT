"use strict";
/** Compact discourse planning v0.4 — source-licensed order, no invented relations.
 * Author annotations are disclosed to EVERY rival arm by the factorial runner.
 * Chronology: use supplied TEMPORAL_NEXT edges only; other moves keep prior
 * source order as a stable tie break. No automatic semantic parse implied.
 */
const {build,orderByEvidence,validate}=require("./discourse_plan_v02.cjs");
const crypto=require("node:crypto");
function compact(task,{perturb=false}={}){
 validate(task);
 const plan=build(task);
 const ids=plan.factOrder;
 const seq=perturb?[...ids].reverse():ids;
 const rel=plan.relationEdges
  .filter(e=>["TEMPORAL_NEXT","CONTRAST","LIMITATION","EVIDENCE_FOR"].includes(e.type))
  .map(e=>e.from+":"+e.type+":"+e.to);
 const limits=task.uncertainties.map((_,i)=>"U"+(i+1));
 const lines=[
  "구성 순서: "+seq.join(" > "),
  "원천이 허가한 연결: "+(rel.join(", ")||"없음"),
  "추론 금지: "+(limits.join(", ")||"없음"),
  "전개: 실험 설정/현장 맥락에서 관찰과 결과로; 확인되지 않은 인과·시간·참여 조건은 확정하지 않기.",
  "한국어: 자연스러운 조사·생략·어미 선택, 형식 기호·F/U 번호는 본문에 출력하지 않기."
 ];
 return {schema:"ksgt.g10.p1.compact-plan.v04",sourceId:task.id,
  orderedFactIds:seq,relationIds:rel,uncertaintyIds:limits,
  perturbed:!!perturb,
  // No full source facts duplicated in the compact plan.
  planText:lines.join("\n"),
  sourceSha256:crypto.createHash("sha256").update(JSON.stringify(task.facts)).digest("hex"),
  authority:"AUTHORED_RELATIONS_ONLY_NO_AUTOMATIC_LANGUAGE_UNDERSTANDING"};
}
function padBudget(text,targetChars){
 if(!Number.isInteger(targetChars)||targetChars<0)throw Error("TARGET_CHARS_REQUIRED");
 if(text.length>targetChars)return text;
 const generic=" 문장 간 연결을 매끄럽게 유지하고 독자와 장르를 고려하되 새 사실을 만들지 마세요.";
 return text+generic.repeat(Math.floor((targetChars-text.length)/generic.length))
    +generic.slice(0,(targetChars-text.length)%generic.length);
}
module.exports={compact,padBudget};
