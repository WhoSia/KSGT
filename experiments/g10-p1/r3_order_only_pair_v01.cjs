"use strict";
/** R3 isolated proposal-order contrast.
 * Both arms get identical source packet, same instructions and all declared edges.
 * No claim of tokenizer equality, causality or natural-language quality.
 */
const crypto=require("node:crypto");
const {sourcePacket}=require("./matched_information_v01.cjs");
const {stableOrder}=require("./dependency_contract_v01.cjs");
const ARMS=Object.freeze(["SOURCE_ORDER_PLAN","DEPENDENCY_ORDER_PLAN"]);
const INSTRUCTION="원천 자료에만 근거하여 독자와 장르에 맞는 자연스러운 한국어 문서를 세 문단으로 작성하세요. 원천의 사실과 모든 작성자 선언 선행관계를 검토하고, 누락·허위 추론을 피하세요. 아래 사실 ID 순서 제안은 참고일 뿐이며 필요한 경우 문서 목적에 맞게 조절하세요. 본문에 사실 ID나 계획 설명은 포함하지 마세요.";
function make(task,arm){
 if(!ARMS.includes(arm))throw Error("UNKNOWN_R3_ARM");
 const packet=sourcePacket(task);
 const ids=arm==="SOURCE_ORDER_PLAN"?task.facts.map(f=>f.id):stableOrder(task);
 const order=ids.join(" → ");
 const messages=[{role:"system",content:"원천에 충실한 한국어 문서 작성자"},{role:"user",content:"원천 자료(JSON):\n"+packet+"\n\n작성 지시:\n"+INSTRUCTION+"\n참고 사실 ID 순서: "+order}];
 return {arm,sourceWork:task.sourceWork||task.id,sourcePacket:packet,
  sourceHash:crypto.createHash("sha256").update(packet).digest("hex"),
  proposedOrder:ids,orderChars:order.length,serializedPromptChars:JSON.stringify(messages).length,
  promptSha256:crypto.createHash("sha256").update(JSON.stringify(messages)).digest("hex"),messages};
}
function pair(task){
 const arms=ARMS.map(a=>make(task,a)),sameSource=arms[0].sourcePacket===arms[1].sourcePacket;
 if(!sameSource)throw Error("SOURCE_INFORMATION_CONFOUND");
 const equalChars=arms[0].serializedPromptChars===arms[1].serializedPromptChars;
 // Character equality is NOT provider-token equality.
 const changed=arms[0].proposedOrder.some((id,i)=>id!==arms[1].proposedOrder[i]);
 return {schema:"ksgt.g10.p1.r3.order-only-pair.v01",sourceWork:task.sourceWork||task.id,
  arms,sameSource,equalSerializedPromptChars:equalChars,planOrderChanged:changed,
  tokenBudgetMatched:false,independentReaderRatings:0,
  caveat:"SAME_INSTRUCTIONS_DIFFERENT_ID_ORDER_ONLY_NO_TOKEN_EQUIVALENCE_OR_QUALITY_CLAIM"};
}
module.exports={ARMS,INSTRUCTION,make,pair};
