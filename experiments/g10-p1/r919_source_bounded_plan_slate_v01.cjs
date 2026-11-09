'use strict';
/** R9.19 source-bounded plan slate for *future* Korean prose generation.
 * Author-approved temporal relations = hard order; other priorities are soft.
 * No model calls, no claim of readability / coherence quality.
 */
const crypto=require('node:crypto');
const {checkTask,source}=require('./r915_reader_first_harness.cjs');
const METHODS=Object.freeze(['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY']);
const digest=s=>crypto.createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
const MOVE_PRIORITIES=Object.freeze({
 public_notice:{EVENT:0,SETUP:1,OBSERVATION:2,LIMITATION:3},
 science_explainer:{SETUP:0,OBSERVATION:1,EVENT:2,LIMITATION:3},
 scene_essay:{SETUP:0,EVENT:1,OBSERVATION:2,LIMITATION:3}
});
function validate(t){
 checkTask(t);
 if(t.factAnnotations!==undefined&&(!Array.isArray(t.factAnnotations)||t.factAnnotations.length!==t.facts.length))
  throw Error('ANNOTATIONS_MUST_ALIGN_WITH_FACTS');
 if(t.factAnnotations?.some(a=>!a||typeof a!=='object'||Array.isArray(a)))
  throw Error('BAD_FACT_ANNOTATION');
 return t;
}
function temporalGraph(t){
 validate(t);
 const n=t.facts.length, edges=[],edgeSet=new Set(),out=Array.from({length:n},()=>[]), indeg=Array(n).fill(0);
 for(const e of t.relations||[]){
  if(e.type!=='TEMPORAL_NEXT')continue;
  if(e.from===e.to)throw Error('SELF_TEMPORAL_EDGE');
  const id=e.from+':'+e.to;
  if(edgeSet.has(id))continue;edgeSet.add(id);
  out[e.from-1].push(e.to-1);indeg[e.to-1]++;edges.push({from:e.from,to:e.to});
 }
 return {n,out,indeg,edges};
}
function rank(t,method,available,lastEntity){
 if(method==='TEMPORAL_STABLE')return available.map(i=>({i,key:[i]}));
 if(method==='READER_FUNCTION'){
  const priority=MOVE_PRIORITIES[t.genre]||{SETUP:0,EVENT:1,OBSERVATION:2,LIMITATION:3};
  return available.map(i=>({i,key:[priority[t.factAnnotations?.[i]?.move]??4,i]}));
 }
 if(method==='ENTITY_CONTINUITY'){
  return available.map(i=>{
   const e=t.factAnnotations?.[i]?.entity;
   // Only source-provided identity labels. Not coreference gold.
   const continuation=lastEntity!==null&&typeof e==='string'&&e===lastEntity;
   return {i,key:[continuation?0:1,i]};
  });
 }
 throw Error('UNKNOWN_METHOD');
}
function select(t,method){
 validate(t);
 if(!METHODS.includes(method))throw Error('UNKNOWN_METHOD');
 const g=temporalGraph(t),indeg=[...g.indeg],seen=new Set(),order=[],trace=[];
 let lastEntity=null;
 for(let step=0;step<g.n;step++){
  const available=indeg.map((v,i)=>v===0&&!seen.has(i)?i:-1).filter(i=>i>=0);
  if(!available.length)throw Error('TEMPORAL_RELATION_CYCLE');
  const ranked=rank(t,method,available,lastEntity).sort((a,b)=>{
   for(let k=0;k<Math.max(a.key.length,b.key.length);k++){
    const delta=(a.key[k]??0)-(b.key[k]??0);if(delta)return delta;
   }return a.i-b.i;
  });
  const picked=ranked[0].i;seen.add(picked);order.push(picked+1);
  trace.push({step:step+1,selectedFactId:'F'+(picked+1),eligibleFactIds:available.map(i=>'F'+(i+1)),
   reason:method==='TEMPORAL_STABLE'?'INPUT_TIEBREAK':method==='READER_FUNCTION'?'ANNOTATED_MOVE_TIEBREAK':'ENTITY_LABEL_TIEBREAK'});
  const e=t.factAnnotations?.[picked]?.entity;
  lastEntity=typeof e==='string'&&e.trim()?e:null;
  for(const j of g.out[picked])indeg[j]--;
 }
 for(const e of g.edges)if(order.indexOf(e.from)>=order.indexOf(e.to))throw Error('TEMPORAL_CONTRACT_BREACH');
 return {method,order,trace,sourceSha256:digest(source(t)),temporalEdges:g.edges,
  warnings:['Planning uses only explicit TEMPORAL_NEXT as hard order; all other relations remain source context.',
   'Annotations are author-provided tags, not measured reader salience or Korean coreference judgments.']};
}
function slate(t){
 validate(t);
 const plans=METHODS.map(method=>select(t,method));
 const unique=new Set(plans.map(p=>p.order.join(',')));
 return {schema:'ksgt.g10.p1.r919.source-bounded-plans.v1',sourceWork:t.sourceWork,
  authoritativeSourceSha256:digest(source(t)),plans,distinctOrders:unique.size,
  actualGenerationCalls:0,readerRatings:0,qualityAdvantage:'NOT_EVALUATED'};
}
function candidatePrompt(t,plan){
 validate(t);
 if(!plan||!METHODS.includes(plan.method)||!Array.isArray(plan.order))throw Error('INVALID_PLAN');
 const verified=select(t,plan.method);
 if(plan.order.join(',')!==verified.order.join(',')||plan.sourceSha256!==verified.sourceSha256)
  throw Error('PLAN_DRIFT_OR_UNAUTHENTICATED_SOURCE');
 const facts=plan.order.map(i=>({factId:'F'+i,content:t.facts[i-1]}));
 return {schema:'ksgt.g10.p1.r919.candidate-message.v1',sourceWork:t.sourceWork,method:plan.method,
  sourceSha256:verified.sourceSha256,
  messages:[{role:'system',content:'같은 근거에서 한국어 완성 산문 한 편만 작성한다. 자연스럽게 읽히도록 구성하되 원천에 없는 사건, 인과, 조건, 감정은 단정하지 않는다. 내부 번호·계획·검증 언어는 출력하지 않는다.'},
  {role:'user',content:JSON.stringify({genre:t.genre,audience:t.audience,purpose:t.purpose,
    suggestedInformationOrder:facts,allOriginalFacts:t.facts,uncertainties:t.uncertainties,
    authorDeclaredRelations:t.relations||[],selectionHint:plan.method,
    instruction:'정보 순서는 작문을 위한 후보이며 원천의 명시된 관계를 위반하지 말 것. 중요한 정보를 빠뜨리지 말고 모든 불확실성을 기계적으로 나열하지도 말 것. 다른 미확인 정보를 임의로 완성하지 말 것.'})}]};
}
function compareCandidateTexts(candidates){
 if(!Array.isArray(candidates)||!candidates.length)throw Error('CANDIDATES_REQUIRED');
 const textHashes=candidates.map(c=>{
  if(!c||typeof c.text!=='string'||!c.text.trim()||typeof c.planMethod!=='string')throw Error('BAD_CANDIDATE');
  return {method:c.planMethod,textSha256:digest(c.text),characters:[...c.text].length};
 });
 const unique=new Set(textHashes.map(x=>x.textSha256));
 return {schema:'ksgt.g10.p1.r919.descriptive-text-receipts.v1',candidates:textHashes,
  distinctExactTexts:unique.size,qualityJudge:'NONE',fidelityJudge:'NONE',
  caveat:'Distinct hashes are not semantic, lexical or stylistic diversity scores.'};
}
module.exports={METHODS,validate,temporalGraph,select,slate,candidatePrompt,compareCandidateTexts};
