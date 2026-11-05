"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {preflight,validateManifest,validateBallots,summarize}=require("./r4_evaluation_gate_v01.cjs");
const m={schema:"ksgt.g10.p1.r4.manifest.v01",sourceDisjointVerified:false,works:[
 {id:"NOTICE_A",eligibleForOrderChange:true,provenance:"DEVELOPMENT"},
 {id:"SCIENCE_A",eligibleForOrderChange:false,provenance:"DEVELOPMENT"},
 {id:"SCENE_A",eligibleForOrderChange:false,provenance:"DEVELOPMENT"}]};
const vote={readerId:"r1",workId:"NOTICE_A",left:"STRONG_DIRECT",right:"GRAPH_PLAN",choice:"RIGHT",blinded:true,independentReader:true};
test("all source works included in denominator",()=>{const a=preflight(m);assert.equal(a.sourceWorks,3);assert.equal(a.eligibleWorks,1);assert.equal(a.nonInterventionWorks,2);assert.equal(a.eligibilityFraction,1/3)});
test("no synthetic output becomes provider generation or reader vote",()=>{const a=preflight(m);assert.equal(a.providerGenerationsObserved,0);assert.equal(a.independentReaderObservations,0)});
test("unverified external source disjointness rejected",()=>assert.throws(()=>validateManifest({...m,works:[{id:"EXT",eligibleForOrderChange:true,provenance:"FROZEN_EXTERNAL"}]}),/EXTERNAL_DISJOINT_NOT_VERIFIED/));
test("duplicate source works rejected",()=>assert.throws(()=>preflight({...m,works:[m.works[0],m.works[0]]}),/INVALID_WORK/));
test("empty ballot does not create ratings",()=>{const s=summarize(m,[]);assert.equal(s.ballots,0);assert.equal(s.ratedSourceWorks,0);assert.equal(s.causalEffectIdentified,false)});
test("mock ballot stays descriptive and clustered by source work",()=>{const s=summarize(m,[vote,{...vote,readerId:"r2",choice:"TIE"}]);assert.equal(s.ballots,2);assert.equal(s.ratedSourceWorks,1);assert.equal(s.workClusters[0].graphWins,1);assert.equal(s.workClusters[0].ties,1)});
test("duplicate same-reader same-source same-pair disallowed even if A/B swapped",()=>assert.throws(()=>validateBallots(m,[vote,{...vote,left:"GRAPH_PLAN",right:"STRONG_DIRECT",choice:"LEFT"}]),/DUPLICATE_READER_SOURCE_PAIR/));
test("unblinded and artificial reader votes rejected",()=>{assert.throws(()=>validateBallots(m,[{...vote,blinded:false}]),/UNQUALIFIED_BALLOT/);assert.throws(()=>validateBallots(m,[{...vote,independentReader:false}]),/UNQUALIFIED_BALLOT/)});
test("unknown work or unknown arm rejected",()=>{assert.throws(()=>validateBallots(m,[{...vote,workId:"SECRET"}]),/UNQUALIFIED_BALLOT/);assert.throws(()=>validateBallots(m,[{...vote,left:"FAKE_ARM"}]),/UNQUALIFIED_BALLOT/)});
test("ties do not create wins",()=>{const s=summarize(m,[{...vote,choice:"TIE"}]);assert.equal(s.workClusters[0].graphWins,0);assert.equal(s.workClusters[0].graphLosses,0);assert.equal(s.workClusters[0].ties,1)});
