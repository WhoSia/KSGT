'use strict';
const test=require('node:test'),a=require('node:assert/strict'),m=require('./r916_preference_pairs_v01.cjs');
const pair=()=>({datasetId:'locally-authorized',sourceWork:'essay1',prompt:'같은 원천',candidateA:'첫 글',candidateB:'둘째 글',
 permission:'RESEARCH_ONLY',permissionEvidenceId:'manual-reviewed-license',ratings:[{raterId:'reader-1',axis:'naturalness',choice:'A'}]});
test('single reader cannot be training gold with default minimum two',()=>{const p=pair();p.permission='TRAINING_ALLOWED';const x=m.exportTrainingPairs([p]);a.equal(x.stats.accepted,0);a.equal(x.pairs.length,0);});
test('two independent agreeing readers produce a locally held contrast pair',()=>{const p=pair();p.permission='TRAINING_ALLOWED';p.ratings.push({raterId:'reader-2',axis:'naturalness',choice:'A'});const x=m.exportTrainingPairs([p]);a.equal(x.stats.accepted,1);a.equal(x.pairs[0].chosen,'첫 글');a.equal(x.trainingPerformed,false);});
test('opposed readers never create a pair',()=>{const p=pair();p.permission='TRAINING_ALLOWED';p.ratings.push({raterId:'reader-2',axis:'naturalness',choice:'B'});a.equal(m.exportTrainingPairs([p]).stats.accepted,0);});
test('other dimension does not masquerade as naturalness',()=>{const p=pair();p.permission='TRAINING_ALLOWED';p.ratings.push({raterId:'reader-2',axis:'coherence',choice:'A'});a.equal(m.exportTrainingPairs([p]).stats.accepted,0);});
test('research only does not export raw outputs',()=>{const x=m.exportTrainingPairs([pair()]);a.equal(x.pairs.length,0);a.equal(JSON.stringify(x).includes('첫 글'),false);});
test('same rater cannot vote twice per axis',()=>{const p=pair();p.ratings.push({...p.ratings[0]});a.throws(()=>m.verify(p),/DUPLICATE_RATING/);});
test('ties and abstentions do not count toward decisive reader requirement',()=>{const p=pair();p.permission='TRAINING_ALLOWED';p.ratings.push({raterId:'reader-2',axis:'naturalness',choice:'TIE'});a.equal(m.exportTrainingPairs([p]).stats.accepted,0);});
test('identical candidates are not a preference',()=>{const p=pair();p.candidateB=p.candidateA;a.throws(()=>m.verify(p),/IDENTICAL_CANDIDATES/);});
test('same prompt copied as a different source work is blocked',()=>{const x=pair(),y=pair();y.sourceWork='essay2';y.candidateA='다른 글';a.throws(()=>m.exportTrainingPairs([x,y]),/SHARED_PROMPT/);});
test('unsupported preference axis rejected',()=>a.throws(()=>m.preference(pair(),'beauty'),/INVALID_SELECTION/));
