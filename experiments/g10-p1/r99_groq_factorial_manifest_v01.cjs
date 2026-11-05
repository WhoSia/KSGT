'use strict';
/** R9.9 preregistered factorial execution manifest. No model calls or output access. */
const crypto=require('node:crypto');
const DRAFTS=Object.freeze(['CLEAN_SOURCE_ONLY','SOURCE_WITH_PROTECTED_CONSTRAINTS']);
const REVISERS=Object.freeze(['GENERIC_DRAFT_REVISE','KSGT_SELECTIVE_ACCOUNTABILITY']);
function digest(x){return crypto.createHash('sha256').update(x).digest('hex');}
function manifest(works,{seed='0',replicates=2}={}){
 if(!Array.isArray(works)||!works.length||!Number.isInteger(replicates)||replicates<1||replicates>20)throw Error('INVALID_DESIGN');
 const seen=new Set(),out=[];
 for(const w of works){
  if(!w||typeof w.workId!=='string'||!w.workId||!/^[a-f0-9]{64}$/.test(w.sourceSha256||'')||!['development','heldout'].includes(w.split)||seen.has(w.workId))throw Error('INVALID_WORK');seen.add(w.workId);
  for(let repeat=0;repeat<replicates;repeat++){
   const groupId=digest([seed,w.workId,repeat].join(':'));
   out.push({workId:w.workId,split:w.split,replicate:repeat,groupId,step:'STRONG_DIRECT',draftTreatment:null,revision:null,sourceSha256:w.sourceSha256});
   for(const d of DRAFTS){
    out.push({workId:w.workId,split:w.split,replicate:repeat,groupId,step:'BUILD_SHARED_DRAFT',draftTreatment:d,revision:null,sourceSha256:w.sourceSha256});
    for(const r of REVISERS)out.push({workId:w.workId,split:w.split,replicate:repeat,groupId,step:'REVISE_SHARED_DRAFT',draftTreatment:d,revision:r,sourceSha256:w.sourceSha256});
   }
  }
 }
 const cellsPerReplicate=1+DRAFTS.length*(1+REVISERS.length);
 return {schema:'ksgt.r9.9.groq-factorial-manifest.v01',sourceWorks:works.length,replicates,cellsPerReplicate,providerCallsPlanned:out.length,rows:out,actualProviderCalls:0,actualReaderRatings:0,qualitySuperiorityEstablished:false,rawTextIncluded:false};
}
module.exports={DRAFTS,REVISERS,manifest};
