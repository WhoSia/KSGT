"use strict";const test=require("node:test"),assert=require("node:assert/strict");
const {audit}=require("./cost_audit_v01.cjs");
const arms=require("./paired_runner_v02.cjs").ARMS;
const fake={schema:"ksgt.g10.p1.paired-generation.v02",status:"MODEL_REQUESTS_ATTEMPTED",model:"MOCK",
 rows:arms.map((arm,i)=>({arm,sourceWork:"S",outcome:i? "GENERATED":"FAILED",
  usage:i?{prompt_tokens:100+i,completion_tokens:50}:null,latencyMs:12}))};
test("missing provider usage never gets silently billed at zero",()=>{
 const r=audit(fake,{promptUsdPerMillion:1,completionUsdPerMillion:2});
 assert.equal(r.arms[0].knownUsageRows,0);
 assert.equal(r.arms[0].unknownOrFailedUsageRows,1);
 assert.equal(r.arms[0].completeCosts,false);
 assert.equal(r.arms[1].knownUsageRows,1);
});
test("explicit rate produces reproducible amounts without fabricated pricing",()=>{
 const r=audit(fake,{promptUsdPerMillion:1,completionUsdPerMillion:2});
 assert.equal(r.arms[1].measuredUsd,0.000201);
 assert.equal(r.rateAuthority,"USER_SUPPLIED");
});
test("dry runs cannot masquerade as cost evidence",()=>{
 assert.throws(()=>audit({...fake,status:"DRY_RUN_NO_MODEL_CALLS"},{promptUsdPerMillion:1,completionUsdPerMillion:2}),/LIVE_REPORT/);
 assert.throws(()=>audit(fake,null),/EXPLICIT_NONNEGATIVE/);
});
