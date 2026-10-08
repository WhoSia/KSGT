"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const K=require("../composer.cjs");
const src=require("../source_events.json");
const brief=id=>src.briefs.find(b=>b.id===id);
const e=(id,n)=>brief(id).events[n-1];
test("Two fresh contexts, ten predicates, typed actors and source lexeme witnesses",()=>{
 assert.equal(K.assertSource(),true);
 assert.equal(src.briefs.length,2);
 for(const b of src.briefs){
  assert.equal(b.events.length,5);
  b.events.forEach(a=>assert.equal(K.validateEvent(a),true));
 }
});
test("Two full Korean passages have distinct joined versions with complete source-event trace",()=>{
 const r=K.court();
 assert.equal(r.outputs,4);
 assert.equal(r.actual_join_operations,2);
 assert.equal(r.actor_ellipsis_operations,2);
 assert(r.paired.every(p=>p.changed_surface&&p.same_source_event_hashes));
 for(const d of r.documents){
  assert.equal(d.paragraphs,2);
  assert.equal(d.source_event_count,5);
  assert.equal(new Set(d.source_trace.map(x=>x.fact_id)).size,5);
  assert.equal(d.text.split("\n\n").length,2);
  assert.equal(d.korean_naturalness,"NOT_EVALUATED");
 }
 assert.equal(r.full_korean_semantic_equivalence,"UNPROVEN");
 assert.equal(r.model_calls,0);
});
test("Science join: same actor sequence; remaining repeated subject may be omitted; limitation is warranted",()=>{
 const c=K.realize("EX13","canonical"),j=K.realize("EX13","combined");
 assert.equal(c.sentence_count,5);assert.equal(j.sentence_count,4);
 assert(j.text.includes("민지는 실험대 위에 투명한 컵 두 개를 놓고 두 컵에 같은 양의 물을 부었다."));
 assert(j.text.includes("그중 한 컵을 창가로 옮겼다."));
 assert(j.text.includes("다만 민지는 두 컵 주변의 공기 온도를 측정하지 않았다."));
 assert.equal(j.join_witnesses.length,1);
 assert.equal(j.ellipsis_witnesses.length,1);
 assert.equal(j.caveat_witnesses.length,1);
});
test("Scene join: omit same-source actor in first conjunct, but reintroduce after impersonal sound",()=>{
 const c=K.realize("EX14","canonical"),j=K.realize("EX14","combined");
 assert.equal(c.sentence_count,5);assert.equal(j.sentence_count,4);
 assert(j.text.includes("서윤은 늦은 오후에 도서관 앞에 도착했다."));
 assert(j.text.includes("입구 옆에 우산을 세워 두고 유리문을 열었다."));
 assert(j.text.includes("안쪽에서 책장을 넘기는 소리가 들렸다. 서윤은 안내판을 읽었다."));
 assert.equal(j.join_witnesses.length,1);
 assert.equal(j.ellipsis_witnesses.length,1);
 assert.equal(j.caveat_witnesses.length,0);
});
test("Join refuses actor mutation, unwarranted link, false time order and cross paragraph",()=>{
 const b=brief("EX13"),h=e("EX13",1),t=e("EX13",2);
 assert.equal(K.checkJoin(b,h,t).source_edge.type,"SEQUENTIAL_AND");
 const other=structuredClone(t);other.event.actor="SEOYUN";
 assert.throws(()=>K.checkJoin(b,h,other),/JOIN_ACTOR_MISMATCH/);
 const noLink=structuredClone(b);noLink.links=[];
 assert.throws(()=>K.checkJoin(noLink,h,t),/UNLICENSED_SEQUENTIAL_JOIN/);
 const badTime=structuredClone(t);badTime.event.sequence=4;
 assert.throws(()=>K.checkJoin(b,h,badTime),/JOIN_TEMPORAL_ORDER/);
 const cross=structuredClone(t);cross.paragraph=2;
 assert.throws(()=>K.checkJoin(b,h,cross),/CROSS_PARAGRAPH_JOIN/);
 const neg=structuredClone(t);neg.event.polarity="NEG";
 assert.throws(()=>K.checkJoin(b,h,neg),/JOIN_WITH_NEGATED_EVENT_NOT_LICENSED/);
});
test("Ellipsis refuses missing, ambiguous, third-party or wrong-paragraph antecedents",()=>{
 const b=brief("EX13"),p=e("EX13",2),next=e("EX13",3);
 const ctx={paragraph:1,active_actor:"MINJI",candidate_actors:["MINJI"]};
 assert.equal(K.checkEllipsis(b,p,next,ctx).omitted_actor,"MINJI");
 assert.throws(()=>K.checkEllipsis(b,p,next,{...ctx,candidate_actors:["MINJI","SEOYUN"]}),/REFERENT_NOT_RECOVERABLE/);
 assert.throws(()=>K.checkEllipsis(b,p,next,{...ctx,active_actor:"SEOYUN"}),/REFERENT_NOT_RECOVERABLE/);
 const newAgent=structuredClone(next);newAgent.event.actor="SEOYUN";
 assert.throws(()=>K.checkEllipsis(b,p,newAgent,ctx),/ACTOR_REIDENTIFICATION_FAILED/);
 const cross=structuredClone(next);cross.paragraph=2;
 assert.throws(()=>K.checkEllipsis(b,p,cross,ctx),/CROSS_PARAGRAPH_ELLIPSIS/);
 assert.throws(()=>K.checkEllipsis(b,e("EX13",4),e("EX13",5),{paragraph:2,active_actor:null,candidate_actors:[]}),/ACTOR_REIDENTIFICATION_FAILED/);
 const tooMany=structuredClone(b);tooMany.links.find(l=>l.type==="ELLIPSIS_ALLOW").antecedents=["MINJI","SEOYUN"];
 assert.throws(()=>K.checkEllipsis(tooMany,p,next,ctx),/AMBIGUOUS_ANTECEDENT/);
});
test("Science caveat is allowed, but unsupported causal and changed epistemic claims fail closed",()=>{
 const b=brief("EX13"),p=e("EX13",4),q=e("EX13",5);
 assert.equal(K.checkCaveat(b,p,q).connective,"다만 ");
 const noWarrant=structuredClone(b);noWarrant.links.find(l=>l.type==="EPISTEMIC_LIMIT").causal_warrant=true;
 assert.throws(()=>K.checkCaveat(noWarrant,p,q),/UNLICENSED_EPISTEMIC_CAVEAT/);
 const altered=structuredClone(q);altered.event.epistemic="OBSERVED";
 assert.throws(()=>K.checkCaveat(b,p,altered),/UNLICENSED_EPISTEMIC_CAVEAT/);
 const wrong=structuredClone(q);wrong.event.polarity="POS";
 assert.throws(()=>K.checkCaveat(b,p,wrong),/UNLICENSED_EPISTEMIC_CAVEAT/);
 for(const op of ["ADD_CAUSE","REVERSE_COMPARISON","FLIP_NEGATION","INSERT_NEW_EVENT"])
   assert.throws(()=>K.realize("EX13","combined",{op}),/NO_CAUSAL_WARRANT|COMPARISON_REVERSAL_FORBIDDEN|POLARITY_MUTATION_FORBIDDEN|EVENT_INVENTION_FORBIDDEN/);
});
test("Finite and coordinate Korean predicate witnesses cannot silently change",()=>{
 const altered=structuredClone(e("EX14",3));altered.surfaces.full="서윤은 유리문을 닫았다.";
 assert.throws(()=>K.validateEvent(altered),/PREDICATE_SURFACE_WITNESS_MISMATCH/);
 const changed=structuredClone(e("EX13",1));changed.surfaces.go="민지는 실험대 위에 투명한 컵 두 개를 던지고";
 assert.throws(()=>K.validateEvent(changed),/CONJUNCTIVE_PREDICATE_WITNESS_MISMATCH/);
 const inverted=structuredClone(e("EX13",4));inverted.surfaces.full="20분 뒤 창가의 물 온도가 다른 컵보다 낮았다.";
 assert.throws(()=>K.validateEvent(inverted),/PREDICATE_SURFACE_WITNESS_MISMATCH/);
 const denied=structuredClone(e("EX13",5));denied.event.polarity="POS";
 assert.throws(()=>K.validateEvent(denied),/UNKNOWN_TO_OBSERVED_MUTATION/);
});
