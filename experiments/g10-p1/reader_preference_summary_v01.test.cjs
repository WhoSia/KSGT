"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {summarize}=require("./reader_preference_summary_v01.cjs");
const key={schema:"ksgt.g10.p1.blind-pair-mapping-v01",pairs:[
 {blindId:"B1",model:"M1",sourceWork:"W1",A_arm:"ROLE_AWARE_PLAN_V05",B_arm:"RICH_CHAR_MATCH_V05"},
 {blindId:"B2",model:"M2",sourceWork:"W1",A_arm:"RICH_CHAR_MATCH_V05",B_arm:"ROLE_AWARE_PLAN_V05"}]};
const votes={schema:"ksgt.g10.p1.native-reader-votes.v01",votes:[
 {blindId:"B1",readerId:"R01",choice:"A",independentHumanReader:true},
 {blindId:"B2",readerId:"R01",choice:"B",independentHumanReader:true}]};
test("real-vote input is descriptive per model and never independently verified",()=>{
 const r=summarize(key,votes);
 assert.equal(r.sourceWorkClusters,1);assert.equal(r.modelSummaries.length,2);
 assert.ok(r.modelSummaries.every(x=>x.descriptiveMeanKsgtPreference===1));
 assert.ok(r.status.includes("DESCRIPTIVE_ONLY"));
});
test("missing human votes not silently converted to KSGT wins",()=>{
 assert.throws(()=>summarize(key,{...votes,votes:[]}),/REAL_READER_VOTES_REQUIRED/);
 assert.throws(()=>summarize(key,{...votes,votes:votes.votes.slice(0,1)}),/INCOMPLETE_PAIR_COVERAGE/);
});
test("duplicate, unidentified or self-assigned ratings rejected",()=>{
 assert.throws(()=>summarize(key,{...votes,votes:[votes.votes[0],votes.votes[0],votes.votes[1]]}),/DUPLICATE_VOTE/);
 assert.throws(()=>summarize(key,{...votes,votes:votes.votes.map(x=>({...x,independentHumanReader:false}))}),/ATTESTATION/);
 assert.throws(()=>summarize(key,{...votes,votes:votes.votes.map(x=>({...x,choice:"KSGT"}))}),/INVALID_VOTE/);
});
