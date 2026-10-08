"use strict";
/* KRC v0.5 — finite Korean event-aware clause composition.
 * Completeness is source event-ID trace, NOT a theorem of Korean entailment.
 * All finite/coordinate/elliptical surfaces are separately author-attested.
 */
const fs=require("node:fs");
const crypto=require("node:crypto");
const src=require("./source_events.json");
const constitution=require("./constitution.json");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const ACTOR_PREFIX={MINJI:"민지는",SEOYUN:"서윤은"};
function fail(s){const e=new Error(s);e.code=s;throw e}
function assertSource(){
 if(constitution.status!=="FROZEN_BEFORE_V05_OUTCOMES"||
 src.briefs.length!==2||src.briefs.some(b=>b.events.length!==5))fail("PRESEAL_OR_SOURCE_DRIFT");
 for(const b of src.briefs){
  if(new Set(b.events.map(e=>e.id)).size!==5)fail("SOURCE_DUPLICATE_FACT");
  if(b.events.some((e,i)=>e.id!=="F"+(i+1)))fail("SOURCE_FACT_ORDER");
  if(b.events.some((e,i)=>i>0&&e.event.sequence<=b.events[i-1].event.sequence))fail("SOURCE_TEMPORAL_ORDER");
  for(const e of b.events)validateEvent(e);
  for(const link of b.links){
   if(!b.events.find(x=>x.id===link.from)||!b.events.find(x=>x.id===link.to))fail("BROKEN_EDGE_SOURCE");
   const i=b.events.findIndex(x=>x.id===link.from);
   if(b.events[i+1]?.id!==link.to)fail("NONADJACENT_DISCOURSE_EDGE");
  }
 }
 return true;
}
function validateEvent(e){
 if(!e||!e.event||!e.surfaces||![1,2].includes(e.paragraph))fail("INVALID_EVENT");
 const {actor,predicate,polarity}=e.event;
 if(!["POS","NEG"].includes(polarity)||typeof predicate!=="string")fail("INVALID_PREDICATION");
 if(actor!==null&&!ACTOR_PREFIX[actor])fail("UNKNOWN_ACTOR_ROLE");
 if(typeof e.surfaces.full!=="string"||!e.surfaces.full.endsWith("."))fail("NO_FINITE_SOURCE");
 if(actor&&!e.surfaces.full.startsWith(ACTOR_PREFIX[actor])&&
    !(e.id==="F4"&&e.event.predicate==="HIGHER_THAN"))fail("OVERT_ACTOR_MISMATCH");
 if(e.surfaces.no_actor){
  if(actor===null||!e.surfaces.no_actor.endsWith(".")||
     e.surfaces.no_actor.startsWith(ACTOR_PREFIX[actor]))fail("UNLICENSED_ELLIPTIC_SURFACE");
 }
 if(e.surfaces.go){
  if(!e.surfaces.go.endsWith("고")||!["POS"].includes(polarity))fail("UNLICENSED_CONJUNCTIVE_SURFACE");
  if(typeof e.surfaces.go_actor_realized!=="boolean")fail("UNDECLARED_GO_ACTOR_REALIZATION");
  const overt=e.surfaces.go.startsWith(ACTOR_PREFIX[actor]||"!NULL!");
  if(e.surfaces.go_actor_realized!==overt)fail("CONJUNCTIVE_ACTOR_MARKER_MISMATCH");
 }
 if(e.event.predicate==="HIGHER_THAN"&&(!/높았다\.$/u.test(e.surfaces.full)||e.event.comparison!=="HIGHER"))fail("COMPARISON_POLARITY_MISMATCH");
 if(e.event.epistemic==="NOT_MEASURED"&&
   (e.event.polarity!=="NEG"||!/측정하지 않았다\.$/u.test(e.surfaces.full)))fail("UNKNOWN_TO_OBSERVED_MUTATION");
 return true;
}
function linkOf(b,from,to,type){
 return b.links.find(x=>x.from===from&&x.to===to&&x.type===type);
}
function checkJoin(b,head,tail){
 if(!head||!tail)fail("MISSING_JOIN_EVENT");
 if(head.paragraph!==tail.paragraph)fail("CROSS_PARAGRAPH_JOIN");
 if(head.event.actor===null||tail.event.actor===null||head.event.actor!==tail.event.actor)fail("JOIN_ACTOR_MISMATCH");
 if(head.event.polarity!=="POS"||tail.event.polarity!=="POS")fail("JOIN_WITH_NEGATED_EVENT_NOT_LICENSED");
 if(tail.event.sequence!==head.event.sequence+1)fail("JOIN_TEMPORAL_ORDER");
 const edge=linkOf(b,head.id,tail.id,"SEQUENTIAL_AND");
 if(!edge||edge.actor_id!==head.event.actor||edge.attested_event_order!==true)fail("UNLICENSED_SEQUENTIAL_JOIN");
 if(!head.surfaces.go||!tail.surfaces.no_actor)fail("UNLICENSED_JOIN_SURFACE");
 return {source_edge:edge,actor:head.event.actor,event_ids:[head.id,tail.id],surface_effect:"SOURCE_ATTESTED_GO_SEQUENCE"};
}
function checkEllipsis(b,previous,current,ctx){
 if(!previous||!current)fail("ELLIPSIS_NO_ANTECEDENT");
 if(previous.paragraph!==current.paragraph)fail("CROSS_PARAGRAPH_ELLIPSIS");
 if(current.event.actor===null||previous.event.actor===null||
    current.event.actor!==previous.event.actor)fail("ACTOR_REIDENTIFICATION_FAILED");
 const link=linkOf(b,previous.id,current.id,"ELLIPSIS_ALLOW");
 if(!link||link.actor_id!==current.event.actor||
  link.discourse_anchor!==previous.id)fail("UNLICENSED_ELLIPSIS_EDGE");
 if(!Array.isArray(link.antecedents)||link.antecedents.length!==1||
   link.antecedents[0]!==current.event.actor)fail("AMBIGUOUS_ANTECEDENT");
 if(ctx.paragraph!==current.paragraph||ctx.active_actor!==current.event.actor||
    ctx.candidate_actors.length!==1||ctx.candidate_actors[0]!==current.event.actor)
  fail("REFERENT_NOT_RECOVERABLE");
 if(!current.surfaces.no_actor&&!current.surfaces.go)fail("NO_ELLIPTIC_SURFACE");
 return {omitted_actor:current.event.actor,antecedent_fact:previous.id,
  source_link:"EXPLICIT_SAME_ACTOR_ELLIPSIS",subject_recovery:"AUTHOR_ASSIGNED_CONTEXT_NOT_GENERAL_ANAPHORA"};
}
function checkCaveat(b,prev,next){
 if(prev?.paragraph!==next?.paragraph)fail("CROSS_PARAGRAPH_CAVEAT");
 const edge=linkOf(b,prev.id,next.id,"EPISTEMIC_LIMIT");
 if(!edge||edge.connective!=="다만"||edge.causal_warrant!==false||
   next.event.epistemic!=="NOT_MEASURED"||next.event.polarity!=="NEG")fail("UNLICENSED_EPISTEMIC_CAVEAT");
 return {connective:"다만 ",edge_from:prev.id,edge_to:next.id,entailment:"NOT_INDEPENDENTLY_PROVEN"};
}
function declineMutation(opts={}){
 const op=opts.op;
 if(op==="FLIP_NEGATION"||op==="INVERT_POLARITY")fail("POLARITY_MUTATION_FORBIDDEN");
 if(op==="REVERSE_COMPARISON")fail("COMPARISON_REVERSAL_FORBIDDEN");
 if(op==="ADD_CAUSE")fail("NO_CAUSAL_WARRANT");
 if(op==="INSERT_NEW_EVENT")fail("EVENT_INVENTION_FORBIDDEN");
 if(op&&op!=="NONE")fail("UNSUPPORTED_GENERATION_OPERATION");
}
function realize(briefId,variant="canonical",overrides={}){
 assertSource();declineMutation(overrides);
 if(!["canonical","combined"].includes(variant))fail("UNKNOWN_REALIZATION_VARIANT");
 const b=src.briefs.find(x=>x.id===briefId);if(!b)fail("UNKNOWN_BRIEF");
 const paragraphs=[[],[]],trace=[],joined=[],ellipses=[],caveats=[];
 const ctx={paragraph:null,active_actor:null,candidate_actors:[]};
 const pushEvent=(e,surface,kind,details={})=>{
  const h=sha(JSON.stringify(e.event));
  trace.push({fact_id:e.id,paragraph:e.paragraph,source_event_sha256:h,
    actor:e.event.actor,predicate:e.event.predicate,polarity:e.event.polarity,
    surface_kind:kind,surface_sha256:sha(surface),...details});
 };
 for(let i=0;i<b.events.length;i++){
  const e=b.events[i],previous=b.events[i-1];
  if(ctx.paragraph!==e.paragraph){
   ctx.paragraph=e.paragraph;ctx.active_actor=null;ctx.candidate_actors=[];
  }
  if(variant==="combined"){
   const next=b.events[i+1];
   if(next&&linkOf(b,e.id,next.id,"SEQUENTIAL_AND")){
    const warrant=checkJoin(b,e,next);
    let omittedHead=false;
    if(e.surfaces.go_actor_realized===false){
     const proof=checkEllipsis(b,previous,e,ctx);
     ellipses.push({fact_id:e.id,...proof});omittedHead=true;
    }
    const span=e.surfaces.go+" "+next.surfaces.no_actor;
    paragraphs[e.paragraph-1].push(span);
    pushEvent(e,e.surfaces.go,omittedHead?"JOIN_HEAD_ELLIPTIC":"JOIN_HEAD_OVERT",
      {join_to:next.id,join_license:warrant.source_edge.type});
    pushEvent(next,next.surfaces.no_actor,"JOIN_TAIL_SAME_ACTOR",
      {join_from:e.id,join_license:warrant.source_edge.type});
    joined.push({from:e.id,to:next.id,actor:warrant.actor});
    ctx.active_actor=next.event.actor;ctx.candidate_actors=[next.event.actor];
    i++;continue;
   }
   if(previous&&linkOf(b,previous.id,e.id,"ELLIPSIS_ALLOW")){
    const proof=checkEllipsis(b,previous,e,ctx);
    ellipses.push({fact_id:e.id,...proof});
    paragraphs[e.paragraph-1].push(e.surfaces.no_actor);
    pushEvent(e,e.surfaces.no_actor,"SAME_ACTOR_ELLIPSIS",{antecedent_fact:previous.id});
    ctx.active_actor=e.event.actor;ctx.candidate_actors=[e.event.actor];continue;
   }
  }
  let prefix="";
  if(variant==="combined"&&previous&&linkOf(b,previous.id,e.id,"EPISTEMIC_LIMIT")){
   const proof=checkCaveat(b,previous,e);
   prefix=proof.connective;caveats.push(proof);
  }
  paragraphs[e.paragraph-1].push(prefix+e.surfaces.full);
  pushEvent(e,e.surfaces.full,"SOURCE_FINITE_OVERT",{prefix:prefix.trim()});
  ctx.active_actor=e.event.actor;ctx.candidate_actors=e.event.actor?[e.event.actor]:[];
 }
 if(paragraphs.some(x=>x.length===0)||trace.length!==b.events.length||
    new Set(trace.map(x=>x.fact_id)).size!==b.events.length)fail("MISSING_SOURCE_EVENT");
 const text=paragraphs.map(p=>p.join(" ")).join("\n\n");
 if(/(?:^|\n)\s*(?:제목|목록|인사말|인용부호)\s*[:：]/um.test(text))fail("UNLICENSED_META_TEXT");
 return {brief_id:briefId,variant,text,paragraphs:paragraphs.length,
  sentence_count:paragraphs.reduce((sum,p)=>sum+p.length,0),
  source_event_count:trace.length,source_trace:trace,
  join_witnesses:joined,ellipsis_witnesses:ellipses,caveat_witnesses:caveats,
  semantic_custody:"SOURCE_EVENT_OBJECTS_TRACED_NO_SURFACE_ENTAILMENT_PROOF",
  korean_naturalness:"NOT_EVALUATED",
  human_ratings:"NONE"};
}
function court(){
 const documents=src.briefs.flatMap(b=>["canonical","combined"].map(v=>realize(b.id,v)));
 const paired=src.briefs.map(b=>{
  const c=documents.find(x=>x.brief_id===b.id&&x.variant==="canonical");
  const v=documents.find(x=>x.brief_id===b.id&&x.variant==="combined");
  return {brief_id:b.id,changed_surface:c.text!==v.text,
   canonical_sentences:c.sentence_count,composed_sentences:v.sentence_count,
   join_count:v.join_witnesses.length,ellipsis_count:v.ellipsis_witnesses.length,
   same_source_event_hashes:c.source_trace.every((x,i)=>x.source_event_sha256===v.source_trace[i].source_event_sha256)};
 });
 return {schema:"ksgt.g9.p53.krc.v05.korean-clause-composition.v1",
   documents,paired,source_event_count:10,outputs:documents.length,
   actual_join_operations:paired.reduce((n,p)=>n+p.join_count,0),
   actor_ellipsis_operations:paired.reduce((n,p)=>n+p.ellipsis_count,0),
   full_korean_semantic_equivalence:"UNPROVEN",
   human_ratings:"NONE",model_calls:0,
   claim:"FINITE_SOURCE_LICENSED_CLAUSE_COMPOSITION_DEMONSTRATION_ONLY"};
}
if(require.main===module){
 const r=court(),out=process.argv[2];
 if(out)fs.writeFileSync(out,JSON.stringify(r,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({documents:r.outputs,joined:r.actual_join_operations,
  ellipses:r.actor_ellipsis_operations,pairs:r.paired}));
}
module.exports={assertSource,validateEvent,linkOf,checkJoin,checkEllipsis,checkCaveat,declineMutation,realize,court};
