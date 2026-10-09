'use strict';
/** P59 internal §v1.1. Metadata/provenance audit ONLY; no copyrighted corpus bytes. */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const FAMILIES=Object.freeze({
 NIKL_ZA25:{language:'ko',phenomenon:'ZERO_ARGUMENT_RESTORATION',labelKind:'ZERO_ARGUMENT',
  origin:'USER_DRIVE_ZIP_PRESENT',rawLocallyInspected:false,license:'TERMS_PENDING',
  archiveName:'NIKL_ZA_2025_v1.0.zip',archiveDriveId:'1hnPT6CztaxtFukrM6uAMLHIFGgZmoDM2',
  previousAudit:'KSGT_G9P53_KRC_v06_NIKL2025_safe_census.json',
  members:[['NXZA2502512313.json',1027,13907,37960],['SXZA2502512312.json',75,16439,24871]]},
 KOSEND25:{language:'ko',phenomenon:'SENTENCE_ENDING_NATURALNESS',labelKind:'ENDING_NATURALNESS',
  origin:'PUBLIC_REPOSITORY_FILES_LISTED_NOT_INGESTED',rawLocallyInspected:false,license:'TERMS_PENDING',
  upstream:'https://github.com/seungukyu/KoSEnd',files:['KoSEnd/easy.json','KoSEnd/intermediate.json','KoSEnd/hard.json'],
  labelWarning:'MIXED_HUMAN_PILOT_AND_LLM_ANNOTATION_UNMAPPED'},
 GOLEM26_KO:{language:'ko',phenomenon:'FICTION_COREFERENCE',labelKind:'COREFERENCE',
  origin:'PUBLIC_REPOSITORY_RELEASE_NOT_INGESTED',rawLocallyInspected:false,license:'CC-BY-NC-4.0_REPOSITORY_SCOPE',
  upstream:'https://github.com/GOLEM-lab/GOLEMcoref',format:['conll','conllu'],
  splitSource:'data/splits/splits.csv',splitCounts:{train:24,dev:3,test:3},
  legalNote:'STORY_SOURCE_AND_DERIVATIVE_USE_NEED_RIGHTS_REVIEW'},
 KOGEM25:{language:'ko',phenomenon:'GRAMMAR_KNOWLEDGE',labelKind:'GRAMMAR_MCQ',
  origin:'DATASET_LINK_IDENTIFIED_NOT_INGESTED',rawLocallyInspected:false,license:'DATASET_CARD_AND_KOGL_PROVENANCE_PENDING',
  upstream:'https://huggingface.co/datasets/Poppo/KoGEM'},
 PARAREVAL25:{language:'en',phenomenon:'REVISION_ACCEPTABILITY_PREFERENCE',labelKind:'REVISION_PREFERENCE',
  origin:'PUBLIC_REPOSITORY_LINK_IDENTIFIED_NOT_INGESTED',rawLocallyInspected:false,license:'REUSE_TERMS_PENDING',
  upstream:'https://github.com/JourdanL/parareval'}
});
const TASKS=Object.freeze({ZERO_ARGUMENT:'ZERO_ARGUMENT',ENDING_NATURALNESS:'ENDING_NATURALNESS',COREFERENCE:'COREFERENCE',GRAMMAR_MCQ:'GRAMMAR_MCQ',REVISION_PREFERENCE:'REVISION_PREFERENCE',PARTITIVE:'PARTITIVE_ANTECEDENT',PROSE:'WHOLE_KOREAN_PROSE_PREFERENCE'});
const VALID_SPLITS=new Set(['train','dev','test','unassigned']);
const VALID_PROVENANCE=new Set(['HUMAN_DIRECT','HUMAN_MAJORITY','LLM_PSEUDO','AUTHOR_SYNTHETIC','UNKNOWN']);
const HEX=/^[a-f0-9]{64}$/;
function validateItem(r){
 if(!r||!FAMILIES[r.datasetId])throw Error('UNKNOWN_DATASET');
 const ds=FAMILIES[r.datasetId];
 for(const k of ['sourceWorkId','sourceEditionId','itemId','blobSha256','split','task','labelProvenance'])
  if(typeof r[k]!=='string'||!r[k])throw Error('MISSING_'+k);
 if(!HEX.test(r.blobSha256))throw Error('INVALID_BLOB_SHA256');
 if(!VALID_SPLITS.has(r.split)||!VALID_PROVENANCE.has(r.labelProvenance))throw Error('INVALID_ENUM');
 if(r.task!==ds.labelKind)throw Error('PHENOMENON_TRANSPORT_NOT_IDENTIFIED');
 if(r.labelProvenance.startsWith('HUMAN')&&!r.humanEvidenceId)throw Error('HUMAN_LABEL_NO_WITNESS');
 if(r.labelProvenance.startsWith('HUMAN')&&r.datasetId==='KOSEND25'&&!r.rowAuthorityVerified)
  throw Error('KOSEND_MIXED_GOLD_LAUNDERING');
 if(r.language && r.language!==ds.language)throw Error('LANGUAGE_MISMATCH');
 if(r.declaredLicense==='PERMISSIVE'&&ds.license!=='PERMISSIVE')throw Error('LICENSE_LAUNDERING');
 if(r.externalRedistribution===true&&(!r.rightsReceiptId||r.datasetId==='GOLEM26_KO'))
  throw Error('REDISTRIBUTION_REQUIRES_SEPARATE_RIGHTS_AUDIT');
 if(r.humanKoreanProseGold===true)throw Error('NO_WHOLE_KOREAN_PROSE_GOLD');
 return true;
}
function auditRows(rows){
 if(!Array.isArray(rows))throw Error('ROWS_NOT_ARRAY');
 const seenItems=new Set(),workSplit=new Map(),hashSplit=new Map(),counts={};
 for(const row of rows){
  validateItem(row);
  const k=row.datasetId+'|'+row.itemId;
  if(seenItems.has(k))throw Error('DUPLICATE_ITEM'); seenItems.add(k);
  const w=row.datasetId+'|'+row.sourceWorkId,old=workSplit.get(w);
  if(old&&old!==row.split&&old!=='unassigned'&&row.split!=='unassigned')throw Error('SOURCE_WORK_SPLIT_LEAK');
  workSplit.set(w,row.split==='unassigned'?old||row.split:row.split);
  const prev=hashSplit.get(row.blobSha256);
  if(prev&&prev!==row.split&&prev!=='unassigned'&&row.split!=='unassigned')throw Error('CROSS_SPLIT_EXACT_BLOB_LEAK');
  hashSplit.set(row.blobSha256,row.split==='unassigned'?prev||row.split:row.split);
  counts[row.datasetId]=(counts[row.datasetId]||0)+1;
 }
 return {status:'METADATA_ONLY_PASS',items:rows.length,sourceWorks:workSplit.size,byDataset:counts,
  realCorpusRead:false,wholeKoreanProsePreferenceObserved:false};
}
function agreementInterval(n,knownHumanMatches,unknown){
 for(const x of [n,knownHumanMatches,unknown])if(!Number.isInteger(x)||x<0)throw Error('INVALID_COUNTS');
 if(n===0||knownHumanMatches+unknown>n)throw Error('INVALID_DENOMINATOR');
 // Conservative unverified-label bound, NOT statistical confidence interval.
 return {lower:knownHumanMatches/n,upper:(knownHumanMatches+unknown)/n,
   interpretation:'FINITE_POPULATION_IDENTIFICATION_BOUND_NOT_CONFIDENCE_INTERVAL'};
}
function conditionalInteraction(four){
 // Outcome estimates require independently observed, within-source measurements.
 const required=['KEEP|clear','EXPLICIT|clear','KEEP|competing','EXPLICIT|competing'];
 if(!four||!required.every(k=>Number.isFinite(four[k])))return {status:'UNIDENTIFIED',interaction:null};
 return {status:'COMPUTABLE_FROM_SUPPLIED_MEASUREMENTS',
  interaction:(four['EXPLICIT|competing']-four['KEEP|competing'])-
  (four['EXPLICIT|clear']-four['KEEP|clear']),
  causalIdentification:'NOT_ESTABLISHED_BY_ARITHMETIC'};
}
function fixture(n,sourceId,split,task='COREFERENCE',datasetId='GOLEM26_KO'){
 return {datasetId,sourceWorkId:sourceId,sourceEditionId:'edition:synthetic-metadata',itemId:'sample:'+n,
  blobSha256:crypto.createHash('sha256').update('fictive-metadata:'+n).digest('hex'),split,task,
  labelProvenance:'UNKNOWN',humanKoreanProseGold:false};
}
function tests(){
 const a=fixture(1,'story-A','train'),b=fixture(2,'story-B','test');
 assert.equal(auditRows([a,b]).items,2);
 const leak=fixture(3,'story-A','test');assert.throws(()=>auditRows([a,leak]),/SOURCE_WORK_SPLIT_LEAK/);
 const blob={...b,blobSha256:a.blobSha256};assert.throws(()=>auditRows([a,blob]),/CROSS_SPLIT_EXACT_BLOB_LEAK/);
 assert.throws(()=>validateItem({...a,task:'WHOLE_KOREAN_PROSE_PREFERENCE'}),/PHENOMENON_TRANSPORT_NOT_IDENTIFIED/);
 assert.throws(()=>validateItem({...a,declaredLicense:'PERMISSIVE'}),/LICENSE_LAUNDERING/);
 assert.throws(()=>validateItem({...a,externalRedistribution:true}),/REDISTRIBUTION_REQUIRES_SEPARATE_RIGHTS_AUDIT/);
 assert.throws(()=>validateItem({...a,humanKoreanProseGold:true}),/NO_WHOLE_KOREAN_PROSE_GOLD/);
 const ks=fixture(4,'sentence-X','dev','ENDING_NATURALNESS','KOSEND25');
 assert.throws(()=>validateItem({...ks,labelProvenance:'HUMAN_DIRECT'}),/HUMAN_LABEL_NO_WITNESS/);
 assert.throws(()=>validateItem({...ks,labelProvenance:'HUMAN_DIRECT',humanEvidenceId:'witness:unconfirmed'}),/KOSEND_MIXED_GOLD_LAUNDERING/);
 assert.equal(validateItem({...ks,labelProvenance:'LLM_PSEUDO'}),true);
 assert.throws(()=>validateItem({...a,datasetId:'NIKL_ZA25',task:'PARTITIVE_ANTECEDENT'}),/PHENOMENON_TRANSPORT_NOT_IDENTIFIED/);
 assert.deepEqual(agreementInterval(10,4,3),{lower:.4,upper:.7,interpretation:'FINITE_POPULATION_IDENTIFICATION_BOUND_NOT_CONFIDENCE_INTERVAL'});
 assert.equal(conditionalInteraction({}).status,'UNIDENTIFIED');
 const toy=conditionalInteraction({'KEEP|clear':.9,'EXPLICIT|clear':.9,'KEEP|competing':.5,'EXPLICIT|competing':.85});
 assert.ok(Math.abs(toy.interaction-.35)<1e-9);
 const nikl=FAMILIES.NIKL_ZA25.members;
 assert.equal(nikl.reduce((n,r)=>n+r[1],0),1102);
 assert.equal(nikl.reduce((n,r)=>n+r[2],0),30346);
 assert.equal(nikl.reduce((n,r)=>n+r[3],0),62831);
 assert.deepEqual(FAMILIES.GOLEM26_KO.splitCounts,{train:24,dev:3,test:3});
 assert.equal(Object.keys(FAMILIES).length,5);
 console.log(JSON.stringify({test:'PASS',section:'P59/v1.1',profiles:5,nikl:{documents:1102,sentences:30346,slots:62831},golemKoreanOfficialSplits:FAMILIES.GOLEM26_KO.splitCounts,
  negativeControls:9,interactionToy:toy.interaction,rawRecordsIngested:0,humanKoreanWritingScores:0}));
}
if(require.main===module){
 if(process.argv.includes('--emit-metadata'))console.log(JSON.stringify({schema:'ksgt.p59.dataset-authority.v1',profiles:FAMILIES,observedRawItems:0,humanKoreanProseGoldCount:0}));
 else tests();
}
module.exports={FAMILIES,TASKS,validateItem,auditRows,agreementInterval,conditionalInteraction,tests};
