"use strict";
const fs=require("node:fs"),crypto=require("node:crypto");
const cfg=require("./constitution.json"),source=require("./new_briefs.json");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const ARMS=["B_CLEAN","U_PLAIN_PLAN","K_TYPED_PLAN"];
function check(){
 if(cfg.status!=="FROZEN_BEFORE_MODEL_OUTPUT"||
   cfg.model.expected_sha256!=="3605803b982cb64aead44f6c1b2ae36e3acdb41d8e46c8a94c6533bc4c67e597"||
   source.briefs.length!==2||source.briefs.some(b=>b.facts.length!==5)||
   cfg.design.retries!==0||cfg.design.n_outputs!==6)throw Error("PRESEAL_MISMATCH");
}
function condition(b,arm){
 if(!ARMS.includes(arm))throw Error("UNKNOWN_ARM");
 const facts=b.facts.map((f,i)=>"자료 "+(i+1)+": "+f).join("\n");
 const base="글의 장르: "+b.genre+"\n읽을 사람: "+b.reader+"\n목적: "+b.purpose+
 "\n주어진 사실:\n"+facts+"\n아직 확인되지 않은 내용:\n"+b.uncertainties.join("\n")+
 "\n\n이 사실을 바탕으로 자연스러운 한국어 산문 두 문단을 쓰세요. 과학 설명에서는 관찰과 원인 추정을 구별하세요. 장면 산문에서는 관찰되지 않은 감정이나 사건을 만들지 마세요.";
 const plain="\n글을 쓰기 전의 정보 배치: 첫째 문단에서 앞의 세 사실을 시간과 상황에 따라 자연스럽게 연결하고, 둘째 문단에서 뒤의 두 사실을 이어 주세요. 사건과 독자의 관점이 달라지지 않도록 쓰세요.";
 const typed="\n문장 실현용 구조 표: paragraph1=[F1,F2,F3]; paragraph2=[F4,F5]. F1..F5는 위 자료 순서입니다. 각 항목은 단 하나의 근거 있는 사건 또는 관찰을 나타냅니다. 두 문단 안에서 표현의 연속성을 만들되, 사실 관계의 방향과 화자 시점은 보존하세요.";
 const extra=arm==="B_CLEAN"?"":arm==="U_PLAIN_PLAN"?plain:typed;
 return [{role:"system",content:"당신은 한국어 산문 작성자입니다. 읽는 사람이 자연스럽게 이해할 수 있는 완성된 글을 씁니다."},
  {role:"user",content:base+extra}];
}
function order(){return source.briefs.flatMap(b=>ARMS.map(arm=>({brief:b.id,arm}))).sort((a,b)=>
 sha("KRC03|"+a.brief+"|"+a.arm).localeCompare(sha("KRC03|"+b.brief+"|"+b.arm)));}
async function run(endpoint=process.env.KRC_MODEL_URL||"http://127.0.0.1:8912",fetcher=fetch){
 check();const result=[];
 for(const job of order()){
  const b=source.briefs.find(x=>x.id===job.brief),idx=source.briefs.indexOf(b);
  const messages=condition(b,job.arm),seed=cfg.design.seed_base+idx;
  const request={model:"local-frozen",messages,stream:false,seed,temperature:cfg.design.temperature,top_p:cfg.design.top_p,max_tokens:cfg.design.max_tokens};
  let output=null,status="FAILED",why=null;
  try{
   const response=await fetcher(endpoint+"/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request),signal:AbortSignal.timeout(220000)});
   if(!response.ok)why="HTTP_"+response.status;
   else {const p=await response.json();output=p?.choices?.[0]?.message?.content??null;
     if(typeof output==="string")status="COMPLETED";else why="NONSTRING_OUTPUT";}
  }catch(err){why=err?.name||"REQUEST_ERROR"}
  const row={brief:job.brief,arm:job.arm,seed,output,status,why,
   prompt_sha256:sha(JSON.stringify(messages)),text_sha256:typeof output==="string"?sha(output):null};
  result.push(row);console.log(JSON.stringify({brief:job.brief,arm:job.arm,status,chars:output?.length??null}));
 }
 return {schema:"ksgt.krc.v03.decoder-gate.outcome",model:cfg.model,source_sha256:sha(JSON.stringify(source)),protocol_sha256:sha(JSON.stringify(cfg)),documents:result,
  expected_outputs:6,completed:result.filter(x=>x.status==="COMPLETED").length,semantic_verdict:"NOT_ADJUDICATED",human_reader_verdict:"CANCELLED_INSUFFICIENT_BASELINE",
  comparative_krc_result:"NOT_ADJUDICATED",no_posthoc_retry:true};
}
if(require.main===module)(async()=>{
 const output=process.argv[2];if(!output)throw Error("USAGE run.cjs output.json");
 const r=await run();fs.writeFileSync(output,JSON.stringify(r,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({completed:r.completed,total:6,semantic:r.semantic_verdict}));
})().catch(e=>{console.error(e);process.exitCode=1});
module.exports={check,condition,order,run};
