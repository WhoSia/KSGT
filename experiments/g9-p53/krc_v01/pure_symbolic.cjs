"use strict";
/* KRC pure symbolic baseline — no LLM, no invented lexical material.
 * Document realization is verbatim licensed fact linearization only.
 * This demonstrates a finite non-neural path through the same typed IR;
 * it does NOT guarantee idiomatic Korean or pragmatic innocence. */
const fs=require("node:fs");
const planner=require("./planner.cjs");
const source=require("../natural_writing_pilot_briefs.json");
function linearize(id){
 const p=planner.construct(id);
 planner.check(p);
 const fact=new Map(p.facts.map(f=>[f.id,f.claim]));
 const paras=[[],[]],trace=[];
 for(const slot of p.slots){
  const literal=slot.fact_ids.map(fid=>fact.get(fid)).join(" ");
  paras[slot.paragraph-1].push(literal);
  trace.push({slot:slot.id,paragraph:slot.paragraph,atom_ids:slot.fact_ids,
    source_text_sha256:planner.sha(literal),language_added:false});
 }
 const text=paras.map(xs=>xs.join(" ")).join("\n\n");
 const brief=source.briefs.find(b=>b.id===id);
 const matched=brief.facts.every(f=>text.includes(f));
 if(!matched)throw Error("SOURCE_FACT_NOT_CONSERVED_VERBATIM");
 const joined=paras.join(" ");
 const inputMultiset=brief.facts.slice().sort().join("\u0000");
 const outputMultiset=p.slots.flatMap(s=>s.fact_ids).map(id=>fact.get(id)).sort().join("\u0000");
 if(inputMultiset!==outputMultiset)throw Error("SOURCE_FACT_MULTISET_MISMATCH");
 return {id,method:"NON_NEURAL_SYMBOLIC_LINEARIZATION",text,
  source_fact_count:brief.facts.length,trace,
  exact_atoms_preserved:true,added_lexical_claims:false,
  premise:"Facts are verbatim, but juxtaposition and order may still change pragmatic readings.",
  naturalness:"NOT_ADJUDICATED"};
}
function run(){
 const ds=source.briefs.map(b=>linearize(b.id));
 return {schema:"ksgt.krc.v0.1.pure-symbolic-realization.v1",
  status:"LLM_FREE_WRITING_STRUCTURE_DEMONSTRATION",
  n:ds.length,documents:ds,
  guarantee:"All five source fact strings occur verbatim exactly once as primary ordered atoms for each document; the program adds only spaces and paragraph separators.",
  limitation:"Verbatim fact conservation is not full logical equivalence, discursive felicity or stylistic naturalness.",
  comparison:"EXCLUDED_FROM_FROZEN_18_BAK_ARMS"};
}
if(require.main===module){
 const result=run();
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({documents:result.n,all_exact:result.documents.every(d=>d.exact_atoms_preserved),human:"NONE",neural_inference:"NONE"}));
}
module.exports={run,linearize};
