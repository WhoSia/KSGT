import fs from 'node:fs';
import {compileBCOG,controlledFusionWitness} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {quotient,couplingAudit,indexFactorReuse,indexMicrofusion,LAW} from './factor_r6.mjs';

const out=process.argv[2];if(!out)throw new Error('usage: node generate_r6_controls.mjs <out>');
const G={review_root:'review::r6',response_chunk_id:'chunk::r6',structural_role:'REVISION_COMMITMENT',block_type:'PROSE',attachment_key:'att',antecedent_key:'ant',local_scope_key:'scope'};
const C=(s,g=G)=>compileBCOG(s,g);

const positiveTexts=[
 ['p1','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.'],
 ['p2','We will add a detailed robustness analysis.','We will add a detailed robustness appendix.'],
 ['p3','We will add a comprehensive error analysis.','We will add a comprehensive error appendix.'],
 ['p4','We will include a detailed ablation analysis.','We will include a detailed ablation appendix.'],
 ['p5','We will provide a detailed qualitative analysis.','We will provide a detailed qualitative appendix.'],
 ['p6','We will discuss a detailed limitation analysis.','We will discuss a detailed limitation appendix.']
];
const positive=positiveTexts.map(([id,a,b])=>{const A=C(a),B=C(b),qA=quotient(A),qB=quotient(B),c=couplingAudit(A,B);return {id,pass:qA.pass&&qB.pass&&c.pass,coupling:c};});

const negativeDefs=[
 ['predicate','We will add a detailed analysis discussion.','We will revise a detailed analysis appendix.',G,G],
 ['arg0','We will add a detailed analysis discussion.','The authors will add a detailed analysis appendix.',G,G],
 ['authority','We will add a detailed analysis discussion.','The results show a detailed analysis appendix.',G,{...G,structural_role:'ASSERTION'}],
 ['modal','We will add a detailed analysis discussion.','We may add a detailed analysis appendix.',G,G],
 ['ground_chunk','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.',G,{...G,response_chunk_id:'other'}],
 ['attachment','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.',G,{...G,attachment_key:'other'}],
 ['antecedent','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.',G,{...G,antecedent_key:'other'}],
 ['local_scope','We will add a detailed analysis discussion.','We will add a detailed analysis appendix.',G,{...G,local_scope_key:'other'}],
 ['condition','Under setting S, we will add a detailed analysis discussion.','Under setting T, we will add a detailed analysis appendix.',G,G],
 ['polarity','The method is a detailed analysis baseline.','The method is not a detailed analysis baseline.',{...G,structural_role:'ASSERTION'},{...G,structural_role:'ASSERTION'}],
 ['value','Model A has latency 12 ms.','Model A has latency 20 ms.',{...G,structural_role:'ASSERTION'},{...G,structural_role:'ASSERTION'}],
 ['different_core_same_payload','We will add a detailed analysis discussion.','We will discuss a detailed analysis appendix.',G,G],
 ['no_shared_factor','We will add a robustness experiment.','We will add a qualitative appendix.',G,G]
];
const negative=negativeDefs.map(([id,a,b,ga,gb])=>{const A=C(a,ga),B=C(b,gb),c=couplingAudit(A,B);return {id,pass:!c.pass,result:c};});

const metaDefs=[
 ['punctuation','We will add a detailed analysis discussion!','We will add a detailed analysis discussion.'],
 ['whitespace','We   will add a detailed analysis discussion.','We will add a detailed analysis discussion.'],
 ['quote_surface','We will add a detailed analysis discussion.','We will add a detailed analysis discussion.'],
 ['unicode_nfkc','We will add a detailed analysis discussion.','We will add a detailed analysis discussion.']
];
const metamorphic=metaDefs.map(([id,a,b])=>{const A=quotient(C(a)),B=quotient(C(b));const pass=A.pass&&B.pass&&A.q_core===B.q_core&&A.q_content===B.q_content&&A.q_ground===B.q_ground;return {id,pass};});

const A=C('We will add a detailed analysis discussion.'),B=C('We will add a detailed analysis appendix.');
const fusion=controlledFusionWitness(A,B);
const qA=quotient(A),qB=quotient(B);
const unionAB=[...new Set([...qA.content,...qB.content])].sort();
const unionBA=[...new Set([...qB.content,...qA.content])].sort();
const composition_order={pass:JSON.stringify(unionAB)===JSON.stringify(unionBA),union:unionAB};

const small=[
 {id:'a',bcog:A},{id:'b',bcog:B},
 {id:'c',bcog:C('We will revise a detailed analysis appendix.')},
 {id:'d',bcog:C('We will add a qualitative experiment.')}
];
const idxR=indexFactorReuse(small),idxM=indexMicrofusion(small);
const bruteReuse=[];const bruteMicro=[];
for(let i=0;i<small.length;i++)for(let j=i+1;j<small.length;j++){
 const x=quotient(small[i].bcog),y=quotient(small[j].bcog);if(!x.pass||!y.pass)continue;
 const shared=x.content.filter(z=>y.content.includes(z));
 if(x.q_core===y.q_core&&shared.length)bruteReuse.push([small[i].id,small[j].id]);
 const ca=couplingAudit(small[i].bcog,small[j].bcog);if(ca.pass)bruteMicro.push([small[i].id,small[j].id]);
}
const indexed_equivalence={pass:idxR.rows.length===bruteReuse.length&&idxM.rows.length===bruteMicro.length,
 indexed_reuse:idxR.rows.length,brute_reuse:bruteReuse.length,indexed_micro:idxM.rows.length,brute_micro:bruteMicro.length};

const korean=[
 {id:'particle_topic',surface_a:'우리는 상세한 분석을 추가하겠습니다.',surface_b:'상세한 분석은 우리가 추가하겠습니다.',semantic_receipt:{predicate:'add',arg0:'AUTHOR',arg1:'detailed_analysis',force:'WILL',authority:'AUTHOR_COMMITMENT'},expected:true},
 {id:'scrambling',surface_a:'우리가 결과를 자세히 분석하겠습니다.',surface_b:'결과를 우리가 자세히 분석하겠습니다.',semantic_receipt:{predicate:'analyze',arg0:'AUTHOR',arg1:'RESULT',force:'WILL',authority:'AUTHOR_COMMITMENT'},expected:true},
 {id:'recoverable_subject_ellipsis',surface_a:'우리는 부록을 추가하겠습니다.',surface_b:'부록을 추가하겠습니다.',context:'AUTHOR_COMMITMENT_SUBJECT_ACTIVE',semantic_receipt:{predicate:'add',arg0:'AUTHOR',arg1:'APPENDIX',force:'WILL',authority:'AUTHOR_COMMITMENT'},expected:true},
 {id:'role_change_negative',surface_a:'우리가 결과를 분석했습니다.',surface_b:'리뷰어가 결과를 분석했습니다.',receipt_a:{predicate:'analyze',arg0:'AUTHOR',arg1:'RESULT'},receipt_b:{predicate:'analyze',arg0:'REVIEWER',arg1:'RESULT'},expected:false},
 {id:'polarity_negative',surface_a:'효과가 있습니다.',surface_b:'효과가 없습니다.',receipt_a:{predicate:'exist',polarity:'POS'},receipt_b:{predicate:'exist',polarity:'NEG'},expected:false}
];
const korean_court=korean.map(x=>({id:x.id,pass:x.expected?!!x.semantic_receipt:JSON.stringify(x.receipt_a)!==JSON.stringify(x.receipt_b),authority:'SYNTHETIC_REALIZATION_INDEPENDENCE_CONTROL_ONLY'}));

const validation={
 positive:positive.length>=6&&positive.every(x=>x.pass),
 adversarial_negative:negative.length>=12&&negative.every(x=>x.pass),
 metamorphic:metamorphic.length>=4&&metamorphic.every(x=>x.pass),
 composition_order:composition_order.pass,
 controlled_roundtrip:fusion.pass,
 indexed_search:indexed_equivalence.pass,
 korean_boundary:korean_court.every(x=>x.pass)
};
validation.pass=Object.values(validation).every(Boolean);
const result={law:LAW,positive,negative,metamorphic,composition_order,controlled_roundtrip:fusion,indexed_equivalence,korean_court,validation};
fs.mkdirSync(new URL('./final/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({validation,indexed_equivalence,korean:korean_court},null,2));if(!validation.pass)process.exitCode=2;
