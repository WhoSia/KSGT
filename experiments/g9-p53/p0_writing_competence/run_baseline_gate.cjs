'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const config=require('./model_gate.json'),{form,packet}=require('./generate_packet.cjs'),sources=require('./source_briefs.json');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function preflight(){
 const x=config;
 if(x.stage!=='G9-P53'||x.status!=='PRESEALED_PRIOR_TO_QWEN3_8B_COMPLETION'||x.only_arm!=='B'||
 x.subset.join(',')!=='SCI01,NAR02'||x.model.sha256!=='d98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785'||
 packet().prompts!==18||x.decision_contract.writer_improvement!=='NOT_ESTABLISHED')throw Error('PRESEAL_MISMATCH');
 if(new Set(x.subset).size!==x.subset.length||x.subset.some(id=>!sources.briefs.some(b=>b.id===id)))throw Error('UNKNOWN_BRIEF');
 return true;
}
function request(brief){
 return {model:'local-frozen',messages:[
  {role:'system',content:'한국어로 정확하고 자연스러운 완성된 본문을 작성합니다. 출처에 없는 사건·인과관계·감정을 만들어 넣지 마세요. 본문만 출력하세요. /no_think'},
  {role:'user',content:form(brief,'B')+'\n/no_think'}],
  stream:false,seed:config.decoding.seed,temperature:config.decoding.temperature,
  top_p:config.decoding.top_p,max_tokens:config.decoding.max_tokens};
}
function mechanical(text){
 if(typeof text!=='string')return {flags:['NO_TEXT'],paragraph_count:0};
 const s=text.trim(),parts=s.split(/\n\s*\n/u).filter(Boolean),flags=[];
 if(parts.length!==2)flags.push('PARAGRAPH_COUNT_NOT_2');
 if(s.length<70)flags.push('SHORT_TEXT_REVIEW');
 if(/<think>|<\/think>|\bF[1-5]\b|^\s*(?:제목|자료|결론)\s*[:：]/mu.test(s))flags.push('SCAFFOLD_OR_THINK_LEAK_REVIEW');
 return {flags,paragraph_count:parts.length,chars:[...s].length,
  semantic_verdict:'NOT_ADJUDICATED',naturalness_verdict:'NOT_ADJUDICATED'};
}
async function run(fetcher=fetch,url=process.env.KSGT_MODEL_URL||'http://127.0.0.1:8912'){
 preflight();const rows=[];
 for(const id of config.subset){
  const b=sources.briefs.find(x=>x.id===id),req=request(b),t=performance.now();
  let output=null,status='FAILED',failure=null,usage=null;
  try{
   const res=await fetcher(url+'/v1/chat/completions',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req),
    signal:AbortSignal.timeout(config.decoding.request_timeout_ms)});
   if(!res.ok)failure='HTTP_'+res.status;
   else {const p=await res.json();output=p?.choices?.[0]?.message?.content??null;usage=p?.usage??null;
    if(typeof output==='string'&&output.trim())status='COMPLETED';else failure='EMPTY_OUTPUT';}
  }catch(e){failure=String(e?.name||'REQUEST_ERROR');}
  rows.push({id,arm:'B',status,failure,model_output:output,output_sha256:typeof output==='string'?sha(output):null,
   source_sha256:sha(JSON.stringify(b)),prompt_sha256:sha(JSON.stringify(req.messages)),
   decoding:config.decoding,latency_ms:Math.round(performance.now()-t),usage,mechanical:mechanical(output)});
  process.stdout.write(JSON.stringify({id,status,chars:output?.length??null,flags:rows.at(-1).mechanical.flags})+'\n');
 }
 return {schema:'ksgt.g9.p53.p0.baseline-preflight-outcome.v1',instrument_only:true,
  model:config.model,gate_sha256:sha(JSON.stringify(config)),source_sha256:sha(JSON.stringify(sources)),results:rows,
  completed:rows.filter(x=>x.status==='COMPLETED').length,
  competent_korean:'PENDING_INDEPENDENT_MANUAL_REVIEW',krc_comparison:'NOT_PERFORMED',
  human_evaluation:'NOT_PERFORMED',writer_superiority:'NOT_ESTABLISHED'};
}
if(require.main===module)(async()=>{
 const path=process.argv[2];if(!path)throw Error('OUTPUT_PATH_REQUIRED');
 const result=await run();
 fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(result.completed!==config.subset.length)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=1});
module.exports={preflight,request,mechanical,run};