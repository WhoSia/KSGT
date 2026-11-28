'use strict';
const assert=require('node:assert/strict');
const {screen,hash,cp}=require('./r5k_source_span_edit.cjs');
const s='준서는 유리창을 바라보며 유리창에는 손을 대지 않았다.';
const range=(str,needle)=>{const i=cp(str).join('').indexOf(needle);assert(i>=0);return {startCp:i,endCp:i+cp(needle).length,kind:'POLARITY',sha256:hash(needle)};};
const first=s.indexOf('유리창'),second=s.indexOf('유리창',first+1);
const base={source:s,sourceSha256:hash(s),proposal:{operation:'DELETE_REPEATED_NOMINAL',startCp:second,endCp:second+3,expected:'유리창',replacement:''},
  authority:{sourceFactIds:['S4','S5'],actorId:'준서',objectId:'유리창',mentionText:'유리창',exactSourceTrace:true,
  protectedSpans:[range(s,'않았다')]}};
const alter=patch=>({...base,...patch});
assert.equal(screen(base).status,'STRUCTURAL_CANDIDATE_ONLY');
assert.equal(screen(base).semanticStatus,'UNVERIFIED');
assert.equal(screen(base).naturalnessStatus,'UNVERIFIED');
assert.equal(screen(alter({sourceSha256:'0'.repeat(64)})).reason,'SOURCE_DIGEST_MISMATCH');
assert.equal(screen(alter({proposal:{...base.proposal,startCp:0}})).reason,'STALE_SPAN');
assert.equal(screen(alter({proposal:{...base.proposal,startCp:0,endCp:99}})).reason,'INVALID_SPAN');
assert.equal(screen(alter({proposal:{...base.proposal,replacement:'손을 댔다'}})).reason,'UNSUPPORTED_OPERATION');
assert.equal(screen(alter({proposal:{...base.proposal,expected:'않았다',startCp:s.indexOf('않았다'),endCp:s.indexOf('않았다')+3}})).reason,'PROTECTED_SPAN_OVERLAP');
assert.equal(screen(alter({authority:{...base.authority,protectedSpans:[]}})).reason,'MISSING_SOURCE_AUTHORITY');
assert.equal(screen(alter({authority:{...base.authority,sourceFactIds:[]}})).reason,'MISSING_SOURCE_AUTHORITY');
assert.equal(screen(alter({authority:{...base.authority,exactSourceTrace:false}})).reason,'MISSING_EXACT_MENTION_TRACE');
assert.equal(screen(alter({authority:{...base.authority,protectedSpans:[{...base.authority.protectedSpans[0],sha256:'wrong'}]}})).reason,'INVALID_PROTECTED_SPAN');
assert.equal(screen(alter({source:'유리창이 깨졌다.',sourceSha256:hash('유리창이 깨졌다.'),proposal:{operation:'DELETE_REPEATED_NOMINAL',startCp:0,endCp:3,expected:'유리창',replacement:''},authority:{...base.authority,protectedSpans:[{kind:'POLARITY',startCp:5,endCp:8,sha256:hash('깨졌다')}]}})).reason,'NO_OTHER_SURFACE_MENTION');
const astral='😀가나다😀가';const units=cp(astral);const example={source:astral,sourceSha256:hash(astral),proposal:{operation:'DELETE_REPEATED_NOMINAL',startCp:4,endCp:5,expected:'😀',replacement:''},authority:{sourceFactIds:['A'],actorId:'x',objectId:'o',mentionText:'😀',exactSourceTrace:true,protectedSpans:[{kind:'POLARITY',startCp:1,endCp:2,sha256:hash('가')}]}};
assert.equal(units.length,6);assert.equal(screen(example).status,'STRUCTURAL_CANDIDATE_ONLY');
assert.equal(screen(example).candidate,'😀가나다가');
assert.equal(screen({}).reason,'MALFORMED');
console.log('R5k structural screen: 17 assertions PASS; no semantic or naturalness certification.');
