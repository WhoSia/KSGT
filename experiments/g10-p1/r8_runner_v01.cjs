"use strict";
const fs=require("node:fs"),path=require("node:path");
const {chat}=require("./provider_client_v01.cjs");
const {prompt,preflight}=require("./r8_shared_draft_v01.cjs");
const CONFIG=path.join(__dirname,"fixtures/r8_request_v01.json");
const COHORT=path.join(__dirname,"fixtures/r6_cohort_v01.json");
function gate(c){if(c?.schema!=="ksgt.g10.p1.r8.request.v01"||c.provider!=="groq"||c.model!=="openai/gpt-oss-20b"||c.temperature!==0||c.maxTokens!==900||c.maxCalls!==18)throw Error("INVALID_R8_CONFIG");return c}
async function run(cohort,c,{dryRun=true,invoke}={}){
 const m=preflight(cohort);gate(c);if(!dryRun&&typeof invoke!=="function")throw Error("PROVIDER_NOT_INJECTED");
 let calls=0;const records=[];
 for(const t of cohort.tasks){
  const rec={sourceWork:t.sourceWork,sourceSha256:prompt(t,"BASE_DRAFT").sourceSha256,draft:null,revisions:[]};
  if(dryRun){rec.status="NOT_EXECUTED";records.push(rec);continue}
  const invokeStep=async (p)=>{
   const entry={arm:p.arm,promptSha256:p.promptSha256,sourceSha256:p.sourceSha256,draftSha256:p.draftSha256};
   if(++calls>c.maxCalls)throw Error("CALL_LIMIT");
   try{
    const response=await invoke({provider:c.provider,model:c.model,messages:p.messages,temperature:c.temperature,maxTokens:c.maxTokens});
    if(typeof response?.text!=="string"||!response.text.trim())throw Error("EMPTY_COMPLETION");
    return {...entry,status:"GENERATED",text:response.text,usage:response.usage??null,latencyMs:response.latencyMs??null};
   }catch(e){return {...entry,status:"FAILED",failureClass:String(e.message||e).replace(/[^A-Za-z0-9_]/g,"_").slice(0,64)}}
  };
  rec.draft=await invokeStep(prompt(t,"BASE_DRAFT"));
  if(rec.draft.status==="GENERATED"){
   for(const arm of ["GENERIC_REVISION","SOURCE_ACCOUNTABLE_REVISION"]){
    rec.revisions.push(await invokeStep(prompt(t,arm,rec.draft.text)));
   }
  }
  records.push(rec);
 }
 const all=records.flatMap(r=>r.draft?[r.draft,...r.revisions]:[]);
 return {schema:"ksgt.g10.p1.r8.execution.v01",mode:dryRun?"PREFLIGHT_ONLY":"PROVIDER_INVOKED",config:c,preflight:m,records,calls,assignedCells:m.assignedOutputs,generatedCells:all.filter(r=>r.status==="GENERATED").length,failedCells:all.filter(r=>r.status==="FAILED").length,unattemptedCells:m.assignedOutputs-all.length,humanRatings:0,independentSemanticGold:0};
}
async function main(argv=process.argv.slice(2),env=process.env){
 const dry=argv.length===1&&argv[0]==="--dry-run",live=argv.length===2&&argv[0]==="--execute";
 if(!dry&&!live)throw Error("INVALID_COMMAND");
 const c=gate(JSON.parse(fs.readFileSync(CONFIG,"utf8"))),cohort=JSON.parse(fs.readFileSync(COHORT,"utf8"));
 if(live&&(!env.GROQ_API_KEY||typeof env.GROQ_API_KEY!=="string"))throw Error("MISSING_PROVIDER_KEY");
 const result=await run(cohort,c,{dryRun:dry,invoke:x=>chat(x,env)});
 if(live){
  const filename=path.resolve(argv[1]);if(!filename.endsWith(".json")||fs.existsSync(filename))throw Error("OUTPUT_REFUSED");
  fs.writeFileSync(filename,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 }
 console.log(JSON.stringify({assigned:result.assignedCells,calls:result.calls,generated:result.generatedCells,failed:result.failedCells,unattempted:result.unattemptedCells}));
 if(live&&(result.failedCells||result.unattemptedCells))process.exitCode=1;
 return result;
}
if(require.main===module)main().catch(e=>{console.error(String(e.message||e).replace(/[^A-Za-z0-9_]/g,"_"));process.exitCode=1});
module.exports={gate,run,main};
