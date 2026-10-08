'use strict';
// P57 admissibility for DIRECT Korean explicit-partitive antecedent labels.
// All source records are metadata. Never manufactures annotation authority.
const RIGHTS = new Set(['CC-BY-SA-4.0','CC-BY-NC-4.0','REQUEST_REQUIRED','PRIVATE_EXISTING','RESEARCH_ARTICLE_ONLY']);
const TASKS = new Set(['EXPLICIT_PARTITIVE_GROUP','CHARACTER_COREFERENCE','GENERAL_COREFERENCE','ZERO_ANAPHORA','ZP_HEAD_LINKING']);
function adjudicateSource(input) {
 if(!input||typeof input!=='object'||typeof input.id!=='string'||!TASKS.has(input.task)||
    !RIGHTS.has(input.rights)||!['MATERIALIZED','CATALOGUED','PAPER_ONLY','PRIVATE_EXISTING'].includes(input.custody)||
    typeof input.nativeKorean!=='boolean'||typeof input.humanAnnotated!=='boolean'||
    typeof input.verifiedExactTargetGold!=='boolean'||typeof input.sourceIndependentGold!=='boolean'||
    !['OBSERVED','NOT_OBSERVED','NOT_TESTED','PARTIAL_CHECK'].includes(input.disagreementStatus)||
    !['FULL','PARTIAL','NONE'].includes(input.targetAuditExtent))
   throw Error('INVALID_SOURCE_AUTHORITY_RECORD');
 const hasGold= input.nativeKorean&&input.humanAnnotated&&input.sourceIndependentGold;
 const direct = hasGold&&input.task==='EXPLICIT_PARTITIVE_GROUP'&&input.verifiedExactTargetGold
   &&input.custody==='MATERIALIZED'&&input.targetAuditExtent==='FULL'
   &&input.rights!=='REQUEST_REQUIRED'&&input.rights!=='RESEARCH_ARTICLE_ONLY';
 const disagreement = direct&&input.disagreementStatus==='OBSERVED';
 let verdict,grounds=[];
 if(direct){verdict='DIRECT_EXPLICIT_PARTITIVE_GOLD_ADMISSIBLE';grounds.push('EXACT_TARGET_AND_HUMAN_GOLD_LANDED')}
 else if(input.custody==='CATALOGUED'||input.custody==='PAPER_ONLY') {verdict='SOURCE_AUTHORITY_CATALOGUE_ONLY';grounds.push('ANNOTATED_BYTES_NOT_MATERIALIZED')}
 else if(input.task==='EXPLICIT_PARTITIVE_GROUP'){verdict='TARGET_CONTEXT_WITHOUT_ADMISSIBLE_GOLD';grounds.push('NO_VERIFIED_HUMAN_GROUP_LINK')}
 else if(hasGold){verdict='ADJACENT_NATIVE_COREFERENCE_GOLD_ONLY';grounds.push('ONTOLOGY_NOT_EXPLICIT_PARTITIVE_GROUP')}
 else {verdict='NO_INDEPENDENT_GOLD_FOR_THIS_QUESTION';grounds.push('WRONG_TASK_OR_NO_HUMAN_GOLD')}
 if(input.rights==='REQUEST_REQUIRED')grounds.push('REQUEST_AND_RIGHTS_VERIFICATION_REQUIRED');
 if(input.targetAuditExtent!=='FULL')grounds.push('UNINSPECTED_SOURCE_PORTION_REMAINS');
 if(!input.verifiedExactTargetGold)grounds.push('NO_DIRECT_GEJUNG_ANTECEDENT_WITNESS');
 return {id:input.id,verdict,grounds,direct_partitive_gold:direct,independent_disagreement_gold:disagreement,
  usable_for_native_adjacent_probe:hasGold&&input.custody==='MATERIALIZED',
  independent_accuracy_estimation_authorized:direct&&Boolean(input.goldFrameDenominator)&&input.goldFrameDenominator>0,
  probabilistic_calibration_authorized:false, // no scored outcomes / frozen independent calibration set
  does_not_prove:'WRITER_PREF_OR_EXPLICIT_PARTITIVE_TRUTH_FROM_OTHER_ONTOLOGY'};
}
function auditRegistry(records) {
 if(!Array.isArray(records)||records.length===0)throw Error('NONEMPTY_REGISTRY_REQUIRED');
 const ids=new Set();
 const outcomes=records.map(r=>{if(ids.has(r.id))throw Error('DUPLICATE_SOURCE_ID');ids.add(r.id);return adjudicateSource(r);});
 return {schema:'ksgt.g9p57.gold_admissibility_v1',sources:outcomes,
  directly_admissible_partitive_gold:outcomes.filter(x=>x.direct_partitive_gold).length,
  materialized_adjacent_native_gold:outcomes.filter(x=>x.usable_for_native_adjacent_probe).length,
  independent_disagreement_gold:outcomes.filter(x=>x.independent_disagreement_gold).length,
  target_accuracies_measured:0,numeric_calibration_performed:false,
  protection:'DO_NOT_PROMOTE_CATALOGUE_OR_CHARACTER_COREFERENCE_TO_EXPLICIT_PARTITIVE_GOLD'};
}
module.exports={adjudicateSource,auditRegistry};
