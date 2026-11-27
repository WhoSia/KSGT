'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const frozen=require('./r6w_d19s_manifest.json');
const MODEL='openai/gpt-oss-120b',MAX=2400,SEED=20261128;
const shared='한국어 작가이자 편집자입니다. 원천의 사실·인식 범위·전달 의도·문단 수·말투를 지키면서 장르에 맞는 흡인력 있고 자연스러운 원고를 쓰세요. 허용된 창작 범위에서는 표현의 질감과 호흡을 충분히 살리고, 허용되지 않은 사실·인과·행동은 추가하지 마세요. 필요한 반복과 병렬 구조, 의도된 후렴을 유지하세요. 근거 없는 대조, 기계적인 결론과 상투적 비유를 피하세요. 최종 완성 원고만 출력하세요. 제목이나 설명은 쓰지 마세요.';
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const count=s=>[...s.replace(/\s/gu,'')].length;
function validate(cases){
 if(cases.length!==48||new Set(cases.map(c=>c.id)).size!==48)throw Error('BAD_COUNT');
 const groups=Map.groupBy(cases,c=>c.family);
 if(groups.size!==4)throw Error('BAD_FAMILIES');
 for(const g of groups.values()){
  if(g.length!==12||new Set(g.map(c=>[c.richness,c.length,c.license].join(':'))).size!==12||new Set(g.map(c=>sha(c.required))).size!==1)throw Error('BAD_BALANCE');
  for(const c of g){
   if(c.id!==[c.family,c.richness,c.length,c.license].join('__')||!['CORE','RICH'].includes(c.richness)||!['SHORT','LONG','FLEX'].includes(c.length)||!['STRICT','BOUNDED'].includes(c.license)||c.paragraphs!==2||c.required.length!==6||c.optional.length!==(c.richness==='RICH'?6:0)||JSON.stringify(c.target)!==JSON.stringify({SHORT:[180,240],LONG:[480,600],FLEX:null}[c.length])||!c.required.every((x,i)=>x.id==='C'+(i+1))||!c.optional.every((x,i)=>x.id==='O'+(i+1)))throw Error('BAD_CELL');
  }
  if(new Set(g.filter(c=>c.richness==='RICH').map(c=>sha(c.optional))).size!==1)throw Error('BAD_OPTIONAL');
 }
 return true;
}
function messages(c){
 return [{role:'system',content:shared},{role:'user',content:[c.task,'문단 수: '+c.paragraphs,c.lengthInstruction,'표현 허용 범위: '+c.licenseInstruction,'반드시 전달할 원천 사실:',...c.required.map(x=>x.text),'사용해도 되지만 모두 넣을 필요는 없는 추가 원천 사실:',...(c.optional.length?c.optional.map(x=>x.text):['없음'])].join('\n')}];
}
function schedule(cases=frozen.cases){
 validate(cases);let seed=SEED>>>0;const shuffled=cases.slice();
 for(let i=shuffled.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 return shuffled.map(c=>({id:c.id,sourceSHA:sha(c),promptSHA:sha(messages(c)),messages:messages(c)}));
}
function manifest(){return {model:MODEL,temperature:0,maxTokens:MAX,seed:SEED,sourceSHA:sha(frozen),schedule:schedule()};}
function write(root,name,data){fs.writeFileSync(path.join(root,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});}
function valid(r,c){return r.id===c.id&&r.sourceSHA===c.sourceSHA&&r.promptSHA===c.promptSHA&&r.model===MODEL&&r.finishReason==='stop'&&r.status==='GENERATED'&&typeof r.text==='string'&&!!r.text.trim()&&r.textSHA===sha(r.text)&&r.nonspace===count(r.text)&&Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0&&Number.isFinite(r.latencyMs)&&r.latencyMs>=0;}
async function run(root,invoke){
 fs.mkdirSync(root,{mode:0o700});const m=manifest();write(root,'manifest.json',m);const rows=[];
 for(const c of m.schedule){
  write(root,c.id+'.attempt.json',c);let r;
  try{const o=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,model:o.responseModel,finishReason:o.finishReason,text:o.text,textSHA:sha(o.text),nonspace:count(o.text),usage:o.usage,latencyMs:o.latencyMs,status:'GENERATED'};if(!valid(r,c))r.status='INCOMPLETE';}
  catch(e){r={id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')};}
  write(root,c.id+'.result.json',r);rows.push(r);if(r.status!=='GENERATED')break;
 }
 const summary={attempted:rows.length,complete:rows.filter(r=>r.status==='GENERATED').length,tokens:rows.reduce((n,r)=>n+(Number.isInteger(r.usage?.total_tokens)?r.usage.total_tokens:0),0)};
 write(root,'summary.json',summary);if(summary.complete!==m.schedule.length)throw Error('INCOMPLETE_PRESERVED');return summary;
}
function verify(root){const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));const m=manifest();if(sha(read('manifest.json'))!==sha(m))throw Error('MANIFEST_MISMATCH');let tokens=0;
 for(const c of m.schedule){const a=read(c.id+'.attempt.json'),r=read(c.id+'.result.json');if(sha(a)!==sha(c)||!valid(r,c))throw Error('BAD_RECEIPT_'+c.id);tokens+=r.usage.total_tokens;}
 const s={attempted:m.schedule.length,complete:m.schedule.length,tokens};if(sha(read('summary.json'))!==sha(s))throw Error('SUMMARY_MISMATCH');return s;
}
module.exports={MODEL,MAX,SEED,sha,count,validate,messages,schedule,manifest,valid,run,verify};
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({calls:schedule().length,manifestSHA:sha(manifest())}));else if(mode==='--execute'&&root){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)));}else if(mode==='--verify'&&root)console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE');})().catch(e=>{console.error(e.message);process.exitCode=1;});}
