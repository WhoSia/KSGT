"use strict";
/* KRC v0.6 — cardinality-aware reference and bounded morphology
 * Evidence is sourced event/group ID and licensed text; not a Korean entailment theorem.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const source=require("./source_cases.json"),preseal=require("./constitution.json");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const LEXICON=Object.freeze({
 "놓다":{stem:"놓",finite:"놓았다"},
 "올려놓다":{stem:"올려놓",finite:"올려놓았다"},
 "옮기다":{stem:"옮기",finite:"옮겼다"},
 "붓다":{stem:"붓",finite:"부었다",note:"ㅅ stem restored under -고"},
 "읽다":{stem:"읽",finite:"읽었다"}
});
function fail(code){const e=new Error(code);e.code=code;throw e;}
function checkFrozen(){
 if(preseal.status!=="FROZEN_BEFORE_V06_OUTPUTS"||source.cases.length!==2||
    source.cases.some(c=>c.events.length!==5))fail("FROZEN_SOURCE_MISMATCH");
 return true;
}
function eventIndex(c,id){return c.events.findIndex(e=>e.id===id);}
function groupAvailable(c,group,at){
 const here=eventIndex(c,at);
 const began=eventIndex(c,group.introduced_at);
 const end=eventIndex(c,group.accessible_until);
 if(here<0||began<0||end<0)fail("UNREGISTERED_DISCOURSE_EVENT");
 return began<here&&here<=end;
}
function resolvePartitive(c,partitive,at){
 if(!partitive||!Number.isInteger(partitive.count)||partitive.count<=0)fail("INVALID_PARTITIVE_QUANTITY");
 const candidates=c.groups.filter(g=>g.kind===partitive.group_kind&&groupAvailable(c,g,at));
 if(!candidates.length)fail("PARTITIVE_NO_ACCESSIBLE_GROUP");
 // Even an internally identified source group cannot make an ambiguous surface
 // '그중' unambiguous if two same-kind groups remain discourse-accessible.
 if(candidates.length!==1)fail("PARTITIVE_AMBIGUOUS_GROUP_REFERENCE");
 const g=candidates[0];
 if(partitive.reference!==g.id)fail("PARTITIVE_ANTECEDENT_MISMATCH");
 if(!g.homogeneous)fail("PARTITIVE_HETEROGENEOUS_GROUP");
 if(partitive.count>=g.cardinality)fail("NOT_PROPER_PARTITIVE_SUBSET");
 return {ref_id:"PARTITIVE_"+at,source_group:g.id,source_event:g.introduced_at,
   selected_count:partitive.count,source_group_count:g.cardinality,
   kind:g.kind,individual_identity:"UNRESOLVED_EXISTENTIAL_MEMBER",
   proof:"ONE_ACCESSIBLE_KIND_MATCH_AND_SOURCE_CARDINALITY_ONLY"};
}
function resolveComplement(c,remainder,selected){
 const group=c.groups.find(x=>x.id===remainder.group_ref);
 if(!group||group.id!==selected.source_group)fail("REMAINDER_GROUP_MISMATCH");
 if(remainder.exclude!==selected.ref_id)fail("REMAINDER_EXCLUSION_MISMATCH");
 const remaining=group.cardinality-selected.selected_count;
 if(remaining!==remainder.count||remaining<1)fail("REMAINDER_CARDINALITY_MISMATCH");
 return {source_group:group.id,count:remaining,complement_of:selected.ref_id,
    identity:"SET_COMPLEMENT_UNNAMED",
    unique_remaining_member:remaining===1,
    proof:"CARDINALITY_AND_EXCLUSION_NOT_INDIVIDUAL_IDENTITY"};
}
function validateConjunction(head,tail,edge){
 if(!head||!tail||edge?.relation!=="SEQUENCE"||edge.can_join!==true||
    edge.from!==head.id||edge.to!==tail.id)fail("NO_LICENSED_SEQUENCE");
 if(head.paragraph!==tail.paragraph)fail("CROSS_PARAGRAPH_LINK");
 if(!head.agent||head.agent!==tail.agent||edge.agent!==head.agent)fail("DIFFERENT_EVENT_AGENT");
 if(head.polarity!=="POS"||tail.polarity!=="POS")fail("NEGATIVE_CONJUNCTIVE_NOT_LICENSED");
 if(head.tense&&tail.tense&&head.tense!==tail.tense)fail("MIXED_TEMPORAL_SCOPE");
 return true;
}
function deriveGo(e){
 if(e.polarity!=="POS")fail("POLARITY_BLOCKS_GO");
 const lex=LEXICON[e.verb_lemma];
 if(!lex||lex.finite!==e.finite_ending)fail("LEXICAL_FORM_NOT_ATTESTED");
 if(!e.finite.endsWith(e.finite_ending+".")||!e.head_without_ending)fail("PREDICATE_SURFACE_INCONSISTENCY");
 // -고 uses the stem rather than the past finite inflection. No claim of
 // full Korean generative morphology (irregulars, aspect, auxiliaries, modality).
 return {stem:lex.stem,conjunctive:lex.stem+"고",lexeme:e.verb_lemma,
   epistemic:"LIMITED_DICTIONARY_NO_GENERAL_MORPHOLOGY_THEOREM"};
}
function passage(caseId,mode="composed"){
 checkFrozen();
 if(!["canonical","composed"].includes(mode))fail("UNKNOWN_MODE");
 const c=source.cases.find(x=>x.id===caseId);if(!c)fail("UNKNOWN_CASE");
 const paragraphs=[[],[]],trace=[],partitives={},links=[],selectionRefs=[];
 // Reference licensing is separate from surface composition and executed for
 // both modes; a proof of source reference availability never implies naturalness.
 for(const e of c.events){
  if(e.partitive){
   const x=resolvePartitive(c,e.partitive,e.id);
   partitives[x.ref_id]=x;selectionRefs.push(x);
  }
  if(e.remainder){
   const sel=partitives[e.remainder.exclude];
   if(!sel)fail("UNLICENSED_REMAINDER_WITHOUT_SELECTION");
   resolveComplement(c,e.remainder,sel);
  }
  if(e.comparison){
   const sel=partitives[e.comparison.target];
   if(!sel)fail("COMPARISON_WITHOUT_PARTITIVE_SOURCE");
   const co=resolveComplement(c,{group_ref:e.comparison.group_ref,exclude:sel.ref_id,count:e.comparison.complement_count},sel);
   if(!co.unique_remaining_member)fail("COMPARATIVE_OTHER_MEMBER_NOT_UNIQUE");
   if(e.comparison.direction!=="HIGHER")fail("COMPARISON_DIRECTION_MUTATION");
  }
  trace.push({event_id:e.id,source_semantic_sha256:sha(JSON.stringify(e)),
    predicate:e.predicate,polarity:e.polarity,
    referent:e.partitive?"PARTITIVE_"+e.id:e.remainder?e.remainder.exclude:e.comparison?e.comparison.target:null});
 }
 for(let i=0;i<c.events.length;i++){
  const e=c.events[i],next=c.events[i+1],edge=c.links.find(x=>x.from===e.id&&x.to===next?.id&&x.can_join);
  if(mode==="composed"&&edge){
   validateConjunction(e,next,edge);
   const m=deriveGo(e);
   const text=e.head_without_ending+" "+m.conjunctive+" "+next.finite;
   paragraphs[e.paragraph-1].push(text);links.push({from:e.id,to:next.id,derived:m.conjunctive,source_ids:[e.id,next.id]});
   i++;continue;
  }
  let text=e.finite;
  const prev=c.events[i-1];
  if(mode==="composed"&&prev&&c.links.some(x=>x.from===prev.id&&x.to===e.id&&x.relation==="EPISTEMIC_LIMIT")){
   if(e.predicate!=="NOT_MEASURED"||e.polarity!=="NEG")fail("FALSE_EPISTEMIC_LIMIT");
   text="다만 "+text;
  }
  paragraphs[e.paragraph-1].push(text);
 }
 if(paragraphs.some(p=>!p.length)||trace.length!==5||
    new Set(trace.map(x=>x.event_id)).size!==5)fail("SOURCE_COVERAGE_FAILURE");
 return {brief_id:c.id,mode,text:paragraphs.map(p=>p.join(" ")).join("\n\n"),
   paragraphs:2,source_event_count:trace.length,physical_sentences:paragraphs.reduce((n,p)=>n+p.length,0),
   event_trace:trace,joined_events:links,licensed_partitives:selectionRefs,
   semantic_assessment:"SOURCE_GROUP_CARDINALITY_ONLY_NO_FULL_ENTAILMENT",
   reader_naturalness:"NOT_OBSERVED"};
}
function court(){
 const documents=source.cases.flatMap(c=>["canonical","composed"].map(m=>passage(c.id,m)));
 return {schema:"ksgt.g9.p53.krc.v06.cardinality-conscious-korean-prose.v1",documents,
  new_source_cases:source.cases.length,output_passages:documents.length,
  physically_composed:documents.filter(x=>x.mode==="composed").length,
  lexical_links:documents.filter(x=>x.mode==="composed").flatMap(x=>x.joined_events).length,
  partitive_tokens:documents.filter(x=>x.mode==="composed").flatMap(x=>x.licensed_partitives).length,
  model_calls:0,human_scores:0,dataset_gold_comparison:"NOT_PERFORMED",
  interpretation:"Finite cardinality-aware discourse reference and productive -고 from restricted lexicon, not free Korean generation"};
}
if(require.main===module){
 const out=process.argv[2];const x=court();
 if(out)fs.writeFileSync(out,JSON.stringify(x,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({texts:x.output_passages,joins:x.lexical_links,partitives:x.partitive_tokens,
   verdict:x.interpretation}));
}
module.exports={checkFrozen,groupAvailable,resolvePartitive,resolveComplement,validateConjunction,deriveGo,passage,court};
