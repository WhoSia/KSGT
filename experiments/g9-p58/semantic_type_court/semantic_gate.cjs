'use strict';
/* G9-P58: minimal, fail-closed semantic source typing of Korean partitive-like constructions.
 * This is not a surface classifier, not human-grade syntax gold and not an author preference model.
 */
const crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const TYPES=new Set(['REFERENTIAL_INDIVIDUAL_SET','REFERENTIAL_KIND_SET','KIND_DOMAIN','MASS_MEASURE','EVENT_PART','UNKNOWN']);
const SELECTIONS=new Set(['EXACT_DISCRETE_ITEMS','EXACT_DISCRETE_HALF','FRACTION_OF_MASS','KIND_QUANTITY','EVENT_PORTION','UNCLASSIFIED']);
const POLICIES=new Set(['KEEP','CONTEXTUAL','CLARIFY']);
function adjudicate({source,selection,target,writerPolicy='CONTEXTUAL',genre='UNSPECIFIED'}={}){
 if(!source||!selection||typeof target!=='string'||!target.includes('그중')||
    !TYPES.has(source.semanticType)||!SELECTIONS.has(selection.mode)||!POLICIES.has(writerPolicy)||
    typeof source.quote!=='string'||typeof source.sentence!=='string'||
    typeof source.discourseGiven!=='boolean'||typeof source.scopeKey!=='string'||
    typeof selection.scopeKey!=='string'||typeof genre!=='string')throw Error('INVALID_TYPED_SEMANTIC_FRAME');
 const original={type:'KEEP',text:target},root={schema:'ksgt.g9p58.semantic_type_gate.v1',
  candidates:[original],genre,semanticType:source.semanticType,selectionMode:selection.mode,
  truthOfAntecedent:'NOT_INDEPENDENTLY_ADJUDICATED',writerChoiceGold:'NONE',
  preferenceScore:null,preferredCandidate:null,automaticRewrite:false,
  sourceWitnessHash:hash(source.sentence),sourceQuoteHash:hash(source.quote)};
 const hold=(status,reason)=>({...root,status,reason});
 if(writerPolicy==='KEEP')return hold('KEEP','AUTHOR_KEEP_VETO');
 if(source.semanticType==='UNKNOWN'||selection.mode==='UNCLASSIFIED')return hold('ABSTAIN','SEMANTIC_TYPE_UNKNOWN');
 if(source.semanticType==='KIND_DOMAIN')return hold('HOLD_TYPE','KIND_OR_PSEUDO_PARTITIVE_QUANTITY_NOT_DISCOURSE_SET_PROVEN');
 if(source.semanticType==='MASS_MEASURE')return hold('HOLD_TYPE','MASS_OR_MEASURE_FRACTION_CANNOT_USE_DISCRETE_SET_CARDINALITY_RULE');
 if(source.semanticType==='EVENT_PART')return hold('HOLD_TYPE','EVENT_MEREOLOGY_REQUIRES_DISTINCT_ANTECEDENT_AND_SCOPE');
 if(!['REFERENTIAL_INDIVIDUAL_SET','REFERENTIAL_KIND_SET'].includes(source.semanticType))return hold('ABSTAIN','UNHANDLED_SOURCE');
 if(!source.discourseGiven||source.scopeKey!==selection.scopeKey)return hold('ABSTAIN','DISCOURSE_GIVEN_OR_SCOPE_NOT_WITNESSED');
 if(source.sentence.split(source.quote).length!==2||!source.quote.trim())return hold('ABSTAIN','NONUNIQUE_OR_ABSENT_SOURCE_QUOTE');
 if(selection.mode==='FRACTION_OF_MASS'||selection.mode==='EVENT_PORTION'||selection.mode==='KIND_QUANTITY')
   return hold('HOLD_TYPE','SELECTION_SEMANTICS_INCOMPATIBLE_WITH_DISCRETE_SET');
 if(!Number.isSafeInteger(source.cardinality)||source.cardinality<2||selection.mode==='EXACT_DISCRETE_ITEMS'&&(!Number.isSafeInteger(selection.count)||selection.count<1))
   return hold('ABSTAIN','NO_OBSERVED_DISCRETE_COUNT');
 if(selection.mode==='EXACT_DISCRETE_HALF'&&source.cardinality%2!==0)
   return hold('HOLD_TYPE','ODD_MEMBER_HALF_CANNOT_PROVE_DISCRETE_ITEM_SELECTION_MASS_HALF_MAY_BE_VALID');
 const count=selection.mode==='EXACT_DISCRETE_HALF'?source.cardinality/2:selection.count;
 if(!(count>=1&&count<source.cardinality))return hold('ABSTAIN','NOT_PROPER_ITEM_SUBSET_WHOLE_SET_QUANTIFICATION_NOT_INVALID_KOREAN');
 if(writerPolicy!=='CLARIFY')return hold('KEEP_CONTEXTUAL','NO_USER_CHOICE_OF_OVERT_REFERENCE');
 const m=[...target.matchAll(/그중/g)];
 if(m.length!==1)return hold('ABSTAIN','MULTIPLE_REFERENCE_OCCURRENCES');
 const alternative=target.slice(0,m[0].index)+source.quote+' 중'+target.slice(m[0].index+2);
 return {...root,status:'REVIEW_ONLY',reason:'DECLARED_DISCOURSE_GIVEN_DISCRETE_SET_AND_STRICT_SUBSET',
  candidates:[original,{type:'OVERT_GROUP_REVIEW',text:alternative,license:'A1_DECLARED_SOURCE_ONLY_NOT_TRUE_GROUP_GOLD',naturalness:'NOT_EVALUATED'}],
  selectionCount:count,referentialEconomy:'KEEP_MAY_BE_BETTER_IN_CONTEXT',genreIsPreferenceEvidence:false};
}
module.exports={adjudicate};
