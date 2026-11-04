"use strict";
/** G10-P1 v0.4: crossed model × architecture on real Korean prose.
 * Two-matched-model / four-arm experiment; 24 calls for 3 source works.
 * Does NOT output human preferences, semantic gold or causal proofs.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {messages:existing,seededOrder,validateCohort}=require("./paired_runner_v02.cjs");
const {compact,padBudget}=require("./compact_plan_v04.cjs");
const {chat}=require("./provider_client_v01.cjs");
const ARMS=Object.freeze(["RICH_PROMPT","RICH_CHAR_MATCH","COMPACT_PLAN_V04","ORDER_PERTURBED_V04"]);
const ALLOWED_MODELS=new Set(["openai/gpt-oss-20b","openai/gpt-oss-120b"]);
function armMessages(task,arm){
 if(!ARMS.includes(arm))throw Error("UNRECOGNIZED_ARM");
 const baseline=existing("RICH_PROMPT",task);
 const copy=()=>baseline.map(x=>({...x}));
 if(arm==="RICH_PROMPT")return copy();
 const good=compact(task);
 const planNote="\n\n참고할 문단 구성 계획(원천 사실보다 우선하지 않음):\n"+good.planText;
 if(arm==="RICH_CHAR_MATCH"){
  const x=copy();
  x[1].content=padBudget(x[1].content,x[1].content.length+planNote.length);
  return x;
 }
 const p=arm==="COMPACT_PLAN_V04"?good:compact(task,{perturb:true});
 const x=copy();
 x[1].content+="\n\n참고할 문단 구성 계획(원천 사실보다 우선하지 않음):\n"+p.planText;
 return x;
}
function validateRequest(request){
 if(!request||request.schema!=="ksgt.g10.p1.factorial-request.v01")throw Error("REQUEST_SCHEMA_REQUIRED");
 if(!/^[A-Z0-9_-]{8,72}$/.test(request.requestId))throw Error("INVALID_ID");
 if(request.cohort!=="experiments/g10-p1/fixtures/challenge_cohort_v01.json")throw Error("ONLY_FIXED_SYNTHETIC_CHALLENGE");
 if(!Array.isArray(request.models)||request.models.length!==2||
  new Set(request.models).size!==2||request.models.some(m=>!ALLOWED_MODELS.has(m)))throw Error("TWO_ALLOWED_DISTINCT_MODELS_REQUIRED");
 if(request.seed===undefined||!/^[A-Za-z0-9_-]{2,72}$/.test(request.seed))throw Error("INVALID_SEED");
 if(!Number.isInteger(request.maxTokens)||request.maxTokens<400||request.maxTokens>1500)throw Error("INVALID_BUDGET");
 if(typeof request.temperature!=="number"||request.temperature<0||request.temperature>1)throw Error("INVALID_TEMPERATURE");
 return request;
}
function sha(obj){return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");}
async function run(cohort,request,{dryRun=false,invoke=chat}={}){
 validateRequest(request);
 const v=validateCohort(cohort);
 if(v.tasks!==3||v.sourceWorks!==3)throw Error("FIXED_THREE_DEVELOPMENT_WORKS_REQUIRED");
 if(!dryRun&&invoke===chat&&!process.env.GROQ_API_KEY)throw Error("GROQ_API_KEY_REQUIRED");
 const rows=[];
 for(const task of cohort.tasks){
  for(const model of request.models){
   for(const arm of seededOrder(ARMS,request.seed+":"+task.id+":"+model)){
    const ms=armMessages(task,arm);
    const row={sourceTask:task.id,sourceWork:task.sourceWork,model,arm,
     promptSha256:sha(ms),promptChars:JSON.stringify(ms).length,
     sourceSha256:sha(task.facts),temperature:request.temperature,maxTokens:request.maxTokens};
    if(dryRun)row.outcome="NOT_EXECUTED";
    else{
     try{
      const o=await invoke({provider:"groq",model,messages:ms,
       maxTokens:request.maxTokens,temperature:request.temperature});
      if(typeof o.text!=="string"||!o.text.trim())throw Error("EMPTY_RESPONSE");
      Object.assign(row,o,{outcome:"GENERATED"});
     }catch(e){row.outcome="FAILED";row.failureClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,"_").slice(0,64);}
    }
    rows.push(row);
   }
  }
 }
 return {schema:"ksgt.g10.p1.crossed-model-architecture.v01",
   requestId:request.requestId,provider:"groq",models:request.models,
   sourceWorkCount:v.sourceWorks,temperature:request.temperature,maxTokens:request.maxTokens,
   status:dryRun?"DRY_RUN_NO_MODEL_CALLS":"MODEL_REQUESTS_ATTEMPTED",
   caveat:"Author synthetic development only; char match not actual API-token match; no native reader judgments.",
   rows};
}
function safeSummary(r){
 const count=r.rows.length,generated=r.rows.filter(x=>x.outcome==="GENERATED").length;
 const failure=r.rows.filter(x=>x.outcome==="FAILED");
 const d=r.rows.map(x=>({
  sourceTask:x.sourceTask,sourceWork:x.sourceWork,model:x.model,arm:x.arm,
  promptChars:x.promptChars,promptSha256:x.promptSha256,outcome:x.outcome,
  promptTokens:x.usage?.prompt_tokens??null,completionTokens:x.usage?.completion_tokens??null,
  latencyMs:x.latencyMs??null,failureClass:x.failureClass||null
 }));
 return {schema:"ksgt.g10.p1.crossed-model-architecture-summary.v01",
  requestId:r.requestId,assigned:count,generated,failed:failure.length,rows:d,
  rawProseExcluded:true,humanPreference:"NOT_MEASURED"};
}
function main(){
 const argv=process.argv.slice(2),dryRun=argv.includes("--dry-run");
 const cleaned=argv.filter(x=>x!=="--dry-run");
 if(cleaned.length!==6||cleaned[0]!=="--request"||cleaned[2]!=="--output"||cleaned[4]!=="--summary")
   throw Error("USAGE_--request_PATH_--output_PATH_--summary_PATH_[--dry-run]");
 const req=validateRequest(JSON.parse(fs.readFileSync(cleaned[1],"utf8")));
 const cohort=JSON.parse(fs.readFileSync(req.cohort,"utf8"));
 return run(cohort,req,{dryRun}).then(r=>{
  const dest=path.resolve(cleaned[3]),out=path.resolve(cleaned[5]);
  if(dest===out)throw Error("DISTINCT_RESULT_PATHS_REQUIRED");
  fs.writeFileSync(dest,JSON.stringify(r,null,2)+"\n",{flag:"wx",mode:0o600});
  fs.writeFileSync(out,JSON.stringify(safeSummary(r),null,2)+"\n",{flag:"wx",mode:0o600});
  process.stdout.write(JSON.stringify({requestId:r.requestId,total:r.rows.length,
   generated:r.rows.filter(x=>x.outcome==="GENERATED").length,summary:out})+"\n");
  if(!dryRun&&r.rows.some(x=>x.outcome!=="GENERATED"))process.exitCode=1;
 });
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={ARMS,armMessages,validateRequest,run,safeSummary};
