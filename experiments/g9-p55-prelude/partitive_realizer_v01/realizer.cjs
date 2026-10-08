'use strict';
// P55 proposed construction-aware Korean partitive candidate proposer.
// NO automatic source-grounding proof, semantic correctness, or human edit preference.
const crypto=require('node:crypto');
const sourceCount=/(?:^|\s)(\d[\d,]*|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(명|개|건|팀|종|가지|권|장|마리|곳)$/u;
const targetCount=/^\s*(\d[\d,]*|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(명|개|건|팀|종|가지|권|장|마리|곳)(?=$|[^가-힣]|[은는이가을를에도과와])/u;
const numberWords=new Map([['한',1],['두',2],['세',3],['네',4],['다섯',5],['여섯',6],['일곱',7],['여덟',8],['아홉',9],['열',10]]);
const count=n=>numberWords.has(n)?numberWords.get(n):Number(n.replaceAll(',',''));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function occurrence(text){
 const matches=[];for(const x of text.matchAll(/그중(?:에서도|에서|에선|에)?/gu)){
   const start=x.index,before=start?text[start-1]:'';const after=text[start+x[0].length]||'';
   if((before&&/[가-힣]/u.test(before))||(after&&/[가-힣]/u.test(after)))continue;
   matches.push({start,form:x[0],end:start+x[0].length});
 }
 return matches;
}
function propose({prior,target,claim=null,writer_policy='CONTEXTUAL',following=''}={}){
 if(!Array.isArray(prior)||prior.length>50||prior.some(x=>typeof x!=='string')||typeof target!=='string'||target.length>100000||!target.trim()||typeof following!=='string')throw Error('INVALID_CONTEXT');
 if(!['CLARIFY','KEEP','CONTEXTUAL'].includes(writer_policy))throw Error('INVALID_WRITER_POLICY');
 const original={id:'KEEP_ORIGINAL',text:target,license:'IDENTITY',writer_quality:'NOT_MEASURED'};
 const base={schema:'ksgt.g9p55.partitive_realizer.prelude.v1',candidates:[original],writer_policy,source_sha256:hash(JSON.stringify(prior)),draft_sha256:hash(target),selection:'NONE',proven_antecedent:false,human_preference:'NOT_COLLECTED',automatic_rewrite:false};
 function hold(reason,extra={}){return {...base,status:'HOLD',reason,...extra};}
 const spans=occurrence(target);
 if(spans.length!==1)return hold(spans.length===0?'NO_SUPPORTED_FORM':'MULTIPLE_TARGET_SPANS');
 const span=spans[0];
 if(writer_policy==='KEEP')return {...base,status:'KEEP',reason:'HIGH_LEVEL_KEEP'};
 if(writer_policy!=='CLARIFY')return hold('WRITER_INTENT_NOT_CLARIFY');
 if(following.trim()&&!/[.!?。？！]$/u.test(target.trim()))return hold('POSSIBLE_RIGHT_CONTEXT_CONTINUATION');
 if(!claim||typeof claim!=='object'||typeof claim.quote!=='string'||typeof claim.group_id!=='string'||claim.group_id.length===0||!Number.isInteger(claim.source_index)||claim.source_index>=0||-claim.source_index>prior.length)return hold('NO_DECLARED_PRECEDING_GROUP');
 const q=claim.quote;
 if(!q||/[\r\n]/u.test(q))return hold('BAD_NOMINAL_GROUP_QUOTE');
 if(prior.at(claim.source_index).split(q).length!==2||prior.reduce((n,s)=>n+(s.split(q).length-1),0)!==1)return hold('GROUP_QUOTE_NOT_UNIQUE_IN_PRECEDING_CONTEXT');
 const source=sourceCount.exec(q);
 if(!source)return hold('SOURCE_CARDINALITY_OR_UNIT_UNLICENSED');
 const tail=target.slice(span.end),tgt=targetCount.exec(tail);
 if(!tgt)return hold('TARGET_SELECTION_NUMBER_OR_UNIT_UNSUPPORTED');
 if(source[2]!==tgt[2])return hold('COUNTER_MISMATCH_NO_MORPHOLOGY_BRIDGE',{observed_source_counter:source[2],observed_target_counter:tgt[2]});
 const left=count(source[1]),right=count(tgt[1]);
 if(!Number.isSafeInteger(left)||!Number.isSafeInteger(right)||left<2||right<1||right>=left)return hold('NOT_STRICT_SUBSET_OR_INVALID_COUNT');
 const suffix=span.form.slice('그중'.length),overt=q+' 중'+suffix;
 const candidate=target.slice(0,span.start)+overt+tail;
 return {...base,status:'PROPOSAL_ONLY',reason:'EXACT_QUOTE_MATCH_WITH_STRICT_SUBSET',candidates:[original,{id:'SOURCE_BOUNDED_OVERT_GROUP',text:candidate,license:'A1_LITERAL_SOURCE_WITNESS_NOT_SEMANTIC_PROOF',writer_quality:'NOT_MEASURED'}],source_witness:{group_id:claim.group_id,quote_sha256:hash(q),source_index:claim.source_index,surface_form:span.form,source_count:left,target_count:right,unit:source[2]},edit:{before:span.form,after:overt,start:span.start},warning:'PARTITIVE_REFERENT_AND_NATURALNESS_NOT_INDEPENDENTLY_VALIDATED'};
}
module.exports={propose,occurrence,count};
