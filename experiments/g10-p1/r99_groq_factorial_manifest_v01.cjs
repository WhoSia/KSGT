'use strict';
/** R9.9 factorial preregistration. Counterbalanced per-replicate staged calls, never live API. */
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
   const groupId=digest([seed,w.workId,repeat].join(':')),phase=Number.parseInt(digest([seed,w.workId].join(':')).slice(0,1),16)%2;
   const orderedDrafts=repeat%2===phase?[...DRAFTS]:[...DRAFTS].reverse();
   const row=(step,draftTreatment,revision)=>({workId:w.workId,split:w.split,replicate:repeat,groupId,step,draftTreatment,revision,sourceSha256:w.sourceSha256});
   out.push(row('STRONG_DIRECT',null,null));
   for(let i=0;i<orderedDrafts.length;i++){
    const d=orderedDrafts[i];out.push(row('BUILD_SHARED_DRAFT',d,null));
    const orderedRevisers=(repeat+DRAFTS.indexOf(d))%2===phase?[...REVISERS]:[...REVISERS].reverse();
    for(const r of orderedRevisers)out.push(row('REVISE_SHARED_DRAFT',d,r));
   }
  }
 }
 return {schema:'ksgt.r9.9.groq-factorial-manifest.v02',sourceWorks:works.length,replicates,cellsPerReplicate:7,providerCallsPlanned:out.length,rows:out,actualProviderCalls:0,actualReaderRatings:0,qualitySuperiorityEstablished:false,rawTextIncluded:false,executionOrder:'COUNTERBALANCED_STAGED_DEPENDENCIES'};
}
module.exports={DRAFTS,REVISERS,manifest};
