"use strict";
/** Source-work-clustered four-arm experiment. Never infers human preference.
 * Node 22; outputs retained only in LOCAL files by caller; no uploaded passages.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {chat}=require("./provider_client_v01.cjs");
const {makeMessages,validateTask}=require("./compare.cjs");
const {build,compactPromptPlan,validate}=require("./discourse_plan_v02.cjs");
const {realize,brief}=require("./korean_realization_v03.cjs");
const ARMS=Object.freeze(["DIRECT","RICH_PROMPT","DISCOURSE_GUIDED","LICENSED_PLAN_V02","KOREAN_REALIZATION_V03"]);
function sourceAnnotations(task){
 if(!task.factAnnotations && !task.relations)return "";
 const a=(task.factAnnotations||[]).map((x,i)=>
  "F"+(i+1)+" "+x.move+" / "+(x.evidence||"UNSPECIFIED")+" / entity="+(x.entity||"미지정")).join("; ");
 const r=(task.relations||[]).map(x=>"F"+x.from+" "+x.type+" F"+x.to).join("; ");
 return "원천에서 명시한 메타정보(새 사실이 아님):\n정보 상태: "+(a||"미제공")+
  "\n허가된 담화 관계: "+(r||"미제공");
}
function messages(arm,task){
 if(!ARMS.includes(arm))throw Error("UNKNOWN_ARM");
 validate(task);
 const annotations=sourceAnnotations(task);
 let ms;
 if(arm==="LICENSED_PLAN_V02"||arm==="KOREAN_REALIZATION_V03"){
   const baseline=makeMessages("DIRECT",task);
   ms=[
    baseline[0],
    {role:"user",content:
      "다음 원천만 사용해 한국어 문단 본문을 작성하세요. 먼저 주어진 담화 관계와 정보 상태를 반영하세요. 근거가 없는 인과·비교·지시 대상·감정은 만들지 마세요. 정보구조에 맞는 조사와 생략을 선택하되, 구성 항목을 기계적으로 문장에 나열하지 마세요.\n"+
       (arm==="LICENSED_PLAN_V02"?compactPromptPlan(task):"출처 근거 담화 계획:\n"+compactPromptPlan(task)+"\n선택 가능한 한국어 정보구조 실현 단서(지침이 아니라 진단 가설):\n"+brief(task))+"\n\n"+baseline[1].content}
   ];
 } else ms=makeMessages(arm,task);
 // Give all rivals the SAME author-supplied facts, discourse relations and
 // epistemic annotations. This avoids a privileged-information confound.
 if(annotations)ms[1].content+="\n\n"+annotations;
 return ms;
}
function seededOrder(arms,seed){
 let state=crypto.createHash("sha256").update(String(seed)).digest().readUInt32LE(0);
 const out=[...arms];
 for(let i=out.length-1;i>0;i--){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const j=state%(i+1);[out[i],out[j]]=[out[j],out[i]];
 }
 return out;
}
function validateCohort(cohort){
 if(!cohort||!Array.isArray(cohort.tasks)||!cohort.tasks.length)throw Error("COHORT_TASKS_REQUIRED");
 const ids=new Set(),groups=new Set();
 for(const item of cohort.tasks){
  validate(item);validateTask(item);
  if(!item.sourceWork||typeof item.sourceWork!=="string"||!item.sourceWork.trim())throw Error("SOURCE_WORK_REQUIRED");
  if(ids.has(item.id))throw Error("DUPLICATE_TASK_ID");ids.add(item.id);
  groups.add(item.sourceWork);
 }
 return {tasks:cohort.tasks.length,sourceWorks:groups.size};
}
function promptHash(messages){
 return crypto.createHash("sha256").update(JSON.stringify(messages)).digest("hex");
}
async function request(messages,model,temperature,maxTokens,provider){
 return chat({provider,model,messages,temperature,maxTokens});
}

async function run(cohort,options,call=request){
 const counts=validateCohort(cohort);
 if(!Number.isInteger(options.maxTokens)||options.maxTokens<1)throw Error("INVALID_MAX_TOKENS");
 if(!Number.isFinite(options.temperature)||options.temperature<0||options.temperature>2)throw Error("INVALID_TEMPERATURE");
 const runLive=options.mode==="run";
 if(runLive&&!options.injected){
  if(!options.model||!options.provider)throw Error("MODEL_AND_PROVIDER_REQUIRED");
  const envName=options.provider==="groq"?"GROQ_API_KEY":options.provider==="openai"?"OPENAI_API_KEY":null;
  if(!envName)throw Error("UNSUPPORTED_PROVIDER");
  if(!process.env[envName])throw Error(envName+"_REQUIRED");
 }
 if(!runLive&&options.mode!=="dry-run")throw Error("EXPLICIT_MODE_REQUIRED");
 const output={schema:"ksgt.g10.p1.paired-generation.v02",status:runLive?"MODEL_REQUESTS_ATTEMPTED":"DRY_RUN_NO_MODEL_CALLS",
  model:options.model||null,provider:options.provider||"INJECTED_OR_DRY_RUN",temperature:options.temperature,maxTokens:options.maxTokens,
  sourceTaskCount:counts.tasks,distinctSourceWorks:counts.sourceWorks,rows:[]};
 for(const task of cohort.tasks){
  const order=seededOrder(ARMS,String(options.seed||0)+":"+task.id);
  for(const arm of order){
   const ms=messages(arm,task);
   const row={taskId:task.id,sourceWork:task.sourceWork,arm,
    promptSha256:promptHash(ms),promptChars:JSON.stringify(ms).length,
    sourceFacts:task.facts.length,uncertainties:task.uncertainties.length,
    planSchema:arm==="KOREAN_REALIZATION_V03"?realize(task).schema:arm==="LICENSED_PLAN_V02"?build(task).schema:arm==="DISCOURSE_GUIDED"?"ksgt.g10.p1.plan.v01":null};
   if(runLive){
    try{
     const result=await call(ms,options.model,options.temperature,options.maxTokens,options.provider);
     Object.assign(row,result,{outcome:"GENERATED"});
    }catch(err){row.outcome="FAILED";row.failureClass=String(err.message||err).replace(/[^A-Z0-9_]/gi,"_").slice(0,80);}
   }else row.outcome="NOT_EXECUTED";
   output.rows.push(row);
  }
 }
 return output;
}
function args(argv){
 const cfg={mode:null,input:null,output:null,provider:null,model:null,temperature:0,maxTokens:420,seed:"0"};
 for(let i=0;i<argv.length;i++){
  let a=argv[i];
  if(a==="--run"||a==="--dry-run"){if(cfg.mode)throw Error("ONE_MODE_ONLY");cfg.mode=a.slice(2)}
  else if(["--input","--output","--provider","--model","--temperature","--max-tokens","--seed"].includes(a)){
   const key={"--input":"input","--output":"output","--provider":"provider","--model":"model","--temperature":"temperature",
      "--max-tokens":"maxTokens","--seed":"seed"}[a];
   if(i+1>=argv.length)throw Error("MISSING_"+a);const v=argv[++i];
   cfg[key]=key==="temperature"||key==="maxTokens"?Number(v):v;
  }else throw Error("UNKNOWN_"+a);
 }
 if(!cfg.mode||!cfg.input)throw Error("EXPLICIT_MODE_AND_INPUT_REQUIRED");
 if(cfg.mode==="run"&&(!cfg.model||!cfg.output||!cfg.provider))throw Error("LIVE_REQUIRES_MODEL_OUTPUT_AND_PROVIDER");
 if(cfg.provider!==null&&!["groq","openai"].includes(cfg.provider))throw Error("INVALID_PROVIDER");
 return cfg;
}
async function main(){
 const cfg=args(process.argv.slice(2)),c=JSON.parse(fs.readFileSync(path.resolve(cfg.input),"utf8"));
 const report=await run(c,cfg);
 if(cfg.output){
  const target=path.resolve(cfg.output);
  fs.writeFileSync(target,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
  process.stdout.write(JSON.stringify({report:target,rows:report.rows.length,status:report.status})+"\n");
    if(cfg.mode==="run" && report.rows.some(r=>r.outcome!=="GENERATED"||typeof r.text!=="string"||!r.text.trim()))process.exitCode=1;
 }else{
  if(cfg.mode==="run")throw Error("OUTPUT_REQUIRED");
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
 }
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={ARMS,messages,seededOrder,validateCohort,promptHash,run,args};
