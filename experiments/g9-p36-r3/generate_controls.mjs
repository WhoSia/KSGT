import fs from 'node:fs';
const out=process.argv[2]; if(!out)throw new Error('usage controls <out.jsonl>');
const g={review_root:'r',response_chunk_id:'c',structural_role:'ASSERTION',block_type:'PROSE',attachment_key:'a',antecedent_key:null};
const f={polarity:'POS',modal:'assert',comparator:'none',condition:'none'};
function c(id,op,A,B,opt={}){
 const sa=A, sb=B, u=[...new Set([...A,...B])].sort();
 return {id,paper:'SYNTHETIC',file:id,operation:op,source_ids:['a','b'],source_texts:opt.texts||['alpha beta gamma.','alpha beta gamma delta.'],
  source_obligation_atoms:[sa,sb],shared_atoms:sa.filter(x=>sb.includes(x)),left_unique_atoms:sa.filter(x=>!sb.includes(x)),right_unique_atoms:sb.filter(x=>!sa.includes(x)),
  fused_obligation_atoms:opt.fused||u,grounding:{compatible:opt.grounding??true,left:g,right:g},force_compatible:opt.force??true,
  representation_sufficiency:{left:{pass:opt.repr??true,missing:[]},right:{pass:opt.repr??true,missing:[]},pass:opt.repr??true},
  compression:opt.compression||{source_chars:120,fused_ir_chars:50,gain_chars:70}};
}
const base=['A:0:alpha','A:1:beta','F:polarity:POS','F:modal:assert'];
const rows=[
 c('POS_SUBSUMPTION','S1_SUBSUMPTION',base,[...base,'R:0:gamma']),
 c('POS_FUSION','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right']),
 c('POS_COMMITMENT_FUSION','F1_CONJUNCTIVE_FUSION',[...base,'ACTION:verb:add','ACTION:object:0:x'],[...base,'ACTION:verb:add','ACTION:object:0:y']),
 c('NEG_VALUE_BINDING_SWAP','F1_CONJUNCTIVE_FUSION',[...base,'V:entity:0:modelA','V:value:0:2%'],[...base,'V:entity:0:modelB','V:value:0:0%'],{force:false}),
 c('NEG_POLARITY_SCOPE_SWAP','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{force:false}),
 c('NEG_MODAL_FORCE','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{force:false}),
 c('NEG_CONDITION','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{force:false}),
 c('NEG_CROSS_ATTACHMENT','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{grounding:false}),
 c('NEG_CROSS_ANTECEDENT','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{grounding:false}),
 c('NEG_ONE_WAY_ADDITION','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{fused:[...base,'R:0:left','R:0:right','R:1:unsupported']}),
 c('NEG_FLUENT_MISSING_ATOM','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{fused:[...base,'R:0:left']}),
 c('NEG_REPRESENTATION_GAP','F1_CONJUNCTIVE_FUSION',[...base,'R:0:left'],[...base,'R:0:right'],{repr:false})
];
fs.writeFileSync(out,rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
