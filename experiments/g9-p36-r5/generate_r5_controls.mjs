import fs from 'node:fs';
import {compileBCOG,controlledFusionWitness} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {neighborhood,indexNeighborhoods,LAW} from './neighborhood_r5.mjs';
const out=process.argv[2];if(!out)throw new Error('usage: node generate_r5_controls.mjs <out>');
const G={review_root:'review::x',response_chunk_id:'chunk',structural_role:'REVISION_COMMITMENT',block_type:'PROSE',attachment_key:'same',antecedent_key:null,local_scope_key:'scope'};
const C=(s,g=G)=>compileBCOG(s,g);
const pos=[
 ['shared_object_fusion','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.','R5_FUSION_NEIGHBOR'],
 ['strict_subsumption','We will add a detailed ablation discussion.','We will add a detailed ablation discussion appendix.','R5_SUBSUMPTION_NEIGHBOR']
].map(([id,a,b,reason])=>{const r=neighborhood(C(a),C(b));return {id,pass:r.pass&&r.reason===reason,result:r};});
const neg=[
 ['predicate','We will add a detailed ablation discussion.','We will revise a detailed ablation discussion.',G,G],
 ['arg0','We will add a detailed ablation discussion.','The authors will add a detailed ablation discussion.',G,G],
 ['authority','We will add a detailed ablation discussion.','The results show a detailed ablation discussion.',G,{...G,structural_role:'ASSERTION'}],
 ['ground_chunk','We will add a detailed ablation discussion.','We will add a detailed robustness discussion.',G,{...G,response_chunk_id:'other'}],
 ['attachment','We will add a detailed ablation discussion.','We will add a detailed robustness discussion.',G,{...G,attachment_key:'other'}],
 ['antecedent','We will add a detailed ablation discussion.','We will add a detailed robustness discussion.',G,{...G,antecedent_key:'other'}],
 ['scope','We will add a detailed ablation discussion.','We will add a detailed robustness discussion.',G,{...G,local_scope_key:'other'}],
 ['force','We will add a detailed ablation discussion.','We may add a detailed robustness discussion.',G,G],
 ['condition','Under setting S, we will add a detailed ablation discussion.','Under setting T, we will add a detailed robustness discussion.',G,G],
 ['low_overlap','We will add a detailed ablation discussion.','We will add new experiments.',G,G],
 ['value_conflict','Model A has latency 12 ms.','Model A has latency 20 ms.',{...G,structural_role:'ASSERTION'},{...G,structural_role:'ASSERTION'}]
].map(([id,a,b,ga,gb])=>{const r=neighborhood(C(a,ga),C(b,gb));return {id,pass:!r.pass,result:r};});
const meta=[
 ['punctuation',C('We will add a detailed analysis discussion!'),C('We will add a detailed analysis appendix.')],
 ['whitespace',C('We   will add a detailed analysis discussion.'),C('We will add a detailed analysis appendix.')]
].map(([id,a,b])=>({id,pass:neighborhood(a,b).pass,result:neighborhood(a,b)}));
const A=C('We will add a detailed analysis discussion.'),B=C('We will add a detailed analysis appendix.'),fusion=controlledFusionWitness(A,B);
const idx=indexNeighborhoods([{id:'a',bcog:A},{id:'b',bcog:B},{id:'c',bcog:C('We will revise a detailed robustness discussion.')}]);
const validation={positive:pos.every(x=>x.pass),negative:neg.every(x=>x.pass),metamorphic:meta.every(x=>x.pass),roundtrip:fusion.pass,indexed:idx.emitted.length===1&&!idx.stats.global_all_pairs};validation.pass=Object.values(validation).every(Boolean);
const result={law:LAW,positive:pos,negative:neg,metamorphic:meta,controlled_fusion:fusion,index_test:idx.stats,validation};fs.mkdirSync(new URL('./final/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({validation,index:idx.stats},null,2));if(!validation.pass)process.exitCode=2;
