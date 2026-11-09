'use strict';
/** R9.16: evidence-conscious corpus ingestion, no model training.
 * Keep raw Korean text local; export only hashes and aggregates.
 * License assertions MUST be independently verified by the researcher.
 */
const crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x,'utf8').digest('hex');
const normalize=x=>x.normalize('NFC').replace(/\s+/gu,'').replace(/[\u200b-\u200d\ufeff]/gu,'');
const SPLITS=new Set(['development','calibration','heldout']);
const PURPOSES=new Set(['RESEARCH_ONLY','TRAINING_ALLOWED']);
function checkRecord(x){
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('RECORD_OBJECT_REQUIRED');
 for(const k of ['datasetId','workId','text','genre','split','permission','permissionEvidenceId']){
  if(typeof x[k]!=='string'||!x[k].trim())throw Error('MISSING_'+k);
 }
 if(!SPLITS.has(x.split))throw Error('INVALID_SPLIT');
 if(!PURPOSES.has(x.permission))throw Error('UNVERIFIED_PERMISSION');
 if(x.train===true&&x.permission!=='TRAINING_ALLOWED')throw Error('TRAINING_NOT_ALLOWED');
 if(x.derivedFrom!==undefined&&(!Array.isArray(x.derivedFrom)||x.derivedFrom.some(s=>typeof s!=='string'||!s.trim())))throw Error('BAD_DERIVATION');
 if(x.authorId!==undefined&&(typeof x.authorId!=='string'||!x.authorId.trim()))throw Error('BAD_AUTHOR_ID');
 if(x.score!==undefined){
  if(!Array.isArray(x.score)||!x.score.length)throw Error('BAD_SCORE');
  for(const j of x.score){
   if(!j||typeof j.raterId!=='string'||!j.raterId||typeof j.dimension!=='string'||!j.dimension||!Number.isFinite(j.value)||typeof j.scaleId!=='string'||!j.scaleId)throw Error('BAD_RATER_SCORE');
  }
 }
 const exact=sha(x.text),normalized=sha(normalize(x.text));
 return {datasetId:x.datasetId,split:x.split,workRef:sha(x.datasetId+'\0'+x.workId),authorRef:x.authorId?sha(x.datasetId+'\0author\0'+x.authorId):null,
  exactTextSha256:exact,normalizedTextSha256:normalized,characters:[...x.text].length,genre:x.genre,
  permission:x.permission,permissionEvidenceId:x.permissionEvidenceId,trainRequested:x.train===true,
  derivedFrom:(x.derivedFrom||[]).map(s=>sha(x.datasetId+'\0'+s)),
  ratingCount:x.score?.length||0,scoreScaleIds:[...new Set((x.score||[]).map(j=>j.scaleId))].sort()};
}
function inventory(records){
 if(!Array.isArray(records))throw Error('RECORDS_ARRAY_REQUIRED');
 const rows=records.map(checkRecord);
 const parent=new Map(),rank=new Map();
 function add(x){if(!parent.has(x)){parent.set(x,x);rank.set(x,0)}}
 function find(x){add(x);const p=parent.get(x);if(p!==x)parent.set(x,find(p));return parent.get(x)}
 function union(a,b){let x=find(a),y=find(b);if(x===y)return; if(rank.get(x)<rank.get(y))[x,y]=[y,x];parent.set(y,x);if(rank.get(x)===rank.get(y))rank.set(x,rank.get(x)+1)}
 const firstByNormalized=new Map(),firstByExact=new Map(),firstByAuthor=new Map();
 for(const row of rows){
  add(row.workRef);
  for(const d of row.derivedFrom)union(row.workRef,d);
  for(const [map,id] of [[firstByNormalized,row.normalizedTextSha256],[firstByExact,row.exactTextSha256]]){
   if(map.has(id))union(row.workRef,map.get(id));else map.set(id,row.workRef);
  }
  if(row.authorRef){if(firstByAuthor.has(row.authorRef))union(row.workRef,firstByAuthor.get(row.authorRef));else firstByAuthor.set(row.authorRef,row.workRef);}
 }
 const splitByComponent=new Map();
 for(const row of rows){
  const component=find(row.workRef),prior=splitByComponent.get(component);
  if(prior&&prior!==row.split)throw Error('CROSS_SPLIT_CONTENT_OR_LINEAGE_LEAKAGE');
  splitByComponent.set(component,row.split);
 }
 const sameTextDifferentWork=rows.length-new Set(rows.map(r=>r.normalizedTextSha256)).size;
 return {schema:'ksgt.r916.corpus-provenance.v1',rows:rows.length,leakageGroups:splitByComponent.size,
   normalizedContentDuplicateRows:sameTextDifferentWork,ratings:rows.reduce((a,r)=>a+r.ratingCount,0),
   trainingPerformed:false,permissionIndependentlyVerifiedByCode:false,rawTextIncluded:false,records:rows};
}
function compareRaters(records){
 const out=[];
 for(const x of records){
  checkRecord(x);
  const by=new Map();
  for(const s of x.score||[]){const key=s.dimension+'\0'+s.scaleId;const v=by.get(key)||[];v.push({raterId:s.raterId,value:s.value});by.set(key,v);}
  for(const [key,a] of by){
   const [dimension,scaleId]=key.split('\0');const vals=a.map(z=>z.value),mean=vals.reduce((u,v)=>u+v,0)/vals.length;
   out.push({sourceWorkSha256:sha(x.datasetId+'\0'+x.workId),dimension,scaleId,raterCount:a.length,
      mean:Math.round(mean*1e6)/1e6,spread:Math.max(...vals)-Math.min(...vals),
      caveat:'Descriptive only: score scales must be comparable, rater independence and gold quality not established.'});
  }
 }
 return {schema:'ksgt.r916.rater-receipts.v1',rows:out.length,records:out,rawTextIncluded:false};
}
module.exports={sha,normalize,checkRecord,inventory,compareRaters};
