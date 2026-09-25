import fs from 'node:fs';import path from 'node:path';
const d=process.argv[2];if(!d)throw new Error('usage: node adjudicate_r7.mjs <final-dir>');
const J=n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8'));
const controls=J('r7_controls.json'),eng=J('re3align_summary.json'),ko=J('stylekqc_summary.json');
const cross=fs.readFileSync(path.join(d,'rust_crosscheck.tsv'),'utf8').trim().split(/\r?\n/).map(x=>x.split('\t'));
const crossMap=Object.fromEntries(cross.map(([k,v])=>[k,Number(v)]));
const r3=fs.readFileSync(path.join(d,'r3_control_proofs.jsonl'),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const expected=new Map([['POS_SUBSUMPTION','CERTIFY'],['POS_FUSION','CERTIFY'],['POS_COMMITMENT_FUSION','CERTIFY'],['NEG_VALUE_BINDING_SWAP','ABSTAIN'],['NEG_POLARITY_SCOPE_SWAP','ABSTAIN'],['NEG_MODAL_FORCE','ABSTAIN'],['NEG_CONDITION','ABSTAIN'],['NEG_CROSS_ATTACHMENT','ABSTAIN'],['NEG_CROSS_ANTECEDENT','ABSTAIN'],['NEG_ONE_WAY_ADDITION','ABSTAIN'],['NEG_FLUENT_MISSING_ATOM','ABSTAIN'],['NEG_REPRESENTATION_GAP','ABSTAIN']]);
const rustPass=
 crossMap.exploratory_pairs===eng.relation_motif.exploratory_edge_recurrence_pairs&&
 crossMap.chain_pairs===eng.relation_motif.connected_chain_pairs_any_paper&&
 crossMap.primary_cross_paper_chain_pairs===eng.relation_motif.primary_cross_paper_connected_chain_pairs;
const validation={
 presealed_controls:controls.validation?.pass===true,
 re3align_118:eng.papers_discovered===118,
 sparse_english:eng.relation_motif?.global_all_pairs===false,
 rust_crosscheck:rustPass,
 stylekqc_validation:ko.validation?.pass===true,
 sparse_korean:ko.sparse_retrieval?.global_all_pairs===false,
 inherited_r3_controls:r3.length===12&&r3.every(x=>expected.get(x.id)===x.verdict)
};validation.pass=Object.values(validation).every(Boolean);
const primary=eng.relation_motif.primary_cross_paper_connected_chain_pairs||0;
const nullPass=eng.lexical_collision_null?.pass===true;
let verdict;
if(!validation.pass)verdict='FAIL_R7_VALIDATION';
else if(primary>0&&nullPass)verdict='PASS_RELATION_MOTIF_MICRO_REUSE_AUTHORITY_PROMOTED_FUSION_AUTHORITY_CLOSED';
else verdict='PASS_LEXICAL_COLLISION_NULL_REJECTS_MICRO_REUSE_PROMOTION';
const result={
 phase:'KSGT Generation IX G9-P36-R7',
 verdict,
 representation:'C3-R7-REM-v1_over_C3-R6-OFQ-v1_over_C3-R4-BCOG-v1',
 source_epistemic_status:{
  re3align:'PREVIOUSLY_OPENED_SOURCE_NEW_PRESEALED_R7_QUESTION_NOT_FRESH_SOURCE_WORLD_CONTACT',
  stylekqc:'PUBLIC_HUMAN_REWRITE_CORPUS_PREVIOUSLY_PARTLY_INSPECTED_NOT_FRESH_SOURCE_WORLD_CONTACT'
 },
 english_relation_court:{
  exploratory_edge_recurrence_pairs:eng.relation_motif.exploratory_edge_recurrence_pairs,
  connected_chain_pairs_any_paper:eng.relation_motif.connected_chain_pairs_any_paper,
  primary_cross_paper_connected_chain_pairs:primary,
  lexical_null:eng.lexical_collision_null,
  micro_reuse_authority:primary>0&&nullPass?'PROMOTED_RELATION_MOTIF_ONLY':'NOT_PROMOTED',
  semantic_equivalence_authority:'NOT_GRANTED',
  fusion_authority:'NOT_GRANTED'
 },
 korean_transport_court:{
  rows:ko.rows,
  particle_realization_change_pairs:ko.surface_transport.particle_realization_change_pairs,
  particle_realization_change_rate:ko.surface_transport.particle_realization_change_rate,
  order_inversion_proxy_pairs:ko.surface_transport.order_inversion_proxy_pairs,
  order_inversion_proxy_rate:ko.surface_transport.order_inversion_proxy_rate,
  surface_deletion_compatible_proxy_pairs:ko.surface_transport.surface_deletion_compatible_proxy_pairs,
  surface_deletion_compatible_proxy_rate:ko.surface_transport.surface_deletion_compatible_proxy_rate,
  true_ellipsis_authority:'HOLD_NO_ZERO_ARGUMENT_ANNOTATION',
  natural_particle_transport:ko.surface_transport.particle_realization_change_pairs>0?'SUPPORTED_BY_PAIRED_HUMAN_REWRITES':'NOT_OBSERVED',
  natural_word_order_transport:ko.surface_transport.order_inversion_proxy_pairs>0?'SUPPORTED_AS_ORDER_PROXY_BY_PAIRED_HUMAN_REWRITES':'NOT_OBSERVED',
  semantic_authority_source:'STYLEKQC_PAIRED_HUMAN_REWRITE_CONSTRUCTION_NOT_HEURISTIC_DETECTOR'
 },
 cross_corpus_sparse_retrieval:{
  english_algorithm:'EVENT_SHELL_PLUS_ORDERED_ARG1_RELATION_POSTINGS',
  korean_algorithm:ko.sparse_retrieval.algorithm,
  korean_paired_target_recall:ko.sparse_retrieval.paired_target_recall,
  korean_top1_rate:ko.sparse_retrieval.top1_rate,
  korean_candidate_size_median:ko.sparse_retrieval.candidate_size_median,
  global_all_pairs:false,
  claim:'AUDITABLE_TYPED_POSTINGS_TRANSPORTS_ACROSS_CORPORA_WITH_LANGUAGE_SPECIFIC_OBSERVABLES'
 },
 validation,
 laws:[
  'ORDERED_RELATION_RECURRENCE_MUST_DEFEAT_A_TOKEN_MARGINAL_ADJACENCY_NULL_BEFORE_PROMOTION',
  'MICRO_REUSE_AUTHORITY_DOES_NOT_IMPLY_SEMANTIC_EQUIVALENCE_OR_FUSION_AUTHORITY',
  'ROLE_EVENT_GEOMETRY_CAN_BE_LANGUAGE_NEUTRAL_WHILE_REALIZATION_OBSERVABLES_ARE_LANGUAGE_SPECIFIC',
  'PAIRED_HUMAN_REWRITE_AUTHORITY_PRECEDES_PARTICLE_ORDER_OR_DELETION_HEURISTICS',
  'SURFACE_DELETION_PROXY_IS_NOT_ZERO_ARGUMENT_ELLIPSIS_AUTHORITY',
  'SPARSE_RETRIEVAL_ARCHITECTURE_CAN_TRANSPORT_WITHOUT_SHARED_SURFACE_FEATURES'
 ],
 authority:{MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED',natural_fusion_frontier:'NOT_REOPENED_BY_R7',human_recruitment:'HOLD',safe_transport:'ABSTAIN'},
 waiting:['P33-R2 legacy strict-30 exact row crosswalk','PeerJ external transport']
};
fs.writeFileSync(path.join(d,'adjudication.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({verdict,primary,null:eng.lexical_collision_null,korean:{rows:ko.rows,particle:ko.surface_transport.particle_realization_change_pairs,order:ko.surface_transport.order_inversion_proxy_pairs,deletion_proxy:ko.surface_transport.surface_deletion_compatible_proxy_pairs,retrieval_recall:ko.sparse_retrieval.paired_target_recall,top1:ko.sparse_retrieval.top1_rate},validation},null,2));
if(!validation.pass)process.exitCode=3;
