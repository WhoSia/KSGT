"use strict";
/** R5: sealed three-arm prompts with full-denominator observations. All arms see identical source JSON.
 * No real provider calls unless caller explicitly injects an invocation function.
 */
const crypto=require("node:crypto");
const ARMS=Object.freeze(["STRONG_DIRECT","EXPLICIT_EDGE","GRAPH_ORDER"]);
const SYSTEM="원천과 독자 목적에 충실한 한국어 문서 작성자. 입력에 없는 확정 사실을 창작하지 않는다.";
function fail(message){throw Error(message);}
function validate(task){
 if(!task||!Array.isArray(task.facts)||task.facts.length===0||!Array.isArray(task.edges)||
 !["public_notice","science_explainer","scene_essay"].includes(task.genre)||
 !["id","sourceWork","audience","purpose"].every(k=>typeof task[k]==="string"&&task[k].length))fail("INVALID_TASK");
 const ids=task.facts.map(x=>x.id),s=new Set(ids);
 if(s.size!==ids.length||task.facts.some(x=>!/^F[1-9][0-9]*$/.test(x.id)||typeof x.text!=="string"||!x.text.trim()))fail("INVALID_FACTS");
 const edges=new Set();
 for(const e of task.edges){
  if(!s.has(e.before)||!s.has(e.after)||e.before===e.after||e.type!=="READER_PREREQUISITE"||e.evidence!=="AUTHOR_DECLARED")fail("UNLICENSED_EDGE");
  const k=e.before+":"+e.after;if(edges.has(k))fail("DUPLICATE_EDGE");edges.add(k);
 }
 const out=[],used=new Set();
 for(let i=0;i<ids.length;i++){
  const next=ids.find(id=>!used.has(id)&&task.edges.every(e=>e.after!==id||used.has(e.before)));
  if(!next)fail("CYCLIC_EDGES");out.push(next);used.add(next);
 }
 return out;
}
function sourcePacket(task){validate(task);return JSON.stringify({id:task.id,sourceWork:task.sourceWork,genre:task.genre,audience:task.audience,purpose:task.purpose,facts:task.facts,edges:task.edges});}
function make(task,arm){
 if(!ARMS.includes(arm))fail("UNKNOWN_ARM");
 const order=validate(task),packet=sourcePacket(task);
 const base="같은 원천 자료에 근거하여 독자가 실제로 이해하기 좋은 자연스러운 한국어 문서를 세 문단으로 작성하세요. 글의 목적과 장르에 맞게 내용을 배열하고 신청 조건·예외·불확실성·사건 주체·인과관계를 왜곡하지 마세요. 원천 사실 ID나 계획 번호는 본문에 표시하지 마세요.";
 let instruction=base;
 if(arm==="EXPLICIT_EDGE")instruction+=" 작성자 선언 선행관계를 참고하여 독자에게 필요한 정보의 제시 순서를 직접 판단하세요. 제시되지 않은 선행관계를 새 사실로 만들어서는 안 됩니다.";
 if(arm==="GRAPH_ORDER")instruction+=" 외부 선행관계 정렬 제안: "+order.join(" → ")+". 이 순서는 사실의 선후 이해를 돕기 위한 비강제적 참고안입니다. 글의 자연스러움이나 장르 목적에 어긋나면 조절하세요.";
 const messages=[{role:"system",content:SYSTEM},{role:"user",content:"원천 JSON:\n"+packet+"\n\n작성 지시:\n"+instruction}];
 const key=x=>crypto.createHash("sha256").update(x).digest("hex");
 return {arm,sourceWork:task.sourceWork,sourceSha256:key(packet),promptSha256:key(JSON.stringify(messages)),promptChars:JSON.stringify(messages).length,messages};
}
function preflight(cohort){
 if(cohort?.schema!=="ksgt.g10.p1.r2.development-fixtures.v01"||cohort.evidence!=="AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT_NOT_HOLDOUT"||!Array.isArray(cohort.tasks)||!cohort.tasks.length)fail("UNAUTHORIZED_COHORT");
 const sourceWorks=new Set(),rows=[];
 for(const task of cohort.tasks){
  if(sourceWorks.has(task.sourceWork))fail("DUPLICATE_SOURCE_WORK");sourceWorks.add(task.sourceWork);
  const prompts=ARMS.map(arm=>make(task,arm));
  if(new Set(prompts.map(x=>x.sourceSha256)).size!==1)fail("INFORMATION_PARITY_BROKEN");
  rows.push({sourceWork:task.sourceWork,prompts:prompts.map(({arm,sourceSha256,promptSha256,promptChars})=>({arm,sourceSha256,promptSha256,promptChars}))});
 }
 return {schema:"ksgt.g10.p1.r5.preflight.v01",sourceWorks:sourceWorks.size,assignedCells:rows.length*ARMS.length,realProviderOutputs:0,humanRatings:0,informationMatched:true,providerTokensMatched:false,evidence:"EXPOSED_DEV_PROMPTS_ONLY",rows};
}
function validateConfig(c){if(c?.schema!=="ksgt.g10.p1.r5.request.v01"||c.provider!=="groq"||!/^[-a-z0-9/.]+$/.test(c.model)||!Number.isInteger(c.maxTokens)||c.maxTokens<500||c.maxTokens>1600||!Number.isFinite(c.temperature)||c.temperature<0||c.temperature>1)fail("INVALID_CONFIG");return c;}
async function run(cohort,config,{dryRun=true,invoke}={}){
 const manifest=preflight(cohort);validateConfig(config);
 if(!dryRun&&typeof invoke!=="function")fail("EXPLICIT_PROVIDER_INVOKER_REQUIRED");
 const rows=[];
 for(const task of cohort.tasks)for(const arm of ARMS){
  const p=make(task,arm);
  const row={sourceWork:task.sourceWork,arm,model:config.model,provider:config.provider,sourceSha256:p.sourceSha256,promptSha256:p.promptSha256,promptChars:p.promptChars,maxTokens:config.maxTokens,temperature:config.temperature};
  if(dryRun){rows.push({...row,outcome:"NOT_EXECUTED"});continue;}
  try{
   const result=await invoke({provider:config.provider,model:config.model,messages:p.messages,temperature:config.temperature,maxTokens:config.maxTokens});
   if(typeof result?.text!=="string"||!result.text.trim())fail("EMPTY_GENERATION");
   rows.push({...row,outcome:"GENERATED",text:result.text,usage:result.usage??null,latencyMs:result.latencyMs??null,finishReason:result.finishReason??null});
  }catch(e){rows.push({...row,outcome:"FAILED",failureClass:String(e.message||e).replace(/[^a-z0-9_]/gi,"_").slice(0,80)});}
 }
 return {schema:"ksgt.g10.p1.r5.execution-ledger.v01",status:dryRun?"NO_API_EXECUTED":"PROVIDER_INVOKER_ATTEMPTED",manifest,records:rows,assigned:rows.length,generated:rows.filter(x=>x.outcome==="GENERATED").length,failed:rows.filter(x=>x.outcome==="FAILED").length,humanRatings:0};
}
module.exports={ARMS,make,preflight,validateConfig,run};
