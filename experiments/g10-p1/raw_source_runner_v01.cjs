"use strict";
/** Raw-source, no-annotation Korean prose experiment:
 * three models × three sources × RICH / meaningful RICH / v06 plans.
 * No human-authored relations or entity labels passed to any arm.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const {messages:baseline,seededOrder,validateCohort}=require("./paired_runner_v02.cjs");
const {prompt:richMeaningful}=require("./meaningful_rich_v01.cjs");
const {plan}=require("./raw_chronology_plan_v06.cjs");
const {chat}=require("./provider_client_v01.cjs");
const MODELS=["openai/gpt-oss-20b","openai/gpt-oss-120b","qwen/qwen3.8-27b"];
const ARMS=["RICH_PROMPT","RICH_MEANINGFUL","RAW_CHRONOLOGY_V06"];
const COHORT="experiments/g10-p1/fixtures/challenge_cohort_v01.json";
function strip(task){
 const {factAnnotations,relations,...raw}=task;
 return raw;
}
function messages(task,arm){
 const bare=strip(task);
 if(arm==="RICH_PROMPT")return baseline("RICH_PROMPT",bare);
 if(arm==="RICH_MEANINGFUL")return richMeaningful(bare);
 if(arm!=="RAW_CHRONOLOGY_V06")throw Error("UNKNOWN_ARM");
 const copy=richMeaningful(bare);
 const p=plan(bare);
 copy[1].content+="\n\n확실한 원천 표현에서만 추출한 보조 계획:\n"+p.prompt;
 return copy;
}
function validate(req){
 if(req?.schema!=="ksgt.g10.p1.raw-source-request.v01")throw Error("INVALID_REQUEST_SCHEMA");
 if(req.cohort!==COHORT)throw Error("FIXED_AUTHOR_SOURCE_REQUIRED");
 if(!/^[A-Z0-9_-]{8,72}$/.test(req.id))throw Error("INVALID_REQUEST_ID");
 if(!/^[A-Za-z0-9_-]{2,80}$/.test(req.seed))throw Error("INVALID_SEED");
 if(!Number.isInteger(req.maxTokens)||req.maxTokens<500||req.maxTokens>1500)throw Error("TOKEN_CAP");
 if(typeof req.temperature!=="number"||req.temperature<0||req.temperature>1)throw Error("TEMPERATURE_BOUND");
 return req;
}
async function run(cohort,req,{dryRun=false,invoke=chat}={}){
 validate(req);
 const v=validateCohort(cohort);
 if(v.tasks!==3||v.sourceWorks!==3)throw Error("THREE_AUTHOR_DEVELOPMENT_TASKS_REQUIRED");
 if(!dryRun&&invoke===chat&&!process.env.GROQ_API_KEY)throw Error("GROQ_KEY_REQUIRED");
 const rows=[];
 for(const task of cohort.tasks)for(const model of MODELS)for(const arm of seededOrder(ARMS,req.seed+":"+task.id+":"+model)){
  const ms=messages(task,arm);
  const row={sourceWork:task.sourceWork,taskId:task.id,model,arm,
   promptSha256:crypto.createHash("sha256").update(JSON.stringify(ms)).digest("hex"),
   promptChars:JSON.stringify(ms).length,sourceId:task.id};
  if(dryRun)row.outcome="NOT_EXECUTED";
  else try{
   const x=await invoke({provider:"groq",model,messages:ms,temperature:req.temperature,maxTokens:req.maxTokens});
   if(typeof x.text!=="string"||!x.text.trim())throw Error("NO_TEXT");
   Object.assign(row,x,{outcome:"GENERATED"});
  }catch(e){row.outcome="FAILED";row.failureClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,"_").slice(0,50);}
  rows.push(row);
 }
 return {schema:"ksgt.g10.p1.raw-source-outputs.v01",id:req.id,
  status:dryRun?"DRY_RUN_NO_MODEL_CALLS":"MODEL_REQUESTS_ATTEMPTED",
  models:MODELS,arms:ARMS,sourceCount:v.sourceWorks,
  sourceAnnotationsUsed:false,sourceWorkAuthority:"EXPOSED_AUTHOR_SYNTHETIC_DEVELOPMENT",
  rows};
}
function summary(r){
 return {schema:"ksgt.g10.p1.raw-source-summary.v01",id:r.id,
  assigned:r.rows.length,generated:r.rows.filter(x=>x.outcome==="GENERATED").length,
  noHumanRatings:true,rows:r.rows.map(x=>({sourceWork:x.sourceWork,model:x.model,arm:x.arm,outcome:x.outcome,
   promptTokens:x.usage?.prompt_tokens??null,completionTokens:x.usage?.completion_tokens??null,
   latencyMs:x.latencyMs??null}))};
}
async function main(){
 const a=process.argv.slice(2),dryRun=a.includes("--dry-run"),b=a.filter(x=>x!=="--dry-run");
 if(b.length!==6||b[0]!=="--request"||b[2]!=="--output"||b[4]!=="--summary")throw Error("USAGE --request FILE --output FILE --summary FILE [--dry-run]");
 const req=validate(JSON.parse(fs.readFileSync(b[1],"utf8"))),cohort=JSON.parse(fs.readFileSync(req.cohort,"utf8"));
 const r=await run(cohort,req,{dryRun});
 if(b[3]===b[5])throw Error("SAME_OUTPUT_PATH");
 fs.writeFileSync(b[3],JSON.stringify(r,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(b[5],JSON.stringify(summary(r),null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({assigned:r.rows.length,generated:summary(r).generated})+"\n");
 if(!dryRun&&r.rows.some(x=>x.outcome!=="GENERATED"))process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MODELS,ARMS,strip,messages,validate,run,summary};
