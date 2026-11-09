'use strict';
/** R9.22 paragraph-aware authored surface correction.
 * This does not infer Korean meaning, generate new language, or score quality.
 * A rule is an exact complete-sentence substitution with a bounded preceding
 * text/window condition; a single ambiguous rule match aborts.
 */
const crypto=require('node:crypto');
const {realize:oldRealize}=require('./r921_boundary_realizer_v01.cjs');
const {ORDER_METHODS,SURFACE_STYLES}=require('./r920_author_surface_composer_v01.cjs');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const end=/[.!?。！？]$/u;
function validateRulebook(t,book){
 if(!book||book.schema!=='ksgt.r922.author-paragraph-rules.v1'||book.sourceWork!==t.sourceWork
   ||!Array.isArray(book.rules))throw Error('RULEBOOK_SOURCE_MISMATCH');
 const n=t.facts.length;
 for(const r of book.rules){
  if(!r||!Number.isInteger(r.current)||r.current<1||r.current>n||
    !SURFACE_STYLES.includes(r.surfaceStyle)||r.authorConfirmed!==true||
    !Array.isArray(r.requiredPrecedingFactIds)||r.requiredPrecedingFactIds.length<1||
    r.requiredPrecedingFactIds.length>3||
    r.requiredPrecedingFactIds.some(x=>!Number.isInteger(x)||x<1||x>n)||
    typeof r.previousTextIncludes!=='string'||!r.previousTextIncludes.trim()||
    typeof r.expectedCurrentSentence!=='string'||!r.expectedCurrentSentence.trim()||
    typeof r.replacement!=='string'||!r.replacement.trim()||
    /[\r\n]/u.test(r.replacement)||r.replacement.length>450||!end.test(r.replacement.trim())||
    r.expectedCurrentSentence===r.replacement)throw Error('INVALID_AUTHOR_CONTEXT_RULE');
 }
 return book.rules;
}
function matches(r,history,candidate,style){
 if(r.current!==Number(candidate.factId.slice(1))||r.surfaceStyle!==style)return false;
 const k=r.requiredPrecedingFactIds.length;
 if(history.length<k)return false;
 const before=history.slice(-k);
 return before.map(s=>Number(s.factId.slice(1))).every((v,i)=>v===r.requiredPrecedingFactIds[i])
   &&before.map(s=>s.selectedSentence).join(' ').includes(r.previousTextIncludes)
   &&candidate.selectedSentence===r.expectedCurrentSentence;
}
function realize(t,book,{orderMethod='READER_FUNCTION',surfaceStyle='READER_DIRECT',mode='CONTEXT_WINDOW'}={}){
 if(!['BASE','CONTEXT_WINDOW'].includes(mode))throw Error('UNKNOWN_PARAGRAPH_MODE');
 const rules=validateRulebook(t,book);
 const base=oldRealize(t,{orderMethod,surfaceStyle,mode:'BOUNDARY_ADAPTED'});
 const history=[],changes=[];
 for(const s of base.segments){
  const applicable=mode==='CONTEXT_WINDOW'?rules.filter(r=>matches(r,history,s,surfaceStyle)):[];
  if(applicable.length>1)throw Error('AMBIGUOUS_PARAGRAPH_RULES');
  const r=applicable[0];
  const out={...s,selectedSentence:r?r.replacement:s.selectedSentence,
    paragraphAdapted:Boolean(r)};
  history.push(out);
  if(r)changes.push({factId:s.factId,previousFactIds:r.requiredPrecedingFactIds.map(n=>'F'+n),
      replacementSha256:sha(r.replacement),previousSpanSha256:sha(history.slice(0,-1).slice(-r.requiredPrecedingFactIds.length).map(x=>x.selectedSentence).join(' '))});
 }
 const text=history.map(s=>s.selectedSentence).join(' ');
 return {schema:'ksgt.g10.p1.r922.paragraph-state.v1',sourceWork:t.sourceWork,sourceSha256:base.sourceSha256,
  rulebookSha256:sha(book),orderMethod,surfaceStyle,mode,order:base.order,text,textSha256:sha(text),
  paragraphChanges:changes,changeCount:changes.length,
  segments:history,modelCalls:0,trainingUpdates:0,semanticFidelity:'NOT_VERIFIED',readerQuality:'NOT_MEASURED',
  limitation:'Last-3-fact approved text-window correction only; no learned discourse or automatic assessment.'};
}
function slate(tasks,books){
 if(!Array.isArray(tasks)||!Array.isArray(books)||tasks.length!==books.length||!tasks.length)
  throw Error('MATCHED_TASK_AND_RULEBOOK_ARRAYS_REQUIRED');
 const seen=new Set(),records=[];
 for(let i=0;i<tasks.length;i++){
  const t=tasks[i],b=books[i];if(seen.has(t.sourceWork))throw Error('DUPLICATE_SOURCE_WORK');
  seen.add(t.sourceWork);validateRulebook(t,b);
  const candidates=[];for(const o of ORDER_METHODS)for(const s of SURFACE_STYLES)
    for(const mode of ['BASE','CONTEXT_WINDOW'])candidates.push(realize(t,b,{orderMethod:o,surfaceStyle:s,mode}));
  records.push({sourceWork:t.sourceWork,sourceSha256:candidates[0].sourceSha256,
    distinctExactTexts:new Set(candidates.map(c=>c.textSha256)).size,
    appliedParagraphChanges:candidates.reduce((n,c)=>n+c.changeCount,0),
    candidates});
 }
 return {schema:'ksgt.g10.p1.r922.paragraph-slate.v1',records,
  attemptedCompositions:records.reduce((s,x)=>s+x.candidates.length,0),
  newModelCalls:0,independentReaderJudgments:0,trainedParameters:0};
}
function safeReceipt(x){
 return {schema:'ksgt.g10.p1.r922.safe-aggregate.v1',attemptedCompositions:x.attemptedCompositions,
  newModelCalls:x.newModelCalls,independentReaderJudgments:x.independentReaderJudgments,
  records:x.records.map(r=>({sourceWork:r.sourceWork,sourceSha256:r.sourceSha256,
    distinctExactTexts:r.distinctExactTexts,appliedParagraphChanges:r.appliedParagraphChanges,
    candidates:r.candidates.map(c=>({orderMethod:c.orderMethod,surfaceStyle:c.surfaceStyle,mode:c.mode,
      textSha256:c.textSha256,changeCount:c.changeCount}))})),rawProseIncluded:false};
}
module.exports={validateRulebook,matches,realize,slate,safeReceipt};
