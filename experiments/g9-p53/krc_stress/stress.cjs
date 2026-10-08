"use strict";
/* Deliberate invalid initial artifacts, then exactly one actual model repair.
 * Never call an injected artifact model-generated. */
const fs=require("node:fs"),crypto=require("node:crypto");
const V=require("../krc_v02/critic.cjs");
const G=require("../krc_v02/generator.cjs");
const sources=require("../krc_v02/new_briefs.json");
const pre=require("./preseal.json");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
async function run(base,transport=fetch){
 if(pre.status!=="EXPLORATORY_PROSPECTIVE_STRESS_TEST_NOT_NATURALNESS_EVALUATION"||
    pre.cases.length!==3||pre.budget.real_model_repairs_max!==3)throw Error("CHALLENGE_PRESEAL_CHANGED");
 G.checkFreeze();
 const cases=[];
 for(let i=0;i<pre.cases.length;i++){
  const c=pre.cases[i],brief=sources.briefs.find(b=>b.id===c.brief_id);
  const fact=brief?.facts.find(f=>f.id===c.fact_id);
  if(!brief||!fact)throw Error("UNLICENSED_FACT");
  const injectedRaw=JSON.stringify(c.injected_candidate);
  const before=V.inspect(c.brief_id,c.fact_id,injectedRaw);
  if(before.status!=="REJECT_WITH_WITNESSES"||
     !before.witnesses.some(w=>w.code===c.required_witness))
       throw Error("CRITIC_DID_NOT_DETECT_PRECOMMITTED_DEFECT");
  const result=await G.request(base,brief,fact,1,before.witnesses,pre.budget.model_seed_base+i,transport);
  const after=result.ok?V.inspect(c.brief_id,c.fact_id,result.raw):{
    status:"MODEL_REQUEST_FAILED",witnesses:[{code:result.status}],advisories:[],candidate:null};
  const admitted=after.status==="MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN";
  cases.push({case_id:c.id,source_fact:c.brief_id+"|"+c.fact_id,
    injected_is_model_output:false,
    injected_raw_sha256:sha(injectedRaw),original_witnesses:before.witnesses,
    repair_prompt_sha256:result.prompt_sha256,real_model_requested:true,
    seed:pre.budget.model_seed_base+i,model_request_status:result.status,
    repaired_output_status:after.status,repair_witnesses:after.witnesses,
    model_raw_reply:result.raw,mechanically_admitted:admitted,
    semantic_preservation:"NOT_PROVEN"});
  console.log(JSON.stringify({case:c.id,original_codes:before.witnesses.map(w=>w.code),
    model_status:result.status,repair_status:after.status,semantics:"NOT_ADJUDICATED"}));
 }
 return {schema:"ksgt.g9.p53.krc-v02.witness-stress-outcome.v1",cases,
   injected_initial_cases:cases.length,real_model_repair_requests:cases.length,
   mechanically_admitted:cases.filter(c=>c.mechanically_admitted).length,
   natural_korean:"NOT_MEASURED",semantic_proof:"NONE",weight_updates:0,
   authority:"INJECTED_COUNTEREXAMPLE_REPAIR_TRANSPORT_ONLY"};
}
if(require.main===module){
 (async()=>{
  const dest=process.argv[2];if(!dest)throw Error("USAGE node stress.cjs output.json");
  const result=await run(process.env.KRC_MODEL_URL||"http://127.0.0.1:8912");
  fs.writeFileSync(dest,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({cases:result.injected_initial_cases,requests:result.real_model_repair_requests,
    admitted:result.mechanically_admitted,sha256:sha(fs.readFileSync(dest)),
    human:"NONE",weights_updated:false}));
 })().catch(e=>{console.error("WITNESS_STRESS_FAILURE_"+e.message);process.exitCode=1;});
}
module.exports={run};
