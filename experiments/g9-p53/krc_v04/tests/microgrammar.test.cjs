"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const K=require("../compiler.cjs"),src=require("../fact_frames.json");
test("All ten independent fact frames are well typed and reinterpreted only from source",()=>{
 const records=src.briefs.flatMap(b=>b.atoms);
 assert.equal(records.length,10);
 for(const b of src.briefs){
  for(const f of b.atoms){
   assert.equal(K.validate(f),true);
   const r=K.surface(b.id,f.id);
   assert.equal(r.proof.source_fragments_reused_exactly,true);
   assert.equal(r.proof.semantic_object_unchanged,true);
   assert.equal(r.semantic_record_sha256,K.semanticToken(f));
   assert.equal(r.sentence.endsWith("."),true);
  }
 }
});
test("Produce two distinct Korean full passages per genre without any LLM and preserve typed roles",()=>{
 const court=K.court();
 assert.equal(court.n_outputs,4);
 assert(court.nonidentical_pairs.every(p=>p.different&&p.equal_semantic_frame_hashes));
 const changed=court.nonidentical_pairs.reduce((n,p)=>n+p.reordered_facts.length,0);
 assert(changed>=4);
 for(const d of court.documents){
  assert.equal(d.paragraphs,2);
  assert.equal(d.atomic_fact_coverage,5);
  assert.equal(d.text.split("\n\n").length,2);
  assert(!/^(?:제목|목록|인사말|인용부호)\s*[:：]/mu.test(d.text));
  assert(d.source_trace.every(x=>typeof x.semantic_sha256==="string"&&x.semantic_sha256.length===64));
 }
 assert.equal(court.model_called,false);
 assert.equal(court.human_reader_quality,"NOT_MEASURED");
});
test("Predicate polarity, comparison reversal and illegal cause are rejected before realization",()=>{
 for(const op of ["FLIP_NEGATION","FLIP_POLARITY"])
  assert.throws(()=>K.surface("EX11","F5",{op}),/POLARITY_PRESERVATION_VIOLATION/);
 assert.throws(()=>K.surface("EX11","F4",{op:"FLIP_COMPARISON"}),/COMPARISON_DIRECTION_VIOLATION/);
 assert.throws(()=>K.surface("EX11","F4",{op:"INSERT_CAUSE"}),/UNLICENSED_CAUSAL_WARRANT/);
 assert.throws(()=>K.surface("EX12","F4",{semanticDelta:{predicate:"MOVE"}}),/UNLICENSED_SEMANTIC_MUTATION/);
});
test("Unsupported reference ellipsis, unknown fact and tampered ordering fail closed",()=>{
 assert.throws(()=>K.surface("EX12","F5",{op:"DELETE_REFERENT",antecedents:["NARRATOR","VISITOR"]}),/UNRECOVERABLE_ELLIPSIS/);
 assert.throws(()=>K.surface("EX12","F5",{op:"DELETE_REFERENT",antecedents:["NARRATOR"]}),/ELLIPSIS_OPERATION_NOT_PROVEN/);
 assert.throws(()=>K.surface("EX12","F6"),/UNKNOWN_FACT_ID/);
 assert.throws(()=>K.surface("EX12","F2",{orderIndex:10}),/ORDER_NOT_SOURCE_LICENSED/);
 assert.throws(()=>K.surface("EX12","F2",{op:"INSERT_MOOD"}),/UNKNOWN_CONSTRUCTION_OPERATION/);
 assert.throws(()=>K.permutation([0,0,2],3),/REPEATED_OR_DROPPED_CONSTITUENT/);
});
test("Semantic source frame mutation is visible under independently rechecked surface obligations",()=>{
 const f=structuredClone(src.briefs[0].atoms[4]);
 f.semantic.polarity="POS";
 assert.throws(()=>K.validate(f),/POSITIVE_POLARITY_CONTRADICTION/);
 const c=structuredClone(src.briefs[0].atoms[3]);
 c.semantic.direction="LOWER";
 assert.throws(()=>K.validate(c),/LOWER_COMPARISON_PREDICATE_MISMATCH/);
 const u=structuredClone(src.briefs[1].atoms[1]);
 u.orders=[[2,1,0]];
 assert.throws(()=>K.validate(u),/FINITE_VERB_MUST_BE_LAST/);
});
test("Connective is permitted only for explicitly source-licensed epistemic limitation edge",()=>{
 const b=src.briefs[0];
 assert.equal(K.connective(b,b.atoms[3],b.atoms[4],"licensed"),"다만 ");
 assert.equal(K.connective(b,b.atoms[0],b.atoms[1],"licensed"),"");
 assert.throws(()=>K.connective(b,b.atoms[3],b.atoms[4],"cause"),/UNKNOWN_DISCOURSE_MODE/);
 const withCause=structuredClone(b);
 withCause.edges[0].causal_warrant=true;
 assert.throws(()=>K.connective(withCause,withCause.atoms[3],withCause.atoms[4],"licensed"),/UNPROVEN_CAUSAL_EDGE/);
});
test("Information order can change without pretending its pragmatic impact was proved",()=>{
 const x=K.surface("EX12","F1",{orderIndex:0});
 const y=K.surface("EX12","F1",{orderIndex:1});
 assert.notEqual(x.sentence,y.sentence);
 assert.equal(x.semantic_record_sha256,y.semantic_record_sha256);
 assert.equal(y.proof.subject_to_pragmatic_review,true);
 assert.equal(x.sentence,"늦은 오후에 나는 우체국 앞에 도착했다.");
 assert.equal(y.sentence,"나는 늦은 오후에 우체국 앞에 도착했다.");
});
