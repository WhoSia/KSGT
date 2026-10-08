"use strict";
/* KRC v0.2 Generator (G) -> independent critic (V) -> witness-only bounded repair -> V.
 * No weights are updated, no scalar reward and no trial-specific prompt tuning.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const source=require("./new_briefs.json"),C=require("./constitution.json");
const V=require("./critic.cjs");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
function checkFreeze(){
 if(C.status!=="FROZEN_BEFORE_MODEL_OUTPUTS"||C.runtime.temperature!==0.4||
   C.runtime.top_p!==0.9||C.runtime.max_tokens!==130||
   C.runtime.seed_base!==53020||C.runtime.max_attempts!==2||C.runtime.source_count!==2||
   C.model.sha256!=="9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031"||
   source.briefs.length!==2||source.briefs.some(b=>b.facts.length!==5))throw Error("FROZEN_PROTOCOL_MUTATION");
 return true;
}
function prompts(brief,fact,attempt,witnesses){
 const role=brief.genre==="science_explainer"?"과학 설명문의 절 하나":"관찰 중심의 짧은 장면 산문의 절 하나";
 const system="당신은 한국어의 "+role+"를 실현하는 역할입니다. JSON 객체만 출력하세요: "+
  '{"fact_id":"F1","sentence":"한국어 한 문장."}. '+ 
  "해당 사실만 표현하세요. 원문의 사실을 바꾸거나 새로운 사건·수치·감정·원인을 만들지 마세요. "+
  "제목·목록·주석·계획 설명을 쓰지 마세요. /no_think";
 const local="작업: "+brief.objective+"\n전체 배경 사실(수정 금지):\n"+
   brief.facts.map(f=>f.id+": "+f.text).join("\n")+
   "\n불명확한 정보(사실이라고 주장 금지): "+brief.unknowns.join("; ")+
   "\n이번 출력에서 실현할 사실 번호: "+fact.id+"\n이번 출력에서 반드시 보존할 원문: "+fact.text+
   "\n문단 속 역할: "+fact.role+"; 앞선 관계: "+fact.relation+
   "\n글의 관점: "+brief.narrator+"; 종결: "+brief.register+
   "\n반드시 "+fact.id+"만 사용하여 간결한 문장 하나를 만드세요.";
 const feedback=attempt===0?"":("\n앞서 다음 검증 문제가 발견됐습니다: "+
   witnesses.map(w=>w.code).join(", ")+
   ". 이는 새 글쓰기 제안이나 문체 점수가 아닙니다. 동일한 사실에 한정하여 다시 작성하세요. "+
   "예전 출력의 문장을 그대로 반복할 필요는 없습니다.");
 return [{role:"system",content:system},{role:"user",content:local+feedback}];
}
async function request(endpoint,brief,fact,attempt,witnesses,seed,transport=fetch){
 const messages=prompts(brief,fact,attempt,witnesses);
 const requestBody={model:"local-frozen",messages,max_tokens:C.runtime.max_tokens,
   temperature:C.runtime.temperature,top_p:C.runtime.top_p,seed,
   response_format:{type:"json_object"},stream:false};
 const t=Date.now();
 try{
  const response=await transport(endpoint+"/v1/chat/completions",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify(requestBody),
    signal:AbortSignal.timeout(120000)});
  if(!response.ok)return {ok:false,status:"HTTP_ERROR",raw:null,latency_ms:Date.now()-t,
      prompt_sha256:sha(JSON.stringify(messages))};
  const packet=await response.json();
  const content=packet?.choices?.[0]?.message?.content;
  if(typeof content!=="string")return {ok:false,status:"MODEL_NONSTRING_REPLY",raw:null,
    latency_ms:Date.now()-t,prompt_sha256:sha(JSON.stringify(messages))};
  return {ok:true,status:"RECEIVED",raw:content,latency_ms:Date.now()-t,
    prompt_sha256:sha(JSON.stringify(messages)),
    finish_reason:packet?.choices?.[0]?.finish_reason??null,
    usage_tokens:packet?.usage?.completion_tokens??null};
 }catch{return {ok:false,status:"TRANSPORT_FAILURE",raw:null,latency_ms:Date.now()-t,
   prompt_sha256:sha(JSON.stringify(messages))};}
}
async function run(endpoint,transport=fetch){
 checkFreeze();
 let globalIndex=0;
 const documents=[],ledger=[];
 for(const brief of source.briefs){
  const accepted=[];
  for(const fact of brief.facts){
   const slotIndex=globalIndex++;
   const attemptLog=[];
   let witnesses=[],chosen=null;
   for(let i=0;i<C.runtime.max_attempts;i++){
    const seed=C.runtime.seed_base+slotIndex*2+i;
    const answer=await request(endpoint,brief,fact,i,witnesses,seed,transport);
    if(!answer.ok){
     attemptLog.push({attempt:i,seed,status:answer.status,witnesses:[{code:answer.status}],
        raw_model_reply:null,prompt_sha256:answer.prompt_sha256,latency_ms:answer.latency_ms});
     break; // no transport retries
    }
    const result=V.inspect(brief.id,fact.id,answer.raw);
    attemptLog.push({attempt:i,seed,status:result.status,
      witnesses:result.witnesses,advisories:result.advisories,
      raw_model_reply:answer.raw,prompt_sha256:answer.prompt_sha256,
      latency_ms:answer.latency_ms,finish_reason:answer.finish_reason});
    if(result.status==="MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN"){
     chosen={fact_id:fact.id,clause:result.candidate,status:"MODEL_ACCEPTED_MECHANICALLY",
       source_verbatim:false,semantic_claim:"UNKNOWN_NOT_PROVEN",advisories:result.advisories};
     break;
    }
    witnesses=result.witnesses;
   }
   if(!chosen)chosen=V.sourceFallback(brief.id,fact.id);
   const ledgerRow={brief_id:brief.id,source_fact_id:fact.id,
     source_fact_text_sha256:sha(fact.text),slot_index:slotIndex,
     attempts:attemptLog,status:chosen.status,
     final_clause_sha256:sha(chosen.clause),fallback:chosen.source_verbatim,
     source_literal_when_fallback:chosen.source_verbatim?chosen.clause:null,
     final_clause:chosen.clause};
   ledger.push(ledgerRow);
   accepted.push(chosen);
   console.log(JSON.stringify({brief:brief.id,slot:fact.id,attempts:attemptLog.length,
       status:chosen.status,witnesses:attemptLog.flatMap(a=>a.witnesses||[]).map(w=>w.code)}));
  }
  documents.push(V.assemble(brief.id,accepted));
 }
 const totalAttempts=ledger.reduce((n,r)=>n+r.attempts.length,0);
 const result={schema:"ksgt.g9.p53.krc-v02.bounded-game-result.v1",
   status:"COMPLETE_TWO_PASS_BOUNDED_GAME_NO_HUMAN_QUALITY_JUDGMENT",
   source_schema:source.schema,
   model_checkpoint:C.model,
   decoding:{temperature:C.runtime.temperature,top_p:C.runtime.top_p,
       max_tokens:C.runtime.max_tokens,seed_base:C.runtime.seed_base},
   frozen_protocol_sha256:sha(JSON.stringify(C)),source_briefs_sha256:sha(JSON.stringify(source)),
   expected_slots:10,attempts:totalAttempts,max_allowed_attempts:20,
   emitted_docs:documents.length,
   source_literal_fallbacks:ledger.filter(l=>l.fallback).length,
   model_admitted_slots:ledger.filter(l=>!l.fallback).length,
   revised_slots:ledger.filter(l=>l.attempts.length>1).length,
   mechanical_two_paragraph_docs:documents.filter(d=>d.paragraphs===2).length,
   documents,slot_ledger:ledger,
   human_semantic_adjudication:"NOT_PERFORMED",
   blind_reader_preference:"NOT_COLLECTED",
   GAN_training:"NOT_PERFORMED_NO_WEIGHTS_UPDATED",
   inference:"Only local format/cargo evidence, no Korean naturalness or semantic guarantee"};
 if(result.attempts>20||result.emitted_docs!==2||result.documents.some(x=>x.source_fact_coverage!==5||x.paragraphs!==2))
   throw Error("UNBOUNDED_OR_MISSING_COVERAGE");
 return result;
}
if(require.main===module){
 (async()=>{
  const outfile=process.argv[2];if(!outfile)throw Error("USAGE node generator.cjs output.json");
  const result=await run(process.env.KRC_MODEL_URL||"http://127.0.0.1:8912");
  fs.writeFileSync(outfile,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({docs:result.emitted_docs,slots:result.expected_slots,
    requests:result.attempts,admitted:result.model_admitted_slots,
    fallback:result.source_literal_fallbacks,paragraphed:result.mechanical_two_paragraph_docs,
    sha256:sha(fs.readFileSync(outfile)),human:"NONE"}));
 })().catch(e=>{console.error("KRC_V02_RUNTIME_ERROR_"+e.message);process.exitCode=1;});
}
module.exports={checkFreeze,prompts,request,run};
