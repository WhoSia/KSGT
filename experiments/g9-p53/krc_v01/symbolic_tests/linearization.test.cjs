"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const {run,linearize}=require("../pure_symbolic.cjs");
const briefs=require("../../natural_writing_pilot_briefs.json");
test("Six pure symbolic Korean passages conserve all thirty input fact atoms verbatim",()=>{
 const x=run();a.equal(x.n,6);
 for(const b of briefs.briefs){
  const d=x.documents.find(y=>y.id===b.id);
  a.equal(d.source_fact_count,5);
  a.equal(d.exact_atoms_preserved,true);
  a.equal(d.added_lexical_claims,false);
  a.equal(d.text.split("\n\n").length,2);
  for(const s of b.facts)a(d.text.includes(s));
 }
});
test("Non-neural symbolic path does not claim semantic validity or reader naturalness",()=>{
 const r=linearize("EX04");
 a.equal(r.method,"NON_NEURAL_SYMBOLIC_LINEARIZATION");
 a.equal(r.naturalness,"NOT_ADJUDICATED");
 a.equal(r.trace.flatMap(t=>t.atom_ids).length,5);
});
