'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const cfg=require('./preseal.json'),briefs=require('../source_briefs.json').briefs;
const base=require('../run_baseline_gate.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function preflight(){
 if(cfg.state!=='FROZEN_BEFORE_14B_INFERENCE'||cfg.arm!=='B'||cfg.limits.stage!=='G9-P53'||
 cfg.model.sha256!=='500a8806e85ee9c83f3ae08420295592451379b4f8cf2d0f41c15dffeb6b81f0'||
 cfg.model.backend_commit!=='9c2e0e491a822adae1f0b1c831adb4160057d24f'||
 cfg.inference_order.join(',')!=='SCI02,NAR01,SCI01,NAR02'||
 cfg.primary_unexposed_dev.join(',')!=='SCI02,NAR01'||cfg.exposed_controls.join(',')!=='SCI01,NAR02'||
 cfg.generation.seed!==123005||cfg.generation.temperature!==0.2||cfg.generation.top_p!==0.9||
 cfg.generation.max_tokens!==700||cfg.generation.ctx_size!==3072)throw Error('PRESEAL_MISMATCH');
 if(new Set(cfg.inference_order).size!==4||cfg.inference_order.some(id=>!briefs.some(b=>b.id===id)))throw Error('BRIEF_MISMATCH');
 base.preflight();return true;
}
function prompt(id){preflight();const b=briefs.find(x=>x.id===id);if(!b)throw Error('UNKNOWN_BRIEF');return base.request(b);}
function classify(text){const diagnostic=base.mechanical(text);
 return {...diagnostic,source_semantics:'PENDING_INTERNAL_REVIEW',reader_naturalness:'NOT_MEASURED',coherent_writing:'NOT_PROVEN'};
}
async function run(fetcher=fetch,url=process.env.KSGT_MODEL_URL||'http://127.0.0.1:8912'){
 preflight();const rows=[];
 for(const id of cfg.inference_order){
  const req=prompt(id),brief=briefs.find(b=>b.id===id),start=performance.now();
  let status='FAILED',error=null,output=null,usage=null;
  try{const res=await fetcher(url+'/v1/chat/completions',{method:'POST',
    headers:{'content-type':'application/json'},body:JSON.stringify(req),
    signal:AbortSignal.timeout(cfg.limits.max_request_ms)});
    if(!res.ok)error='HTTP_'+res.status;else{
      const data=await res.json();output=data?.choices?.[0]?.message?.content??null;usage=data?.usage??null;
      if(typeof output==='string'&&output.trim())status='COMPLETED';else error='EMPTY_OUTPUT';
    }
  }catch(e){error=e?.name||'REQUEST_ERROR';}
  rows.push({id,arm:'B',cohort:cfg.primary_unexposed_dev.includes(id)?'PRIMARY_UNEXPOSED_DEV':'EXPOSED_8B_CONTROL',
    status,error,output,output_sha256:typeof output==='string'?hash(output):null,
    prompt_sha256:hash(JSON.stringify(req.messages)),source_sha256:hash(JSON.stringify(brief)),
    mechanical:classify(output),usage,latency_ms:Math.round(performance.now()-start)});
  console.log(JSON.stringify({id,status,cohort:rows.at(-1).cohort,chars:output?.length||0,flags:rows.at(-1).mechanical.flags}));
 }
 return {schema:'ksgt.g9.p53.p0.qwen14b.bonly.readback.v1',model:cfg.model,config_sha256:hash(JSON.stringify(cfg)),
  completed:rows.filter(r=>r.status==='COMPLETED').length,rows,writer_superiority:'NOT_ESTABLISHED',KSGT_vs_B:'NOT_PERFORMED',
  B_competence:'PENDING_SOURCE_AND_PROSE_AUDIT',no_human_rating:true};
}
if(require.main===module){const out=process.argv[2];if(!out)throw Error('USAGE output.json');
run().then(r=>{fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n',{flag:'wx'});if(r.completed!==4)process.exitCode=2})
.catch(e=>{console.error(e);process.exitCode=1});}
module.exports={preflight,prompt,classify,run};