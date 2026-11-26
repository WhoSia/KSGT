'use strict';
// New investigator-authored fictional sources only; no corpus input or user data.
const fs=require('node:fs'), path=require('node:path'), {createHash}=require('node:crypto');
const MODEL='openai/gpt-oss-120b', MAX=1200;
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const works=[
 {id:'SCI',genre:'과학 보고서',draft:'빛의 세기를 달리한 두 화분을 비교했다. 밝은 곳에 둔 화분의 잎이 더 길었다. 따라서 빛이 잎의 성장을 촉진했다.',feedback:'결론에 대한 근거를 보완하고 관찰과 인과를 구분해 주세요.',facts:['두 화분을 비교했다.','밝은 곳의 잎이 더 길었다.','물의 양과 초기 잎 길이는 기록하지 않았다.','인과관계는 확인되지 않았다.'],links:[['F2','관찰로만 뒷받침','두 화분의 차이'],['F3','제한','F2에서 인과 결론으로의 추론'],['F4','결론 범위','인과 미확인']]},
 {id:'NOTICE',genre:'학교 도서관 공지',draft:'금요일부터 열람실을 정리합니다. 새로 정리한 자료는 안내하겠습니다. 이용 시간도 확인해 주세요.',feedback:'어느 내용이 확정이고 어느 내용이 미정인지 자연스럽게 드러내 주세요.',facts:['금요일부터 서가 정리를 시작한다.','정리 중에도 열람실은 이용할 수 있다.','일부 서가의 위치가 바뀔 수 있다.','정리 완료일과 변경된 위치는 아직 정해지지 않았다.'],links:[['F1','확정','시작'],['F2','확정','이용'],['F3','가능성','위치 변화'],['F4','미정','완료일 및 변경 위치']]},
 {id:'CHAT',genre:'연구 팀 대화',draft:'초록에 방법이 설명돼 있더라. 그걸 반영해도 될 듯. 결과도 비슷한 것 같아.',feedback:'그것이 무엇인지 명확히 하고 확인되지 않은 결과는 단정하지 마세요.',facts:['공개 초록에는 표본을 나눈 기준만 나와 있다.','논문 전문은 아직 읽지 않았다.','팀 문서에는 표본을 나눈 기준을 추가하자는 제안이다.','결과의 일치 여부는 모른다.'],links:[['F1','출처 범위','F3'],['F2','제한','F4'],['F3','제안이지 완료 아님','팀 문서']]},
 {id:'SCENE',genre:'짧은 소설 장면',draft:'서쪽 유리창 앞에 민서가 섰다. 도윤은 동쪽 유리창을 바라봤다. 비가 내렸지만 창은 마른 채였다. 그가 천천히 돌아섰다.',feedback:'창과 인물의 지시 대상을 명확히 하되 서술을 딱딱하게 반복하지 마세요.',facts:['민서는 서쪽 창 앞에 서 있다.','도윤은 동쪽 창을 바라본다.','비가 내린다.','동쪽 창의 안쪽 면은 말라 있다.','돌아선 사람은 민서다.'],links:[['F4','대상','동쪽 창 안쪽 면'],['F5','행위자','민서'],['F2','행위자','도윤']]}
];
const plain={
 SCI:'F2는 두 화분의 관찰된 차이만을 뒷받침합니다. F3는 F2에서 인과 결론을 도출하는 데 제한이 됩니다. F4에 따라 인과관계는 확인되지 않았다는 범위에서 결론을 내립니다.',
 NOTICE:'F1의 시작 시점과 F2의 이용 가능 여부는 확정됐습니다. F3의 위치 변화는 가능성이고, F4의 완료일과 변경 위치는 미정입니다.',
 CHAT:'F1은 F3의 출처 범위를 나타냅니다. F2 때문에 F4는 확인할 수 없습니다. F3는 팀 문서에 대한 제안이지 이미 완료된 일이 아닙니다.',
 SCENE:'F4의 대상은 동쪽 창 안쪽 면입니다. F5의 행위자는 민서이고, F2의 행위자는 도윤입니다.'
};
const arms=['DIRECT_RICH','RELATION_STRUCTURED'];
const system='당신은 한국어 글을 다듬는 능숙한 편집자입니다. 원래 장르, 화자의 말투와 의도를 유지하면서 완결된 자연스러운 원고를 작성하세요. 주어진 사실과 관계만 사용하고 확인되지 않은 값, 행위, 약속 또는 인과를 만들지 마세요. 필요한 경우 문장 순서와 문장 수를 바꿔도 됩니다. 설명이나 수정 목록 없이 원고만 출력하세요.';
function messages(w,arm){
 const common=`장르: ${w.genre}\n초안: ${w.draft}\n첨삭 요청: ${w.feedback}\n확인된 정보:\n${w.facts.map((f,i)=>`F${i+1}: ${f}`).join('\n')}`;
 const relation=arm==='DIRECT_RICH'?plain[w.id]:JSON.stringify(w.links.map(([from,relation,to])=>({from,relation,to})));
 return [{role:'system',content:system},{role:'user',content:`${common}\n관계 정보:\n${relation}\n완성 원고를 작성하세요.`}];
}
function plan(){return works.flatMap((w,i)=>(i%2?arms.slice().reverse():arms).map(arm=>{const m=messages(w,arm);return {id:w.id+'_'+arm,work:w.id,arm,sourceSHA:sha({work:w,plain:plain[w.id]}),messages:m,promptSHA:sha(m)}}))}
function write(p,x){fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600})}
async function run(root,invoke){
 const cells=plan();fs.mkdirSync(root,{mode:0o700});write(path.join(root,'plan.json'),{model:MODEL,maxTokens:MAX,temperature:0,authority:'INVESTIGATOR_AUTHORED_DEVELOPMENT_ONLY',works,plain,cells});
 const rows=[];
 for(const c of cells){
   write(path.join(root,c.id+'.attempt.json'),{id:c.id,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA});
   let r;
   try{const out=await invoke({provider:'groq',model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});r={id:c.id,work:c.work,arm:c.arm,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,responseModel:out.responseModel,finishReason:out.finishReason,text:out.text,textSHA:sha(out.text),usage:out.usage,latencyMs:out.latencyMs,status:out.finishReason==='stop'&&out.responseModel===MODEL&&Number.isInteger(out.usage?.total_tokens)&&out.usage.total_tokens>0?'GENERATED':'INCOMPLETE'}}catch(e){r={id:c.id,work:c.work,arm:c.arm,status:'PROVIDER_ERROR',errorCode:String(e.status||e.code||'UNKNOWN')}}
   write(path.join(root,c.id+'.result.json'),r);rows.push(r);
   // Do not retry, and do not consume further provider calls after a provider failure.
   if(r.status!=='GENERATED')break;
 }
 const summary={planned:cells.length,attempted:rows.length,complete:rows.filter(x=>x.status==='GENERATED').length,independentReaders:0,qualitySuperiority:'NOT_ESTABLISHED',byArm:Object.fromEntries(arms.map(a=>[a,{complete:rows.filter(x=>x.arm===a&&x.status==='GENERATED').length,tokens:rows.filter(x=>x.arm===a).reduce((n,x)=>n+(x.usage?.total_tokens||0),0)}]))};
 write(path.join(root,'summary.json'),summary);
 if(summary.complete!==cells.length)throw Error('INCOMPLETE_RECEIPTS_PRESERVED');
 return summary;
}
function verify(root){
 const cells=plan(),frozen=JSON.parse(fs.readFileSync(path.join(root,'plan.json')));if(sha(frozen.cells)!==sha(cells))throw Error('PLAN_MISMATCH');
 const rows=cells.map(c=>{const r=JSON.parse(fs.readFileSync(path.join(root,c.id+'.result.json')));if(r.id!==c.id||r.promptSHA!==c.promptSHA||r.sourceSHA!==c.sourceSHA||r.responseModel!==MODEL||r.finishReason!=='stop'||r.status!=='GENERATED'||typeof r.text!=='string'||!r.text.trim()||sha(r.text)!==r.textSHA||!Number.isInteger(r.usage?.total_tokens)||r.usage.total_tokens<=0)throw Error('BAD_RECEIPT_'+c.id);return r});
 return {complete:rows.length,byArm:Object.fromEntries(arms.map(a=>[a,rows.filter(r=>r.arm===a).reduce((n,r)=>n+r.usage.total_tokens,0)])),independentReaders:0,qualitySuperiority:'NOT_ESTABLISHED'};
}
if(require.main===module){const [mode,root]=process.argv.slice(2);(async()=>{if(mode==='--preflight')console.log(JSON.stringify({works:works.length,calls:plan().length,planSHA:sha(plan())}));else if(mode==='--execute'){const {chat}=require('../../g10-p1/provider_client_v01.cjs');console.log(JSON.stringify(await run(root,chat)))}else if(mode==='--verify')console.log(JSON.stringify(verify(root)));else throw Error('BAD_MODE')})().catch(e=>{console.error(e.message);process.exitCode=1})}
module.exports={works,plain,arms,messages,plan,run,verify,MODEL,sha};
