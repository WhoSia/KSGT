"use strict";
/** G10-P1 v0.3 — explicitly grounded information-structure realization.
 * Generates editorial hints only; NEVER asserts linguistic correctness.
 * Input annotations are authored, not independently inferred.
 */
const {build,validate}=require("./discourse_plan_v02.cjs");
function normalizeEntity(v){return typeof v==="string"?v.trim().replace(/\s+/g," "):"";}
function distinct(arr){return [...new Set(arr.filter(Boolean))];}
function realize(task){
 validate(task);
 const p=build(task);
 const history=[];
 const trace=p.moves.map((move,idx)=>{
   const explicit=normalizeEntity(move.entity);
   const prior=idx===0?null:history[history.length-1];
   const alternatives=distinct(history.slice(-3));
   const repeated=!!explicit&&explicit===prior;
   const topic=(!explicit)?"UNSPECIFIED":
      (repeated?"CONTINUE_CANDIDATE":alternatives.includes(explicit)?"REINTRODUCE_CANDIDATE":"INTRODUCE_CANDIDATE");
   const omission=(!explicit)?"NO_EVIDENCE":
      repeated&&alternatives.length===1?"ELLIPSIS_MAY_BE_LICENSED_CHECK_CONTEXT":
      "DO_NOT_FORCE_ELLIPSIS";
   // Ambiguity is not solved by repeated labels. We conservatively withhold
   // omission suggestions when multiple referent labels are in local history.
   const discourseLinks=p.relationEdges.filter(e=>e.from===move.factId||e.to===move.factId);
   const explicitLimit=p.unresolved.length>0&&move.evidence==="INFERRED";
   if(explicit)history.push(explicit);
   return {factId:move.factId,sourceIndex:move.sourceIndex,authorEntity:explicit||null,
     topicalityHint:topic,ellipsisHint:omission,
     evidence:move.evidence,discourseLinks,
     caution:explicitLimit?"DO_NOT_TURN_INFERENCE_INTO_OBSERVATION":"NONE",
     confidence:"HEURISTIC_NOT_HUMAN_VALIDATED"};
 });
 return {schema:"ksgt.g10.p1.realization-hints.v03",sourceId:task.id,
   sourcePlan:p,trace,
   boundary:"SURFACE_REALIZATION_HINTS_NOT_CORRECTNESS_LABELS",
   informationalLimits:[
     "Entity tags identify annotations, not unique coreference resolutions.",
     "Topicality/ellipsis choices require actual discourse and speaker context.",
     "No unsupported causal, epistemic or referential commitments."
   ]};
}
function brief(task){
 const r=realize(task);
 return r.trace.map(x=>{
   const rel=x.discourseLinks.map(e=>e.from+"-"+e.type+"-"+e.to).join(",")||"none";
   return x.factId+": entity="+(x.authorEntity||"not-provided")+
    "; topicality="+x.topicalityHint+"; ellipsis="+x.ellipsisHint+
    "; source-relations="+rel+"; evidence="+x.evidence+"; caution="+x.caution;
 }).join("\n")+"\n제약: 위 값은 문장 생성 선택을 돕는 가능성 표시일 뿐, 조사를 반드시 바꾸거나 생략하라는 명령이 아니다.";
}
module.exports={realize,brief};
