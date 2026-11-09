'use strict';
/** R9.21 boundary-aware Korean realization. Each replacement is a whole sentence
 * approved for a precise preceding fact and current fact. NO automatic
 * semantic reconstruction, zero-pronoun generator or human preference verdict.
 */
const crypto=require('node:crypto');
const {compose,ORDER_METHODS,SURFACE_STYLES,validateSurface}=require('./r920_author_surface_composer_v01.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const modes=Object.freeze(['BASE','BOUNDARY_ADAPTED']);
const terminal=/[.!?。！？]$/u;
function verifyRules(task){
 validateSurface(task);
 const n=task.facts.length, rules=task.boundaryRealizations||[];
 if(!Array.isArray(rules))throw Error('BAD_BOUNDARY_RULES');
 const seen=new Set();
 for(const r of rules){
  if(!r||!Number.isInteger(r.previous)||!Number.isInteger(r.current)||r.previous<1||r.previous>n||
     r.current<1||r.current>n||r.previous===r.current||!SURFACE_STYLES.includes(r.surfaceStyle)||
     r.authorConfirmed!==true||typeof r.replacement!=='string'||!r.replacement.trim()||
     r.replacement.length>400||/[\r\n]/u.test(r.replacement)||
     !terminal.test(r.replacement.trim()))throw Error('BAD_OR_UNCONFIRMED_BOUNDARY_RULE');
  const k=[r.previous,r.current,r.surfaceStyle].join(':');
  if(seen.has(k))throw Error('DUPLICATE_BOUNDARY_RULE');seen.add(k);
 }
 return rules;
}
function realize(t,{orderMethod='READER_FUNCTION',surfaceStyle='READER_DIRECT',mode='BASE'}={}){
 if(!ORDER_METHODS.includes(orderMethod)||!SURFACE_STYLES.includes(surfaceStyle)||!modes.includes(mode))
   throw Error('UNKNOWN_REALIZATION_MODE_OR_AXIS');
 const rules=verifyRules(t),base=compose(t,{orderMethod,surfaceStyle});
 const adapted=base.segments.map((segment,index)=>{
  const current=Number(segment.factId.slice(1)),previous=index===0?null:base.order[index-1];
  const rule=mode==='BOUNDARY_ADAPTED'&&previous!==null?
    rules.find(r=>r.previous===previous&&r.current===current&&r.surfaceStyle===surfaceStyle):undefined;
  return {...segment,selectedSentence:rule?rule.replacement:segment.authoredSentence,
   realizedFrom:rule?'AUTHOR_APPROVED_ADJACENCY_OVERRIDE':'BASE_AUTHORED_SENTENCE',
   previousFactId:previous===null?null:'F'+previous,overrideApplied:Boolean(rule)};
 });
 const text=adapted.map(s=>s.selectedSentence.trim()).join(' ');
 return {schema:'ksgt.g10.p1.r921.adjacent-conditional-surface.v1',sourceWork:t.sourceWork,
  sourceSha256:base.sourceSha256,surfacePackageSha256:hash({realizations:t.realizations,boundaryRealizations:rules}),
  orderMethod,surfaceStyle,mode,order:base.order,text,textSha256:hash(text),
  segments:adapted,appliedOverrides:adapted.filter(s=>s.overrideApplied).map(s=>({from:s.previousFactId,to:s.factId,style:surfaceStyle})),
  appliedOverrideCount:adapted.filter(s=>s.overrideApplied).length,
  semanticEquivalent:'NOT_VERIFIED',humanPreference:'NOT_MEASURED',
  authorSurfaceInputs:true,newModelCalls:0,parameterUpdates:0,
  caveat:'Only exact fact-ID adjacency with author-written replacement is applied. Linguistic correctness is not proven by this trace.'};
}
function slate(t){
 verifyRules(t);
 const candidates=[];
 for(const orderMethod of ORDER_METHODS)for(const surfaceStyle of SURFACE_STYLES)
  for(const mode of modes)candidates.push(realize(t,{orderMethod,surfaceStyle,mode}));
 const distinctExactTexts=new Set(candidates.map(x=>x.textSha256)).size;
 return {schema:'ksgt.g10.p1.r921.3x3x2-boundary-slate.v1',sourceWork:t.sourceWork,
  candidates,uniqueExactTexts:distinctExactTexts,overrideApplications:candidates.reduce((s,x)=>s+x.appliedOverrideCount,0),
  noAutomaticFidelityJudgment:true,newModelCalls:0,qualityRatings:0};
}
function safeReceipt(tasks){
 if(!Array.isArray(tasks)||!tasks.length)throw Error('TASKS_REQUIRED');
 const group=new Set(),rows=[];
 for(const t of tasks){
  if(group.has(t.sourceWork))throw Error('DUPLICATE_SOURCE_WORK');group.add(t.sourceWork);
  const s=slate(t);
  rows.push({sourceWork:t.sourceWork,uniqueExactTexts:s.uniqueExactTexts,
    appliedOverrides:s.overrideApplications,
    combinations:s.candidates.map(x=>({orderMethod:x.orderMethod,surfaceStyle:x.surfaceStyle,mode:x.mode,
       textSha256:x.textSha256,overrideCount:x.appliedOverrideCount}))});
 }
 return {schema:'ksgt.g10.p1.r921.safe-receipt.v1',sourceWorks:rows.length,
   attemptedCompositions:rows.length*ORDER_METHODS.length*SURFACE_STYLES.length*modes.length,
   rows,rawKoreanProseExcluded:true,modelCalls:0,readerRatings:0,trainingUpdates:0};
}
module.exports={modes,verifyRules,realize,slate,safeReceipt};
