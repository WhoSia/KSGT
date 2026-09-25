import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';
const p=process.argv[2]||'';const out=process.argv[3]||'experiments/g9-p36-r10/final/nikl_intake_status.json';
let r={phase:'G9-P36-R10',source:'NIKL Zero Anaphora Corpus 2020/2025',state:'WAITING_FOR_OFFICIAL_BYTES',bytes_present:false,scoring_authorized:false};
if(p&&fs.existsSync(p)){const b=fs.readFileSync(p);r={...r,state:'BYTES_PRESENT_INTAKE_ONLY',bytes_present:true,sha256:crypto.createHash('sha256').update(b).digest('hex'),size:b.length,filename:path.basename(p),scoring_authorized:false,next:'ARCHIVE_INVENTORY_AND_SCHEMA_CENSUS_BEFORE_ANY_ROW_SCORING'}}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r,null,2));
