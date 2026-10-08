"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const R=require("../realizer.cjs"),src=require("../source_cases.json");
const clone=structuredClone;
const ex=id=>src.cases.find(c=>c.id===id);
test("Source constitution and two authored fresh cases are frozen",()=>{
 a.equal(R.checkFrozen(),true);
 a.equal(src.cases.length,2);
 a.deepEqual(src.cases.map(c=>c.events.length),[5,5]);
});
test("One of two cups is an unresolved identity, not a named individual",()=>{
 const c=ex("EX17"),p=R.resolvePartitive(c,c.events[2].partitive,"F3");
 a.equal(p.source_group,"CUPS_A");
 a.equal(p.selected_count,1);a.equal(p.source_group_count,2);
 a.equal(p.individual_identity,"UNRESOLVED_EXISTENTIAL_MEMBER");
 const complement=R.resolveComplement(c,{group_ref:"CUPS_A",exclude:"PARTITIVE_F3",count:1},p);
 a.equal(complement.unique_remaining_member,true);
 a.equal(complement.identity,"SET_COMPLEMENT_UNNAMED");
});
test("Three books admits 1+2 partition, but the remaining two are not one definite book",()=>{
 const c=ex("EX18"),p=R.resolvePartitive(c,c.events[1].partitive,"F2");
 const r=R.resolveComplement(c,c.events[2].remainder,p);
 a.equal(p.selected_count,1);
 a.equal(r.count,2);a.equal(r.unique_remaining_member,false);
});
test("The very same 그중 is rejected under multiple accessible same-kind groups",()=>{
 const c=clone(ex("EX17"));
 c.groups.push({id:"CUPS_OTHER",kind:"CUP",cardinality:4,homogeneous:true,introduced_at:"F1",accessible_until:"F4"});
 a.throws(()=>R.resolvePartitive(c,c.events[2].partitive,"F3"),/PARTITIVE_AMBIGUOUS_GROUP_REFERENCE/);
});
test("Partitive rejects wrong type, unintroduced group, excessive count and nonhomogeneous group",()=>{
 const c=ex("EX17"),p=c.events[2].partitive;
 a.throws(()=>R.resolvePartitive(c,{...p,group_kind:"BOOK"},"F3"),/PARTITIVE_NO_ACCESSIBLE_GROUP/);
 a.throws(()=>R.resolvePartitive(c,{...p,reference:"WRONG"},"F3"),/PARTITIVE_ANTECEDENT_MISMATCH/);
 a.throws(()=>R.resolvePartitive(c,{...p,count:3},"F3"),/NOT_PROPER_PARTITIVE_SUBSET/);
 a.throws(()=>R.resolvePartitive(c,p,"F1"),/PARTITIVE_NO_ACCESSIBLE_GROUP/);
 const c2=clone(c);c2.groups[0].homogeneous=false;
 a.throws(()=>R.resolvePartitive(c2,p,"F3"),/PARTITIVE_HETEROGENEOUS_GROUP/);
});
test("Remainder rejects impossible cardinality or crossing selected group",()=>{
 const c=ex("EX18"),p=R.resolvePartitive(c,c.events[1].partitive,"F2");
 a.throws(()=>R.resolveComplement(c,{...c.events[2].remainder,count:1},p),/REMAINDER_CARDINALITY_MISMATCH/);
 a.throws(()=>R.resolveComplement(c,{...c.events[2].remainder,group_ref:"ANOTHER"},p),/REMAINDER_GROUP_MISMATCH/);
});
test("Restricted -고 is derived from lexeme, not manually supplied joined sentence",()=>{
 const ex17=ex("EX17"),ex18=ex("EX18");
 a.equal(R.deriveGo(ex17.events[0]).conjunctive,"놓고");
 a.equal(R.deriveGo(ex18.events[0]).conjunctive,"올려놓고");
 a.equal(R.deriveGo({...ex17.events[1],head_without_ending:"두 컵에 같은 양의 물을"}).conjunctive,"붓고");
 const neg={...ex17.events[0],polarity:"NEG"};
 a.throws(()=>R.deriveGo(neg),/POLARITY_BLOCKS_GO/);
 const bad={...ex17.events[0],finite_ending:"놓였다"};
 a.throws(()=>R.deriveGo(bad),/LEXICAL_FORM_NOT_ATTESTED/);
});
test("Only linked same-actor positive events may combine, never different actor or scope",()=>{
 const c=ex("EX17"),h=c.events[0],tail=c.events[1],edge=c.links[0];
 a.equal(R.validateConjunction(h,tail,edge),true);
 a.throws(()=>R.validateConjunction(h,{...tail,agent:"STRANGER"},edge),/DIFFERENT_EVENT_AGENT/);
 a.throws(()=>R.validateConjunction(h,{...tail,paragraph:2},edge),/CROSS_PARAGRAPH_LINK/);
 a.throws(()=>R.validateConjunction(h,{...tail,polarity:"NEG"},edge),/NEGATIVE_CONJUNCTIVE_NOT_LICENSED/);
 a.throws(()=>R.validateConjunction({...h,tense:"PAST"},{...tail,tense:"PRESENT"},edge),/MIXED_TEMPORAL_SCOPE/);
 a.throws(()=>R.validateConjunction(h,tail,{...edge,can_join:false}),/NO_LICENSED_SEQUENCE/);
});
test("Four Korean passages have two paragraphs, source coverage and actual material changes",()=>{
 const r=R.court();a.equal(r.output_passages,4);
 a.equal(r.lexical_links,2);a.equal(r.partitive_tokens,2);
 a.equal(r.model_calls,0);a.equal(r.human_scores,0);
 for(const id of ["EX17","EX18"]){
  const b=r.documents.find(x=>x.brief_id===id&&x.mode==="canonical");
  const c=r.documents.find(x=>x.brief_id===id&&x.mode==="composed");
  a.notEqual(b.text,c.text);a.equal(b.physical_sentences,5);a.equal(c.physical_sentences,4);
  a.equal(b.source_event_count,5);a.equal(c.source_event_count,5);
  a.equal(new Set(c.event_trace.map(x=>x.event_id)).size,5);
  a.deepEqual(b.event_trace.map(x=>x.source_semantic_sha256),c.event_trace.map(x=>x.source_semantic_sha256));
  a.equal(c.paragraphs,2);
 }
});
test("Constructed prose links source group correctly and never inserts AI prompt scaffolds",()=>{
 const x=R.passage("EX17","composed"),y=R.passage("EX18","composed");
 a(x.text.includes("컵 두 개를 실험대에 놓고 두 컵에 같은 양의 물을 부었다."));
 a(x.text.includes("그중 한 컵을 창가로 옮겼다."));
 a(x.text.includes("다른 컵보다 높았다."));
 a(y.text.includes("책 세 권을 책장에 올려놓고 그중 한 권을 책상으로 옮겼다."));
 a(y.text.includes("나머지 두 권은 책장에 남아 있었다."));
 a(!x.text.includes("제목:"));a(!y.text.includes("자료 1"));
});
