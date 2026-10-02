import fs from 'node:fs';
const syn=JSON.parse(fs.readFileSync('experiments/g9-p36-r10/final/two_bucket_synthesis.json','utf8'));
const ctrl=JSON.parse(fs.readFileSync('experiments/g9-p36-r10/final/arg_controls.json','utf8'));
const intake=JSON.parse(fs.readFileSync('experiments/g9-p36-r10/final/nikl_intake_status.json','utf8'));
const validation={synthesis:syn.decision.authority_bearing_relation_motif_lane==='RETIRED',arg_controls:ctrl.pass===true,gold_guard:intake.scoring_authorized===false};
validation.pass=Object.values(validation).every(Boolean);
const verdict=validation.pass?(intake.bytes_present?'PASS_RELATION_MOTIF_LANE_RETIRED_ARG_CONSTITUTION_SEALED_GOLD_BYTES_INTAKE_PENDING_SCHEMA':'PASS_RELATION_MOTIF_LANE_RETIRED_ARG_CONSTITUTION_SEALED_EXTERNAL_GOLD_WAIT'):'FAIL_R10_VALIDATION';
const result={phase:'KSGT Generation IX G9-P36-R10',verdict,status:intake.bytes_present?'ACTIVE_GOLD_INTAKE':'ACTIVE_EXTERNAL_GOLD_HOLD',two_bucket:syn,korean_arg:{version:'KSGT-ARG-v1',controls:ctrl.tests.length,controls_pass:ctrl.pass,semantic_reuse_candidate:'ROLE_EVENT_RECOVERABILITY_GRAPH',english_relation_bigram_authority:'RETIRED',gold_status:intake.state},validation,authority:{relation_motif_authority_lane:'RETIRED',relation_motif_diagnostic_probe:'RETAINED',predicate_family_authority:'NOT_PROMOTED',micro_reuse:'NOT_PROMOTED',cross_language_reuse:'HOLD',MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED'},waiting:['NIKL Zero Anaphora Corpus 2020 annotation bytes','NIKL Zero Anaphora Corpus 2025 annotation bytes','P33-R2 legacy strict-30 exact row crosswalk','PeerJ external transport']};
fs.writeFileSync('experiments/g9-p36-r10/final/adjudication.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!validation.pass)process.exitCode=2;
