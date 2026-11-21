"use strict";
/* G10-P2 R5b Korean Realizer: actually write complete prose, not reader HTML.
 * Four actual writer variants on 8 R5a exposed development sources:
 * B20 reused sealed original; K20 / B120 / K120 new Groq calls.
 * Core limitation: prompt-controlled craft != learned model/novel architecture.
*/
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const {chat,resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const {REVISION_SETTINGS}=require("../../g10-p1/r924_anchored_revision_v01.cjs");
const r5a=require("./r5a_realized_prefix_prose.cjs");
const manifest=require("./fixtures/r5b_frozen_r5a_direct_sha_manifest.json");
const sha=v=>createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
const assert=(b,n)=>{if(!b)throw Error(n)};
const BASE="openai/gpt-oss-20b",STRONG="openai/gpt-oss-120b";
const ARMS=["K20","B120","K120"];
const PER_GENRE=Object.freeze({
 chat:"실제 팀원이 받는 짧은 답장처럼 쓰되, 이미 처리한 사실과 아직 끝나지 않은 일, 확인된 다음 행동을 한 문맥에서 자연스럽게 연결한다. 확인되지 않은 후속 연락·기한·확답을 덧붙이지 않는다. 의례적인 인사와 보고서식 항목 반복은 필요하지 않으면 생략한다.",
 science:"실측값을 먼저 이해 가능하게 밝히고, 측정되지 않았거나 조건이 달랐던 변수 때문에 인과를 어디까지 주장할 수 있는지 정확히 구분한다. 원천에 없는 추가 측정값과 교란변수, 가능성이 더 높다는 추정은 만들지 않는다. 과학적 정확성을 지키며 문장 사이 호응과 리듬을 자연스럽게 조정한다.",
 notice:"독자의 실제 행동에 필요한 시간·대상·예외와 미정인 사항을 쉽게 찾을 수 있게 배열한다. 교시를 임의 시각으로 바꾸거나 장소, 연락 수단, 별도 절차를 만들어내지 않는다. 과도한 번호·감사 인사·관청식 상투 표현을 무조건 붙이지 않는다.",
 scene:"서술된 인물의 행동·물건·시점·장면 종료 지점을 엄격히 유지한다. 소리·빛·촉감 같은 비사건적 질감은 필요하면 살리되 인물의 새 행동과 감정적 해설을 덧붙이지 않는다. '그저', '마치', '숨을 죽인 듯' 같은 익숙한 장식을 자동으로 반복하지 않는다. 이미지가 이미 의미를 전했다면 마지막에 다시 설명하지 않는다."
});
const GENERAL="한국어의 어휘는 멋을 내려고 임의의 고급 동의어로 교체하지 말고, 장면·사실·독자의 목적에 꼭 맞는 말과 동사를 선택한다. 문장 길이, 종결어미, 생략, 지시어와 어순을 앞뒤 맥락에 따라 결정한다. 존재하지 않는 대립 가정을 세운 뒤 '단순히 A가 아니라 B'로 뒤집는 공허한 대조를 피한다. 불필요한 요약, 자기평가, 감탄, 항목 재진술을 덧붙이지 않는다. 원천의 역할·사건·인과·조건·확실성의 범위는 반드시 보존한다. 결과물은 완성된 한국어 본문만 출력한다.";
function validate(){
 r5a.validateFixture();
 assert(manifest.schema==="ksgt.g10p2.r5b.r5a-direct-reuse.v1","BAD_OLD_MANIFEST");
 assert(manifest.baseModel===BASE&&manifest.records?.length===8,"BAD_OLD_BASELINE");
 assert(new Set(manifest.records.map(x=>x.sourceWork)).size===8,"REPEATED_OLD_WORK");
 for(const w of r5a.fixture.works){
  const record=manifest.records.find(x=>x.sourceWork===w.id);
  assert(record&&/^[a-f0-9]{64}$/.test(record.outputSha256)&&
   /^[a-f0-9]{64}$/.test(record.promptSha256)&&Number.isInteger(record.tokens)&&record.tokens>100,
   "BAD_BASELINE_MANIFEST_"+w.id);
  const p=r5a.writerPrompt(w,"direct");
  assert(sha(p)===record.promptSha256,"OLD_DIRECT_PROMPT_CHANGED_"+w.id);
 }
 return true;
}
function craftPrompt(w){
 const base=r5a.writerPrompt(w,"direct");
 const original=JSON.parse(base[1].content);
 const enriched={...original,koreanRealization:{
  generalPolicy:GENERAL,genrePolicy:PER_GENRE[w.genre],
  expectedUse:"표현의 실질 개선을 연구하는 동등 원천 정보 대조군; 목록형 검사 문구를 답변에 쓰지 않는다."}};
 return [base[0],{role:"user",content:JSON.stringify(enriched)}];
}
function buildPlan(){
 validate();
 const plan=[];
 for(const [i,w] of r5a.fixture.works.entries()){
  const rotate=i%3,arms=ARMS.slice(rotate).concat(ARMS.slice(0,rotate));
  for(const arm of arms){
   const prompt=arm==="B120"?r5a.writerPrompt(w,"direct"):craftPrompt(w);
   const model=arm==="K20"?BASE:STRONG;
   plan.push({id:w.id+"_"+arm,sourceWork:w.id,genre:w.genre,arm,model,provider:"groq",
    prompt,promptSha256:sha(prompt),sourceSha256:sha(w.facts)});
  }
 }
 assert(plan.length===24&&new Set(plan.map(c=>c.id)).size===24,"WRONG_WRITER_PLAN");
 return plan;
}
function planHash(plan=buildPlan()){return sha({schema:"ksgt.g10p2.r5b.writer-plan.v1",
 settings:{provider:"groq",temperature:0,maxTokens:REVISION_SETTINGS.maxTokens},
 cells:plan});}
function read(f){return JSON.parse(fs.readFileSync(f,"utf8"))}
function noOverwrite(file,obj){fs.writeFileSync(file,JSON.stringify(obj,null,2)+"\n",{flag:"wx",mode:0o600})}
function oldBaseline(root){
 validate();
 const dir=path.join(root,"r5a-live","writers");
 const originals=r5a.readPhase(dir,r5a.buildWriterPlan());
 const seen=[];
 for(const w of r5a.fixture.works){
  const m=manifest.records.find(r=>r.sourceWork===w.id);
  const r=originals.get(w.id+"_direct");
  assert(r.textSha256===m.outputSha256&&r.promptSha256===m.promptSha256&&
   r.responseModel===BASE&&r.usage.total_tokens===m.tokens,"OLD_BASELINE_IDENTITY_FAIL_"+w.id);
  seen.push({id:w.id,text:r.text,sha256:r.textSha256,tokens:r.usage.total_tokens});
 }
 assert(seen.reduce((n,x)=>n+x.tokens,0)===4995,"OLD_BASELINE_TOKEN_RECOUNT_CHANGED");
 return seen;
}
function strictRead(root,plan=buildPlan()){
 const dir=path.join(root,"responses"),summary=read(path.join(dir,"summary.json"));
 assert(summary.planHash===planHash(plan)&&summary.rows?.length===plan.length,"PLAN_OR_RESPONSE_COUNT_MISMATCH");
 const expected=new Set(plan.map(x=>x.id));
 for(const suffix of [".attempt.json",".result.json"]){
  const f=fs.readdirSync(dir).filter(x=>x.endsWith(suffix)).map(x=>x.slice(0,-suffix.length));
  assert(f.length===expected.size&&f.every(x=>expected.has(x)),"WRITER_RECEIPT_MISSING_OR_EXTRA");
 }
 return new Map(plan.map(p=>{
  const attempt=read(path.join(dir,p.id+".attempt.json"));
  const result=read(path.join(dir,p.id+".result.json"));
  assert(attempt.id===p.id&&attempt.planHash===planHash(plan)&&
   attempt.promptSha256===p.promptSha256&&attempt.model===p.model&&
   result.id===p.id&&result.modelRequested===p.model&&
   result.promptSha256===p.promptSha256&&result.sourceSha256===p.sourceSha256,
   "RESULT_PROVENANCE_MISMATCH_"+p.id);
  assert(result.status==="GENERATED"&&result.finishReason==="stop"&&
   result.responseModel===p.model&&typeof result.text==="string"&&
   result.text.trim()&&sha(result.text)===result.textSha256&&
   Number.isInteger(result.usage?.total_tokens)&&result.usage.total_tokens>0,
   "RESULT_TEXT_MODEL_OR_TOKEN_INVALID_"+p.id);
  return [p.id,result];
 }));
}
function phraseNotes(text){
 const marks=["단순히","마치","그저","느꼈다","알려드리겠습니다","될 것입니다","그 순간","중요합니다"];
 return Object.fromEntries(marks.map(k=>[k,text.split(k).length-1]));
}
function score(root,oldRoot){
 const old=oldBaseline(oldRoot);
 const actual=strictRead(root),rows=r5a.fixture.works.map(w=>{
  const original=old.find(x=>x.id===w.id),outputs={
   B20:{text:original.text,sha256:original.sha256,tokens:original.tokens,providerModel:BASE,
    historicalSource:"R5A_SEALED_OLD_WRITER_CALL_NOT_NEW"}
  };
  for(const arm of ARMS){
   const r=actual.get(w.id+"_"+arm);
   outputs[arm]={text:r.text,sha256:r.textSha256,tokens:r.usage.total_tokens,
    providerModel:r.responseModel,latencyMs:r.latencyMs,
    historicalSource:"R5B_ACTUAL_NEW_PROVIDER_CALL"};
  }
  return {id:w.id,genre:w.genre,sourceFacts:w.facts,task:w.task,
   purpose:w.purpose,risk:w.risk,license:w.license,
   outputs:Object.fromEntries(Object.entries(outputs).map(([arm,v])=>
    [arm,{...v,lengthCharacters:v.text.length,paragraphs:v.text.split(/\n[ \t]*\n/).length,
      diagnosticPhraseCounts:phraseNotes(v.text)}]))};
 });
 const byArm=Object.fromEntries(["B20",...ARMS].map(arm=>[arm,{
  texts:8,providerTokens:rows.reduce((s,r)=>s+r.outputs[arm].tokens,0),
  chars:rows.reduce((s,r)=>s+r.outputs[arm].lengthCharacters,0),
  model:rows[0].outputs[arm].providerModel
 }]));
 return {schema:"ksgt.g10p2.r5b.realizer-prose-development.v1",
  status:"ACTUAL_FULL_KOREAN_WRITING_NOT_INDEPENDENT_HUMAN_GOLD",
  works:8,completedWholeTexts:32,newProviderCalls:24,reusedHistoricalProviderCalls:8,
  newCallTokens:byArm.K20.providerTokens+byArm.B120.providerTokens+byArm.K120.providerTokens,
  totals:byArm,independentReaderVotes:0,independentSourceGold:0,
  stylePhraseCountsAreQualityScores:false,qualityAdvantage:"NOT_ESTABLISHED",
  controllerArchitectureEffect:"NOT_TESTED",rows};
}
function makeOwnerPacket(scoreValue){
 // This is simple Markdown, not a flawed HTML evaluation instrument.
 const order=[["K120","B20","K20","B120"],["B120","K20","B20","K120"],
  ["K20","B120","K120","B20"],["B20","K120","B120","K20"]];
 const parts=["# R5b — 실제 한국어 완성문 대조 원고 (8개 원천 × 4편)",
 "이 문서는 실제 사람인 필자가 *선택적으로* 읽기 쉽게 만든 작업 원고이다. 설문·독자 모집·독립 인간 정답이 아니다.",
 "네 조건은 같은 원천을 공유한다. 처음에는 조건명을 가리고 A–D 본문을 읽되, 소스 사실은 그대로 볼 수 있다.",
 "표지에는 인위적으로 1–5점을 매기는 기준을 강요하지 않는다. 가장 자연스러운 문장, 고칠 문장, 원천을 벗어난 사실을 직접 표시할 수 있다.",
 "자동 세션·토큰 결과와 원시 출력은 별도 ZIP에 보존한다."];
 const key=[];
 for(const [i,r] of scoreValue.rows.entries()){
  parts.push("\n---\n\n## "+(i+1)+". "+r.id+" ("+r.genre+")\n\n**요청:** "+r.task+
   "\n\n**핵심 위험:** "+r.risk+"\n\n**원천 사실:**\n"+r.sourceFacts.map((x,j)=>(j+1)+". "+x).join("\n"));
  const groups=order[i%order.length];const labels=["A","B","C","D"];
  for(let k=0;k<4;k++){parts.push("### 원고 "+labels[k]+"\n\n"+r.outputs[groups[k]].text.trim());}
  key.push(r.id+": "+labels.map((l,k)=>l+"="+groups[k]).join(", "));
 }
 parts.push("\n---\n\n## 블라인드 표지 해독표 (원고를 다 읽은 뒤 보기)\n\n"+
 key.join("\n")+"\n\n**범위:** B20은 과거 20B 원본 재사용이며 나머지 24편만 R5b 신규 호출.");
 return parts.join("\n\n")+"\n";
}
async function run(root,{invoke=chat}={}){
 assert(!fs.existsSync(root),"REFUSE_EXISTING_R5B_OUTPUT");
 const plan=buildPlan();fs.mkdirSync(root,{recursive:false,mode:0o700});
 noOverwrite(path.join(root,"frozen-r5b-plan.json"),{planHash:planHash(plan),
  cells:plan.map(({prompt,...p})=>p),
  oldManifestSha:sha(manifest)});
 const dir=path.join(root,"responses");fs.mkdirSync(dir,{mode:0o700});
 const rows=[];
 for(const cell of plan){
  noOverwrite(path.join(dir,cell.id+".attempt.json"),{
   id:cell.id,promptSha256:cell.promptSha256,sourceSha256:cell.sourceSha256,
   model:cell.model,planHash:planHash(plan)});
  let result;
  try{
   const r=await invoke({provider:"groq",model:cell.model,messages:cell.prompt,
    temperature:0,maxTokens:REVISION_SETTINGS.maxTokens});
   result={id:cell.id,sourceWork:cell.sourceWork,arm:cell.arm,modelRequested:cell.model,
    sourceSha256:cell.sourceSha256,promptSha256:cell.promptSha256,
    status:r.finishReason==="stop"?"GENERATED":"INCOMPLETE",
    text:r.text,textSha256:sha(r.text),usage:r.usage,responseModel:r.responseModel,
    latencyMs:r.latencyMs,finishReason:r.finishReason};
  }catch(e){
   // Never print provider payloads or secrets on failure.
   result={id:cell.id,sourceWork:cell.sourceWork,arm:cell.arm,modelRequested:cell.model,
    sourceSha256:cell.sourceSha256,promptSha256:cell.promptSha256,
    status:"PROVIDER_ERROR",failureCode:e.status||e.code||e.message||"UNKNOWN",text:null};
  }
  noOverwrite(path.join(dir,cell.id+".result.json"),result);
  rows.push({id:cell.id,arm:cell.arm,status:result.status,modelRequested:cell.model,
   responseModel:result.responseModel||null,totalTokens:result.usage?.total_tokens||0});
 }
 noOverwrite(path.join(dir,"summary.json"),{planHash:planHash(plan),rows});
 assert(rows.every(x=>x.status==="GENERATED"),"R5B_PARTIAL_OUTPUT_PRESERVED_NO_QUALITY_SCORE");
 strictRead(root,plan);
 return {runRoot:root,generated:rows.length};
}
async function main(argv){
 const [mode,...params]=argv;
 if(mode==="--plan"&&params.length===0){
  console.log(JSON.stringify({works:8,oldActualCallsReused:8,newCalls:24,
   planHash:planHash(),pairs:buildPlan().map(({prompt,...p})=>p)},null,2));return;
 }
 if(mode==="--execute"&&params.length===1){
  resolveProvider("groq");const result=await run(params[0]);console.log("R5b-live",JSON.stringify(result));return;
 }
 if((mode==="--score"||mode==="--owner-markdown")&&params.length===2){
  const x=score(params[0],params[1]);
  if(mode==="--score"){const {rows,...s}=x;console.log(JSON.stringify(s,null,2));}
  else console.log(makeOwnerPacket(x));
  return;
 }
 throw Error("USAGE: --plan | --execute NEW_DIR | --score NEW_DIR R5A_OLD_DIR | --owner-markdown NEW_DIR R5A_OLD_DIR");
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{
 console.error("R5B_FAILURE_AND_RAW_RETAINED",e.message);process.exitCode=1;
});
module.exports={validate,craftPrompt,buildPlan,planHash,oldBaseline,strictRead,
 score,makeOwnerPacket,run,phraseNotes,GENERAL,PER_GENRE};
