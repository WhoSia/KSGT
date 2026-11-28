'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {works}=require('./r6v_works.cjs'),{diagnose,render}=require('./r6v_cadence.cjs');
const MODEL='openai/gpt-oss-120b',MAX=2400;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const shared='한국어 작가이자 편집자입니다. 원천의 사실·인식 범위·전달 의도·문단 수·말투를 지키면서 장르에 맞는 흡인력 있고 자연스러운 원고를 쓰세요. 허용된 창작 범위에서는 표현의 질감과 호흡을 충분히 살리고, 허용되지 않은 사실·인과·행동은 추가하지 마세요. 필요한 반복과 병렬 구조, 의도된 후렴을 유지하세요. 근거 없는 대조, 기계적인 결론과 상투적 비유를 피하세요.';
const complete='최종 완성 원고만 출력하세요. 제목이나 설명은 쓰지 마세요.';
const revision=' 아래 초안을 읽고 필요한 부분만 다듬으세요. 원천과 과제를 우선하고, 표현의 질감·문장 연결·완급·전체 문단의 흐름을 고려하세요. 좋은 부분은 그대로 두세요. ';
function schedule(){return works.flatMap((w,i)=>['direct',...(i%2?['cadence','revise']:['revise','cadence'])].map(step=>({id:w.id+'_'+step,work:w.id,step,sourceSHA:sha(w)})))}
function source(w){return [w.genre,w.task,'표현 허용 범위: '+w.license,'원천 정보:',...w.facts.map((v,i)=>`${i+1}. ${v}`)].join('\n')}
function messages(w,step,previous){let sys=shared,user=source(w),diagnostic=null;
 if(step==='direct')sys+=' '+complete;
 else if(step==='revise'||step==='cadence'){sys+=revision+complete;user+='\n\n초안:\n'+previous.text;if(step==='cadence'){diagnostic=diagnose(previous.text,w);user+=render(diagnostic);}}
 else throw Error('BAD_STEP');
 return {messages:[{role:'system',content:sys},{role:'user',content:user}],diagnostic};}
function manifest(){return {model:MODEL,maxTokens:MAX,schedule:schedule(),works,shared,revision,initial:works.map(w=>messages(w,'direct',null))};}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600})}
function cell(c,rows){const w=works.find(w=>w.id===c.work),parent=c.step==='direct'?null:'direct';const prev=parent?rows.get(w.id+'_'+parent):null;if(parent&&!prev)throw Error('PARENT_MISSING');const m=messages(w,c.step,prev);return {...c,parentSHA:prev?.textSHA??null,promptSHA:sha(m.messages),...m};}
function valid(r,c){return r.id===c.id&&r.sourceSHA===c.sourceSHA&&r.promptSHA===c.promptSHA&&r.parentSHA===c.parentSHA&&r.model===MODEL&&r.finishReason==='stop'&&r.status==='GENERATED'&&typeof r.text==='string'&&r.text.trim()&&sha(r.text)===r.textSHA&&Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0;}
async function run(root,invoke){fs.mkdirSync(root,{mode:0o700});write(path.join(root,'manifest.json'),manifest());const rows=new Map();for(const s of schedule()){const c=cell(s,rows);write(path.join(root,c.id+'.attempt.json'),c);let r;try{const o=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,parentSHA:c.parentSHA,model:o.responseModel,finishReason:o.finishReason,text:o.text,textSHA:sha(o.text),usage:o.usage,latencyMs:o.latencyMs,status:'GENERATED'};if(!valid(r,c))r.status='INCOMPLETE';}catch(e){r={id:c.id,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')}}write(path.join(root,c.id+'.result.json'),r);rows.set(c.id,r);if(r.status!=='GENERATED')break;}
 const result={attempted:rows.size,complete:[...rows.values()].filter(r=>r.status==='GENERATED').length,tokens:[...rows.values()].reduce((n,r)=>n+(r.usage?.total_tokens||0),0)};write(path.join(root,'summary.json'),result);if(result.complete!==schedule().length)throw Error('INCOMPLETE_PRESERVED');return result;}
function verify(root){const read=n=>JSON.parse(fs.readFileSync(path.join(root,n)));if(sha(read('manifest.json'))!==sha(manifest()))throw Error('MANIFEST_MISMATCH');const rows=new Map();for(const s of schedule()){const c=cell(s,rows),a=read(c.id+'.attempt.json'),r=read(c.id+'.result.json');if(sha(c)!==sha(a)||!valid(r,c))throw Error('BAD_RECEIPT_'+c.id);rows.set(c.id,r)}return {complete:rows.size,tokens:[...rows.values()].reduce((n,r)=>n+r.usage.total_tokens,0)};}
module.exports={MODEL,MAX,sha,schedule,manifest,messages,cell,run,verify};
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({calls:schedule().length,manifestSHA:sha(manifest())}));else if(mode==='--execute'){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)))}else if(mode==='--verify')console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE')})().catch(e=>{console.error(e.message);process.exitCode=1});}
