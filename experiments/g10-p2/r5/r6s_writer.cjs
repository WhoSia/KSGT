'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {works}=require('./r6s_works.cjs'),{roles,rhythms,decode,render}=require('./r6s_plan.cjs');
const MODEL='openai/gpt-oss-120b',MAX=1600;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const shared='한국어 작가이자 편집자입니다. 장르와 독자, 화자의 의도, 글 전체의 정보 배열, 문단 연결, 문장 호흡을 고려하세요. 주어진 사실과 인식 범위, 말투, 문단 수를 보존하세요. 원천에 없는 사건·심리·인과·결론을 만들지 마세요. 문체 효과를 위해 허용된 표현은 활용하되 반복과 번역투, 근거 없는 대조, 과장된 칭찬·결론을 피하세요.';
const complete='최종 완성 원고만 출력하세요. 제목이나 설명은 쓰지 마세요.';
const steps=['direct','revise','plan','realize'];
function schedule(){return works.flatMap((w,i)=>(i%2?['plan','realize','direct','revise']:steps).map(step=>({id:w.id+'_'+step,work:w.id,step,sourceSHA:sha(w)})))}
function source(w){return [w.genre,w.task,'원천 정보:',...w.facts.map((v,i)=>`${i+1}. ${v}`)].join('\n')}
function messages(w,step,previous){let sys=shared,user=source(w),status=null;
 if(step==='direct')sys+=' '+complete;
 if(step==='revise'){sys+=' 아래 초안을 검토하고 필요할 때만 수정하세요. 초안보다 글 전체의 흐름과 과제에 맞는 표현을 우선하세요. '+complete;user+='\n\n초안:\n'+previous.text;}
 if(step==='plan')sys+=` 원고를 아직 쓰지 마세요. 문단별 정보 배열과 초점을 정하세요. JSON 객체 {"paragraphs":[{"role":"${roles.join('|')}","facts":[1,2],"focus":1,"rhythm":"${rhythms.join('|')}"}]}만 출력하세요. 원천 정보 번호는 정확히 한 번씩 사용하고 focus는 해당 문단의 번호 중 하나입니다. 문단 수는 과제와 일치해야 합니다. 선택지 중 하나만 사용하고 다른 필드를 넣지 마세요.`;
 if(step==='realize'){status=decode(previous.text,w);sys+=' 제공된 문단 계획은 글 전체를 위한 참고입니다. 의미와 과제에 어긋나는 부분은 원천을 우선하고, 정보 번호는 출력하지 마세요. '+complete;if(status.kind==='VALID')user+='\n\n문단 계획:\n'+render(status.plan);}
 return {messages:[{role:'system',content:sys},{role:'user',content:user}],planStatus:status};
}
function manifest(){return {model:MODEL,maxTokens:MAX,schedule:schedule(),works,shared,initial:works.flatMap(w=>['direct','plan'].map(s=>messages(w,s,null)))};}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600})}
function cell(c,rows){const w=works.find(w=>w.id===c.work),parent=c.step==='revise'?'direct':c.step==='realize'?'plan':null;const prev=parent?rows.get(w.id+'_'+parent):null;if(parent&&!prev)throw Error('PARENT_MISSING');const m=messages(w,c.step,prev);return {...c,parentSHA:prev?.textSHA??null,promptSHA:sha(m.messages),...m};}
function valid(r,c){return r.id===c.id&&r.sourceSHA===c.sourceSHA&&r.promptSHA===c.promptSHA&&r.parentSHA===c.parentSHA&&r.model===MODEL&&r.finishReason==='stop'&&r.status==='GENERATED'&&typeof r.text==='string'&&r.text.trim()&&sha(r.text)===r.textSHA&&Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0;}
async function run(root,invoke){fs.mkdirSync(root,{mode:0o700});write(path.join(root,'manifest.json'),manifest());const rows=new Map();for(const s of schedule()){const c=cell(s,rows);write(path.join(root,c.id+'.attempt.json'),c);let r;try{const o=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,parentSHA:c.parentSHA,model:o.responseModel,finishReason:o.finishReason,text:o.text,textSHA:sha(o.text),usage:o.usage,latencyMs:o.latencyMs,status:'GENERATED'};if(!valid(r,c))r.status='INCOMPLETE';}catch(e){r={id:c.id,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')}}write(path.join(root,c.id+'.result.json'),r);rows.set(c.id,r);if(r.status!=='GENERATED')break;}
 const result={attempted:rows.size,complete:[...rows.values()].filter(r=>r.status==='GENERATED').length,tokens:[...rows.values()].reduce((n,r)=>n+(r.usage?.total_tokens||0),0)};write(path.join(root,'summary.json'),result);if(result.complete!==schedule().length)throw Error('INCOMPLETE_PRESERVED');return result;}
function verify(root){const read=n=>JSON.parse(fs.readFileSync(path.join(root,n)));if(sha(read('manifest.json'))!==sha(manifest()))throw Error('MANIFEST_MISMATCH');const rows=new Map();for(const s of schedule()){const c=cell(s,rows),a=read(c.id+'.attempt.json'),r=read(c.id+'.result.json');if(sha(c)!==sha(a)||!valid(r,c))throw Error('BAD_RECEIPT_'+c.id);rows.set(c.id,r)}return {complete:rows.size,tokens:[...rows.values()].reduce((n,r)=>n+r.usage.total_tokens,0)};}
module.exports={MODEL,MAX,sha,schedule,manifest,messages,cell,run,verify};
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({calls:schedule().length,manifestSHA:sha(manifest())}));else if(mode==='--execute'){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)))}else if(mode==='--verify')console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE')})().catch(e=>{console.error(e.message);process.exitCode=1});}
