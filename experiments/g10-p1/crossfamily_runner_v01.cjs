"use strict";
/** Three-family/model comparative pilot, source-matched and prose-first.
 * Same developer-authored cohort; NOT a held-out human evaluation.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const {validateCohort,seededOrder}=require("./paired_runner_v02.cjs");
const {armMessages}=require("./factorial_runner_v02.cjs");
const {prompt:meaningfulRich}=require("./meaningful_rich_v01.cjs");
const {chat}=require("./provider_client_v01.cjs");
const MODELS=Object.freeze(["openai/gpt-oss-20b","openai/gpt-oss-120b","qwen/qwen3.8-27b"]);
const ARMS=Object.freeze(["RICH_PROMPT","RICH_MEANINGFUL","ROLE_AWARE_PLAN_V05"]);
const SOURCE="experiments/g10-p1/fixtures/challenge_cohort_v01.json";
function validate(request){
 if(request?.schema!=="ksgt.g10.p1.crossfamily-request.v01")throw Error("INVALID_REQUEST_SCHEMA");
 if(request.cohort!==SOURCE)throw Error("PUBLIC_DEVELOPMENT_COHORT_ONLY");
 if(!/^[A-Z0-9_-]{8,72}$/.test(request.id))throw Error("INVALID_REQUEST_ID");
 if(!Number.isInteger(request.maxTokens)||request.maxTokens<500||request.maxTokens>1500)throw Error("INVALID_TOKEN_LIMIT");
 if(typeof request.temperature!=="number"||request.temperature<0||request.temperature>1)throw Error("INVALID_TEMPERATURE");
 if(!/^[A-Za-z0-9_-]{2,80}$/.test(request.seed))throw Error("INVALID_SEED");
 return request;
}
function message(task,arm){
 if(arm==="RICH_MEANINGFUL")return meaningfulRich(task);
 if(!ARMS.includes(arm))throw Error("UNKNOWN_ARM");
 return armMessages(task,arm);
}
async function run(cohort,request,{dryRun=false,invoke=chat}={}){
 validate(request);
 const count=validateCohort(cohort);
 if(count.tasks!==3||count.sourceWorks!==3)throw Error("EXACT_THREE_SOURCE_WORKS_REQUIRED");
 if(!dryRun&&invoke===chat&&!process.env.GROQ_API_KEY)throw Error("GROQ_API_KEY_REQUIRED");
 const rows=[];
 for(const task of cohort.tasks)for(const model of MODELS){
  for(const arm of seededOrder(ARMS,request.seed+":"+task.id+":"+model)){
   const messages=message(task,arm);
   const row={taskId:task.id,sourceWork:task.sourceWork,model,arm,
    promptSha256:crypto.createHash("sha256").update(JSON.stringify(messages)).digest("hex"),
    promptChars:JSON.stringify(messages).length,outcome:dryRun?"NOT_EXECUTED":"ATTEMPTED"};
   if(!dryRun){
    try{
     const x=await invoke({provider:"groq",model,messages,temperature:request.temperature,maxTokens:request.maxTokens});
     if(typeof x.text!=="string"||!x.text.trim())throw Error("EMPTY_COMPLETION");
     Object.assign(row,x,{outcome:"GENERATED"});
    }catch(e){row.outcome="FAILED";row.failureClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,"_").slice(0,64);}
   }
   rows.push(row);
  }
 }
 return {schema:"ksgt.g10.p1.crossfamily-output.v01",id:request.id,
  sourceWorkCount:count.sourceWorks,models:MODELS,arms:ARMS,
  status:dryRun?"DRY_RUN_NO_MODEL_CALLS":"MODEL_REQUESTS_ATTEMPTED",
  caveat:"Three exposed synthetic works, model families unequal size and decoding, no independent human preference.",
  rows};
}
function safeSummary(r){
 return {schema:"ksgt.g10.p1.crossfamily-metadata.v01",id:r.id,
  assigned:r.rows.length,generated:r.rows.filter(x=>x.outcome==="GENERATED").length,
  rows:r.rows.map(x=>({taskId:x.taskId,sourceWork:x.sourceWork,model:x.model,arm:x.arm,
   outcome:x.outcome,promptTokens:x.usage?.prompt_tokens??null,
   completionTokens:x.usage?.completion_tokens??null,
   finishReason:x.finishReason||null,latencyMs:x.latencyMs??null})),
  rawKoreanProse:"EXCLUDED",independentHumanQuality:"NOT_MEASURED"};
}
async function main(){
 const a=process.argv.slice(2),dryRun=a.includes("--dry-run");
 const args=a.filter(x=>x!=="--dry-run");
 if(args.length!==6||args[0]!=="--request"||args[2]!=="--output"||args[4]!=="--summary")throw Error("USAGE --request FILE --output FILE --summary FILE [--dry-run]");
 const request=validate(JSON.parse(fs.readFileSync(args[1],"utf8")));
 const cohort=JSON.parse(fs.readFileSync(request.cohort,"utf8"));
 const r=await run(cohort,request,{dryRun});
 if(args[3]===args[5])throw Error("DISTINCT_FILES_REQUIRED");
 fs.writeFileSync(args[3],JSON.stringify(r,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(args[5],JSON.stringify(safeSummary(r),null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({assigned:r.rows.length,generated:r.rows.filter(x=>x.outcome==="GENERATED").length})+"\n");
 if(!dryRun&&r.rows.some(x=>x.outcome!=="GENERATED"))process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MODELS,ARMS,message,validate,run,safeSummary};
