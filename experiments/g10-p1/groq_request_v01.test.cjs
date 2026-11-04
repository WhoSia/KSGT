"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {validate,outputs}=require("./groq_request_v01.cjs");
const request={schema:"ksgt.g10.p1.groq-commit-request.v01",requestId:"PILOT_20261104_01",
 model:"openai/gpt-oss-120b",cohort:"experiments/g10-p1/fixtures/groq_smoke_one_source.json",
 maxTokens:850,temperature:0.2,seed:"pilot-20261104-001"};
test("approved synthetic one-work model request exposes no private keys",()=>{
 assert.equal(validate(request).model,"openai/gpt-oss-120b");
 const out=outputs(request);assert.ok(out.includes("model=openai/gpt-oss-120b"));
 assert.ok(!out.includes("KEY"));assert.ok(!out.includes("secret"));
});
test("rejects arbitrary source paths and injected outputs",()=>{
 assert.throws(()=>validate({...request,cohort:"private/other.json"}),/ONLY_PUBLIC_AUTHOR_SYNTHETIC/);
 assert.throws(()=>validate({...request,model:"openai/gpt-oss-120b\nevil=true"}),/UNAPPROVED_MODEL/);
 assert.throws(()=>validate({...request,requestId:"../../escape"}),/INVALID_REQUEST_ID/);
 assert.throws(()=>validate({...request,seed:"x\ny"}),/INVALID_SEED/);
});
test("caps token use and forbids unknown model",()=>{
 assert.throws(()=>validate({...request,maxTokens:99999}),/INVALID_TOKEN_BUDGET/);
 assert.throws(()=>validate({...request,model:"unsupported-model"}),/UNAPPROVED_MODEL/);
 assert.throws(()=>validate({...request,model:"llama-3.3-70b-versatile"}),/UNAPPROVED_MODEL/);
 assert.throws(()=>validate({...request,temperature:100}),/INVALID_TEMPERATURE/);
});

test("allows only the original three-work author synthetic development cohort",()=>{
 assert.equal(validate({...request,cohort:"experiments/g10-p1/fixtures/cohort_v02.json"}).cohort,
  "experiments/g10-p1/fixtures/cohort_v02.json");
 assert.throws(()=>validate({...request,cohort:"../secret.json"}),/ONLY_PUBLIC_AUTHOR_SYNTHETIC/);
});
