'use strict';
const classes=new Set(['ZERO_ANAPHORA','PARTITIVE_GOLD','EDITOR_PAIRS','LEARNER_CORRECTION','STYLE_PARAPHRASES','ORIGINAL_PROSE']);
const rights=new Set(['PENDING','RESTRICTED','VERIFIED']);
const role=new Set(['UNKNOWN','EDITOR','SAME_WRITER','HUMAN_PARAPHRASE','ANNOTATOR']);
function validate(records){
 if(!Array.isArray(records)||!records.length)throw Error('NO_EVIDENCE_RECORDS');
 const seen=new Set();
 for(const x of records){
  if(!x||typeof x.source_id!=='string'||!x.source_id||!classes.has(x.class)||!rights.has(x.license_status)||!role.has(x.authority))throw Error('INVALID_PROVENANCE');
  if(seen.has(x.source_id))throw Error('DUPLICATE_SOURCE_ID');seen.add(x.source_id);
  if(x.public_raw===true&&x.license_status!=='VERIFIED')throw Error('UNLICENSED_PUBLIC_RAW');
  if(x.independent_partitive_gold===true&&(x.class!=='PARTITIVE_GOLD'||x.independent_adjudication!==true))throw Error('FALSE_PARTITIVE_GOLD');
  if(x.authority==='SAME_WRITER'&&x.same_writer_provenance!==true)throw Error('FALSE_SAME_WRITER_AUTHORITY');
  if(x.class==='EDITOR_PAIRS'&&x.estimate_no_edit_rate===true&&x.edit_conditioned===true)throw Error('SELECTION_BIAS_NO_EDIT_RATE');
  if(Object.hasOwn(x,'raw_text')||Object.hasOwn(x,'raw_bytes')||Object.hasOwn(x,'source_sentence'))throw Error('RAW_TEXT_IN_PUBLIC_METADATA');
  if(!['EXISTING_PRIVATE_DRIVE','SOURCE_METADATA_ONLY','NEW_PENDING'].includes(x.custody))throw Error('UNKNOWN_DATA_CUSTODY');
 }
 return {state:'METADATA_VALIDATED_NOT_LICENSE_GRANTED',source_count:records.length,independent_partitive_gold:records.filter(x=>x.independent_partitive_gold===true).length,raw_publication:'NONE',authority:'NO_INDEPENDENT_WRITER_QUALITY'};
}
module.exports={validate};
