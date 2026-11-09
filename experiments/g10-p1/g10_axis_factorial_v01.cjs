'use strict';
/* KSGT Generation X R9.13: orthogonal discourse-order and Korean-realization arms.
   Deterministic, prompt-construction-only; makes ZERO provider requests.
   Synthetic author-authored development source tasks, not quality ratings. */
const crypto=require('node:crypto');
const ARMS=Object.freeze(['STRONG_DIRECT','RICH_BASELINE','ORDER_ONLY','KOREAN_ONLY','ORDER_PLUS_KOREAN']);
const DIMENSIONS=Object.freeze({STRONG_DIRECT:null,RICH_BASELINE:[0,0],ORDER_ONLY:[1,0],KOREAN_ONLY:[0,1],ORDER_PLUS_KOREAN:[1,1]});
function sha(value){return crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');}
function assertTask(task){
 if(!task||typeof task!=='object'||Array.isArray(task))throw Error('TASK_REQUIRED');
 for(const k of ['id','sourceWork','genre','audience','purpose'])if(typeof task[k]!=='string'||!task[k].trim())throw Error('INVALID_'+k);
 if(!Array.isArray(task.facts)||!task.facts.length||task.facts.length>50||task.facts.some(x=>typeof x!=='string'||!x.trim()))throw Error('INVALID_FACTS');
 if(!Array.isArray(task.uncertainties)||task.uncertainties.some(x=>typeof x!=='string'))throw Error('INVALID_UNCERTAINTIES');
 if(task.factAnnotations!==undefined&&(!Array.isArray(task.factAnnotations)||task.factAnnotations.length!==task.facts.length))throw Error('ANNOTATION_LENGTH_MISMATCH');
 for(const e of task.relations||[]){if(!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<1||e.to<1||e.from>task.facts.length||e.to>task.facts.length||typeof e.type!=='string')throw Error('INVALID_AUTHOR_RELATION');}
 return task;
}
function authoritative(task){
 assertTask(task);
 return {sourceWork:task.sourceWork,genre:task.genre,audience:task.audience,purpose:task.purpose,
  facts:task.facts.map((text,i)=>({id:'F'+(i+1),text})),uncertainties:[...task.uncertainties],
  factAnnotations:(task.factAnnotations||[]).map((x,i)=>({id:'F'+(i+1),move:x.move||null,evidence:x.evidence||null,entity:x.entity||null})),
  relations:(task.relations||[]).map(x=>({from:'F'+x.from,to:'F'+x.to,type:x.type}))};
}
function authorOrder(task){
 assertTask(task);
 const n=task.facts.length,edges=Array.from({length:n},()=>new Set()),indegree=Array(n).fill(0);
 function add(a,b){if(a===b)throw Error('SELF_RELATION_CYCLE');if(!edges[a].has(b)){edges[a].add(b);indegree[b]++;}}
 // Only author-declared precedence is binding; descriptive relations are not imposed as temporal truth.
 for(const e of task.relations||[])if(['TEMPORAL_NEXT','BACKGROUND'].includes(e.type))add(e.from-1,e.to-1);
 const ranking={SETUP:0,EVENT:1,OBSERVATION:2,INTERPRETATION:3,LIMITATION:4,CONCLUSION:5};
 const rank=i=>ranking[task.factAnnotations?.[i]?.move]??2;
 const ready=indegree.flatMap((x,i)=>x===0?[i]:[]),ordered=[];
 while(ready.length){ready.sort((a,b)=>rank(a)-rank(b)||a-b);const i=ready.shift();ordered.push('F'+(i+1));for(const j of edges[i])if(--indegree[j]===0)ready.push(j);}
 if(ordered.length!==n)throw Error('AUTHORED_RELATION_CYCLE');
 return ordered;
}
function planNote(task){
 return '내부 구성 선택: 원천 정보의 권장 제시 순서는 '+authorOrder(task).join(' → ')+'. '+
 '이 순서는 문장을 복제하라는 뜻이 아니다. 관계의 인과성이나 새로운 시간 순서를 상상하지 않는다. '+
 '원천 정보의 문단 배치는 자연스러운 독자 이해를 우선하며 작성 단계에서 검증 용어 및 F번호를 드러내지 않는다.';
}
function koreanNote(task){
 assertTask(task);
 const tags=(task.factAnnotations||[]).map(x=>x.entity||null);
 let adjacent=0, switches=0;
 for(let i=1;i<tags.length;i++)if(tags[i]&&tags[i-1])tags[i]===tags[i-1]?adjacent++:switches++;
 return '한국어 언어실현 선택: (1) 독자가 이미 추적하는 대상을 매번 재명명하지 말되, 두 인물이 경쟁하면 지시 대상을 분명히 한다. '+
 '(2) 조사 은/는·이/가 선택은 대조와 화제 연속성에 따라 문맥별로 판단한다. '+
 '(3) 문장 종결·높임·연결어미는 장르와 독자에 맞춰 일관되게 선택하고 접속어를 기계적으로 반복하지 않는다. '+
 '(4) 생략은 모호하지 않을 때에만 허용하며 새로운 감정·인과·행동을 추가하지 않는다. '+
 '(5) 위 정보는 내부 집필 판단이지 본문에 기호·평가 메타언어로 출력하지 않는다. '+
 '참고용 작성자 주석의 인접 동일 대상 수='+adjacent+', 대상 전환 수='+switches+'; 이는 정확성 판정이 아니다.';
}
function messages(task,arm){
 if(!ARMS.includes(arm))throw Error('INVALID_ARM');
 const packet=authoritative(task),base=JSON.stringify(packet);
 const system='제공된 원천 사실과 알려지지 않은 사항을 보존하면서 실제 독자가 읽을 자연스러운 한국어 산문을 작성한다. 원천에 없는 사건·사실을 만들지 않는다. 문서 본문만 출력한다.';
 const rich='정보를 독자가 이해하기 쉽게 연결하라. 독자의 목적과 장르를 반영하라. 근거 없는 사실은 추가하지 말고 수치·확실성·부정 조건을 유지하라. 문단 본문만 출력하라.';
 let directives=arm==='STRONG_DIRECT'?'원천 정보를 바탕으로 자연스러운 한국어 문단을 작성하라.':rich;
 const dims=DIMENSIONS[arm];
 if(dims?.[0])directives+='\n'+planNote(task);
 if(dims?.[1])directives+='\n'+koreanNote(task);
 return {arm,dimensions:dims,authoritativePacket:packet,authoritativeSha256:sha(packet),
  messages:[{role:'system',content:system},{role:'user',content:directives+'\n\n공통 원천 패킷:\n'+base}]};
}
function manifest(cohort){
 if(!cohort||!Array.isArray(cohort.tasks)||!cohort.tasks.length)throw Error('INVALID_COHORT');
 const seenWork=new Set(),seenSource=new Set(),rows=[];
 for(const task of cohort.tasks){
  assertTask(task);const key=sha(authoritative(task));
  if(seenWork.has(task.sourceWork)||seenSource.has(key))throw Error('DUPLICATE_SOURCE_UNIT');
  seenWork.add(task.sourceWork);seenSource.add(key);
  const group=ARMS.map(arm=>messages(task,arm));
  if(new Set(group.map(x=>x.authoritativeSha256)).size!==1)throw Error('AUTHORITATIVE_SOURCE_DRIFT');
  for(const g of group)rows.push({work:task.sourceWork,arm:g.arm,dimensions:g.dimensions,sourceSha256:g.authoritativeSha256,promptSha256:sha(g.messages),promptCharacters:JSON.stringify(g.messages).length,modelsCalled:0});
 }
 return {schema:'ksgt.r9.13.axes-manifest.v01',developmentOnly:true,works:cohort.tasks.length,conditions:ARMS.length,plannedCompletions:rows.length,modelCallsActuallyMade:0,independentReaderRatings:0,proseQualityImprovement:'NOT_ESTABLISHED',note:'Prompt character counts are not token counts; factorial arms differ in instruction length.',rows};
}
module.exports={ARMS,DIMENSIONS,sha,assertTask,authoritative,authorOrder,planNote,koreanNote,messages,manifest};