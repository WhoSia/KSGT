'use strict';
// Investigator-authored synthetic sources only. No corpus text or user information.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const MODEL='openai/gpt-oss-120b',MAX=1200;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const science=(which)=>({id:'SCI_'+which,genre:'과학 실험 결과를 설명하는 한 문단',facts:['두 센서의 출력값을 같은 날 각각 기록했다.',`${which==='A'?'A':'B'} 센서에서만 출력 변동 폭이 감소했다.`,'다른 센서의 변동 폭이 달라졌는지는 확인하지 않았다.','두 센서의 교정 상태는 기록하지 않았다.'],limits:['변동 폭 감소를 다른 센서에 일반화하지 않는다.','교정 상태, 실험 횟수, 원인, 수치를 새로 단정하지 않는다.'],style:['비교 대상과 관찰 범위를 명확히 하고 결과에서 한계로 자연스럽게 이어간다.'],task:'관찰 결과와 해석의 한계를 연구 보고서에 들어갈 한 문단으로 작성한다.'});
const scene=(which)=>({id:'SCENE_'+which,genre:'짧은 소설 장면',facts:['정우는 복도 왼쪽 의자에 앉아 있다.','수현은 오른쪽 의자 옆에 서 있다.','복도 끝에서 빛이 들어온다.',`${which==='L'?'왼쪽':'오른쪽'} 의자의 등받이에만 빛이 닿는다.`,'일어난 사람은 정우다.'],limits:['빛의 범위를 두 의자로 넓히지 않는다.','수현이 일어났다고 쓰지 않는다.','새 행동, 심리, 대사, 사건, 물체를 추가하지 않는다.'],style:['빛과 이미 등장한 물체의 배치를 비유적으로 묘사할 수 있다.','어순과 문장 길이, 리듬, 생략은 자유롭다.'],task:'정적인 장면에서 정우가 일어나는 순간까지 자연스러운 문학적 문단을 쓴다.'});
const works=[science('A'),science('B'),{id:'NOTICE',genre:'학교 시설 안내문',facts:['화요일에 2층 세미나실의 책상을 정리한다.','1층 열람실은 평소대로 이용할 수 있다.','2층 세미나실의 재개방 시각은 미정이다.'],limits:['정리 종료 시각이나 공지 채널을 새로 약속하지 않는다.','1층과 2층의 이용 여부를 혼동하지 않는다.'],style:['핵심 안내를 먼저 쓰고 정중한 종결어미를 사용한다.'],task:'학생들이 바로 읽을 수 있는 짧은 공지문을 작성한다.'},{id:'CHAT',genre:'친한 연구 팀원에게 보내는 메시지 한 개',facts:['공개 자료에는 측정 간격만 나와 있다.','전체 실험 기록은 아직 확인하지 못했다.','팀의 방법 문서에 측정 간격을 넣자고 제안한다.','측정 결과의 재현 여부는 모른다.'],limits:['제안을 이미 반영한 사실이나 약속으로 바꾸지 않는다.','공개 자료 자체를 수정하자는 뜻이 아니다.','여러 화자, 해설, 인사말을 추가하지 않는다.'],style:['반말로 자연스럽게 연결하고 불필요한 전문 용어와 반복을 줄인다.'],task:'팀원에게 보낼 메시지 한 개를 작성한다.'},scene('L'),scene('R')];
const arms=['DIRECT_RICH','SCOPE_PROCESS'];
const system='당신은 한국어 글을 능숙하게 쓰는 편집자입니다. 요청한 장르의 자연스러운 완성 원고만 출력하세요. 주어진 사실과 허용 범위를 지키면서 문장 결합, 생략, 어휘 선택과 리듬을 자유롭게 조절하세요. 원고에 작업 과정, 사실 번호, 평가 또는 수정 목록을 넣지 마세요.';
function messages(w,arm){
 if(!arms.includes(arm))throw Error('BAD_ARM');
 const common=`장르: ${w.genre}\n요청: ${w.task}\n확인된 사실:\n${w.facts.join('\n')}\n사실 및 의미의 제한:\n${w.limits.join('\n')}\n허용되는 문체적 선택:\n${w.style.join('\n')}`;
 const method=arm==='SCOPE_PROCESS'?'\n작성 방식: 사실마다 대상·행위자·시점·확정 여부 중 해당하는 범위를 유지한 채 문단 전체의 흐름을 구성하세요. 문체 선택은 사실의 수를 늘리지 않는 선에서 사용하세요. 초안 전체에서 뒤쪽 문장이 앞쪽의 범위를 넓히거나 새로운 사건·약속을 만들지 않는지 확인한 후 완성문만 출력하세요.':'';
 return [{role:'system',content:system},{role:'user',content:common+method+'\n완성 원고를 작성하세요.'}];
}
function plan(){return works.flatMap((w,i)=>(i%2?arms.slice().reverse():arms).map(arm=>{const m=messages(w,arm);return {id:w.id+'_'+arm,work:w.id,arm,sourceSHA:sha(w),messages:m,promptSHA:sha(m)}}))}
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
