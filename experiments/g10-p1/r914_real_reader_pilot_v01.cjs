'use strict';
/* R9.14 genuine Groq model pilot. Strict 3 source-works x 5 generation arms.
 * Only author-created exposed development briefs; no human/semantic gold.
 * No secrets or output text in stdout or GitHub commits.
 */
const fs=require('node:fs'),crypto=require('node:crypto');
const {messages,ARMS,manifest}=require('./g10_axis_factorial_v01.cjs');
const {chat}=require('./provider_client_v01.cjs');
const COHORT_PATH='experiments/g10-p1/fixtures/challenge_cohort_v01.json';
const MODEL='openai/gpt-oss-20b';
const MAX_TOKENS=1050;
const TEMPERATURE=0;
const REQUEST_ID='R914_DIRECT_READER_PILOT_20261109';
function sha(x){return crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');}
function shuffle(items,seed){
 const bytes=crypto.createHash('sha256').update(seed).digest();
 let state=bytes.readUInt32LE(0),out=[...items];
 for(let i=out.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
function validate(cohort){
 const v=manifest(cohort);
 if(v.works!==3||v.plannedCompletions!==15||cohort.schema!=='ksgt.g10.p1.authored-challenge-cohort.v01')throw Error('EXACT_DEVELOPMENT_COHORT_REQUIRED');
 return v;
}
async function execute({cohort,invoke=chat,dryRun=false}){
 validate(cohort);
 const rows=[];
 for(const task of cohort.tasks){
  for(const arm of shuffle(ARMS,REQUEST_ID+':'+task.id)){
   const spec=messages(task,arm);
   const row={workId:task.sourceWork,taskId:task.id,genre:task.genre,arm,sourceSha256:spec.authoritativeSha256,
    promptSha256:sha(spec.messages),model:MODEL,maxTokens:MAX_TOKENS,temperature:TEMPERATURE,
    dimensions:spec.dimensions};
   if(dryRun){row.status='NOT_EXECUTED';rows.push(row);continue;}
   try{
    const r=await invoke({provider:'groq',model:MODEL,messages:spec.messages,temperature:TEMPERATURE,maxTokens:MAX_TOKENS});
    if(!r||typeof r.text!=='string'||!r.text.trim())throw Error('EMPTY_GENERATION');
    if(!r.usage||!Number.isInteger(r.usage.total_tokens))throw Error('USAGE_REQUIRED');
    row.status=r.finishReason==='stop'?'GENERATED':'INCOMPLETE';
    row.text=r.text;row.textSha256=sha(r.text);row.usage=r.usage;
    row.finishReason=r.finishReason;row.responseModel=r.responseModel;row.latencyMs=r.latencyMs;
   }catch(e){row.status='FAILED';row.errorClass=String(e.message||e).replace(/[^A-Z0-9_]/gi,'_').slice(0,70);}
   rows.push(row);
  }
 }
 return {schema:'ksgt.g10.p1.r914.real-generation.v1',requestId:REQUEST_ID,cohortAuthority:'AUTHOR_EXPOSED_DEVELOPMENT',
  model:MODEL,provider:'groq',rows,actualCalls:dryRun?0:rows.length,readerRatings:0,
  qualityWinner:'NOT_EVALUATED',executionMode:dryRun?'DRY_RUN':'REAL_PROVIDER_CALLS',
  caveat:'Prompt character length not matched; results must be judged by independent readers. No retries; failed attempts preserved.'};
}
function summary(result){
 return {schema:'ksgt.g10.p1.r914.safe-summary.v1',requestId:REQUEST_ID,model:MODEL,attempts:result.actualCalls,
  generated:result.rows.filter(x=>x.status==='GENERATED').length,failed:result.rows.filter(x=>x.status==='FAILED').length,
  incomplete:result.rows.filter(x=>x.status==='INCOMPLETE').length,readerRatings:0,
  rows:result.rows.map(x=>({workId:x.workId,arm:x.arm,status:x.status,promptSha256:x.promptSha256,
    textSha256:x.textSha256||null,promptTokens:x.usage?.prompt_tokens??null,
    completionTokens:x.usage?.completion_tokens??null,reasoningTokens:x.usage?.completion_tokens_details?.reasoning_tokens??null,
    totalTokens:x.usage?.total_tokens??null,latencyMs:x.latencyMs??null,errorClass:x.errorClass||null})),
  rawProseExcluded:true,qualityWinner:'NOT_EVALUATED'};
}
async function main(argv){
 const dryRun=argv.length===1&&argv[0]==='--dry-run';
 const live=argv.length===2&&argv[0]==='--execute'&&argv[1].endsWith('.json');
 if(!dryRun&&!live)throw Error('USAGE_DRY_RUN_OR_EXECUTE_OUTPUT_JSON');
 if(live&&!process.env.GROQ_API_KEY)throw Error('GROQ_API_KEY_REQUIRED');
 const cohort=JSON.parse(fs.readFileSync(COHORT_PATH,'utf8'));
 const data=await execute({cohort,dryRun});
 if(live){
   fs.writeFileSync(argv[1],JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
   fs.writeFileSync(argv[1].replace(/\.json$/,'_summary.json'),JSON.stringify(summary(data),null,2)+'\n',{flag:'wx',mode:0o600});
 }
 console.log(JSON.stringify({mode:data.executionMode,rows:data.rows.length,attempts:data.actualCalls,
   generated:data.rows.filter(x=>x.status==='GENERATED').length,failed:data.rows.filter(x=>x.status==='FAILED').length}));
 if(live&&data.rows.some(x=>x.status!=='GENERATED'))process.exitCode=1;
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(String(e.message||e));process.exitCode=1;});
module.exports={MODEL,ARMS,REQUEST_ID,shuffle,validate,execute,summary};
