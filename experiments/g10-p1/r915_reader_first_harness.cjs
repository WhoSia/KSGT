'use strict';
/** KSGT R9.15 reader-first generation harness. Offline prompt engineering, not model training. */
const crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const PROFILES=Object.freeze(['STRONG_RICH','READER_PRIORITY','DISCOURSE_INVISIBLE','RHYTHM_CONTEXTUAL']);
const COMMON='원천의 사실과 미확인 사항을 왜곡하지 말 것. 작성자 목적, 독자, 장르를 우선할 것. 내부 점검 언어·사실 번호·작성 지시를 최종 글에 드러내지 말 것. 본문만 작성할 것.';
function checkTask(t){
 if(!t||typeof t!=='object'||Array.isArray(t))throw Error('TASK_OBJECT_REQUIRED');
 for(const k of ['id','sourceWork','genre','audience','purpose'])if(typeof t[k]!=='string'||!t[k].trim())throw Error('INVALID_'+k);
 if(!Array.isArray(t.facts)||!t.facts.length||t.facts.length>80||t.facts.some(s=>typeof s!=='string'||!s.trim()))throw Error('INVALID_FACTS');
 if(!Array.isArray(t.uncertainties)||t.uncertainties.some(s=>typeof s!=='string'))throw Error('INVALID_UNCERTAINTIES');
 if(t.relations!==undefined&&(!Array.isArray(t.relations)||t.relations.some(e=>!e||!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<1||e.to<1||e.from>t.facts.length||e.to>t.facts.length||typeof e.type!=='string')))throw Error('INVALID_RELATIONS');
 return t;
}
function source(t){checkTask(t);return Object.freeze({genre:t.genre,audience:t.audience,purpose:t.purpose,
 facts:[...t.facts],uncertainties:[...t.uncertainties],relations:(t.relations||[]).map(x=>({from:x.from,to:x.to,type:x.type})),
 authorAnnotations:(t.factAnnotations||[]).map(x=>({move:x.move||null,entity:x.entity||null,evidence:x.evidence||null}))});}
function instructions(profile,genre){
 switch(profile){
 case 'STRONG_RICH':return '독자가 쉽게 이해할 수 있도록 자연스럽고 간결하게, 하지만 필요한 사항을 충분히 설명하라. 적절한 순서와 자연스러운 문장 연결을 사용하라.';
 case 'READER_PRIORITY':return '작성자 목적에 맞추어 독자가 실제로 알고 싶어 할 판단·행동·핵심 결과를 먼저 설명하라. 원천에 존재한다는 이유만으로 덜 중요한 불확실성을 결론이나 훈계형 문장으로 나열하지 말라. 단, 행동·판단에 필요한 조건과 모든 핵심 결과, 해석의 제한을 유지하라. 불필요한 메타 해설 없이 독자에게 직접 말하라.';
 case 'DISCOURSE_INVISIBLE':return '작성에 앞서 원천 사실 사이의 관계와 권장 설명 순서를 내부적으로 정하라. 배경·관찰·중요한 제한·독자 행동을 독해에 유리한 순서로 배치하라. 그 계획을 번호나 해설로 출력하지 말고, 완성된 글로만 실현하라. 근거 없는 사건·시간·인과 관계를 만들지 말라.';
 case 'RHYTHM_CONTEXTUAL':return '주제의 전환과 문장 밀도에 맞추어 길고 짧은 문장을 자연스럽게 섞어라. 반드시 짧은 문장으로 통일하거나 서정성을 억지로 넣지 말라. 반복되는 주어·접속 표현·불필요한 피동과 명사화는 문맥에 맞게 정리하라. 문장 종결과 높임은 장르 및 독자 요구에 맞춰 통일하고, 모호한 생략은 피하라.';
 default:throw Error('UNKNOWN_PROFILE');
 }
}
function build(t,profile){
 if(!PROFILES.includes(profile))throw Error('UNKNOWN_PROFILE');
 const s=source(t),binding=sha(s);
 const spec={schema:'ksgt.r915.reader-first-prompt.v1',sourceWork:t.sourceWork,sourceSha256:binding,profile,
 messages:[{role:'system',content:'당신은 실제 독자가 읽을 완성된 한국어 글을 쓰는 작성자이다. '+COMMON},
 {role:'user',content:'목표: '+instructions(profile,t.genre)+'\n\n공통 원천(모든 비교 조건에서 동일):\n'+JSON.stringify(s)}]};
 return {...spec,promptSha256:sha(spec.messages),promptCharacters:JSON.stringify(spec.messages).length};
}
function surfaceAudit(text){
 if(typeof text!=='string')throw Error('TEXT_REQUIRED');
 const checks={
  unrequestedMeta:[/원천(?:의|에|에서)\s*(?:정보|사실|제공|명시)/g,/정확히\s*보존(?:되어|되었)/g,/[\(（]F\d+[\)）]/g],
  genericAdmonition:[/염두에\s*두어야/g,/유념해야\s*(?:합니다|한다)/g],
  redundantClosure:[/이러한\s*(?:점|사실|결과)을\s*(?:바탕으로|종합하면)/g]
 };
 return {schema:'ksgt.r915.surface-diagnostic.v1',characters:[...text].length,
  flags:Object.fromEntries(Object.entries(checks).map(([k,arr])=>[k,arr.reduce((n,re)=>n+[...text.matchAll(re)].length,0)])),
  caveat:'Narrow regex surfacing only. No semantic gold, literary judgment, hallucination verdict, or automatic rejection.'};
}
function harness(tasks){
 if(!Array.isArray(tasks)||!tasks.length)throw Error('TASKS_REQUIRED');
 const ids=new Set(),unit=new Set(),rows=[];
 for(const task of tasks){checkTask(task);if(ids.has(task.id)||unit.has(task.sourceWork))throw Error('DUPLICATE_SOURCE_WORK');ids.add(task.id);unit.add(task.sourceWork);
  for(const p of PROFILES){const x=build(task,p);rows.push({sourceWork:task.sourceWork,profile:p,sourceSha256:x.sourceSha256,promptSha256:x.promptSha256,promptCharacters:x.promptCharacters,actualModelCalls:0});}}
 return {schema:'ksgt.r915.offline-harness.v1',sourceWorkCount:tasks.length,profileCount:PROFILES.length,
  rows,actualModelCalls:0,readerQualityRatings:0,claimsOfImprovement:false,
  note:'No finetuning or training has occurred. Prompt profiles are untested architecture candidates; no winner selected.'};
}
module.exports={PROFILES,COMMON,sha,checkTask,source,instructions,build,surfaceAudit,harness};