'use strict';
// KSGT G9-P55: A1 bounded surface transport for 하나 / exact discrete 절반.
// Exact quotation is not independently verified antecedent truth or preference.
const base=require('../../g9-p55-prelude/partitive_realizer_v01/realizer.cjs');
const SOURCE=/(?:^|\s)(\d[\d,]*|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(명|개|건|팀|종|가지|권|장|마리|곳)$/u;
const UNTYPED=/^\s*(하나|절반)(?=$|[\s,.!?;]|[은는이가을를에도과와만])/u;
function propose(input){
 const standard=base.propose(input);
 const target=input?.target;
 if(typeof target!=='string')return standard;
 const spans=base.occurrence(target);
 if(spans.length!==1)return {...standard,schema:'ksgt.g9p55.quantifier_transport.v1',extension:'NONE'};
 const span=spans[0],tail=target.slice(span.end),u=UNTYPED.exec(tail);
 if(!u)return {...standard,schema:'ksgt.g9p55.quantifier_transport.v1',extension:'NONE'};
 const extension=u[1]==='하나'?'SINGLE_UNTYPED':'EXACT_DISCRETE_HALF';
 const label={schema:'ksgt.g9p55.quantifier_transport.v1',extension,
  morphology:'EXACT_SINGLE_ITEM_OR_EXACT_INTEGER_HALF_ONLY',
  independently_verified_reference:false,human_preference:'NOT_COLLECTED'};
 if(input.writer_policy==='KEEP'||input.writer_policy!=='CLARIFY')return {...standard,...label};
 const m=SOURCE.exec(input?.claim?.quote??'');
 if(!m)return {...standard,...label};
 const total=base.count(m[1]),unit=m[2];
 if(!Number.isSafeInteger(total)||total<2)return {...standard,...label,status:'HOLD',reason:'INVALID_DISCRETE_SOURCE_SIZE'};
 if(extension==='EXACT_DISCRETE_HALF'&&total%2!==0)
  return {...standard,...label,status:'HOLD',reason:'ODD_DISCRETE_HALF_NOT_EXACT'};
 const selected=extension==='SINGLE_UNTYPED'?1:total/2;
 if(!(selected>=1&&selected<total))return {...standard,...label,status:'HOLD',reason:'NOT_A_STRICT_SUBSET'};
 // Normalize only internally to reuse the old exact-quote, morphology,
 // writer-intent and right-context guards. Never output the normalized text.
 const normalizedTail=tail.replace(UNTYPED,full=>full.replace(u[1],String(selected)+unit));
 const verified=base.propose({...input,target:target.slice(0,span.end)+normalizedTail});
 if(verified.status!=='PROPOSAL_ONLY')
  return {...standard,...label,status:'HOLD',reason:'BASELINE_SOURCE_GUARD_'+verified.reason};
 const q=input.claim.quote,overt=q+' 중'+span.form.slice('그중'.length);
 const edited=target.slice(0,span.start)+overt+tail;
 return {...standard,...label,status:'PROPOSAL_ONLY',reason:'A1_BOUNDED_UNTYPED_PARTITIVE_CANDIDATE',
  candidates:[standard.candidates[0],{
   id:'SOURCE_WITNESSED_UNTYPED_CANDIDATE',text:edited,
   license:'A1_SURFACE_QUOTE_AND_COUNT_NOT_SEMANTIC_PROOF',writer_quality:'NOT_MEASURED'}],
  source_witness:{...verified.source_witness,untyped_selection:u[1],selection_count:selected},
  edit:{before:span.form,after:overt,start:span.start},
  warning:'QUOTE_MAY_NOT_BE_TRUE_ANTECEDENT_AND_NEW_SENTENCE_MAY_BE_UNNATURAL'};
}
module.exports={propose};
