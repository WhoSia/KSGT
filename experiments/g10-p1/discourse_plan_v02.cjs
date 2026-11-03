"use strict";
/** G10-P1 v0.2: source-licensed discourse planner.
 * Author-supplied rhetorical edges are EVIDENCE, not inferred truth. No Korean deep-parser claim.
 * In the absence of trusted annotations, use strict source order and mark all relations UNKNOWN.
 */
const assert=require("node:assert/strict");
const REL=new Set(["BACKGROUND","TEMPORAL_NEXT","ELABORATION","CONTRAST","EVIDENCE_FOR","LIMITATION"]);
const MOVE=new Set(["SETUP","EVENT","OBSERVATION","INTERPRETATION","LIMITATION","CONCLUSION"]);
function nonempty(s){return typeof s==="string"&&!!s.trim()}
function validate(task){
 if(!task || typeof task!=="object"||Array.isArray(task))throw Error("TASK_OBJECT_REQUIRED");
 for(const k of ["id","genre","audience","purpose"]){if(!nonempty(task[k]))throw Error("INVALID_"+k.toUpperCase())}
 if(!Array.isArray(task.facts)||!task.facts.length||task.facts.length>50||task.facts.some(x=>!nonempty(x)))throw Error("INVALID_FACTS");
 if(!Array.isArray(task.uncertainties)||task.uncertainties.length>50||task.uncertainties.some(x=>!nonempty(x)))throw Error("INVALID_UNCERTAINTIES");
 if(task.factAnnotations!==undefined){
  if(!Array.isArray(task.factAnnotations)||task.factAnnotations.length!==task.facts.length)throw Error("ANNOTATION_LENGTH_MISMATCH");
  for(let i=0;i<task.factAnnotations.length;i++){
   const a=task.factAnnotations[i];
   if(!a||typeof a!=="object"||!MOVE.has(a.move))throw Error("INVALID_MOVE");
   if(a.entity!==undefined&&!nonempty(a.entity))throw Error("INVALID_ENTITY");
   if(a.evidence!==undefined&&!["OBSERVED","GIVEN","REPORTED","INFERRED"].includes(a.evidence))throw Error("INVALID_EVIDENCE");
  }
 }
 if(task.relations!==undefined){
  if(!Array.isArray(task.relations))throw Error("RELATIONS_ARRAY_REQUIRED");
  const seen=new Set();
  for(const e of task.relations){
   if(!e||!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<1||e.to<1||
      e.from>task.facts.length||e.to>task.facts.length||e.from===e.to||!REL.has(e.type))
     throw Error("INVALID_RELATION");
   const key=e.from+":"+e.to+":"+e.type;
   if(seen.has(key))throw Error("DUPLICATE_RELATION");
   seen.add(key);
  }
 }
 return task;
}
function orderByEvidence(task){
 const n=task.facts.length;
 const incoming=Array(n).fill(0);
 const edges=Array.from({length:n},()=>[]);
 // Ordering is only imposed by explicitly annotated temporal relations.
 for(const r of task.relations||[])if(r.type==="TEMPORAL_NEXT"){
  edges[r.from-1].push(r.to-1);incoming[r.to-1]++;
 }
 const queue=[];
 for(let i=0;i<n;i++)if(incoming[i]===0)queue.push(i);
 const order=[];
 while(queue.length){
  queue.sort((a,b)=>a-b);const i=queue.shift();order.push(i);
  for(const t of edges[i])if(--incoming[t]===0)queue.push(t);
 }
 if(order.length!==n)throw Error("TEMPORAL_CYCLE_NOT_LICENSED");
 return order;
}
function build(task){
 validate(task);
 const order=orderByEvidence(task);
 const moves=order.map(i=>({
  id:"M"+(i+1),factId:"F"+(i+1),sourceIndex:i+1,
  move:task.factAnnotations?.[i]?.move||"UNSPECIFIED",
  entity:task.factAnnotations?.[i]?.entity||null,
  evidence:task.factAnnotations?.[i]?.evidence||"UNSPECIFIED"
 }));
 const relationEdges=(task.relations||[]).map(r=>({
  from:"F"+r.from,to:"F"+r.to,type:r.type,authority:"AUTHOR_SUPPLIED"
 }));
 return {
  schema:"ksgt.g10.p1.source-licensed-plan.v02",
  sourceId:task.id,
  factOrder:order.map(i=>"F"+(i+1)),
  moves,relationEdges,
  omittedOrInventedFacts:[],
  unresolved:task.uncertainties.map((text,i)=>({sourceId:"U"+(i+1),text,policy:"NO_UNLICENSED_CERTAINTY"})),
  provenance:{edgeAuthority:relationEdges.length?"SOURCE_BRIEF_ANNOTATION":"NONE",semanticParsing:"NOT_PERFORMED"},
  realizationPolicy:{
   rhetorical:"Treat labeled edges as given constraints; do not assert unspecified causal, temporal or contrastive relations.",
   Korean:"Use topic marking, zero arguments and connectives only when natural and contextually unambiguous; do not force all labels into surface words.",
   epistemic:"Distinguish observed fact from inference and preserve unmeasured/unknown quantities."
  }
 };
}
function compactPromptPlan(task){
 const p=build(task);
 const ordered=p.factOrder.join(" → ");
 const moves=p.moves.map(m=>m.factId+"["+m.move+", "+m.evidence+", referent:"+(m.entity||"미표시")+"]").join("; ");
 const rel=p.relationEdges.map(r=>r.from+" "+r.type+" "+r.to).join("; ")||"관계 지정 없음: 임의 추론 금지";
 return "사실 배열 순서: "+ordered+"\n이동/정보 상태: "+moves+
 "\n원천이 직접 허가한 담화관계: "+rel+
 "\n불확실성: "+p.unresolved.map(u=>u.sourceId+" "+u.text).join("; ")+
 "\n한국어 실현: 주제표지는 맥락에 맞게, 주어/목적어 생략은 참조가 분명할 때만, 인과·비교 연결은 근거 있을 때만. 종결어미/길이를 기계적으로 통일하지 말 것.";
}
module.exports={REL,MOVE,validate,orderByEvidence,build,compactPromptPlan};
