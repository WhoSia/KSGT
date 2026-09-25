import fs from 'node:fs';
import {compileBCOG,compatibleCore,controlledFusionWitness} from './compiler_bcog_r4.mjs';
const out=process.argv[2];if(!out)throw new Error('usage: node generate_r4_controls.mjs <out.json>');
const G={review_root:'review::x',response_chunk_id:'chunk',structural_role:'REVISION_COMMITMENT',block_type:'PROSE',attachment_key:'same',antecedent_key:null,local_scope_key:'p'};
const positives=[
 ['simple_transitive','We show the improvement.',{...G,structural_role:'ASSERTION'}],
 ['revision_commitment','We will add an ablation discussion.',G],
 ['directed_comparison','Model A is higher than Model B.',{...G,structural_role:'ASSERTION'}],
 ['entity_value_unit','Model A has latency 12 ms.',{...G,structural_role:'ASSERTION'}],
 ['negated_relation','Model A is not better than Model B.',{...G,structural_role:'ASSERTION'}],
 ['modal_relation','We may report additional results.',G],
 ['conditioned_relation','Under setting S, Model A is higher than Model B.',{...G,structural_role:'ASSERTION'}],
 ['quantified_argument','All models are stable.',{...G,structural_role:'ASSERTION'}]
];
const negativePairs=[
 ['argument_role_swap','Model A is higher than Model B.','Model B is higher than Model A.'],
 ['relation_direction_swap','Model A is higher than Model B.','Model A is lower than Model B.'],
 ['value_binding_swap','Model A has latency 12 ms.','Model A has latency 20 ms.'],
 ['unit_binding_swap','Model A has latency 12 ms.','Model A has latency 12 s.'],
 ['comparator_direction_swap','Model A is better than Model B.','Model A is worse than Model B.'],
 ['negation_scope_swap','Model A is not better than Model B.','Model A is better than Model B.'],
 ['modal_scope_swap','We may report additional results.','We will report additional results.'],
 ['quantifier_scope_swap','All models are stable.','Some models are stable.'],
 ['condition_attachment_swap','Under setting S, Model A is higher than Model B.','Under setting T, Model A is higher than Model B.'],
 ['authority_commitment_swap','We will add an ablation discussion.','The results show an ablation discussion.'],
 ['same_anchor_different_graph','Model A is higher than Model B.','Model B is higher than Model A.'],
 ['fluent_missing_edge','We will add an ablation discussion.','We will add a discussion.']
];
const positiveResults=positives.map(([id,text,g])=>{const r=compileBCOG(text,g);return {id,text,pass:r.representation_certificate?.pass===true,result:r};});
const negativeResults=negativePairs.map(([id,a,b])=>{const A=compileBCOG(a,G),B=compileBCOG(b,G),c=compatibleCore(A,B);return {id,a,b,pass:!c.pass||JSON.stringify(A.atoms)!==JSON.stringify(B.atoms),core:c,left:A,right:B};});
const fusionA=compileBCOG('We will add an ablation discussion.',G),fusionB=compileBCOG('We will add a robustness discussion.',G),fusion=controlledFusionWitness(fusionA,fusionB);
const meta=[
 {id:'punctuation_invariance',pass:JSON.stringify(compileBCOG('We will add an ablation discussion!',G).atoms)===JSON.stringify(fusionA.atoms)},
 {id:'whitespace_invariance',pass:JSON.stringify(compileBCOG('We   will add an ablation discussion.',G).atoms)===JSON.stringify(fusionA.atoms)},
 {id:'surface_alias_binding',pass:compileBCOG('We will add an ablation discussion.',G).frame?.predicate==='add'},
 {id:'role_change_not_invariant',pass:JSON.stringify(compileBCOG('Model A is higher than Model B.',G).atoms)!==JSON.stringify(compileBCOG('Model B is higher than Model A.',G).atoms)}
];
const result={positive:positiveResults,negative:negativeResults,controlled_fusion:{pass:fusion.pass,result:fusion},metamorphic:meta,validation:{positive:positiveResults.every(x=>x.pass),negative:negativeResults.every(x=>x.pass),fusion:fusion.pass,metamorphic:meta.every(x=>x.pass)}};
result.validation.pass=Object.values(result.validation).every(Boolean);
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({validation:result.validation,positive:positiveResults.map(x=>[x.id,x.pass]),negative:negativeResults.map(x=>[x.id,x.pass]),fusion:fusion.pass,metamorphic:meta},null,2));
if(!result.validation.pass)process.exitCode=2;
