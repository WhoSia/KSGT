'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {works}=require('./r6l_works.cjs');
const {solve}=require('./r6l_discourse.cjs');
const MODEL='openai/gpt-oss-120b',MAX=1000;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const system='능숙한 한국어 작가이자 편집자입니다. 제공된 사실과 요청만으로 장르에 맞는 자연스러운 완성 원고를 작성하세요. 정보의 순서와 문장 결합은 자유롭지만 사건의 행위자, 관찰·전언·미확인 범위, 시간과 인과관계, 제안과 완료를 바꾸지 마세요. 두 문단으로 작성하고 설명·제목·목록을 덧붙이지 마세요.';
function plan(){return works.map(w=>{
 const source={genre:w.genre,task:w.task,facts:w.units.map(u=>u.fact)};
 const messages=[{role:'system',content:system},{role:'user',content:[source.genre,source.task,...source.facts].join('\n')}];
 return {id:w.id,source,sourceSHA:sha(source),messages,promptSHA:sha(messages),compiled:solve(w).text};
});}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600})}
async function run(root,invoke){const cells=plan();fs.mkdirSync(root,{mode:0o700});write(path.join(root,'plan.json'),{cells,model:MODEL,maxTokens:MAX});let rows=[];
 for(const c of cells){write(path.join(root,c.id+'.attempt.json'),{id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA});let r;try{const o=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,model:o.responseModel,finishReason:o.finishReason,text:o.text,textSHA:sha(o.text),usage:o.usage,latencyMs:o.latencyMs,status:o.responseModel===MODEL&&o.finishReason==='stop'&&typeof o.text==='string'&&o.text.trim()&&Number.isInteger(o.usage?.total_tokens)&&o.usage.total_tokens>0?'GENERATED':'INCOMPLETE'}}catch(e){r={id:c.id,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')}}write(path.join(root,c.id+'.result.json'),r);rows.push(r);if(r.status!=='GENERATED')break;}
 const result={attempted:rows.length,complete:rows.filter(x=>x.status==='GENERATED').length,tokens:rows.reduce((n,r)=>n+(r.usage?.total_tokens||0),0),independentReaders:0};write(path.join(root,'summary.json'),result);if(result.complete!==cells.length)throw Error('INCOMPLETE_PRESERVED');return result;}
function verify(root){const cells=plan(),p=JSON.parse(fs.readFileSync(path.join(root,'plan.json')));if(sha(p.cells)!==sha(cells)||p.model!==MODEL||p.maxTokens!==MAX)throw Error('PLAN_MISMATCH');const rows=cells.map(c=>{const a=JSON.parse(fs.readFileSync(path.join(root,c.id+'.attempt.json'))),r=JSON.parse(fs.readFileSync(path.join(root,c.id+'.result.json')));if(a.id!==c.id||a.sourceSHA!==c.sourceSHA||a.promptSHA!==c.promptSHA||r.id!==c.id||r.sourceSHA!==c.sourceSHA||r.promptSHA!==c.promptSHA||r.model!==MODEL||r.finishReason!=='stop'||r.status!=='GENERATED'||typeof r.text!=='string'||!r.text.trim()||sha(r.text)!==r.textSHA||!Number.isInteger(r.usage?.total_tokens)||r.usage.total_tokens<1)throw Error('BAD_RECEIPT_'+c.id);return r});return {complete:rows.length,tokens:rows.reduce((n,r)=>n+r.usage.total_tokens,0),independentReaders:0};}
module.exports={plan,run,verify,sha,MODEL};
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({calls:plan().length,planSHA:sha(plan())}));else if(mode==='--execute'){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)))}else if(mode==='--verify')console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE')})().catch(e=>{console.error(e.message);process.exitCode=1});}
