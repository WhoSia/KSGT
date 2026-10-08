'use strict';
/* G9-P53 KRC v0.7: finite, evidence-scoped writer-choice prototype.
 * No model call, no Korean naturalness judge, no inferred writer intentions.
 * A caller-supplied authorConfirmed flag is NOT identity verification.
 */
function decision(status,reason,text,extra={}) {
  return {status,reason,text,changed:status==='EDIT',scope:'SYNTHETIC_DECLARED_SOURCE_ONLY',...extra};
}
function decide(input) {
  const {text,groups,query,directive}=input||{};
  if(typeof text!=='string') return decision('ABSTAIN','INVALID_TEXT',text);
  if(!Array.isArray(groups)||!query||typeof query!=='object') return decision('ABSTAIN','INVALID_SOURCE_PLAN',text);
  if(!directive||directive.authorConfirmed!==true) return decision('ABSTAIN','AUTHOR_OBJECTIVE_UNCONFIRMED',text);
  if(directive.objective==='PRESERVE_AMBIGUITY'||directive.objective==='NO_EDIT')
    return decision('KEEP','WRITER_INTENT_PRESERVES_TEXT',text);
  if(directive.objective!=='CLARIFY') return decision('ABSTAIN','UNKNOWN_OBJECTIVE',text);
  const {anaphor,kind,count,targetGroupId}=query;
  if(typeof anaphor!=='string'||!/^그중 한 [^\s]+$/.test(anaphor)||
     !Number.isSafeInteger(count)||count!==1||typeof kind!=='string'||!kind||
     typeof targetGroupId!=='string') return decision('ABSTAIN','OUTSIDE_FINITE_PARTITIVE_CONTRACT',text);
  const offset=text.indexOf(anaphor);
  if(offset<0||text.indexOf(anaphor,offset+anaphor.length)>=0)
    return decision('ABSTAIN','NONUNIQUE_ANAPHOR_SPAN',text);
  const eligible=[];
  for(const g of groups) {
    if(!g||typeof g.id!=='string'||typeof g.kind!=='string'||
      !Number.isSafeInteger(g.size)||g.size<2||typeof g.quote!=='string')
      return decision('ABSTAIN','INVALID_GROUP_RECORD',text);
    if(!g.accessible||g.kind!==kind||g.size<=count)continue;
    eligible.push(g);
  }
  const target=eligible.find(g=>g.id===targetGroupId);
  if(!target||eligible.some(g=>g.id===target.id&&g!==target))
    return decision('ABSTAIN','TARGET_NOT_UNIQUELY_LICENSED',text);
  if(eligible.length===1)return decision('KEEP','SINGLE_ACCESSIBLE_GROUP',text,{source_group:target.id});
  if(typeof target.quote!=='string'||!target.quote||/[\r\n]/.test(target.quote))
    return decision('ABSTAIN','UNSUPPORTED_SOURCE_QUOTE',text);
  const at=text.indexOf(target.quote);
  if(at<0||at>=offset||text.indexOf(target.quote,at+target.quote.length)>=0)
    return decision('ABSTAIN','SOURCE_QUOTE_NOT_UNIQUE_AND_PRECEDING',text);
  // Surface editing is limited to inserting an EXACT preceding group mention.
  // Neither reference gold nor context-dependent aesthetic quality follows.
  const overt=target.quote+' 중 '+anaphor.slice('그중 '.length);
  return decision('EDIT','DECLARED_TARGET_CLARIFIED',text.slice(0,offset)+overt+text.slice(offset+anaphor.length),{
    before:anaphor,after:overt,source_group:target.id,
    evidence:{quote:target.quote,quote_offset:at,edit_offset:offset},
    quality:'NOT_OBSERVED',author_confirmation:'DECLARED_NOT_AUTHENTICATED'
  });
}
module.exports={decide};
