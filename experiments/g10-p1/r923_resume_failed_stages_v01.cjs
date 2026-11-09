'use strict';
/** R9.23 no-repeat continuation from first immutable failed Groq artifact.
 * Never discard truncated output; never re-call successful stages.
 * New attempts append to the original raw evidence, stage final state separated.
 */
const fs=require('node:fs'),crypto=require('node:crypto');
const {chat}=require('./provider_client_v01.cjs');
const {MODEL,messages,packet,summary}=require('./r923_actual_role_pipeline_v01.cjs');
const cohortPath='experiments/g10-p1/fixtures/global_document_dev_v01.json';
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
async function resume(before,cohort,{invoke=chat,dryRun=false}={}){
 if(before?.schema!=='ksgt.r923.real-groq-pipeline.v1'||before.records?.length!==3||
   before.mode!=='REAL_API_ATTEMPT'||cohort.tasks?.length!==3)throw Error('FIRST_RUN_AND_COHORT_REQUIRED');
 const d=structuredClone(before),priorCount=d.calls.length;let attempts=0;
 for(let i=0;i<3;i++){
  const t=cohort.tasks[i],v=d.records[i];
  if(t.sourceWork!==v.sourceWork||sha(packet(t))!==v.sourceSha256)throw Error('SOURCE_DRIFT');
  if(!v.draft||!v.generic||sha(v.draft.text)!==v.draft.textSha256||
    sha(v.generic.text)!==v.generic.textSha256||v.generic.draftSha256!==v.draft.textSha256)
      throw Error('PRIOR_SUCCESS_DRAFT_OR_GENERIC_REQUIRED');
  for(const stage of ['CONTEXT_DIAGNOSIS','CONTEXT_REVISION']){
   const field=stage==='CONTEXT_DIAGNOSIS'?'critique':'contextual';
   if(v[field]?.status==='GENERATED')continue;
   if(stage==='CONTEXT_REVISION'&&v.critique?.status!=='GENERATED')throw Error('CRITIQUE_NOT_READY');
   const ms=messages(t,stage,{draft:v.draft.text,diagnosis:v.critique?.text});
   const r={sourceWork:t.sourceWork,stage,model:MODEL,sourceSha256:v.sourceSha256,
     promptSha256:sha(ms),draftSha256:v.draft.textSha256,status:'NOT_EXECUTED',retryOf:'FIRST_RUN_INCOMPLETE_OR_BLOCKED'};
   if(!dryRun){
    attempts++;
    try{
     const x=await invoke({provider:'groq',model:MODEL,messages:ms,temperature:0,maxTokens:stage==='CONTEXT_DIAGNOSIS'?1800:1450});
     if(!x||!x.text?.trim()||!Number.isInteger(x.usage?.total_tokens))throw Error('INVALID_RETRY_RESPONSE');
     Object.assign(r,{status:x.finishReason==='stop'?'GENERATED':'INCOMPLETE',text:x.text,textSha256:sha(x.text),
      usage:x.usage,finishReason:x.finishReason,responseModel:x.responseModel,latencyMs:x.latencyMs});
    }catch(e){r.status='FAILED';r.errorClass=String(e?.message||e).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,65);}
   }
   d.calls.push(r);
   if(r.status==='GENERATED')v[field]=r;
   if(r.status!=='GENERATED')break;
  }
 }
 d.newModelCalls=before.newModelCalls+attempts;
 d.mode='RETRY_COLD_READ_COMPLETED';
 d.initialCallCount=priorCount;
 d.retryCalls=attempts;
 d.originalFailedAttemptsRetained=true;
 d.finalStageSlots=d.records.reduce((n,r)=>n+['draft','generic','critique','contextual'].filter(k=>r[k]?.status==='GENERATED').length,0);
 d.firstRunEvidenceSha256=sha(before);
 return d;
}
async function main(argv){
 if(argv.length!==3||argv[0]!=='--resume'||!argv[2].endsWith('.json'))throw Error('USAGE_--resume_FIRST_JSON_OUTPUT_JSON');
 if(!process.env.GROQ_API_KEY)throw Error('GROQ_API_KEY_REQUIRED');
 const before=JSON.parse(fs.readFileSync(argv[1],'utf8'));
 const cohort=JSON.parse(fs.readFileSync(cohortPath,'utf8'));
 const d=await resume(before,cohort);
 fs.writeFileSync(argv[2],JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(argv[2].replace(/\.json$/,'.safe.json'),JSON.stringify({...summary(d),
   originalFailedAttemptsRetained:d.originalFailedAttemptsRetained,finalStageSlots:d.finalStageSlots,
   retryCalls:d.retryCalls,firstRunEvidenceSha256:d.firstRunEvidenceSha256},null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({priorCallRows:d.initialCallCount,retryProviderCalls:d.retryCalls,
   cumulativeProviderCalls:d.newModelCalls,completedStageSlots:d.finalStageSlots,
   originalFailedAttemptsRetained:true}));
 if(d.finalStageSlots!==12)process.exitCode=1;
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(String(e?.message||e));process.exitCode=1});
module.exports={resume};
