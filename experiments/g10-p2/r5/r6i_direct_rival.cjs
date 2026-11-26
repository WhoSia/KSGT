'use strict';
// Investigator-authored synthetic sources only. No corpus text or user information.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const MODEL='openai/gpt-oss-120b',MAX=1200;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const {states,facts,realize}=require('./r6i_epistemic_realizer.cjs');
const works=states.map(state=>({id:'SCI_'+state.join(''),state,facts:facts(state)}));
const arms=['DIRECT_RICH'];
const system='한국어 과학 보고서를 능숙하게 작성하는 편집자입니다. 제공된 정보를 정확하게 유지하며 자연스러운 한 문단만 출력하세요. 관찰 결과와 실제 결과를 구별하고, 확인하지 못했다는 것은 결과가 없었다거나 측정하지 않았다는 뜻이 아닙니다. 다른 실험 조건, 수치, 원인, 향후 연구 계획을 추가하지 마세요. 문장 결합과 어휘 선택은 자유롭습니다.';
function messages(w,arm){if(arm!=='DIRECT_RICH')throw Error('BAD_ARM');return [{role:'system',content:system},{role:'user',content:'확인된 정보:\n'+w.facts.join('\n')+'\n위 정보로 결과 및 기록 범위를 설명하는 한 문단을 작성하세요.'}]}
function plan(){return works.map(w=>{const m=messages(w,'DIRECT_RICH');return {id:w.id+'_DIRECT_RICH',work:w.id,arm:'DIRECT_RICH',sourceSHA:sha(w),messages:m,promptSHA:sha(m)}})}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600})}
async function run(root,invoke){
 const cells=plan();fs.mkdirSync(root,{mode:0o700});write(path.join(root,'plan.json'),{model:MODEL,maxTokens:MAX,temperature:0,authority:'INVESTIGATOR_AUTHORED_DEVELOPMENT_ONLY',works,cells});
 const rows=[];
 for(const c of cells){
   write(path.join(root,c.id+'.attempt.json'),{id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA});
   let r;
   try{const out=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,work:c.work,arm:c.arm,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,responseModel:out.responseModel,finishReason:out.finishReason,text:out.text,textSHA:typeof out.text==='string'?sha(out.text):null,usage:out.usage,latencyMs:out.latencyMs,status:out.finishReason==='stop'&&out.responseModel===MODEL&&typeof out.text==='string'&&out.text.trim()&&Number.isInteger(out.usage?.total_tokens)&&out.usage.total_tokens>0?'GENERATED':'INCOMPLETE'}}catch(e){r={id:c.id,work:c.work,arm:c.arm,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')}}
   write(path.join(root,c.id+'.result.json'),r);rows.push(r);
   if(r.status!=='GENERATED')break;
 }
 const summary={planned:cells.length,attempted:rows.length,complete:rows.filter(x=>x.status==='GENERATED').length,independentReaders:0,qualitySuperiority:'NOT_ESTABLISHED',byArm:Object.fromEntries(arms.map(a=>[a,{complete:rows.filter(x=>x.arm===a&&x.status==='GENERATED').length,tokens:rows.filter(x=>x.arm===a).reduce((n,x)=>n+(x.usage?.total_tokens||0),0)}]))};
 write(path.join(root,'summary.json'),summary);
 if(summary.complete!==cells.length)throw Error('INCOMPLETE_RECEIPTS_PRESERVED');
 return summary;
}
function verify(root){
 const cells=plan(),frozen=JSON.parse(fs.readFileSync(path.join(root,'plan.json')));if(sha(frozen.cells)!==sha(cells)||sha(frozen.works)!==sha(works)||frozen.model!==MODEL||frozen.maxTokens!==MAX||frozen.temperature!==0)throw Error('PLAN_MISMATCH');
 const rows=cells.map(c=>{const a=JSON.parse(fs.readFileSync(path.join(root,c.id+'.attempt.json'))),r=JSON.parse(fs.readFileSync(path.join(root,c.id+'.result.json')));if(a.id!==c.id||a.promptSHA!==c.promptSHA||a.sourceSHA!==c.sourceSHA||r.id!==c.id||r.work!==c.work||r.arm!==c.arm||r.promptSHA!==c.promptSHA||r.sourceSHA!==c.sourceSHA||r.responseModel!==MODEL||r.finishReason!=='stop'||r.status!=='GENERATED'||typeof r.text!=='string'||!r.text.trim()||sha(r.text)!==r.textSHA||!Number.isInteger(r.usage?.total_tokens)||r.usage.total_tokens<=0)throw Error('BAD_RECEIPT_'+c.id);return r});
 return {complete:rows.length,byArm:Object.fromEntries(arms.map(a=>[a,rows.filter(r=>r.arm===a).reduce((n,r)=>n+r.usage.total_tokens,0)])),independentReaders:0,qualitySuperiority:'NOT_ESTABLISHED'};
}
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({works:works.length,calls:plan().length,planSHA:sha(plan())}));else if(mode==='--execute'){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)))}else if(mode==='--verify')console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE')})().catch(e=>{console.error(e.message);process.exitCode=1})}
module.exports={works,arms,messages,plan,run,verify,MODEL,sha};
