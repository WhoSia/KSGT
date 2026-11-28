'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {cases}=require('./r6x_scope_cases.json');
const MODEL='openai/gpt-oss-120b',MAX=2400;
const shared='한국어 작가이자 편집자입니다. 원천의 사실·인식 범위·전달 의도·문단 수·말투를 지키면서 장르에 맞는 흡인력 있고 자연스러운 원고를 쓰세요. 허용된 창작 범위에서 질감과 호흡을 살리고, 근거 없는 사실·인과·행동을 추가하지 마세요. 글쓰기 지시 자체를 독자에게 설명하지 말고 실제 글에 적용하세요. 최종 원고만 출력하세요. 제목과 설명은 쓰지 마세요.';
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const count=s=>[...s.replace(/\s/gu,'')].length;
function messages(c,arm){
 if(!['FLAT','SCOPED'].includes(arm))throw Error('BAD_ARM');
 const source=c.facts.map((x,i)=>(i+1)+'. '+x).join('\n');
 const body=arm==='FLAT'?'원천 정보 및 작성 조건:\n'+source+'\n'+(c.facts.length+1)+'. '+c.boundary:'원천 정보:\n'+source+'\n작성 경계 조건:\n'+(c.facts.length+1)+'. '+c.boundary;
 return [{role:'system',content:shared},{role:'user',content:[c.genre,c.task,'표현 허용 범위: '+c.license,body].join('\n')}];
}
function schedule(){return cases.flatMap((c,i)=>(i%2?['SCOPED','FLAT']:['FLAT','SCOPED']).map(arm=>({id:c.id+'__'+arm,work:c.id,arm,sourceSHA:sha(c),promptSHA:sha(messages(c,arm)),messages:messages(c,arm)})));}
function manifest(){return {model:MODEL,maxTokens:MAX,temperature:0,cases,schedule:schedule()};}
function write(root,n,v){fs.writeFileSync(path.join(root,n),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});}
function valid(r,c){return r.id===c.id&&r.sourceSHA===c.sourceSHA&&r.promptSHA===c.promptSHA&&r.model===MODEL&&r.finishReason==='stop'&&r.status==='GENERATED'&&typeof r.text==='string'&&!!r.text.trim()&&r.textSHA===sha(r.text)&&r.nonspace===count(r.text)&&Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0&&Number.isFinite(r.latencyMs)&&r.latencyMs>=0;}
async function run(root,invoke){fs.mkdirSync(root,{mode:0o700});const m=manifest();write(root,'manifest.json',m);const rows=[];
 for(const c of m.schedule){write(root,c.id+'.attempt.json',c);let r;
 try{const o=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,model:o.responseModel,finishReason:o.finishReason,text:o.text,textSHA:sha(o.text),nonspace:count(o.text),usage:o.usage,latencyMs:o.latencyMs,status:'GENERATED'};if(!valid(r,c))r.status='INCOMPLETE';}
 catch(e){r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')};}
 write(root,c.id+'.result.json',r);rows.push(r);if(r.status!=='GENERATED')break;}
 const s={attempted:rows.length,complete:rows.filter(r=>r.status==='GENERATED').length,tokens:rows.reduce((n,r)=>n+(Number.isInteger(r.usage?.total_tokens)?r.usage.total_tokens:0),0)};write(root,'summary.json',s);if(s.complete!==m.schedule.length)throw Error('INCOMPLETE_PRESERVED');return s;}
function verify(root){const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));const m=manifest();if(sha(read('manifest.json'))!==sha(m))throw Error('MANIFEST_MISMATCH');let tokens=0;for(const c of m.schedule){const a=read(c.id+'.attempt.json'),r=read(c.id+'.result.json');if(sha(a)!==sha(c)||!valid(r,c))throw Error('BAD_RECEIPT_'+c.id);tokens+=r.usage.total_tokens;}const s={attempted:m.schedule.length,complete:m.schedule.length,tokens};if(sha(read('summary.json'))!==sha(s))throw Error('SUMMARY_MISMATCH');return s;}
module.exports={MODEL,MAX,shared,sha,count,messages,schedule,manifest,run,verify};
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({calls:schedule().length,manifestSHA:sha(manifest())}));else if(mode==='--execute'&&root){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)));}else if(mode==='--verify'&&root)console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE');})().catch(e=>{console.error(e.message);process.exitCode=1;});}