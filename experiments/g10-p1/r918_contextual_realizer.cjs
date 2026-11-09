'use strict';
/** R9.18 literature-grounded optional linguistic-choice harness.
 * No model invocation, automatic grammatical judgments, or preference claims.
 */
const crypto=require('node:crypto');
const {source,checkTask}=require('./r915_reader_first_harness.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ARMS=Object.freeze(['STRONG_RICH','ENTITY_ACCESSIBILITY','RELATION_FUNCTION','READER_DECISION','JOINT_CONTEXTUAL']);
const MAIN='제공된 사실과 명시된 관계만으로 한국어 본문을 작성한다. 독자·장르·목적에 맞추되 출처에 없는 행동, 원인, 감정, 조건을 추가하지 않는다. 검증 절차와 내부 번호는 드러내지 않는다.';
function localChoice(t){
 checkTask(t);
 const tags=(t.factAnnotations||[]).map(a=>(typeof a?.entity==='string'&&a.entity.trim())?a.entity.trim():null);
 const trace=tags.map((entity,i)=>{
  if(!entity)return {factId:`F${i+1}`,entity:null,status:'UNANNOTATED',omission:'NO_AUTOMATIC_OMISSION'};
  const previous=tags.slice(Math.max(0,i-3),i).filter(Boolean);
  const last=previous.at(-1)||null;
  const competitors=[...new Set(previous.filter(x=>x!==entity))];
  const continued=entity===last;
  return {factId:`F${i+1}`,entity,status:continued?'RECENT_SAME_LABEL':'INTRODUCED_OR_SWITCHED',
   omission:continued&&competitors.length===0?'CONSIDER_ONLY_WITH_CONTEXT':'RETAIN_EXPLICIT_IF_AMBIGUOUS',
   competitors:competitors.length,annotationConfidence:'AUTHOR_LABEL_NOT_COREFERENCE_GOLD'};
 });
 return {schema:'ksgt.r918.contextual-reference-hints.v1',trace,
  limitation:'Author entity labels do not resolve referential identity, grammatical role, discourse salience or inference cost.'};
}
function relationChoice(t){
 checkTask(t);
 const allowed=new Set(['TEMPORAL_NEXT','BACKGROUND','LIMITATION','CONTRAST','ELABORATION','EVIDENCE_FOR']);
 const relations=(t.relations||[]).map(e=>({from:`F${e.from}`,to:`F${e.to}`,type:allowed.has(e.type)?e.type:'UNCLASSIFIED',
  sourceType:e.type}));
 return {schema:'ksgt.r918.author-relation-hints.v1',relations,
  limitation:'Only author-declared relations. A connective must not transform contrast, evidence or limitation into causation.'};
}
function readerChoice(t){
 checkTask(t);
 const role=t.genre==='public_notice'?'ACTION_AND_ELIGIBILITY':t.genre==='science_explainer'?'OBSERVATION_AND_EPISTEMIC_LIMIT':t.genre==='scene_essay'?'EVENT_TRACE_AND_REFERENCE':'PURPOSE_ADAPTIVE';
 return {schema:'ksgt.r918.reader-function.v1',role,audience:t.audience,purpose:t.purpose,
  limitation:'Heuristic genre mapping; not an independently rated salience label and does not authorize removing necessary source facts.'};
}
function note(t,arm){
 if(!ARMS.includes(arm))throw Error('UNKNOWN_ARM');
 const base='글이 명료하면서도 부드럽게 읽히도록 구성하되, 사실을 목록처럼 소진하거나 별다른 정보가 없는 훈계형 맺음말을 덧붙이지 말라. 중요한 불확실성은 보존하되 독자의 판단에 왜 필요한지에 맞추어 전달하라.';
 if(arm==='STRONG_RICH')return base;
 const parts=[base];
 if(['ENTITY_ACCESSIBILITY','JOINT_CONTEXTUAL'].includes(arm)){
  const h=localChoice(t); const active=h.trace.filter(v=>v.entity).map(v=>`${v.factId}:${v.status}:${v.omission}`).join('; ');
  parts.push('인물·대상의 재언급은 문맥에서 지시가 분명할 때만 생략하라. 주제가 유지되어도 여러 대상이 경쟁하면 명시하라. 다음 작성자 표지는 생략의 정답이 아니다: '+(active||'미제공'));
 }
 if(['RELATION_FUNCTION','JOINT_CONTEXTUAL'].includes(arm)){
  const r=relationChoice(t).relations.map(x=>`${x.from}-${x.sourceType}-${x.to}`).join('; ');
  parts.push('시간적 선후, 배경, 대조, 정당화 근거, 인과를 혼동하지 말라. 근거 없는 접속어로 관계를 만들어내지 말라. 제공된 관계: '+(r||'없음'));
 }
 if(['READER_DECISION','JOINT_CONTEXTUAL'].includes(arm)){
  const role=readerChoice(t).role;
  parts.push('독자 관점에서 글의 기능을 정하라('+role+'). 공지는 참여 조건과 독자가 할 일을, 과학 설명은 관측 결과와 해석의 한계를, 장면은 사건의 추적을 우선하되 기계적으로 규칙을 적용하지 말라.');
 }
 return parts.join('\n');
}
function prompt(t,arm){
 checkTask(t);if(!ARMS.includes(arm))throw Error('UNKNOWN_ARM');
 const authoritative=source(t),sourceSha256=hash(authoritative);
 const messages=[{role:'system',content:MAIN},{role:'user',content:note(t,arm)+'\n\n공통 출처 패킷:\n'+JSON.stringify(authoritative)}];
 return {schema:'ksgt.r918.generation-arm.v1',arm,sourceSha256,promptSha256:hash(messages),promptChars:JSON.stringify(messages).length,messages};
}
function manifest(tasks){
 if(!Array.isArray(tasks)||!tasks.length)throw Error('TASKS_REQUIRED');
 const works=new Set(),rows=[];
 for(const t of tasks){checkTask(t);if(works.has(t.sourceWork))throw Error('DUPLICATE_WORK');works.add(t.sourceWork);
  const group=ARMS.map(a=>prompt(t,a));if(new Set(group.map(v=>v.sourceSha256)).size!==1)throw Error('SOURCE_DRIFT');
  rows.push(...group.map(v=>({sourceWork:t.sourceWork,arm:v.arm,sourceSha256:v.sourceSha256,promptSha256:v.promptSha256,promptChars:v.promptChars})));
 }
 return {schema:'ksgt.r918.prompt-only-manifest.v1',works:works.size,arms:ARMS.length,rows,modelCalls:0,trainingSteps:0,humanQualityRatings:0,qualityGain:'NOT_ESTABLISHED'};
}
module.exports={ARMS,localChoice,relationChoice,readerChoice,note,prompt,manifest};
