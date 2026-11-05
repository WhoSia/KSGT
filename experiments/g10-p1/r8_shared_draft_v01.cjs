"use strict";
/** R8 shared-draft controlled revision; this is a generation interface, not a semantic verifier. */
const crypto=require("node:crypto");
const {validate,sourcePacket}=require("./r6_source_license_v01.cjs");
const ARMS=Object.freeze(["BASE_DRAFT","GENERIC_REVISION","SOURCE_ACCOUNTABLE_REVISION"]);
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const WRITER="한국어 작성자. 확인된 정보와 불확실성을 구별하고 자연스러운 완성문만 작성한다.";
const COMMON="원천 JSON의 사실·시간·숫자·부정·불확실성·창작 허용 범위를 지키면서 독자를 위한 자연스러운 한국어 문서를 정확히 세 문단으로 작성하세요. 원천 ID, 소제목, 메타 설명은 본문에 쓰지 마세요.";
function prompt(task,arm,draft){
 validate(task);
 if(!ARMS.includes(arm))throw Error("UNKNOWN_R8_ARM");
 if(arm!=="BASE_DRAFT"&&(typeof draft!=="string"||!draft.trim()))throw Error("SHARED_DRAFT_REQUIRED");
 const packet=sourcePacket(task);
 const base="원천 JSON:\n"+packet+"\n\n";
 let instruction=COMMON;
 if(arm==="BASE_DRAFT")instruction+=" 먼저 초안을 작성하세요.";
 if(arm==="GENERIC_REVISION")instruction+=" 다음 초안에서 부정확하거나 부자연스러운 부분을 확인해 필요한 만큼만 고친 최종 문서만 작성하세요. 문단 흐름과 한국어 문체를 다듬되 원천에 없는 사실을 만들지 마세요.";
 if(arm==="SOURCE_ACCOUNTABLE_REVISION")instruction+=" 다음 초안의 각 사실 주장에 대해 원천의 정확한 문장으로 뒷받침할 수 있는지 확인하세요. 원천에 없는 사건·주기·사물 상태·운영 절차는 삭제하거나 원천에 있는 표현으로 최소한 수정하세요. 원천이 확정한 사건을 가능성으로 약화하지 말고, 미정 사항을 확정하지 마세요. 시점·주체·부정·인과의 확실성을 보존하고, 바꿔야 하는 문장만 고쳐 자연스러운 연결을 유지하세요. 수정 과정은 출력하지 말고 최종 완성문만 작성하세요.";
 if(arm!=="BASE_DRAFT")instruction+="\n\n수정 대상 공통 초안:\n"+draft;
 const messages=[{role:"system",content:WRITER},{role:"user",content:base+instruction}];
 return {arm,sourceWork:task.sourceWork,messages,sourceSha256:sha(packet),draftSha256:arm==="BASE_DRAFT"?null:sha(draft),promptSha256:sha(JSON.stringify(messages))};
}
function preflight(cohort){
 if(cohort?.schema!=="ksgt.g10.p1.r6.dev-cohort.v01"||cohort.authority!=="AUTHOR_AUTHORED_EXPOSED_DEVELOPMENT_NO_EXTERNAL_HOLDOUT"||!Array.isArray(cohort.tasks)||cohort.tasks.length!==6)throw Error("INVALID_COHORT");
 const ids=new Set();for(const t of cohort.tasks){validate(t);if(ids.has(t.sourceWork))throw Error("DUPLICATE_WORK");ids.add(t.sourceWork)}
 return {schema:"ksgt.g10.p1.r8.shared-draft.v01",sourceWorks:6,arms:[...ARMS],assignedOutputs:18,maxProviderCalls:18,independentSourceGold:false,independentHumanReaders:0,tokenBudgetMatched:false};
}
module.exports={ARMS,prompt,preflight};
