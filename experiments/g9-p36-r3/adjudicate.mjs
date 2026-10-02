import fs from 'node:fs';
import path from 'node:path';

const [outDir]=process.argv.slice(2);
if(!outDir)throw new Error('usage: node adjudicate.mjs <outdir>');
const readJsonl=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const natural=readJsonl(path.join(outDir,'proof_objects.jsonl'));
const controls=readJsonl(path.join(outDir,'control_proofs.jsonl'));
const extraction=JSON.parse(fs.readFileSync(path.join(outDir,'extraction_summary.json'),'utf8'));
const r2=JSON.parse(fs.readFileSync('experiments/g9-p36-r2/final/full121_structural_replay.json','utf8'));

const expected=new Map([
 ['POS_SUBSUMPTION','CERTIFY'],['POS_FUSION','CERTIFY'],['POS_COMMITMENT_FUSION','CERTIFY'],
 ['NEG_VALUE_BINDING_SWAP','ABSTAIN'],['NEG_POLARITY_SCOPE_SWAP','ABSTAIN'],['NEG_MODAL_FORCE','ABSTAIN'],
 ['NEG_CONDITION','ABSTAIN'],['NEG_CROSS_ATTACHMENT','ABSTAIN'],['NEG_CROSS_ANTECEDENT','ABSTAIN'],
 ['NEG_ONE_WAY_ADDITION','ABSTAIN'],['NEG_FLUENT_MISSING_ATOM','ABSTAIN'],['NEG_REPRESENTATION_GAP','ABSTAIN']
]);
const controlAudit=controls.map(x=>({id:x.id,expected:expected.get(x.id),observed:x.verdict,reason:x.reason,pass:expected.get(x.id)===x.verdict}));
const reasonCounts={}; for(const p of natural)reasonCounts[p.reason]=(reasonCounts[p.reason]||0)+1;
const opCounts={}; for(const p of natural)opCounts[p.operation]=(opCounts[p.operation]||0)+1;
const certs=natural.filter(x=>x.verdict==='CERTIFY');
const validation={
  papers_121: extraction.papers_discovered===121,
  controls_12_12: controlAudit.length===12&&controlAudit.every(x=>x.pass),
  positive_controls_3_3: controlAudit.filter(x=>x.id.startsWith('POS_')).length===3&&controlAudit.filter(x=>x.id.startsWith('POS_')).every(x=>x.pass),
  negative_controls_9_9: controlAudit.filter(x=>x.id.startsWith('NEG_')).length===9&&controlAudit.filter(x=>x.id.startsWith('NEG_')).every(x=>x.pass),
  inherited_r2_validation: !!r2.validation?.pass,
  inherited_r2_certifiable_zero: r2.aggregate?.certifiable===0
};
validation.pass=Object.values(validation).every(Boolean);
const frontierReopened=validation.pass&&certs.length>0;
const representationVeto=natural.filter(x=>x.reason==='REPRESENTATION_SUFFICIENCY_VETO').length;
const result={
 phase:'KSGT Generation IX G9-P36-R3',
 court:'Cross-Sentence Obligation Subsumption, Distributed Semantic Redundancy, Entailment-Bidirectional Fusion, Context-Preserving Compression Proofs & Non-Local Frontier Reopening Court',
 compiler:'C3-R3-FUSION-PROOF-v1',
 source:{archive_sha256:'d400a34d8dcf557c0e49b1d140db29a34153688a7047e451bba9635c5944519b',csv_sha256:'599ff1bbfeddf0aa81f018416a4103e1c842e2e043f8090c12d46ff762e13e28'},
 extraction, proof_objects:natural.length, operation_counts:opCounts, reason_counts:reasonCounts,
 certifiable_natural:certs.length, representation_sufficiency_veto:representationVeto,
 controls:controlAudit,
 inherited_r2:{papers:r2.aggregate?.papers,candidates:(r2.aggregate?.W0||0)+(r2.aggregate?.W1||0)+(r2.aggregate?.W2||0),certifiable:r2.aggregate?.certifiable,validation:r2.validation},
 validation, frontier_reopened:frontierReopened,
 authority:{
  fusion_ir: certs.length>0?'NATURAL_WITNESS_PROVISIONALLY_ESTABLISHED_UNDER_FROZEN_IR':'NO_NATURAL_CERTIFIED_WITNESS',
  natural_language_realization:'OUTSIDE_CERTIFICATE_AUTHORITY',MNMC_5:'RETAINED',MNMC_6:'NOT_JUSTIFIED',safe_transport:'ABSTAIN'
 },
 certified_witnesses:certs
};
fs.writeFileSync(path.join(outDir,'adjudication.json'),JSON.stringify(result,null,2)+'\n');
const verdict=validation.pass?(frontierReopened?'PASS_WITH_NATURAL_PROOF_CARRYING_FUSION_WITNESS':'PASS_WITH_PROOF_SYSTEM_CALIBRATED_NATURAL_FRONTIER_NOT_REOPENED'):'FAIL_VALIDATION';
fs.writeFileSync(path.join(outDir,'adjudication.yaml'),[
 'phase: KSGT Generation IX G9-P36-R3',`verdict: ${verdict}`,
 `papers: ${extraction.papers_discovered}`,`response_files: ${extraction.response_files}`,`obligations: ${extraction.obligations}`,
 `candidate_pairs: ${extraction.candidates}`,`proof_objects: ${natural.length}`,`certifiable_natural: ${certs.length}`,
 `representation_sufficiency_veto: ${representationVeto}`,
 `positive_controls: ${controlAudit.filter(x=>x.id.startsWith('POS_')&&x.pass).length}/3_PASS`,
 `adversarial_negative_controls: ${controlAudit.filter(x=>x.id.startsWith('NEG_')&&x.pass).length}/9_PASS`,
 `r2_regression_validation: ${validation.inherited_r2_validation&&validation.inherited_r2_certifiable_zero?'PASS':'FAIL'}`,
 `frontier_reopened: ${frontierReopened}`,'MNMC_5: RETAINED','MNMC_6: NOT_JUSTIFIED',
 'natural_language_realization_authority: OUTSIDE_CERTIFICATE','safe_transport: ABSTAIN'
].join('\n')+'\n');
console.log(JSON.stringify({verdict,validation,frontier_reopened:frontierReopened,certifiable_natural:certs.length,reason_counts:reasonCounts},null,2));
if(!validation.pass) process.exitCode=3;
