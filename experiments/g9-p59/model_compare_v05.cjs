"use strict";
/** G9-P59 v0.5: same input packets, descriptive structural comparison, no model quality ranking. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {makeRows,hash}=require('./dataset_v05.cjs');
const ACTIONS=new Set(['KEEP','EXPLICIT','RESTRUCTURE','ABSTAIN']);
function inputPacket(row){
 return {id:row.id,source:row.source.fact,genre:row.source.genre,
  readerState:row.readerState,intendedMeaning:row.intent,
  actions:['KEEP','EXPLICIT','RESTRUCTURE','ABSTAIN'],split:row.split,
  disclosure:'Author-created meaning/reader-state, not gold or human preference'};
}
function suppliedPrediction(row,policy){
 const action=policy==='keep'?'KEEP':policy==='explicit'?'EXPLICIT':'ABSTAIN';
 return {id:row.id,action,text:action==='ABSTAIN'?'[ABSTAIN]':row.alternatives[action]};
}
function checkPrediction(row,pred){
 if(!pred||!ACTIONS.has(pred.action)||typeof pred.text!=='string')return {status:'REJECT',reason:'BAD_SCHEMA'};
 if(pred.action==='ABSTAIN')return {status:pred.text==='[ABSTAIN]'?'ABSTAIN':'REJECT',reason:'ABSTAIN'};
 if(pred.action==='RESTRUCTURE')return {status:'HOLD',reason:'FREE_RESTRUCTURE_UNVALIDATED'};
 if(pred.text!==row.alternatives[pred.action])return {status:'HOLD',reason:'OUTSIDE_AUTHORED_CLOSED_ALTERNATIVES'};
 if(pred.action==='KEEP'&&row.readerState.accessibleRefs.length!==1)return {status:'HOLD',reason:'READER_REFERENT_UNDERDETERMINED'};
 return {status:'TYPED_CONTRACT_PASS',reason:'EXACT_AUTHOR_CANDIDATE_NOT_INDEPENDENT_MEANING_GOLD'};
}
function compare(rows,models){
 const ids=rows.map(r=>r.id),idSet=new Set(ids),datasetHash=hash(rows);
 assert.equal(new Set(ids).size,ids.length);
 const receipts=[];
 for(const model of models){
  if(typeof model.modelId!=='string'||!model.modelId.trim())throw Error('MISSING_MODEL_ID');
  if(model.datasetHash!==datasetHash)throw Error('DATASET_HASH_MISMATCH');
  if(!Array.isArray(model.predictions)||model.predictions.length!==rows.length)throw Error('INCOMPLETE_COMPARABLE_COVERAGE');
  const predictions=new Map();
  for(const p of model.predictions){
   if(!idSet.has(p.id)||predictions.has(p.id))throw Error('DUPLICATE_OR_UNKNOWN_ID');
   predictions.set(p.id,p);
  }
  const bySplit={},byAction={KEEP:0,EXPLICIT:0,RESTRUCTURE:0,ABSTAIN:0},byVerdict={};
  for(const row of rows){
   const p=predictions.get(row.id),v=checkPrediction(row,p);
   bySplit[row.split]??={n:0,typed:0,held:0};
   bySplit[row.split].n++;
   if(v.status==='TYPED_CONTRACT_PASS')bySplit[row.split].typed++;
   if(v.status==='HOLD')bySplit[row.split].held++;
   if(byAction[p.action]!==undefined)byAction[p.action]++;
   byVerdict[v.status]=(byVerdict[v.status]||0)+1;
  }
  receipts.push({modelId:model.modelId,submittedDigest:hash(model.predictions),byAction,byVerdict,bySplit});
 }
 if(new Set(receipts.map(r=>r.modelId)).size!==receipts.length)throw Error('DUPLICATE_MODEL_ID');
 return {schema:'ksgt.p59.compare.v05',datasetHash,modelCount:receipts.length,rows:rows.length,
  inputContract:'SAME_ROW_IDENTITIES_AND_DECLARED_READER_STATE',
  comparability:'STRUCTURAL_ONLY_NOT_KOREAN_NATURALNESS_OR_PREFERENCE',
  interpretation:'NO_WINNER_NO_HUMAN_GOLD',receipts};
}
function test(){
 const rows=makeRows(),digest=hash(rows);
 const models=['keep','explicit','abstain'].map(p=>({modelId:'fixture-'+p,datasetHash:digest,predictions:rows.map(r=>suppliedPrediction(r,p))}));
 const r=compare(rows,models);
 assert.equal(r.rows,32);assert.equal(r.modelCount,3);
 assert.deepEqual(r.receipts[0].byVerdict,{TYPED_CONTRACT_PASS:16,HOLD:16});
 assert.deepEqual(r.receipts[1].byVerdict,{TYPED_CONTRACT_PASS:32});
 assert.deepEqual(r.receipts[2].byVerdict,{ABSTAIN:32});
 assert.throws(()=>compare(rows,[{...models[0],datasetHash:'unmatched'}]),/DATASET_HASH_MISMATCH/);
 assert.throws(()=>compare(rows,[{...models[0],predictions:models[0].predictions.slice(1)}]),/INCOMPLETE_COMPARABLE_COVERAGE/);
 const swapped=structuredClone(models[0]);swapped.predictions[0].id=swapped.predictions[1].id;
 assert.throws(()=>compare(rows,[swapped]),/DUPLICATE_OR_UNKNOWN_ID/);
 assert.equal(checkPrediction(rows[0],{action:'RESTRUCTURE',text:'새 문장'}).status,'HOLD');
 assert.equal(checkPrediction(rows[0],{action:'EXPLICIT',text:'임의 내용'}).status,'HOLD');
 console.log(JSON.stringify({test:'PASS',rows:32,models:3,receipts:r.receipts,authority:r.interpretation}));
}
if(require.main===module){
 if(process.argv.includes('--inputs'))console.log(JSON.stringify({schema:'ksgt.p59.model-input.v05',datasetHash:hash(makeRows()),packets:makeRows().map(inputPacket)}));
 else if(process.argv.includes('--compare-file')){
  const path=process.argv[process.argv.indexOf('--compare-file')+1];
  if(!path)throw Error('MISSING_PATH');
  console.log(JSON.stringify(compare(makeRows(),JSON.parse(fs.readFileSync(path,'utf8')).models)));
 }else test();
}
module.exports={inputPacket,suppliedPrediction,checkPrediction,compare,test};
