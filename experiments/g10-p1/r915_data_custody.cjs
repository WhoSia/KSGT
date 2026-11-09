'use strict';
/** Local-only corpus admission: explicit rights assertion and source-work disjoint splits.
 * The assertion is NOT a substitute for verifying actual legal permission. */
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function admission(rec){
 if(!rec||typeof rec!=='object')throw Error('RECORD_REQUIRED');
 for(const k of ['datasetId','sourceWork','genre','split','text','rightsReceipt'])if(typeof rec[k]!=='string'||!rec[k])throw Error('INVALID_'+k);
 if(!['development','calibration','heldout'].includes(rec.split))throw Error('INVALID_SPLIT');
 if(!['AUTHORIZED_RESEARCH','AUTHORIZED_TRAINING'].includes(rec.rightsReceipt))throw Error('RIGHTS_NOT_VERIFIED');
 if(rec.useForTraining && rec.rightsReceipt!=='AUTHORIZED_TRAINING')throw Error('TRAINING_NOT_LICENSED');
 return {datasetId:rec.datasetId,sourceWorkHash:sha(rec.datasetId+'\u0000'+rec.sourceWork),split:rec.split,
  genre:rec.genre,textSha256:sha(rec.text),chars:[...rec.text].length,
  useForTraining:!!rec.useForTraining,rightsReceipt:rec.rightsReceipt};
}
function inventory(records){
 if(!Array.isArray(records))throw Error('ARRAY_REQUIRED');
 const units=new Map(),out=[];
 for(const rec of records){const row=admission(rec),seen=units.get(row.sourceWorkHash);
  if(seen&&seen!==row.split)throw Error('CROSS_SPLIT_SOURCE_WORK_LEAKAGE');
  units.set(row.sourceWorkHash,row.split);out.push(row);}
 return {schema:'ksgt.r915.corpus-inventory.v1',records:out.length,sourceWorks:units.size,rows:out,rawTextIncluded:false,
  generatedCorpusGold:false,trainingPerformed:false};
}
function importNdjson(localFile,manifestFile){
 const rows=fs.readFileSync(localFile,'utf8').split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x));
 const data=inventory(rows);const out=path.resolve(manifestFile);
 if(path.resolve(localFile)===out)throw Error('DO_NOT_OVERWRITE_SOURCE');
 fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return data;
}
module.exports={admission,inventory,importNdjson};
if(require.main===module){if(process.argv.length!==4)throw Error('USAGE_LOCAL_NDJSON_OUTPUT_MANIFEST');
 const r=importNdjson(process.argv[2],process.argv[3]);console.log(JSON.stringify({records:r.records,sourceWorks:r.sourceWorks,rawTextIncluded:false}));}