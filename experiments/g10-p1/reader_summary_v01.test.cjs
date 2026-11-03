"use strict";
const test=require("node:test");const assert=require("node:assert/strict");
const {analyze}=require("./reader_summary_v01.cjs");
const pkt={schema:"ksgt.g10.p1.blind-packet.v01",status:"UNRATED_REAL_OUTPUTS",
 rows:[{sourceTask:"X",blindId:"X-C1"},{sourceTask:"X",blindId:"X-C2"}]};
const key={schema:"ksgt.g10.p1.private-blind-key.v01",
 rows:[{sourceTask:"X",sourceWork:"S",blindId:"X-C1",arm:"DIRECT"},
       {sourceTask:"X",sourceWork:"S",blindId:"X-C2",arm:"RICH_PROMPT"}]};
const ratings={schema:"ksgt.g10.p1.independent-reader-ratings.v01",
 rows:[{blindId:"X-C1",reviewerId:"R1",independenceAttested:true,protocolId:"TEST",preference:2,coherence:3},
       {blindId:"X-C2",reviewerId:"R1",independenceAttested:true,protocolId:"TEST",preference:4,coherence:4}]};
test("self-attested mock ratings summarize source-work metrics without claiming proven independence",()=>{
 const r=analyze(pkt,key,ratings);assert.equal(r.sourceWorkCount,1);assert.equal(r.uniqueReviewerCount,1);
 assert.equal(r.records[0].arms[0].meanPreference,2);
 assert.ok(r.status.startsWith("SELF_ATTESTED"));
});
test("no ratings or partial assessment cannot become quality evidence",()=>{
 assert.throws(()=>analyze(pkt,key,{...ratings,rows:[]}),/NO_REAL/);
 assert.throws(()=>analyze(pkt,key,{...ratings,rows:ratings.rows.slice(0,1)}),/INCOMPLETE/);
});
test("attestation, fabricated scores, repeated judgments rejected",()=>{
 assert.throws(()=>analyze(pkt,key,{...ratings,rows:ratings.rows.map(x=>({...x,independenceAttested:false}))}),/ATTESTATION/);
 assert.throws(()=>analyze(pkt,key,{...ratings,rows:ratings.rows.map(x=>({...x,preference:9}))}),/INVALID_PREFERENCE/);
 assert.throws(()=>analyze(pkt,key,{...ratings,rows:[ratings.rows[0],ratings.rows[0],ratings.rows[1]]}),/DUPLICATE_REVIEW/);
});
