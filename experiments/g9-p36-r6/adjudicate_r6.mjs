import fs from 'node:fs';import path from 'node:path';
const d=process.argv[2];if(!d)throw new Error('usage: node adjudicate_r6.mjs <final-dir>');
const jl=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const extraction=JSON.parse(fs.readFileSync(path.join(d,'extraction_summary.json'),'utf8'));
const controls=JSON.parse(fs.readFileSync(path.join(d,'r6_controls.json'),'utf8'));
const proofs=jl(path.join(d,'proof_objects.jsonl')),candidates=jl(path.join(d,'candidates.jsonl')),r3controls=jl(path.join(d,'r3_control_proofs.jsonl'));
const expected=new Map([['POS_SUBSUMPTION','CERTIFY'],['POS_FUSION','CERTIFY'],['POS_COMMITMENT_FUSION','CERTIFY'],['NEG_VALUE_BINDING_SWAP','ABSTAIN'],['NEG_POLARITY_SCOPE_SWAP','ABSTAIN'],['NEG_MODAL_FORCE','ABSTAIN'],['NEG_CONDITION','ABSTAIN'],['NEG_CROSS_ATTACHMENT','ABSTAIN'],['NEG_CROSS_ANTECEDENT','ABSTAIN'],['NEG_ONE_WAY_ADDITION','ABSTAIN'],['NEG_FLUENT_MISSING_ATOM','ABSTAIN'],['NEG_REPRESENTATION_GAP','ABSTAIN']]);
const certs=proofs.filter(x=>x.verdict==='CERTIFY');
const validation={
 source_118:extraction.papers_discovered===118,
 presealed_controls:controls.validation?.pass===true,
 sparse_factor_index:extraction.factor_reuse?.global_all_pairs===false&&extraction.microfusion?.global_all_pairs===false,
 inherited_r3_controls:r3controls.length===12&&r3controls.every(x=>expected.get(x.id)===x.verdict),
 proof_count:proofs.length===candidates.length,
 roundtrip_required:certs.every(p=>candidates.find(c=>c.id===p.id)?.realization?.pass===true)
};
validation.pass=Object.values(validation).every(Boolean);
const reuse=extraction.factor_reuse?.core_qualified_reuse_pairs||0;
const microCandidates=extraction.microfusion?.microfusion_candidate_pairs||0;
const roundtrip=extraction.microfusion?.controlled_roundtrip_pass_pairs||0;
let verdict,law,ceiling,frontier=false;
if(!validation.pass){verdict='FAIL_VALIDATION';law='UNADJUDICATED';ceiling='VALIDATION_FAILURE';}
else if(certs.length>0){verdict='PASS_MACRO_SPARSE_MICRO_REDUNDANT_MICROFUSION_FRONTIER_REOPENED';law='MACRO_SPARSE_MICRO_REDUNDANT';ceiling='CERTIFIED_MICROFUSION_WITNESS_REVIEW';frontier=true;}
else if(reuse>0){verdict='PASS_MACRO_SPARSE_MICRO_REDUNDANT_FUSION_AUTHORITY_NOT_REOPENED';law='MACRO_SPARSE_MICRO_REDUNDANT';ceiling=microCandidates===0?'GROUNDING_CONDITIONED_MICROFUSION_SPARSITY':roundtrip===0?'CONTROLLED_RECOMPOSITION_OR_COUPLING':'R3_PROOF_OR_COMPRESSION_GATE';}
else{verdict='PASS_MACRO_SPARSE_MICRO_REDUNDANCY_NOT_ESTABLISHED';law='MACRO_SPARSE_MICRO_SPARSE_WITHIN_C3_R6_OFQ_V1';ceiling='FACTOR_NEIGHBORHOOD_SPARSITY';}
const reasons={};for(const p of proofs)reasons[p.reason]=(reasons[p.reason]||0)+1;
const result={
 phase:'KSGT Generation IX G9-P36-R6',
 verdict,whole_obligation_law:law,
 representation:'C3-R6-OFQ-v1_over_C3-R4-BCOG-v1',
 inherited_r5_selector:'C3-R5-RNSN-v1_IMMUTABLE_NEGATIVE_REFERENCE',
 proof_kernel:'C3-R3-FUSION-PROOF-v1_RUST_UNCHANGED',
 source_epistemic_status:'NEW_PROSPECTIVE_QUESTION_ON_PREVIOUSLY_OPENED_R5_SOURCE_NOT_FRESH_SOURCE_WORLD_CONTACT',
 extraction,
 natural_factor_reuse_pairs:reuse,
 natural_microfusion_candidates:microCandidates,
 controlled_roundtrip_natural:roundtrip,
 proof_objects:proofs.length,
 certified_natural_microfusion:certs.length,
 proof_reason_counts:reasons,
 frontier_reopened:frontier,
 validation,
 laws:[
  'FACTOR_REUSE_DOES_NOT_IMPLY_FUSION_AUTHORITY',
  'WHOLE_OBLIGATION_SPARSITY_DOES_NOT_ENTAIL_SUBGRAPH_SPARSITY',
  'CROSS_GROUNDING_REDUNDANCY_IS_REUSE_EVIDENCE_NOT_FUSION_AUTHORITY',
  'PROTECTED_CORE_AND_GROUNDING_REMAIN_CONJUNCTIVE_FOR_MICROFUSION',
  'FLUENCY_CANNOT_CREATE_SEMANTIC_AUTHORITY'
 ],
 korean_boundary:{
  semantic_quotient:'LANGUAGE_NEUTRAL',
  particle_word_order_ellipsis:'DOWNSTREAM_REALIZATION_ONLY',
  protected_geometry:['predicate','ARG0','ARG1','force','scope','authority','value','grounding'],
  synthetic_realization_controls:controls.korean_court?.length||0,
  natural_korean_semantic_authority:'NOT_ESTABLISHED_BY_R6_ENGLISH_CORPUS'
 },
 scalability:{
  global_all_pairs:false,
  method:'typed_hash_postings_plus_sparse_content_index',
  independent_count_crosscheck:'REQUIRED_BY_WORKFLOW'
 },
 authority:{MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED',safe_transport:'ABSTAIN',human_recruitment:'HOLD'},
 waiting:['P33-R2 legacy strict-30 exact row crosswalk','PeerJ external transport']
};
fs.writeFileSync(path.join(d,'adjudication.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({verdict,whole_obligation_law:law,reuse,microCandidates,roundtrip,certified:certs.length,ceiling,validation},null,2));
if(!validation.pass)process.exitCode=3;
