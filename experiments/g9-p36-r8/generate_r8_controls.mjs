import fs from 'node:fs';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {analyze,LAW} from './motif_r8.mjs';
const out=process.argv[2];if(!out)throw new Error('usage');
const G=(id,role='REVISION_COMMITMENT')=>({review_root:'r8',response_chunk_id:id,structural_role:role,block_type:'PROSE',attachment_key:id,antecedent_key:'Evaluation',local_scope_key:'SRP'});
const I=(id,paper,text,label='SRP',perspective='Evaluation',role='REVISION_COMMITMENT')=>({id,paper,text,rebuttal_label:label,perspective,bcog:compileBCOG(text,G(id,role))});
const pos=[
 I('p1a','P1','We will add a detailed error analysis appendix.'),I('p1b','P2','We will include a detailed error analysis section.'),
 I('p2a','P3','We will clarify a comprehensive robustness analysis appendix.'),I('p2b','P4','We will explain a comprehensive robustness analysis section.'),
 I('p3a','P5','We will revise a detailed limitation analysis appendix.'),I('p3b','P6','We will update a detailed limitation analysis section.')
];
const exact=analyze(pos,'exact'),family=analyze(pos,'family');
const negs=[
 [I('n1a','N1','We will add a detailed error analysis appendix.','SRP'),I('n1b','N2','We will include a detailed error analysis section.','DWC','Evaluation','ASSERTION'),'LABEL_MISMATCH'],
 [I('n2a','N3','We will add a detailed error analysis appendix.','SRP','Evaluation'),I('n2b','N4','We will include a detailed error analysis section.','SRP','Theory'),'PERSPECTIVE_MISMATCH'],
 [I('n3a','N5','We will add a detailed error analysis appendix.'),I('n3b','N6','We may include a detailed error analysis section.'),'MODAL_MISMATCH'],
 [I('n4a','N7','We will add a detailed error analysis appendix.'),I('n4b','N8','We will revise a detailed error analysis section.'),'FAMILY_MISMATCH'],
 [I('n5a','N9','We will add a detailed error analysis appendix.'),I('n5b','N10','We will include a qualitative error appendix.'),'NO_CONNECTED_CHAIN'],
 [I('n6a','N11','We will add a detailed error analysis appendix.'),I('n6b','N12','We will add a detailed error analysis appendix!'),'EXACT_SURFACE_NORMALIZATION']
];
const negative=negs.map(([a,b,id])=>{const z=analyze([a,b],'family');return {id,primary:z.stats.primary_cross_paper_pairs,exploratory:z.stats.exploratory_pairs,pass:z.stats.primary_cross_paper_pairs===0};});
const samePaper=analyze([I('s1','SAME','We will add a detailed error analysis appendix.'),I('s2','SAME','We will include a detailed error analysis section.')],'family');
const validation={
 family_promotes_synthetic_cross_predicate_chain:family.stats.primary_cross_paper_pairs===3,
 exact_does_not_promote_cross_predicate_chain:exact.stats.primary_cross_paper_pairs===0,
 negative_controls:negative.every(x=>x.pass),
 same_paper_not_primary:samePaper.stats.primary_cross_paper_pairs===0,
 global_all_pairs:family.stats.global_all_pairs===false
};validation.pass=Object.values(validation).every(Boolean);
const result={law:LAW,exact:exact.stats,family:family.stats,negative,same_paper:samePaper.stats,validation};
fs.mkdirSync(new URL('./final/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!validation.pass)process.exitCode=2;
