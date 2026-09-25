import fs from 'node:fs';import path from 'node:path';
const d=process.argv[2];const J=n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8'));
const c=J('r9_controls.json'),prep=J('rmr_prepare_summary.json'),sum=J('rmr_analysis_summary.json'),ko=J('nikl_zero_status.json');
const x=Object.fromEntries(fs.readFileSync(path.join(d,'rust_crosscheck.tsv'),'utf8').trim().split(/?
/).map(l=>{const [k,v]=l.split('	');return[k,Number(v)]}));
const ex=sum.exact_arm,fa=sum.family_arm,nul=sum.family_null;
const validation={
 controls:c.validation?.pass===true,
 fresh_bucket:prep.r8_overlap_papers===0&&prep.selected_papers>0,
 author_resolution:sum.author_metadata.resolved>0,
 sparse_exact:ex.global_all_pairs===false,
 sparse_family:fa.global_all_pairs===false,
 rust:x.exact_independent===ex.lineage_independent_primary_pairs&&x.family_independent===fa.lineage_independent_primary_pairs&&x.family_distinct_papers===fa.distinct_independent_papers&&x.family_distinct_families===fa.distinct_independent_families,
 nikl_source:ko.catalog_recovered===true
};validation.pass=Object.values(validation).every(Boolean);
const familyIncrement=fa.lineage_independent_primary_pairs-ex.lineage_independent_primary_pairs;
const gate={
 pairs:fa.lineage_independent_primary_pairs>=5,
 papers:fa.distinct_independent_papers>=8,
 author_components:fa.distinct_author_components>=5,
 families:fa.distinct_independent_families>=3,
 null:nul.pass===true,
 validation:validation.pass
};gate.pass=Object.values(gate).every(Boolean);
let verdict;
if(!validation.pass)verdict='FAIL_R9_VALIDATION';
else if(gate.pass&&familyIncrement>=1&&ko.gold_execution_ready===true)verdict='PASS_CROSS_LANGUAGE_REUSE_AUTHORITY_REOPENED';
else if(gate.pass&&familyIncrement>=1)verdict='PASS_ENGLISH_LINEAGE_INDEPENDENT_MICRO_REUSE_PROMOTED_KOREAN_GOLD_HOLD';
else if(fa.lineage_independent_primary_pairs>0)verdict='PASS_LINEAGE_INDEPENDENT_SIGNAL_INSUFFICIENT_FOR_PROMOTION';
else verdict='PASS_LINEAGE_DECONTAMINATION_REMOVES_PRIMARY_SIGNAL';
const result={phase:'KSGT Generation IX G9-P36-R9',verdict,fresh_replication:{selected_papers:prep.selected_papers,deduped_rows:prep.deduped_rows,exact:ex,family:fa,family_null:nul},predicate_family_necessity:{family_minus_exact_independent:familyIncrement,authority:familyIncrement>=1?'INCREMENTAL_SIGNAL_OBSERVED_NOT_SEMANTIC_EQUIVALENCE':'NO_INCREMENTAL_SIGNAL'},promotion_gate:gate,korean_zero_argument:ko,cross_language_reuse_authority:(gate.pass&&familyIncrement>=1&&ko.gold_execution_ready===true)?'REOPENED':'HOLD',validation,authority:{MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED',semantic_equivalence:'NOT_GRANTED',fusion:'NOT_GRANTED',human_recruitment:'HOLD',safe_transport:'ABSTAIN'},waiting:['P33-R2 legacy strict-30 exact row crosswalk','PeerJ external transport']};
fs.writeFileSync(path.join(d,'adjudication.json'),JSON.stringify(result,null,2)+'
');console.log(JSON.stringify(result,null,2));if(!validation.pass)process.exitCode=3;
