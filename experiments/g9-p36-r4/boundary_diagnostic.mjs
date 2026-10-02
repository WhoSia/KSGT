import fs from 'node:fs';
const p='experiments/g9-p36-r4/final/candidates.jsonl';
const rows=fs.readFileSync(p,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const postRep=rows.filter(r=>r.representation_sufficiency?.pass);
const postGround=postRep.filter(r=>r.grounding?.compatible);
const corePass=rows.filter(r=>r.bcog?.core?.pass);
const mismatch={class:0,predicate:0,arg0:0,polarity:0,modal:0,quantifier:0,condition:0,authority:0,value_conflict:0};
const examples={};
const canon=x=>JSON.stringify(x??null);
for(const r of postGround){
 const A=r.bcog?.left,B=r.bcog?.right;if(!A||!B)continue;
 const tests={
  class:A.frame?.class!==B.frame?.class,
  predicate:A.frame?.predicate!==B.frame?.predicate,
  arg0:A.frame?.arg0_canon!==B.frame?.arg0_canon,
  polarity:A.force?.polarity!==B.force?.polarity,
  modal:A.force?.modal!==B.force?.modal,
  quantifier:canon(A.force?.quantifiers)!==canon(B.force?.quantifiers),
  condition:A.force?.condition!==B.force?.condition,
  authority:A.frame?.authority!==B.frame?.authority,
  value_conflict:r.bcog?.core?.reason==='VALUE_BINDING_CONFLICT'
 };
 for(const [k,v] of Object.entries(tests))if(v){mismatch[k]++;(examples[k]??=[]).length<3&&examples[k].push({id:r.id,texts:r.source_texts,left_frame:A.frame,right_frame:B.frame,left_force:A.force,right_force:B.force});}
}
const coreWitnesses=corePass.map(r=>({
 id:r.id,paper:r.paper,file:r.file,operation:r.operation,texts:r.source_texts,
 grounding_compatible:r.grounding?.compatible,grounding:r.grounding,
 representation_pass:r.representation_sufficiency?.pass,
 core:r.bcog?.core,witness:r.bcog?.witness,
 left_frame:r.bcog?.left?.frame,right_frame:r.bcog?.right?.frame,
 left_force:r.bcog?.left?.force,right_force:r.bcog?.right?.force,
 compression:r.compression
}));
const out={
 phase:'G9-P36-R4-BOUNDARY-DIAGNOSTIC',
 candidate_pairs:rows.length,
 representation_complete_pairs:postRep.length,
 representation_complete_and_grounding_compatible:postGround.length,
 compatible_core_any_grounding:corePass.length,
 compatible_core_and_grounding_compatible:corePass.filter(r=>r.grounding?.compatible).length,
 post_grounding_mismatch_dimensions:mismatch,
 mismatch_examples:examples,
 compatible_core_witnesses:coreWitnesses
};
fs.writeFileSync('experiments/g9-p36-r4/final/boundary_diagnostic.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({candidate_pairs:out.candidate_pairs,representation_complete_pairs:out.representation_complete_pairs,post_grounding:out.representation_complete_and_grounding_compatible,compatible_core_any_grounding:out.compatible_core_any_grounding,compatible_core_and_grounding:out.compatible_core_and_grounding_compatible,mismatch},null,2));
