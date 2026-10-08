"use strict";
/* KRC v0.1 frozen same-checkpoint 18-output generation.
 * One model checkpoint / fixed decoding / 6 briefs x B,A,K / zero reruns.
 * Raw draft text is preserved; no output repair or evaluator feedback. */
const fs=require("node:fs");
const crypto=require("node:crypto");
const planner=require("./planner.cjs");
const constitution=require("./constitution.json");
const briefs=require("../natural_writing_pilot_briefs.json");
const sha=planner.sha;
const C=constitution.experimental_protocol;
const gen=C.generation;
function frozenCheck(){
 if(constitution.status!=="FROZEN_PRE_CONTROLLED_GENERATION"||
   gen.temperature!==0.65||gen.top_p!==0.9||gen.max_tokens!==640||
   gen.context_tokens!==4096||gen.retries!==0||gen.regeneration_after_critic!==0||
   C.frozen_checkpoint.sha256!=="9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031"||
   planner.order().length!==18)throw Error("GENERATION_CONTRACT_CHANGED");
 return true;
}
async function callModel(endpoint,job,transport=fetch){
 const messages=planner.compilePrompt(job.brief,job.arm);
 const seed=planner.seed(job.brief);
 const request={model:"local-frozen",messages,seed,temperature:gen.temperature,
  top_p:gen.top_p,max_tokens:gen.max_tokens,stream:false};
 const started=Date.now();
 try{
  const response=await transport(endpoint+"/v1/chat/completions",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify(request),
    signal:AbortSignal.timeout(220000)});
  if(!response.ok)return {status:"HTTP_ERROR",text:null,detail:"HTTP_"+response.status,
    prompt_sha256:sha(JSON.stringify(messages)),latency_ms:Date.now()-started,seed};
  const payload=await response.json();
  const text=payload?.choices?.[0]?.message?.content;
  if(typeof text!=="string")return {status:"INVALID_MODEL_CONTENT",text:null,detail:"NO_TEXT",
    prompt_sha256:sha(JSON.stringify(messages)),latency_ms:Date.now()-started,seed};
  return {status:"COMPLETED",text,detail:"UNADJUDICATED",
    prompt_sha256:sha(JSON.stringify(messages)),prompt_utf16_units:JSON.stringify(messages).length,
    latency_ms:Date.now()-started,seed,finish_reason:payload?.choices?.[0]?.finish_reason??null,
    completion_tokens:payload?.usage?.completion_tokens??null,
    output_contains_think:/(<think>|<\/think>)/u.test(text)};
 }catch(e){return {status:"REQUEST_ERROR",text:null,detail:e?.name||"ERROR",
   prompt_sha256:sha(JSON.stringify(messages)),latency_ms:Date.now()-started,seed};}
}
function blind(raw){
 const out=raw.documents.map(d=>({
   anonymous_id:sha("KRC01-BLIND-"+d.brief+"|"+d.arm).slice(0,18),
   brief_id:d.brief,
   paragraph_text:d.text,
   state:d.status,
   audit_instruction:"Judge fidelity to immutable source facts before idiomaticity; not AI detection."
 }));
 out.sort((a,b)=>a.anonymous_id.localeCompare(b.anonymous_id));
 return {schema:"ksgt.krc.v0.1.blind-reader-pack.v1",status:"MATERIAL_ONLY_NO_READERS",
  comparison:"Natural Korean coherence / faithful factual content. A source brief is required alongside each anonymous passage.",
  documents:out,scales:{naturalness:"1..7 or abstain",coherence:"1..7 or abstain",genre_fit:"1..7 or abstain",
   factual_warning:"list cited unsupported claims",open_comment:"text",tie_allowed:true},
  no_arm_labels:true,no_generated_winner:true};
}
async function run(endpoint,transport=fetch){
 frozenCheck();
 const order=planner.order(),documents=[];
 for(const [index,job] of order.entries()){
  const result=await callModel(endpoint,job,transport);
  const brief=planner.briefById(job.brief);
  documents.push({id:job.brief+"_"+job.arm,brief:job.brief,arm:job.arm,
    execution_index:index,model_seed:result.seed,prompt_sha256:result.prompt_sha256,
    prompt_utf16_units:result.prompt_utf16_units??null,
    model_revision:C.frozen_checkpoint.revision,model_file_sha256:C.frozen_checkpoint.sha256,
    status:result.status,finish_reason:result.finish_reason??null,
    completion_tokens:result.completion_tokens??null,
    latency_ms:result.latency_ms,output_contains_think:result.output_contains_think??false,
    text:result.text,output_sha256:typeof result.text==="string"?sha(result.text):null,
    raw_chars:result.text?.length??null,target_chars:brief.target_chars,
    engineering_detail:result.detail,provenance:job.arm==="K_TYPED_PLAN"?
      {plan_sha256:sha(JSON.stringify(planner.construct(job.brief))),plan_type:"KRC_TYPED_IR"}:
      {plan_sha256:null,plan_type:job.arm==="A_SURFACE_ABLATION"?"SURFACE_BAN_ONLY":"NONE"}});
  console.log(JSON.stringify({i:index+1,of:order.length,brief:job.brief,arm:job.arm,
    status:result.status,chars:result.text?.length??null,finish_reason:result.finish_reason??null}));
 }
 const raw={schema:"ksgt.krc.v0.1.controlled-generation.v1",status:"GENERATED_UNBLINDED_UNADJUDICATED",
  model:C.frozen_checkpoint,generation_protocol:gen,source_briefs_sha256:sha(JSON.stringify(briefs)),
  allocation_policy:"DETERMINISTIC_SHA_ORDER_KRC01",n_requested:18,
  n_completed:documents.filter(d=>d.status==="COMPLETED").length,
  records_are_comparable:"EXPLORATORY_SAME_CHECKPOINT_DIFFERENT_PROMPT_LENGTHS_AND_PLANS",
  reader_evaluation:"NOT_PERFORMED",fact_semantic_adjudication:"NOT_PERFORMED",documents,
  scientific_claim:"NO_HUMAN_NATURALNESS_OR_KSGT_SUPERIORITY_EVIDENCE"};
 return {raw,blinded:blind(raw)};
}
if(require.main===module){
 (async()=>{
  const out=process.argv[2],blindOut=process.argv[3],
    endpoint=process.env.KRC_MODEL_URL||"http://127.0.0.1:8912";
  if(!out||!blindOut)throw Error("USAGE node generate.cjs raw.json blind.json");
  const result=await run(endpoint);
  fs.writeFileSync(out,JSON.stringify(result.raw,null,2)+"\n",{flag:"wx"});
  fs.writeFileSync(blindOut,JSON.stringify(result.blinded,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({requested:18,completed:result.raw.n_completed,
   raw_sha256:sha(fs.readFileSync(out)),blind_sha256:sha(fs.readFileSync(blindOut)),
   semantic:"NOT_PERFORMED",reader:"NONE"}));
 })().catch(e=>{console.error("KRC_GENERATION_INFRA_FAILURE_"+e.message);process.exitCode=1;});
}
module.exports={frozenCheck,callModel,blind,run};
