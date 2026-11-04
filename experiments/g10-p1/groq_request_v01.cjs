"use strict";
const fs=require("node:fs");
const ALLOWED_MODELS=new Set(["llama-3.3-70b-versatile","openai/gpt-oss-20b","openai/gpt-oss-120b","llama-3.1-8b-instant"]);
const COHORT="experiments/g10-p1/fixtures/groq_smoke_one_source.json";
function validate(v){
 if(!v||v.schema!=="ksgt.g10.p1.groq-commit-request.v01")throw Error("INVALID_REQUEST_SCHEMA");
 if(!/^[A-Z0-9_-]{8,72}$/.test(v.requestId))throw Error("INVALID_REQUEST_ID");
 if(!ALLOWED_MODELS.has(v.model))throw Error("UNAPPROVED_MODEL");
 if(v.cohort!==COHORT)throw Error("ONLY_PUBLIC_SYNTHETIC_SMOKE_SOURCE_PERMITTED");
 if(!Number.isInteger(v.maxTokens)||v.maxTokens<400||v.maxTokens>1500)throw Error("INVALID_TOKEN_BUDGET");
 if(typeof v.temperature!=="number"||v.temperature<0||v.temperature>1)throw Error("INVALID_TEMPERATURE");
 if(typeof v.seed!=="string"||!/^[A-Za-z0-9_-]{1,64}$/.test(v.seed))throw Error("INVALID_SEED");
 return v;
}
function outputs(v){
 v=validate(v);
 return ["model="+v.model,"cohort="+v.cohort,"max_tokens="+v.maxTokens,"temperature="+v.temperature,"seed="+v.seed,"request_id="+v.requestId].join("\n")+"\n";
}
if(require.main===module){
 try{
  if(process.argv.length!==3)throw Error("USAGE_node_request_json");
  process.stdout.write(outputs(JSON.parse(fs.readFileSync(process.argv[2],"utf8"))));
 }catch(e){console.error(e.message);process.exitCode=1}
}
module.exports={validate,outputs};
