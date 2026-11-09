'use strict';
/** R9.16 preference-record gate for future DPO/ORPO workflows.
 * Does NOT train a model, invent preferences, or assume naturalness from metadata.
 */
const {sha}=require('./r916_corpus_provenance_v01.cjs');
const LABELS=new Set(['A','B','TIE','ABSTAIN']);
const AXES=new Set(['naturalness','information_flow','reader_fit','fidelity','rhythm','coherence']);
function verify(x){
 if(!x||typeof x!=='object')throw Error('PAIR_REQUIRED');
 for(const f of ['datasetId','sourceWork','candidateA','candidateB','prompt','permissionEvidenceId']){
  if(typeof x[f]!=='string'||!x[f].trim())throw Error('BAD_'+f);
 }
 if(x.candidateA===x.candidateB)throw Error('IDENTICAL_CANDIDATES');
 if(x.permission!=='TRAINING_ALLOWED'&&x.permission!=='RESEARCH_ONLY')throw Error('PERMISSION_NOT_RECORDED');
 if(!Array.isArray(x.ratings)||!x.ratings.length)throw Error('ACTUAL_RATINGS_REQUIRED');
 const raters=new Set();
 for(const r of x.ratings){
  if(!r||typeof r.raterId!=='string'||!r.raterId||!AXES.has(r.axis)||!LABELS.has(r.choice))throw Error('INVALID_READER_RATING');
  const id=r.raterId+'\0'+r.axis;if(raters.has(id))throw Error('DUPLICATE_RATING');raters.add(id);
 }
 return x;
}
function preference(x,axis,{minIndependentRaters=2}={}){
 verify(x);
 if(!AXES.has(axis)||!Number.isInteger(minIndependentRaters)||minIndependentRaters<1)throw Error('INVALID_SELECTION');
 const ratings=x.ratings.filter(r=>r.axis===axis);
 const yes=ratings.filter(r=>r.choice==='A'||r.choice==='B');
 const a=yes.filter(r=>r.choice==='A').length,b=yes.filter(r=>r.choice==='B').length;
 const consensus=a>b?'A':b>a?'B':null;
 return {axis,ratings:ratings.length,decisive:yes.length,counts:{A:a,B:b,tie:ratings.filter(r=>r.choice==='TIE').length,abstain:ratings.filter(r=>r.choice==='ABSTAIN').length},
  selected:yes.length>=minIndependentRaters&&consensus&&(consensus==='A'?a:b)===yes.length?consensus:null,
  status:yes.length<minIndependentRaters?'INSUFFICIENT_READERS':!consensus?'NO_MAJORITY':Math.min(a,b)>0?'CONTESTED':'CONSENSUS_OR_TIE_NOT_TRAINABLE'};
}
function exportTrainingPairs(items,{axis='naturalness',minIndependentRaters=2}={}){
 if(!Array.isArray(items))throw Error('PAIRS_ARRAY_REQUIRED');
 const out=[],stats={seen:0,accepted:0,notTrainingLicensed:0,notConsensus:0};
 const promptAcross=new Map();
 for(const raw of items){
  const x=verify(raw);stats.seen++;
  const group=sha(x.datasetId+'\0'+x.sourceWork);
  const promptHash=sha(x.prompt);
  const previous=promptAcross.get(promptHash);
  if(previous&&previous!==group)throw Error('CROSS_WORK_SHARED_PROMPT_NEEDS_REVIEW');
  promptAcross.set(promptHash,group);
  if(x.permission!=='TRAINING_ALLOWED'){stats.notTrainingLicensed++;continue;}
  const p=preference(x,axis,{minIndependentRaters});
  if(!p.selected){stats.notConsensus++;continue;}
  out.push({sourceGroupSha256:group,prompt:x.prompt,chosen:p.selected==='A'?x.candidateA:x.candidateB,
   rejected:p.selected==='A'?x.candidateB:x.candidateA,axis,readerCount:p.decisive,
   permissionEvidenceId:x.permissionEvidenceId,
   caveat:'Development/training candidates only. No license independently verified here, no population quality gold, no training performed.'});
  stats.accepted++;
 }
 return {schema:'ksgt.r916.preferences-for-local-training.v1',stats,trainingPerformed:false,
   warning:'Contains prose: keep local/private, verify rights against primary terms. Never put this data in public Git.',
   pairs:out};
}
module.exports={verify,preference,exportTrainingPairs};
