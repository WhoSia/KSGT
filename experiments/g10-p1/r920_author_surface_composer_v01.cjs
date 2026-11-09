'use strict';
/** R9.20 actual Korean surface composition from *author-approved* complete sentences.
 * Not a grammar model, not a finetuned LLM, not a semantic/fidelity judge.
 * Use a full 3x3 order x surface factorial: keep effects independently identifiable.
 */
const crypto=require('node:crypto');
const {select}=require('./r919_source_bounded_plan_slate_v01.cjs');
const {source}=require('./r915_reader_first_harness.cjs');
const ORDER_METHODS=Object.freeze(['TEMPORAL_STABLE','READER_FUNCTION','ENTITY_CONTINUITY']);
const SURFACE_STYLES=Object.freeze(['NEUTRAL','READER_DIRECT','RHYTHM_VARIED']);
const digest=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const TERMINAL=/[.!?。！？]$/u;
function validateSurface(t){
 const n=t.facts?.length;
 if(!Number.isInteger(n)||!Array.isArray(t.realizations)||t.realizations.length!==n)
  throw Error('ONE_AUTHORED_REALIZATION_PER_FACT_REQUIRED');
 for(let i=0;i<n;i++){
  const r=t.realizations[i];
  if(!r||r.factId!=='F'+(i+1)||!r.authorConfirmed)throw Error('AUTHOR_CONFIRMATION_REQUIRED_F'+(i+1));
  for(const style of SURFACE_STYLES){
   const s=r.forms?.[style];
   if(typeof s!=='string'||!s.trim()||s.length>400||/[\r\n]/u.test(s)||!TERMINAL.test(s.trim()))
    throw Error('BAD_AUTHORED_SENTENCE_'+style+'_F'+(i+1));
  }
 }
 return t;
}
function compose(t,{orderMethod='TEMPORAL_STABLE',surfaceStyle='NEUTRAL'}={}){
 validateSurface(t);
 if(!ORDER_METHODS.includes(orderMethod)||!SURFACE_STYLES.includes(surfaceStyle))throw Error('UNKNOWN_COMPOSITION_AXIS');
 const plan=select(t,orderMethod);
 const sourceSha256=digest(source(t));
 if(plan.sourceSha256!==sourceSha256)throw Error('SOURCE_SHA_DRIFT');
 const ordered=plan.order.map(i=>({factId:'F'+i,sourceFact:t.facts[i-1],
  authoredSentence:t.realizations[i-1].forms[surfaceStyle]}));
 const text=ordered.map(x=>x.authoredSentence.trim()).join(' ');
 return {schema:'ksgt.g10.p1.r920.author-surface-composition.v1',sourceWork:t.sourceWork,
  orderMethod,surfaceStyle,sourceSha256,surfacePackageSha256:digest(t.realizations),
  order:plan.order,text,textSha256:digest(text),characters:[...text].length,
  exactFactIds:ordered.map(x=>x.factId),segments:ordered,
  candidateOrigin:'AUTHOR_PREWRITTEN_SENTENCES_COMPOSED_ALGORITHMICALLY',
  naturalnessGrade:null,fidelityGrade:null,modelCalls:0,trainingSteps:0,
  limitation:'Author-confirmed is an input assertion; semantic equivalence and text quality are NOT established by the program.'};
}
function slate(t){
 validateSurface(t);
 const all=[];
 for(const o of ORDER_METHODS)for(const s of SURFACE_STYLES)all.push(compose(t,{orderMethod:o,surfaceStyle:s}));
 const distinctOrders=new Set(all.map(x=>x.order.join(','))).size;
 const distinctTexts=new Set(all.map(x=>x.textSha256)).size;
 return {schema:'ksgt.g10.p1.r920.3x3-surface-factorial.v1',sourceWork:t.sourceWork,
  orderMethods:[...ORDER_METHODS],surfaceStyles:[...SURFACE_STYLES],candidates:all,
  uniqueOrders:distinctOrders,uniqueExactTexts:distinctTexts,
  distinctTextHashIsNotLiteraryDiversity:true,
  readerPreference:'NOT_MEASURED',actualModelCalls:0,actualTrainingUpdates:0};
}
function safeManifest(tasks){
 if(!Array.isArray(tasks)||!tasks.length)throw Error('TASKS_REQUIRED');
 const works=new Set(),out=[];
 for(const task of tasks){
  if(works.has(task.sourceWork))throw Error('DUPLICATE_SOURCE_WORK');
  works.add(task.sourceWork);
  const s=slate(task);
  out.push({sourceWork:s.sourceWork,sourceSha256:s.candidates[0].sourceSha256,
    surfacePackageSha256:s.candidates[0].surfacePackageSha256,uniqueOrders:s.uniqueOrders,
    uniqueExactTexts:s.uniqueExactTexts,candidates:s.candidates.map(c=>({orderMethod:c.orderMethod,
      surfaceStyle:c.surfaceStyle,order:c.order,textSha256:c.textSha256,characters:c.characters}))});
 }
 return {schema:'ksgt.g10.p1.r920.safe-manifest.v1',works:out.length,
  intendedCandidates:out.length*ORDER_METHODS.length*SURFACE_STYLES.length,results:out,
  humanAuthoredSurfaceExamples:true,rawTextExcluded:true,modelCalls:0,trainingUpdates:0,
  conclusion:'NO_READER_QUALITY_EVALUATION'};
}
module.exports={ORDER_METHODS,SURFACE_STYLES,validateSurface,compose,slate,safeManifest};
