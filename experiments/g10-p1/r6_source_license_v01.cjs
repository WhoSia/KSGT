"use strict";
/** R6 explicitly witnessed source-license representation. This does not infer truth or grade semantics. */
const crypto=require('node:crypto');
const ARM_NAMES=Object.freeze(['STRONG_DIRECT','GENERIC_CONTRACT','KSGT_GENRE_LICENSE']);
const GENRE_PLANS={
 public_notice:["독자의 결정에 필요한 행동·신청 조건을 먼저 분명히 한다","참석·예외와 확인된 조건을 혼동 없이 잇는다","아직 미정인 준비사항은 미정으로 남긴다"],
 science_explainer:["측정 조건과 수치를 정확히 소개한다","관측 결과를 설명하되 인과관계로 확정하지 않는다","불확실성과 추가 자료 필요성을 정확히 남긴다"],
 scene_essay:["관찰된 배경과 공간을 제시한다","인물의 확인된 행동이 이어지는 장면을 만든다","원천이 허락하지 않은 심리·동기·새 행동은 창작하지 않는다"]
};
function fail(s){throw Error(s)}
function validate(t){
 if(!t||typeof t.id!=='string'||typeof t.sourceWork!=='string'||!GENRE_PLANS[t.genre]||
 typeof t.audience!=='string'||typeof t.purpose!=='string'||!Array.isArray(t.facts)||t.facts.length<4||
 !Array.isArray(t.edges)||!Array.isArray(t.protected)||typeof t.creativeLicense!=='string'||
 !['NO_NEW_EVENTS','NO_NEW_OPERATIONAL_FACTS','BOUNDED_EXPLANATORY_INFERENCE'].includes(t.creativeLicense))fail('INVALID_SOURCE_SCHEMA');
 const ids=t.facts.map(f=>f.id),set=new Set(ids);
 if(set.size!==ids.length||t.facts.some(f=>!/^F[1-9][0-9]*$/.test(f.id)||typeof f.text!=='string'||!f.text.trim()))fail('INVALID_SOURCE_FACT');
 if(t.protected.some(p=>!p||!['EXACT_VALUE','NEGATION','UNKNOWN','NONCAUSAL','NO_NEW_EVENT'].includes(p.kind)||!Array.isArray(p.factIds)||p.factIds.some(id=>!set.has(id))||typeof p.note!=='string'||!p.note.trim()))fail('INVALID_PROTECTED_ASSERTION');
 const keys=new Set();
 for(const e of t.edges){if(!set.has(e.before)||!set.has(e.after)||e.before===e.after||e.type!=='READER_PREREQUISITE'||e.evidence!=='AUTHOR_DECLARED')fail('UNLICENSED_EDGE');const k=e.before+':'+e.after;if(keys.has(k))fail('DUP_EDGE');keys.add(k)}
 const ordered=[],done=new Set();
 while(ordered.length<ids.length){const n=ids.find(id=>!done.has(id)&&t.edges.every(e=>e.after!==id||done.has(e.before)));if(!n)fail('CYCLE');ordered.push(n);done.add(n)}
 return ordered;
}
function sourcePacket(t){validate(t);return JSON.stringify({id:t.id,sourceWork:t.sourceWork,genre:t.genre,audience:t.audience,purpose:t.purpose,facts:t.facts,edges:t.edges,protected:t.protected,creativeLicense:t.creativeLicense})}
const SHARED='제공된 원천 JSON만으로 자연스러운 한국어 3문단 완성문을 쓰세요. 정확한 값과 부정, 아직 모르는 정보, 관측과 인과의 구별, 원천에서 허락한 창작 범위를 지키세요. 메타 해설·목차·소제목·사실 ID를 본문에 적지 마세요. 문서 목적을 고려하되 임의의 운영 절차·새 사건·새 심리·확정 사실을 추가하지 마세요.';
function build(t,arm){
 if(!ARM_NAMES.includes(arm))fail('UNKNOWN_ARM');const packet=sourcePacket(t),ordered=validate(t);let note='';
 if(arm==='GENERIC_CONTRACT')note=' 작성 전 정확한 값·시간·횟수, 부정 및 미정 상태, 출처에 없는 새로운 운영절차나 사건 추가 여부를 점검하고, 내용이 없는 수사적 문장을 피하세요.';
 if(arm==='KSGT_GENRE_LICENSE'){
  const g=GENRE_PLANS[t.genre];
  const protectedLines=t.protected.map(p=>p.kind+' ['+p.factIds.join(',')+']: '+p.note);
  note=' 독자 목적을 위한 비강제적 문단 기능 제안: '+g.map((x,i)=>(i+1)+') '+x).join('; ')+'. 출처가 확정한 보호 경계: '+protectedLines.join('; ')+'. '+(t.edges.length?'작성자 선언 선행관계는 '+t.edges.map(e=>e.before+'→'+e.after).join(', ')+'이다.':'선행관계가 선언되지 않았다.')+' 출처에 없는 내용을 덧붙이지 않으면서 한국어 문장 연결을 완결하세요.';
 }
 const messages=[{role:'system',content:'정확한 원천 사실과 자연스러운 한국어 문체를 지키는 글 작성자.'},{role:'user',content:'원천 JSON:\n'+packet+'\n\n지시:\n'+SHARED+note}];
 const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
 return {arm,sourceWork:t.sourceWork,sourceSha256:sha(packet),promptSha256:sha(JSON.stringify(messages)),messages,promptChars:JSON.stringify(messages).length,annotationCount:t.protected.length,graphOrder:ordered};
}
function preflight(cohort){
 if(cohort?.schema!=='ksgt.g10.p1.r6.dev-cohort.v01'||cohort.authority!=='AUTHOR_AUTHORED_EXPOSED_DEVELOPMENT_NO_EXTERNAL_HOLDOUT'||!Array.isArray(cohort.tasks)||cohort.tasks.length!==6)fail('UNAPPROVED_COHORT');
 const s=new Set();const works=[];
 for(const t of cohort.tasks){if(s.has(t.sourceWork))fail('DUP_SOURCE_WORK');s.add(t.sourceWork);const arms=ARM_NAMES.map(a=>build(t,a));if(new Set(arms.map(a=>a.sourceSha256)).size!==1)fail('SOURCE_PARITY_BROKEN');works.push({sourceWork:t.sourceWork,genre:t.genre,sourceSha256:arms[0].sourceSha256,arms:arms.map(x=>({arm:x.arm,promptSha256:x.promptSha256,promptChars:x.promptChars}))})}
 return {schema:'ksgt.g10.p1.r6.preflight.v01',sourceWorks:works.length,assignedCells:works.length*ARM_NAMES.length,matchedSourceInfo:true,tokenBudgetMatched:false,actualOutputs:0,independentHumanGold:0,works};
}
module.exports={ARM_NAMES,GENRE_PLANS,validate,sourcePacket,build,preflight};
