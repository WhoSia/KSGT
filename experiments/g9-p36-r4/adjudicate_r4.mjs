import fs from 'node:fs';
import path from 'node:path';
const [outDir]=process.argv.slice(2);if(!outDir)throw new Error('usage: node adjudicate_r4.mjs <outdir>');
const readJsonl=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const natural=readJsonl(path.join(outDir,'proof_objects.jsonl'));
const candidates=readJsonl(path.join(outDir,'candidates.jsonl'));
const candidateById=new Map(candidates.map(x=>[x.id,x]));
const r3controls=readJsonl(path.join(outDir,'r3_control_proofs.jsonl'));
const r4controls=JSON.parse(fs.readFileSync(path.join(outDir,'r4_representation_controls.json'),'utf8'));
const extraction=JSON.parse(fs.readFileSync(path.join(outDir,'extraction_summary.json'),'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(outDir,'representation_audit.json'),'utf8'));
const r3=JSON.parse(fs.readFileSync('experiments/g9-p36-r3/final/adjudication.json','utf8'));
const expected=new Map([
 ['POS_SUBSUMPTION','CERTIFY'],['POS_FUSION','CERTIFY'],['POS_COMMITMENT_FUSION','CERTIFY'],
 ['NEG_VALUE_BINDING_SWAP','ABSTAIN'],['NEG_POLARITY_SCOPE_SWAP','ABSTAIN'],['NEG_MODAL_FORCE','ABSTAIN'],
 ['NEG_CONDITION','ABSTAIN'],['NEG_CROSS_ATTACHMENT','ABSTAIN'],['NEG_CROSS_ANTECEDENT','ABSTAIN'],
 ['NEG_ONE_WAY_ADDITION','ABSTAIN'],['NEG_FLUENT_MISSING_ATOM','ABSTAIN'],['NEG_REPRESENTATION_GAP','ABSTAIN']
]);
const r3audit=r3controls.map(x=>({id:x.id,expected:expected.get(x.id),observed:x.verdict,pass:expected.get(x.id)===x.verdict,reason:x.reason}));
const reasons={},ops={};for(const p of natural){reasons[p.reason]=(reasons[p.reason]||0)+1;ops[p.operation]=(ops[p.operation]||0)+1;}
const certs=natural.filter(x=>x.verdict==='CERTIFY');
const f1certs=certs.filter(x=>x.operation==='F1_CONJUNCTIVE_FUSION');
const f1Roundtrip=f1certs.every(x=>!!candidateById.get(x.id)?.bcog?.witness?.pass);
const validation={
 source_papers_121:extraction.papers_discovered===121,
 frozen_r3_window_exact:extraction.eligible_pair_windows===8071&&extraction.candidates===8071,
 r4_representation_controls:r4controls.validation?.pass===true,
 inherited_r3_controls:r3audit.length===12&&r3audit.every(x=>x.pass),
 inherited_r3_closure:r3.validation?.pass===true&&r3.frontier_reopened===false,
 f1_certificates_have_roundtrip_witness:f1Roundtrip
};
validation.pass=Object.values(validation).every(Boolean);
const frontier=validation.pass&&certs.length>0;
const verdict=!validation.pass?'FAIL_VALIDATION':frontier?'PASS_NATURAL_FRONTIER_REOPENED_WITH_BINDING_COMPLETE_PROOF':'PASS_BINDING_GRAPH_RECOVERED_NATURAL_FRONTIER_NOT_REOPENED';
const result={
 phase:'KSGT Generation IX G9-P36-R4',
 court:'Binding-Complete Obligation Graph Recovery, Predicate-Argument-Value-Scope Reattachment, Representation-Sufficiency Witnesses, Cross-Sentence Proof-Carrying Fusion Reconstitution & Natural Frontier Reopening Court',
 compiler:'C3-R4-BCOG-v1',proof_kernel:'INHERITED_UNCHANGED_C3-R3_RUST_KERNEL',
 source:{archive_sha256:'d400a34d8dcf557c0e49b1d140db29a34153688a7047e451bba9635c5944519b',csv_sha256:'599ff1bbfeddf0aa81f018416a4103e1c842e2e043f8090c12d46ff762e13e28'},
 extraction,representation_audit:audit,proof_objects:natural.length,operation_counts:ops,reason_counts:reasons,
 certifiable_natural:certs.length,frontier_reopened:frontier,certified_witnesses:certs,
 controls:{r4_representation:r4controls.validation,r3_inherited:r3audit},
 validation,verdict,
 authority:{
  MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED_BY_DESIGN',
  external_AMR_SRL_as_truth:'REJECTED',
  natural_language_realization:'OUTSIDE_CERTIFICATE_AUTHORITY',
  representation_authority:extraction.representation_complete_pairs>126?'EXPANDED_RELATIVE_TO_R3':'NOT_EXPANDED_RELATIVE_TO_R3',
  safe_transport:'ABSTAIN',human_recruitment:'HOLD'
 }
};
fs.writeFileSync(path.join(outDir,'adjudication.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'adjudication.yaml'),[
 'phase: KSGT Generation IX G9-P36-R4',`verdict: ${verdict}`,
 `papers: ${extraction.papers_discovered}`,`candidate_pairs: ${extraction.candidates}`,
 `representation_complete_pairs: ${extraction.representation_complete_pairs}`,
 `controlled_roundtrip_witnesses: ${extraction.controlled_roundtrip_witnesses}`,
 `certifiable_natural: ${certs.length}`,`frontier_reopened: ${frontier}`,
 `r4_representation_controls: ${validation.r4_representation_controls?'PASS':'FAIL'}`,
 `inherited_r3_controls: ${validation.inherited_r3_controls?'PASS':'FAIL'}`,
 'MNMC_5: RETAINED','MNMC_6: NOT_JUSTIFIED','safe_transport: ABSTAIN','human_recruitment: HOLD'
].join('\n')+'\n');
console.log(JSON.stringify({verdict,validation,frontier_reopened:frontier,certifiable_natural:certs.length,representation_complete_pairs:extraction.representation_complete_pairs,controlled_roundtrip_witnesses:extraction.controlled_roundtrip_witnesses,reason_counts:reasons},null,2));
if(!validation.pass)process.exitCode=3;
