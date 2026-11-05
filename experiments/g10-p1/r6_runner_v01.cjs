"use strict";
/** R6 actual provider execution. Explicit --execute required and only 18 fixed cells possible. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ARM_NAMES,build,preflight}=require('./r6_source_license_v01.cjs');
const {chat}=require('./provider_client_v01.cjs');
const COHORT=path.join(__dirname,'fixtures/r6_cohort_v01.json');
const REQUEST=path.join(__dirname,'fixtures/r6_request_v01.json');
function configGate(c){if(c?.schema!=='ksgt.g10.p1.r6.request.v01'||c.provider!=='groq'||
 c.model!=='openai/gpt-oss-20b'||c.temperature!==0||c.maxTokens!==900||c.maxCalls!==18||c.provenance!=='EXPOSED_AUTHOR_DEVELOPMENT')throw Error('INVALID_FROZEN_CONFIG');return c}
function rotationFor(sourceWork){return parseInt(crypto.createHash('sha256').update(sourceWork).digest('hex').slice(0,8),16)%ARM_NAMES.length}
function rows(cohort){preflight(cohort);return cohort.tasks.flatMap(t=>{const shift=rotationFor(t.sourceWork);return ARM_NAMES.map((_,i)=>build(t,ARM_NAMES[(i+shift)%ARM_NAMES.length]))})}
async function run(cohort,c,{dryRun=true,invoke}={}){
 const pre=preflight(cohort);configGate(c);
 if(!dryRun&&typeof invoke!=='function')throw Error('PROVIDER_INVOKER_NOT_INJECTED');
 const ordered=rows(cohort);if(ordered.length!==c.maxCalls)throw Error('COUNT_LIMIT_VIOLATION');
 const result=[];
 for(const p of ordered){const base={sourceWork:p.sourceWork,arm:p.arm,model:c.model,sourceSha256:p.sourceSha256,promptSha256:p.promptSha256,promptChars:p.promptChars,creativeLicense:'IN_SOURCE_JSON'};
  if(dryRun){result.push({...base,status:'NOT_EXECUTED'});continue}
  try{
   const a=await invoke({provider:c.provider,model:c.model,messages:p.messages,temperature:c.temperature,maxTokens:c.maxTokens});
   if(typeof a?.text!=='string'||!a.text.trim())throw Error('EMPTY_TEXT');
   result.push({...base,status:'GENERATED',text:a.text,usage:a.usage??null,latencyMs:a.latencyMs??null,finishReason:a.finishReason??null,responseModel:a.responseModel??c.model});
  }catch(e){result.push({...base,status:'FAILED',failureClass:String(e.message||e).replace(/[^A-Za-z0-9_]/g,'_').slice(0,70)});}
 }
 return {schema:'ksgt.g10.p1.r6.provider-ledger.v01',kind:dryRun?'PREFLIGHT_NO_API':'PROVIDER_ATTEMPTED',cohortAuthority:cohort.authority,config:c,preflight:pre,rows:result,assigned:result.length,generated:result.filter(r=>r.status==='GENERATED').length,failures:result.filter(r=>r.status==='FAILED').length,humanRatings:0,independentSemanticGold:0};
}
async function main(argv=process.argv.slice(2),env=process.env){
 const dry=argv.length===1&&argv[0]==='--dry-run';const live=argv.length===2&&argv[0]==='--execute';
 if(!dry&&!live)throw Error('USAGE_DRY_RUN_OR_EXECUTE_OUTPUT');
 const cohort=JSON.parse(fs.readFileSync(COHORT,'utf8')),config=configGate(JSON.parse(fs.readFileSync(REQUEST,'utf8')));
 if(dry){const a=await run(cohort,config,{dryRun:true});process.stdout.write(JSON.stringify({assigned:a.assigned,generated:a.generated,sourceWorks:a.preflight.sourceWorks,matchedSourceInfo:a.preflight.matchedSourceInfo})+'\n');return a;}
 if(typeof env.GROQ_API_KEY!=='string'||!env.GROQ_API_KEY.trim())throw Error('MISSING_GROQ_API_KEY');
 const target=path.resolve(argv[1]);if(!target.endsWith('.json')||fs.existsSync(target))throw Error('INVALID_OR_EXISTING_OUTPUT');
 const a=await run(cohort,config,{dryRun:false,invoke:x=>chat(x,env)});
 fs.writeFileSync(target,JSON.stringify(a,null,2)+'\n',{flag:'wx',mode:0o600});
 process.stdout.write(JSON.stringify({assigned:a.assigned,generated:a.generated,failures:a.failures,outputPath:path.basename(target)})+'\n');if(a.failures)process.exitCode=1;return a;
}
if(require.main===module)main().catch(e=>{console.error(String(e.message||e).replace(/[^A-Z0-9_]/gi,'_'));process.exitCode=1});
module.exports={configGate,rotationFor,rows,run,main};
