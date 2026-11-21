'use strict';
const assert=require('node:assert/strict');
const {screen,hash}=require('./r5k_source_span_edit.cjs');
// A counterexample to conflating same surface form with referent identity.
// A and B are *different* windows; the caller dishonestly assigns both the same objectId.
// No automatic source-grounded coreference, trust root or human reading is available.
const source='서쪽 유리창은 열려 있었다. 동쪽 유리창은 잠겨 있었다.';
const phrase='유리창',startCp=source.lastIndexOf(phrase);
const authority={sourceFactIds:['WEST','EAST'],actorId:'NARRATOR',objectId:'WINDOW_1',
  mentionText:phrase,exactSourceTrace:true,
  protectedSpans:[{kind:'MODALITY',startCp:source.indexOf('잠겨 있었다'),endCp:source.indexOf('잠겨 있었다')+'잠겨 있었다'.length,
    sha256:hash('잠겨 있었다')}]};
const result=screen({source,sourceSha256:hash(source),
  proposal:{operation:'DELETE_REPEATED_NOMINAL',startCp,endCp:startCp+phrase.length,expected:phrase,replacement:''},
  authority});
assert.equal(result.status,'STRUCTURAL_CANDIDATE_ONLY');
assert.equal(result.semanticStatus,'UNVERIFIED');
console.log(JSON.stringify({case:'identical_noun_distinct_referents_forged_authority',
  observed:result.status,semanticStatus:result.semanticStatus,
  interpretation:'a structural candidate cannot establish coreference or approve a final edit'}));
