"use strict";
const fs=require("node:fs"),path=require("node:path");
const {chat}=require("./provider_client_v01.cjs");
const {ARMS,decodePlan,messages,preflight}=require("./r7_commitment_pipeline_v01.cjs");
function gate(c){if(c?.schema!=="r7.request.v01"||c.provider!=="groq"||c.model!=="openai/gpt-oss-20b"||c.temperature!==0||c.maxTokens!==900||c.maxCalls!==30)throw Error("INVALID_REQUEST");return c}
async function run(cohort,c,{dryRun=true,invoke}={}){
 const p=preflight(cohort);gate(c);if(!dryRun&&typeof invoke!=="function")throw Error("INVOCATION_REQUIRED");
 const records=[];let calls=0;
 for(const t of cohort.tasks)for(const arm of ARMS){
  const phases=arm==="STRONG_DIRECT"?["final"]:arm==="GENERIC_DRAFT_REVISE"?["draft","final"]:["plan","final"];
  const record={sourceWork:t.sourceWork,arm,steps:[],status:dryRun?"NOT_EXECUTED":"FAILED"};let context="";
  if(!dryRun)for(const phase of phases){
   const req=messages(t,arm,phase,context);if(++calls>c.maxCalls)throw Error("CALL_CAP_EXCEEDED");
   const step={phase,promptSha256:req.promptSha256,sourceSha256:req.sourceSha256};
   try{
    const res=await invoke({provider:c.provider,model:c.model,messages:req.messages,temperature:c.temperature,maxTokens:c.maxTokens});
    if(!res?.text?.trim())throw Error("EMPTY_RESPONSE");
    step.status="GENERATED";step.text=res.text;step.usage=res.usage??null;step.latencyMs=res.latencyMs??null;
    context=phase==="plan"?JSON.stringify(decodePlan(res.text,t)):res.text;
    record.steps.push(step);
   }catch(e){step.status="FAILED";step.failureClass=String(e.message||e).replace(/[^a-z0-9_]/gi,"_").slice(0,60);record.steps.push(step);break}
  }
  if(!dryRun&&record.steps.length===phases.length&&record.steps.every(s=>s.status==="GENERATED"))record.status="GENERATED";
  records.push(record);
 }
 return {schema:"r7.execution.v01",preflight:p,records,calls,assigned:records.length,generated:records.filter(r=>r.status==="GENERATED").length,failed:records.filter(r=>r.status==="FAILED").length,readers:0};
}
async function main(argv=process.argv.slice(2),env=process.env){
 const dry=argv.length===1&&argv[0]==="--dry-run",live=argv.length===2&&argv[0]==="--execute";
 if(!dry&&!live)throw Error("INVALID_COMMAND");
 const c=gate(JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures/r7_request_v01.json"),"utf8")));
 const cohort=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures/r6_cohort_v01.json"),"utf8"));
 if(live&&!env.GROQ_API_KEY)throw Error("PROVIDER_KEY_MISSING");
 const result=await run(cohort,c,{dryRun:dry,invoke:q=>chat(q,env)});
 if(live){const target=path.resolve(argv[1]);if(!target.endsWith(".json")||fs.existsSync(target))throw Error("OUTPUT_EXISTS");fs.writeFileSync(target,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600})}
 console.log(JSON.stringify({assigned:result.assigned,calls:result.calls,generated:result.generated,failed:result.failed}));
 if(result.failed)process.exitCode=1;return result;
}
if(require.main===module)main().catch(e=>{console.error(String(e.message||e).replace(/[^a-z0-9_]/gi,"_"));process.exitCode=1});
module.exports={gate,run,main};
