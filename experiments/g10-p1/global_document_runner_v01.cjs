"use strict";
/** Same-model global Korean document study, all arms see identical source facts.
 * No fake gold ratings. One API call per arm. Source work is the statistical unit.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const {map}=require("./global_document_map_v01.cjs");
const {chat}=require("./provider_client_v01.cjs");
const MODELS=["openai/gpt-oss-20b","openai/gpt-oss-120b","qwen/qwen3.8-27b"];
const ARMS=["STRONG_ONE_SHOT","GENERIC_OUTLINE","GLOBAL_MAP","GLOBAL_MAP_ABLATED"];
const PATH="experiments/g10-p1/fixtures/global_document_dev_v01.json";
function validate(req){
 if(req?.schema!=="ksgt.g10.p1.global-document-request.v01")throw Error("INVALID_REQUEST");
 if(req.cohort!==PATH)throw Error("UNAUTHORIZED_COHORT");
 if(!/^[A-Z0-9_-]{8,72}$/.test(req.id))throw Error("INVALID_ID");
 if(!Number.isInteger(req.maxTokens)||req.maxTokens<700||req.maxTokens>2300)throw Error("INVALID_BUDGET");
 if(typeof req.temperature!=="number"||req.temperature<0||req.temperature>1)throw Error("INVALID_TEMPERATURE");
 return req;
}
function messages(task,arm){
 if(!ARMS.includes(arm))throw Error("UNKNOWN_ARM");
 const source=task.facts.map((x,i)=>"F"+(i+1)+": "+x).join("\n");
 const limits=task.uncertainties.map((x,i)=>"U"+(i+1)+": "+x).join("\n");
 const strong="원천에 근거해 정확하고 자연스러운 한국어 문서를 정확히 세 문단으로 작성하세요. 첫 문단은 배경과 독자의 관심사를 제시하고, 둘째 문단은 핵심 내용과 근거를 이해하기 쉽게 전개하며, 셋째 문단은 원천에서 허용하는 결론·한계 또는 행동 지침으로 마무리하세요. 원천 순서에 얽매이지 않고 전역적 구성과 문단 간 연결을 고려하세요. 누락·중복·근거 없는 추론·기한이나 부정의 변경을 피하세요. 문단 외의 제목이나 사실 번호는 출력하지 마세요.";
 let guidance=strong;
 if(arm==="GENERIC_OUTLINE")guidance+="\n일반 개요: 배경과 목적 → 핵심 사건과 근거 → 함의와 한계. 문단마다 이전 문단의 정보가 다음 문단을 이해하도록 연결하세요.";
 if(arm==="GLOBAL_MAP"||arm==="GLOBAL_MAP_ABLATED")
  guidance+="\n외부에서 계산한 문서 정보 분배 제안:\n"+map(task,{ablate:arm==="GLOBAL_MAP_ABLATED"}).prompt;
 return [
 {role:"system",content:"원천에 충실한 한국어 문서 작성자. 입력에 없는 사실을 창작하지 않는다."},
 {role:"user",content:"장르: "+task.genre+"\n독자: "+task.audience+"\n글쓰기 목적: "+task.purpose+
  "\n주어진 사실:\n"+source+"\n미확인 사항:\n"+limits+"\n\n"+guidance}
 ];
}
function countParagraphs(x){return x.trim().split(/\n\s*\n/u).filter(Boolean).length;}
async function run(cohort,req,{dryRun=false,invoke=chat}={}){
 validate(req);
 if(cohort?.schema!=="ksgt.g10.p1.global-dev-cohort.v01"||cohort.tasks?.length!==3)throw Error("EXPECTED_THREE_DEV_WORKS");
 if(!dryRun&&invoke===chat&&!process.env.GROQ_API_KEY)throw Error("GROQ_API_KEY_REQUIRED");
 const rows=[];
 for(const task of cohort.tasks)for(const model of MODELS)for(const arm of ARMS){
  const ms=messages(task,arm);
  const row={sourceWork:task.sourceWork,taskId:task.id,model,arm,
   promptSha256:crypto.createHash("sha256").update(JSON.stringify(ms)).digest("hex"),promptChars:JSON.stringify(ms).length};
  if(dryRun)row.outcome="NOT_EXECUTED";
  else try{
   const result=await invoke({provider:"groq",model,messages:ms,temperature:req.temperature,maxTokens:req.maxTokens});
   if(typeof result.text!=="string"||!result.text.trim())throw Error("EMPTY_GENERATION");
   Object.assign(row,result,{outcome:"GENERATED",observedParagraphs:countParagraphs(result.text)});
  }catch(e){row.outcome="FAILED";row.failureClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,"_").slice(0,60);}
  rows.push(row);
 }
 return {schema:"ksgt.g10.p1.global-document-outputs.v01",id:req.id,status:dryRun?"DRY_RUN_NO_API":"API_ATTEMPTED",rows,
  evidence:"AUTHOR_SYNTHETIC_DEV_NOT_BLIND_HUMAN_GOLD"};
}
function summary(r){return {schema:"ksgt.g10.p1.global-document-summary.v01",id:r.id,assigned:r.rows.length,
 generated:r.rows.filter(x=>x.outcome==="GENERATED").length,humanRatings:0,
 rows:r.rows.map(x=>({sourceWork:x.sourceWork,model:x.model,arm:x.arm,outcome:x.outcome,
  observedParagraphs:x.observedParagraphs??null,promptTokens:x.usage?.prompt_tokens??null,
  completionTokens:x.usage?.completion_tokens??null,latencyMs:x.latencyMs??null}))};}
async function main(){
 const a=process.argv.slice(2),dryRun=a.includes("--dry-run"),b=a.filter(x=>x!=="--dry-run");
 if(b.length!==6||b[0]!=="--request"||b[2]!=="--output"||b[4]!=="--summary")throw Error("USAGE");
 const req=validate(JSON.parse(fs.readFileSync(b[1],"utf8")));
 const cohort=JSON.parse(fs.readFileSync(req.cohort,"utf8"));
 const r=await run(cohort,req,{dryRun});
 if(b[3]===b[5])throw Error("SAME_PATH");
 fs.writeFileSync(b[3],JSON.stringify(r,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(b[5],JSON.stringify(summary(r),null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({assigned:r.rows.length,generated:summary(r).generated})+"\n");
 if(!dryRun&&summary(r).generated!==r.rows.length)process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MODELS,ARMS,messages,validate,run,summary,countParagraphs};
