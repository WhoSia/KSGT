"use strict";
/** R3 paired run; dry-run by default, no secret or real call unless explicitly enabled.
 * Exposed synthetic sources; not a confirmatory reader experiment.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const {pair}=require("./r3_order_only_pair_v01.cjs");
const {chat}=require("./provider_client_v01.cjs");
function validateRequest(req) {
 if(req?.schema!=="ksgt.g10.p1.r3.request.v01"||
    req.provider!=="groq"||typeof req.model!=="string"||!req.model.trim()||
    !Number.isInteger(req.maxTokens)||req.maxTokens<500||req.maxTokens>2300||
    !Number.isFinite(req.temperature)||req.temperature<0||req.temperature>1||
    req.sourcePolicy!=="EXPOSED_SYNTHETIC_DEVELOPMENT")throw Error("INVALID_R3_REQUEST");
 return req;
}
function cohortGate(cohort){
 if(cohort?.schema!=="ksgt.g10.p1.r2.development-fixtures.v01"||
 cohort?.evidence!=="AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT_NOT_HOLDOUT"||
 !Array.isArray(cohort.tasks)||cohort.tasks.length<1||
 new Set(cohort.tasks.map(t=>t.sourceWork)).size!==cohort.tasks.length)throw Error("INVALID_R3_COHORT");
 return cohort;
}
function plan(cohort,req){
 cohortGate(cohort);validateRequest(req);
 const pairs=cohort.tasks.map(task=>pair(task));
 const eligible=pairs.filter(p=>p.planOrderChanged);
 return {schema:"ksgt.g10.p1.r3.preflight.v01",sourceWorks:pairs.length,
  identifiableOrderPairs:eligible.length,noOrderContrastPairs:pairs.length-eligible.length,
  assignedEligibleCalls:eligible.length*2,matchedSource:true,
  matchedPromptCharacters:pairs.every(p=>p.equalSerializedPromptChars),matchedProviderTokens:false,
  humanRatings:0,modelOutputs:0,
  pairs:pairs.map(p=>({sourceWork:p.sourceWork,planOrderChanged:p.planOrderChanged,
   equalPromptChars:p.equalSerializedPromptChars,sourceHash:p.arms[0].sourceHash,
   arms:p.arms.map(a=>({arm:a.arm,promptSha256:a.promptSha256,promptChars:a.serializedPromptChars}))}))};
}
async function run(cohort,req,{dryRun=true,invoke=chat}={}){
 const preflight=plan(cohort,req);
 const records=[];
 for(const task of cohort.tasks){
  const p=pair(task);
  if(!p.planOrderChanged){
   records.push({sourceWork:p.sourceWork,status:"NO_INTERVENTION",reason:"IDENTICAL_PROMPT_ORDER",modelCalls:0});
   continue;
  }
  // Counterbalanced by immutable source-work hash, never post-outcome choice.
  const flip=parseInt(crypto.createHash("sha256").update(task.sourceWork).digest("hex").slice(0,2),16)%2;
  const arms=flip?[...p.arms].reverse():p.arms;
  for(const a of arms){
   const row={sourceWork:p.sourceWork,model:req.model,provider:req.provider,arm:a.arm,
    sourceHash:a.sourceHash,promptSha256:a.promptSha256,promptChars:a.serializedPromptChars,
    maxTokens:req.maxTokens,temperature:req.temperature};
   if(dryRun){row.status="NOT_EXECUTED";records.push(row);continue;}
   try{
    const response=await invoke({provider:req.provider,model:req.model,messages:a.messages,
     temperature:req.temperature,maxTokens:req.maxTokens});
    if(typeof response.text!=="string"||!response.text.trim())throw Error("EMPTY_GENERATION");
    Object.assign(row,{status:"GENERATED",text:response.text,usage:response.usage||null,
     latencyMs:response.latencyMs??null,responseModel:response.responseModel||req.model,
     finishReason:response.finishReason??null});
   }catch(e){row.status="FAILED";row.failureClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,"_").slice(0,60);}
   records.push(row);
  }
 }
 return {schema:"ksgt.g10.p1.r3.execution-ledger.v01",
  status:dryRun?"DRY_RUN_NO_PROVIDER_CALLS":"API_ATTEMPTED",
  request:{...req},preflight,records,
  generated:records.filter(r=>r.status==="GENERATED").length,
  failures:records.filter(r=>r.status==="FAILED").length,
  humanRatings:0,authority:"DEVELOPMENT_ONLY_NO_COMPREHENSION_OR_QUALITY_GOLD"};
}
async function main(){
 const args=process.argv.slice(2),dryRun=args.includes("--dry-run");
 const argv=args.filter(a=>a!=="--dry-run");
 if(argv.length!==2||argv[0]!=="--request")throw Error("USAGE: --request file [--dry-run]");
 if(!dryRun)throw Error("CLI_REAL_RUN_DISABLED_USE_EXPLICIT_APPROVED_RUNNER");
 const req=JSON.parse(fs.readFileSync(argv[1],"utf8"));
 const cohort=JSON.parse(fs.readFileSync("experiments/g10-p1/fixtures/r2_matched_information_dev_v01.json","utf8"));
 process.stdout.write(JSON.stringify(await run(cohort,req,{dryRun:true}),null,2)+"\n");
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={validateRequest,cohortGate,plan,run};
