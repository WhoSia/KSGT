'use strict';
/* R9.23 actual author-exposed Korean writing pipeline.
 * Four Groq calls per work: rich draft, same-draft generic edit,
 * source-aware critique, same-draft critique-conditioned edit.
 * The critique is an unverified model proposal, not human/semantic gold.
 */
const fs=require('node:fs'),crypto=require('node:crypto');
const {chat}=require('./provider_client_v01.cjs');
const MODEL='openai/gpt-oss-20b',PATH='experiments/g10-p1/fixtures/global_document_dev_v01.json';
const STAGES=['RICH_DRAFT','GENERIC_REVISION','CONTEXT_DIAGNOSIS','CONTEXT_REVISION'];
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
function packet(t){if(!t||!Array.isArray(t.facts)||!t.facts.length||!Array.isArray(t.uncertainties))throw Error('SOURCE_REQUIRED');
 return {sourceWork:t.sourceWork,genre:t.genre,audience:t.audience,purpose:t.purpose,facts:t.facts,uncertainties:t.uncertainties};}
function messages(t,stage,{draft,diagnosis}={}){
 if(!STAGES.includes(stage))throw Error('UNKNOWN_STAGE');
 if(stage!=='RICH_DRAFT'&&(!draft||typeof draft!=='string'))throw Error('EXACT_SHARED_DRAFT_REQUIRED');
 if(stage==='CONTEXT_REVISION'&&(!diagnosis||typeof diagnosis!=='string'))throw Error('DIAGNOSIS_REQUIRED');
 const roles={RICH_DRAFT:'한국어 장문 작성자',GENERIC_REVISION:'한국어 문장 전문 편집자',
 CONTEXT_DIAGNOSIS:'원천 대조와 한국어 담화 분석자',CONTEXT_REVISION:'문맥 실현 편집자'};
 const tasks={
  RICH_DRAFT:'제시한 원천에서 독자와 장르에 맞는 한국어 완성문 세 문단을 작성한다. 제목이나 점검 목록은 쓰지 않는다.',
  GENERIC_REVISION:'기존 초안을 자연스럽고 정확한 한국어 세 문단으로 고친다. 독자가 이해할 순서로 정리하고 중복과 과잉 해설을 줄인다. 완성문만 출력한다.',
  CONTEXT_DIAGNOSIS:'원천과 기존 초안을 대조해 잘못된 조건·원인·참여 자격, 인물 지시, 불필요한 반복·방어적 결말·원천 검증 메타 문구를 최대 다섯 항목으로 분석한다. 각 항목은 실제 초안의 단어를 인용하고 근거 없거나 판단 불가한 부분은 미확인으로 적는다. 이는 독립적인 품질 판정이 아니라 편집 참고 자료이다.',
  CONTEXT_REVISION:'기존 초안을 세 문단 완성문으로 고친다. 분석자의 지적은 실제 원천과 초안으로 뒷받침되는 경우만 반영한다. 자연스러운 문단 전환, 화제 유지와 독자의 실제 정보 요구를 중시하고 내부 심사 어휘는 출력하지 않는다. 완성문만 출력한다.'};
 const user={source:packet(t),instruction:tasks[stage]};
 if(stage!=='RICH_DRAFT')user.exactSharedDraft=draft;
 if(stage==='CONTEXT_REVISION')user.modelCritiqueNotGold=diagnosis;
 return [{role:'system',content:roles[stage]+'. 주어진 원천에 없는 동기, 행동, 장소, 고정 주기, 후속 공지 경로나 인과를 단정하지 않는다. 독자용 본문에 체크리스트나 원천 준수 설명을 넣지 않는다.'},{role:'user',content:JSON.stringify(user)}];
}
async function run(cohort,{invoke=chat,dryRun=false}={}){
 if(cohort?.schema!=='ksgt.g10.p1.global-dev-cohort.v01'||cohort.tasks?.length!==3)throw Error('EXACT_DEVELOPMENT_COHORT_REQUIRED');
 const records=[],calls=[];
 for(const t of cohort.tasks){
  const item={sourceWork:t.sourceWork,sourceSha256:sha(packet(t)),draft:null,generic:null,critique:null,contextual:null};
  for(const stage of STAGES){
   const dependence={draft:item.draft?.text,diagnosis:item.critique?.text};
   let msg;
   try{msg=messages(t,stage,dependence)}catch(e){calls.push({sourceWork:t.sourceWork,stage,status:'SKIPPED_DEPENDENCY'});continue;}
   const c={sourceWork:t.sourceWork,stage,model:MODEL,sourceSha256:item.sourceSha256,
      promptSha256:sha(msg),draftSha256:stage==='RICH_DRAFT'?null:sha(item.draft.text),status:'NOT_EXECUTED'};
   if(!dryRun){
    try{const r=await invoke({provider:'groq',model:MODEL,messages:msg,temperature:0,maxTokens:stage==='CONTEXT_DIAGNOSIS'?950:1450});
      if(!r||typeof r.text!=='string'||!r.text.trim()||!Number.isInteger(r.usage?.total_tokens))throw Error('INVALID_PROVIDER_RESULT');
      Object.assign(c,{status:r.finishReason==='stop'?'GENERATED':'INCOMPLETE',text:r.text,textSha256:sha(r.text),
        usage:r.usage,finishReason:r.finishReason,responseModel:r.responseModel,latencyMs:r.latencyMs});
    }catch(e){c.status='FAILED';c.errorClass=String(e?.message||e).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,65);}
   }
   calls.push(c);
   if(c.status==='GENERATED'){
    if(stage==='RICH_DRAFT')item.draft=c;
    if(stage==='GENERIC_REVISION')item.generic=c;
    if(stage==='CONTEXT_DIAGNOSIS')item.critique=c;
    if(stage==='CONTEXT_REVISION')item.contextual=c;
   }
  }
  records.push(item);
 }
 return {schema:'ksgt.r923.real-groq-pipeline.v1',model:MODEL,cohort:'EXPOSED_AUTHOR_DEV',records,calls,
  newModelCalls:dryRun?0:calls.filter(x=>x.status!=='SKIPPED_DEPENDENCY').length,
  readerQualityRatings:0,independentSemanticGold:0,trainingUpdates:0,mode:dryRun?'DRY_RUN':'REAL_API_ATTEMPT',
  caveat:'Generic edit uses one call; context edit uses a diagnosis plus editing call. Neither arm is cost matched nor independently rated.'};
}
function summary(d){
 return {schema:'ksgt.r923.safe-summary.v1',model:d.model,mode:d.mode,newModelCalls:d.newModelCalls,
  statusCounts:d.calls.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),readerQualityRatings:0,trainingUpdates:0,rawTextIncluded:false,
  works:d.records.map(x=>({sourceWork:x.sourceWork,sourceSha256:x.sourceSha256,
   draftHash:x.draft?.textSha256||null,genericHash:x.generic?.textSha256||null,
   contextualHash:x.contextual?.textSha256||null,
   sameDraftForBothEditors:!!(x.generic&&x.contextual&&x.generic.draftSha256===x.contextual.draftSha256)})),
  calls:d.calls.map(r=>({sourceWork:r.sourceWork,stage:r.stage,status:r.status,
    promptHash:r.promptSha256||null,outputHash:r.textSha256||null,
    promptTokens:r.usage?.prompt_tokens??null,completionTokens:r.usage?.completion_tokens??null,
    reasoningTokens:r.usage?.completion_tokens_details?.reasoning_tokens??null,
    totalTokens:r.usage?.total_tokens??null,latencyMs:r.latencyMs??null,errorClass:r.errorClass||null}))};
}
async function main(args){
 const dry=args.length===1&&args[0]==='--dry-run',live=args.length===2&&args[0]==='--execute'&&/\.json$/.test(args[1]);
 if(!dry&&!live)throw Error('USAGE_DRY_RUN_OR_EXECUTE');
 if(live&&!process.env.GROQ_API_KEY)throw Error('GROQ_API_KEY_REQUIRED');
 const cohort=JSON.parse(fs.readFileSync(PATH,'utf8')),d=await run(cohort,{dryRun:dry});
 if(live){fs.writeFileSync(args[1],JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
   fs.writeFileSync(args[1].replace(/\.json$/,'.safe.json'),JSON.stringify(summary(d),null,2)+'\n',{flag:'wx',mode:0o600});}
 console.log(JSON.stringify({mode:d.mode,sourceWorks:d.records.length,actualCalls:d.newModelCalls,
    generated:d.calls.filter(x=>x.status==='GENERATED').length,
    failed:d.calls.filter(x=>x.status!=='GENERATED'&&x.status!=='SKIPPED_DEPENDENCY'&&x.status!=='NOT_EXECUTED').length}));
 if(live&&d.calls.some(x=>x.status!=='GENERATED'))process.exitCode=1;
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(String(e?.message||e));process.exitCode=1});
module.exports={MODEL,STAGES,packet,messages,run,summary};
