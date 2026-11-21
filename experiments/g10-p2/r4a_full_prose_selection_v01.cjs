"use strict";
/*
 * G10-P2 R4a: candidate-level post-realization selection on NEW complete prose.
 * Honest limits: all "risk" assertions come from the same fallible base model;
 * an exact quotation validates provenance only, not semantic entailment.
 * Real outputs/notes live in Actions temporary storage and Drive, not Git.
 */
const fs=require("node:fs"),path=require("node:path");
const {createHash}=require("node:crypto");
const {executePlan}=require("../g10-p1/r928_scope_and_prose_v01.cjs");
const {REVISION_SETTINGS}=require("../g10-p1/r924_anchored_revision_v01.cjs");
const {resolveProvider}=require("../g10-p1/provider_client_v01.cjs");
const raw=require("./fixtures/r4a_new_full_prose_12works_v01.json");
const sha=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const ARMS=["direct","rich"],STATUS=["CLEAR","RISK","UNCERTAIN"];
const KINDS=new Set(["NEW_EVENT","ACTOR_SWAP","CAUSAL_OVERREACH",
  "OBLIGATION_EXPANSION","TIME_CHANGE","SCOPE_CHANGE","OTHER"]);
const GENERAL="독자가 요청한 목적을 이루도록 완성된 한국어 본문만 쓴다. 원천 사실의 사실성·조건·행위자·시점·대상 범위를 유지한다. 원천에 없는 새로운 의무, 사건, 약속, 관측 결과를 사실처럼 추가하지 않는다. 글의 문단 수는 필요한 만큼만 선택한다.";
const RICH={
  chat:"지금 확인된 일과 미정인 일을 명확히 갈라서, 받는 사람이 해야 할 판단을 바로 할 수 있게 쓴다. 불필요한 후속 연락 약속을 만들지 않는다.",
  science:"먼저 실제 관찰 또는 측정을 제시하고, 인과를 단정할 수 없는 이유와 다음에 통제할 변수를 정확히 설명한다. 가정은 가정으로 표시한다.",
  notice:"시간·대상·예외를 읽는 사람이 바로 분기할 수 있게 쓴다. 적용 대상이 다른 의무를 한데 섞지 않으며 원문에 없는 절차를 만들지 않는다.",
  scene:"인물의 행동과 소지품 이동이 자연스럽게 따라가도록 쓰고 마지막 사건에서 장면을 멈춘다. 감정의 의미를 마지막에 해설하지 않고, 사건 외의 감각적 질감은 자연스럽게 활용한다."
};
const SYSTEM="한국어 글쓰기 작업이다. 지시와 원천 사실을 정확히 보존하되 장르에 맞게 자연스럽게 쓴다. 내용이 확실하지 않으면 새로운 사실을 만들지 않는다.";
const AUDIT_SYSTEM="원천 사실과 생성된 한국어 완성문을 비교하는 위험 탐지기다. 동일한 문장의 행위자·대상·인과·의무·시점·적용 범위를 신중히 대조한다. 불확실하면 UNCERTAIN을 고른다. 원천에 명시되지 않은 과학 인과나 공지 의무를 만들어 내면 위험이고, 문학에서 단순 감각적 질감은 위험이 아니지만 새로운 사건·행위자 변경은 위험이다. JSON 객체 하나만 출력한다. 정확한 키는 status, risks이고 status는 CLEAR, RISK, UNCERTAIN 중 하나다. 위험이 있으면 RISK와 최대 5개의 risks 배열을, 없으면 CLEAR와 빈 배열, 판정할 수 없으면 UNCERTAIN과 빈 배열을 낸다. 각 위험은 정확히 kind, outputQuote, sourceFactIndex, sourceQuote 네 키를 갖는다. kind는 NEW_EVENT, ACTOR_SWAP, CAUSAL_OVERREACH, OBLIGATION_EXPANSION, TIME_CHANGE, SCOPE_CHANGE, OTHER 중 하나다. outputQuote는 실제 완성문에 한 번만 존재하는 연속 구절, sourceQuote는 비교할 원천 사실 문장에 실제 존재하는 연속 구절이어야 한다. sourceFactIndex는 1부터 시작한다. Markdown 장식 문자도 원문 그대로 복사한다. 추가 설명은 금지한다.";
const SELECT_SYSTEM="한국어 글쓰기 편집자다. 동일한 원천으로 생성한 완성문 A(direct)와 B(rich)에서 독자가 바로 사용하기에 더 적합한 한 편을 택하라. 두 후보를 고치거나 합치지 말라. 모델 위험 탐지기 메모는 자체 오류 가능성이 있으므로 그 근거를 원문과 대조해 판단하라. 내용 사실성과 서술의 자연스러움 모두 고려한다. JSON 객체 하나만 반환한다: {\"choice\":\"direct 또는 rich\",\"reason\":\"근거를 간략히 적는다\"}. 다른 키와 본문을 출력하지 않는다.";
function ensure(cond,reason){if(!cond)throw Error(reason)}
function validateFixture(data=raw){
  ensure(data.schema==="ksgt.g10p2.r4a.source-work-dev.v1" &&
    data.status==="AUTHOR_SYNTHETIC_NEW_DEVELOPMENT_NO_INDEPENDENT_READER_GOLD" &&
    Array.isArray(data.works)&&data.works.length===12,"BAD_R4A_FIXTURE");
  const counts={},ids=new Set();
  for(const w of data.works){
    ensure(/^R4A_(CHAT|SCI|NOTICE|SCENE)_[A-Z]+$/.test(w.id)&&!ids.has(w.id),
      "DUPLICATE_OR_BAD_WORK_ID");ids.add(w.id);
    ensure(["chat","science","notice","scene"].includes(w.genre),"UNKNOWN_GENRE");
    counts[w.genre]=(counts[w.genre]||0)+1;
    for(const name of ["audience","purpose","task","readerQuestion","answer","risk"])
      ensure(typeof w[name]==="string"&&w[name].length>9,"MISSING_TASK_FIELD");
    ensure(Array.isArray(w.facts)&&w.facts.length>=4 && w.facts.length<=7 &&
      w.facts.every(x=>typeof x==="string"&&x.length>8) &&
      new Set(w.facts).size===w.facts.length,"BAD_SOURCE_FACTS");
    if(w.genre==="scene")ensure(typeof w.license==="string"&&w.license.length>20,
      "LITERARY_DETAIL_LICENSE_MISSING");
  }
  ensure(Object.values(counts).every(x=>x===3)&&Object.keys(counts).length===4,
    "BAD_GENRE_BALANCE");
  return data;
}
function promptWork(w,arm){
  const task={genre:w.genre,reader:w.audience,purpose:w.purpose,request:w.task,
    sourceFacts:w.facts,factualRisk:w.risk,
    allowedDetail:w.license||"새 사실·절차·행위를 만들지 않는다.",
    instruction:GENERAL};
  if(arm==="rich")task.generalGenreGuide=RICH[w.genre];
  return [{role:"system",content:SYSTEM},{role:"user",content:JSON.stringify(task)}];
}
function buildWriterPlan(){
  validateFixture();
  const out=[];
  for(const [i,w] of raw.works.entries()){
    const order=i%2?["rich","direct"]:["direct","rich"];
    for(const arm of order){
      const prompt=promptWork(w,arm);
      out.push({id:w.id+"_"+arm,sourceWork:w.id,condition:arm,
        sourceSha256:sha(w.facts),prompt,promptSha256:sha(prompt)});
    }
  }
  ensure(out.length===24,"BAD_WRITER_PLAN");
  return out;
}
function receiptPlanHash(plan){return sha({settings:REVISION_SETTINGS,plan});}
function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"));}
function strictReadPhase(dir,plan){
  const hash=receiptPlanHash(plan);
  const index=new Map(plan.map(p=>[p.id,p]));
  const summary=readJson(path.join(dir,"summary.json"));
  ensure(summary.planHash===hash&&summary.rows?.length===plan.length,"PHASE_SUMMARY_MISMATCH");
  for(const suffix of [".attempt.json",".result.json"]){
    const found=new Set(fs.readdirSync(dir).filter(f=>f.endsWith(suffix))
      .map(x=>x.slice(0,-suffix.length)));
    ensure(found.size===plan.length && [...found].every(id=>index.has(id)),
      "INCOMPLETE_OR_EXTRA_PHASE_RECEIPTS");
  }
  return new Map(plan.map(p=>{
    const attempt=readJson(path.join(dir,p.id+".attempt.json"));
    const response=readJson(path.join(dir,p.id+".result.json"));
    ensure(attempt.id===p.id&&response.id===p.id &&
      attempt.promptSha256===p.promptSha256 &&
      response.promptSha256===p.promptSha256&&attempt.planHash===hash,
      "PHASE_REQUEST_IDENTITY_MISMATCH_"+p.id);
    if(response.outcome==="GENERATED") {
      ensure(typeof response.text==="string"&&response.text.trim() &&
        sha(response.text)===response.textSha256 &&
        response.finishReason==="stop" &&
        Number.isInteger(response.usage?.total_tokens),"RESPONSE_BYTES_OR_USAGE_MISMATCH_"+p.id);
    }
    return [p.id,response];
  }));
}
function requireComplete(receipts,phase){
  const failures=[...receipts].filter(([,r])=>r.outcome!=="GENERATED");
  ensure(failures.length===0,phase+"_INCOMPLETE_"+failures.map(x=>x[0]).join(","));
  return receipts;
}
function writerRows(root){
  const receipts=requireComplete(strictReadPhase(path.join(root,"writers"),buildWriterPlan()),"WRITERS");
  return raw.works.map(w=>{
    const direct=receipts.get(w.id+"_direct"),rich=receipts.get(w.id+"_rich");
    return {work:w,direct,rich};
  });
}
function auditPrompt(w,arm,paragraph){
  return [{role:"system",content:AUDIT_SYSTEM},
    {role:"user",content:JSON.stringify({genre:w.genre,task:w.task,
      originalSourceFacts:w.facts,detailLicense:w.license||null,
      candidate:paragraph, auditScope:"unsupported added claims and altered scope only"})}];
}
function buildAuditPlan(root){
  const plan=[];
  for(const [i,{work,direct,rich}] of writerRows(root).entries()){
    const order=i%2?["rich","direct"]:["direct","rich"];
    for(const arm of order){
      const candidate=arm==="direct"?direct:rich;
      const prompt=auditPrompt(work,arm,candidate.text);
      plan.push({id:work.id+"_audit_"+arm,sourceWork:work.id,condition:"audit_"+arm,
        observedTextSha256:candidate.textSha256,prompt,promptSha256:sha(prompt)});
    }
  }
  ensure(plan.length===24,"BAD_AUDIT_PLAN");return plan;
}
function uniqueSpan(source,quote){
  if(typeof quote!=="string"||!quote||quote!==quote.trim())return null;
  const at=source.indexOf(quote);
  if(at<0||source.indexOf(quote,at+1)>=0)return null;
  return [at,at+quote.length];
}
function parseAudit(text,w,candidate){
  let obj;try{obj=JSON.parse(text.trim());}catch{return {valid:false,reason:"NON_JSON"}}
  if(!obj||typeof obj!=="object"||Array.isArray(obj)||
    Object.keys(obj).sort().join("|")!=="risks|status"||
    !STATUS.includes(obj.status)||!Array.isArray(obj.risks)||
    obj.risks.length>5||((obj.status==="RISK")!==Boolean(obj.risks.length)))
    return {valid:false,reason:"BAD_AUDIT_SCHEMA"};
  const cleaned=[];
  for(const item of obj.risks){
    if(!item||typeof item!=="object"||Array.isArray(item)||
      Object.keys(item).sort().join("|")!=="kind|outputQuote|sourceFactIndex|sourceQuote"||
      !KINDS.has(item.kind)||!Number.isInteger(item.sourceFactIndex)||
      item.sourceFactIndex<1||item.sourceFactIndex>w.facts.length)
      return {valid:false,reason:"BAD_AUDIT_RISK"};
    const outputSpan=uniqueSpan(candidate,item.outputQuote);
    const sourceSpan=uniqueSpan(w.facts[item.sourceFactIndex-1],item.sourceQuote);
    if(!outputSpan||!sourceSpan)return {valid:false,reason:"UNANCHORED_RISK_EVIDENCE"};
    cleaned.push({...item,outputSpan,sourceSpan});
  }
  return {valid:true,status:obj.status,risks:cleaned,
    labelAuthority:"MODEL_SELF_AUDIT_NOT_INDEPENDENT_SOURCE_GOLD"};
}
function auditedRows(root){
  const rows=writerRows(root);
  const plan=buildAuditPlan(root);
  const receipt=requireComplete(strictReadPhase(path.join(root,"audits"),plan),"AUDITS");
  return rows.map(row=>{
    const audits={};
    for(const arm of ARMS){
      const candidate=row[arm];
      audits[arm]=parseAudit(receipt.get(row.work.id+"_audit_"+arm).text,row.work,candidate.text);
    }
    return {...row,audits,auditReceipts:{
      direct:receipt.get(row.work.id+"_audit_direct"),
      rich:receipt.get(row.work.id+"_audit_rich")
    }};
  });
}
function controller(audits) {
  const a=audits.direct,b=audits.rich;
  if(!a?.valid||!b?.valid||a.status==="UNCERTAIN"||b.status==="UNCERTAIN")
    return {choice:"direct",status:"ABSTAIN_KEEP_DIRECT",
      reason:"INVALID_OR_UNCERTAIN_MODEL_SELF_AUDIT"};
  const ac=a.risks.length,bc=b.risks.length;
  if(ac<bc)return {choice:"direct",status:"SELECTED",reason:"FEWER_MODEL_REPORTED_RISKS"};
  if(bc<ac)return {choice:"rich",status:"SELECTED",reason:"FEWER_MODEL_REPORTED_RISKS"};
  return {choice:"direct",status:"TIE_KEEP_DIRECT",reason:"NO_MODEL_REPORTED_RISK_ADVANTAGE"};
}
function selectionPrompt(row){
  return [{role:"system",content:SELECT_SYSTEM},
    {role:"user",content:JSON.stringify({
      task:{genre:row.work.genre,audience:row.work.audience,purpose:row.work.purpose,
        requestedText:row.work.task,facts:row.work.facts,
        detailLicense:row.work.license||null},
      candidateA:{name:"direct",text:row.direct.text},
      candidateB:{name:"rich",text:row.rich.text},
      identicalStructuredRiskState:row.audits
    })}];
}
function buildChooserPlan(root) {
  return auditedRows(root).map(row=>{
    const prompt=selectionPrompt(row);
    return {id:row.work.id+"_state_text_choice",sourceWork:row.work.id,
      condition:"state_as_text",sourceSha256:sha(row.work.facts),
      candidateHashes:{direct:row.direct.textSha256,rich:row.rich.textSha256},
      prompt,promptSha256:sha(prompt)};
  });
}
function parseChoice(text){
  let obj;try{obj=JSON.parse(text.trim());}catch{return {valid:false,reason:"NON_JSON"}}
  if(!obj||typeof obj!=="object"||Array.isArray(obj)||
    Object.keys(obj).sort().join("|")!=="choice|reason"||
    !ARMS.includes(obj.choice)||typeof obj.reason!=="string"||
    !obj.reason.trim()||obj.reason.length>400)
    return {valid:false,reason:"BAD_CHOICE_SCHEMA"};
  return {valid:true,choice:obj.choice,reason:obj.reason};
}
function score(root){
  const rows=auditedRows(root),chooser=buildChooserPlan(root),
    responses=strictReadPhase(path.join(root,"chooser"),chooser);
  const outcomes=rows.map(row=>{
    const id=row.work.id+"_state_text_choice";
    const response=responses.get(id);
    const modelChoice=response.outcome==="GENERATED"?parseChoice(response.text):
      {valid:false,reason:"MODEL_"+response.outcome};
    const executable=controller(row.audits);
    const selectModel=modelChoice.valid?modelChoice.choice:null;
    return {sourceWork:row.work.id,genre:row.work.genre,
      candidateSha256:{direct:row.direct.textSha256,rich:row.rich.textSha256},
      candidateTextsEqual:row.direct.text===row.rich.text,
      riskState:row.audits,
      executable,
      stateAsText:modelChoice,
      exactSelectedSha256:{
        direct:row.direct.textSha256,rich:row.rich.textSha256,
        controller:row[executable.choice].textSha256,
        stateAsText:selectModel?row[selectModel].textSha256:null
      },
      callTokens:{
        direct:row.direct.usage?.total_tokens||0,rich:row.rich.usage?.total_tokens||0,
        auditDirect:row.auditReceipts.direct.usage?.total_tokens||0,
        auditRich:row.auditReceipts.rich.usage?.total_tokens||0,
        chooser:response.usage?.total_tokens||0
      },
      resultStatuses:{direct:row.direct.outcome,rich:row.rich.outcome,
        auditDirect:row.auditReceipts.direct.outcome,
        auditRich:row.auditReceipts.rich.outcome,chooser:response.outcome}
    };
  });
  const sums=k=>outcomes.reduce((v,x)=>v+x.callTokens[k],0);
  const byArm=Object.fromEntries(["direct","rich","auditDirect","auditRich","chooser"].map(k=>[k,sums(k)]));
  return {schema:"ksgt.g10p2.r4a.exposed-chooser-results.v1",
    warning:"NO_INDEPENDENT_KOREAN_READERS; MODEL_SELF_AUDIT_NOT_FACTUAL_GOLD; NO_EQUAL_COST_COMPLEX_COMPARISON",
    sourceWorks:outcomes.length,providerAttempts:outcomes.length*5,
    successfulCalls:outcomes.reduce((v,x)=>v+Object.values(x.resultStatuses).filter(s=>s==="GENERATED").length,0),
    byArmTokens:byArm,totalTokens:Object.values(byArm).reduce((a,b)=>a+b,0),
    validAuditPairs:outcomes.filter(x=>x.riskState.direct.valid&&x.riskState.rich.valid).length,
    controllerAbstentions:outcomes.filter(x=>x.executable.status==="ABSTAIN_KEEP_DIRECT").length,
    controllerChoseRich:outcomes.filter(x=>x.executable.choice==="rich").length,
    textChoseRich:outcomes.filter(x=>x.stateAsText.choice==="rich").length,
    validTextChoices:outcomes.filter(x=>x.stateAsText.valid).length,
    selectionsAgree:outcomes.filter(x=>x.stateAsText.valid&&x.stateAsText.choice===x.executable.choice).length,
    exactSameCandidates:outcomes.filter(x=>x.candidateTextsEqual).length,
    independentReaderRatings:0,independentSourceAudits:0,rows:outcomes};
}
function writeNoOverwrite(name,value){fs.writeFileSync(name,JSON.stringify(value,null,2)+"\n",{flag:"wx",mode:0o600});}
async function run(root,{exec=executePlan}={}){
  if(fs.existsSync(root))throw Error("REFUSE_EXISTING_R4A_OUTPUT");
  fs.mkdirSync(root,{mode:0o700});
  const p=buildWriterPlan();
  writeNoOverwrite(path.join(root,"frozen-writer-plan.json"),{
    settings:REVISION_SETTINGS,planHash:receiptPlanHash(p),
    cells:p.map(({prompt,...rest})=>rest)});
  const writers=await exec(p,path.join(root,"writers"));
  if(writers.rows.some(x=>x.outcome!=="GENERATED"))throw Error("WRITER_INCOMPLETE_RETAIN_RAW");
  const ap=buildAuditPlan(root);
  writeNoOverwrite(path.join(root,"audit-plan.json"),{
    settings:REVISION_SETTINGS,planHash:receiptPlanHash(ap),
    cells:ap.map(({prompt,...rest})=>rest)});
  const audits=await exec(ap,path.join(root,"audits"));
  if(audits.rows.some(x=>x.outcome!=="GENERATED"))throw Error("AUDIT_INCOMPLETE_RETAIN_RAW");
  const cp=buildChooserPlan(root);
  writeNoOverwrite(path.join(root,"choice-plan.json"),{
    settings:REVISION_SETTINGS,planHash:receiptPlanHash(cp),
    cells:cp.map(({prompt,...rest})=>rest)});
  await exec(cp,path.join(root,"chooser"));
  const result=score(root);
  writeNoOverwrite(path.join(root,"final-score.json"),result);
  return result;
}
async function main(args){
  const [mode,dir,...rest]=args;
  if(rest.length||!["--plan","--execute","--score"].includes(mode)||
     (mode==="--plan"&&dir)|| (mode!=="--plan"&&!dir))
    throw Error("USAGE --plan | --execute NEW_DIR | --score EXISTING_DIR");
  if(mode==="--plan") {
    const p=buildWriterPlan();
    console.log(JSON.stringify({status:"FROZEN_WRITER_FIRST_PHASE",
      settings:REVISION_SETTINGS,planHash:receiptPlanHash(p),providerRequests:60,
      sourceWorks:raw.works.length,prompts:p.map(({prompt,...rest})=>rest)},null,2));
  }
  if(mode==="--execute"){
    resolveProvider("groq");
    const s=await run(dir);
    console.log(JSON.stringify({sourceWorks:s.sourceWorks,generated:s.successfulCalls,
      providerAttempts:s.providerAttempts,totalTokens:s.totalTokens,
      controllerChoseRich:s.controllerChoseRich,selectionsAgree:s.selectionsAgree}));
    if(s.successfulCalls!==60)process.exitCode=1;
  }
  if(mode==="--score") console.log(JSON.stringify(score(dir),null,2));
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={raw,ARMS,validateFixture,promptWork,buildWriterPlan,receiptPlanHash,strictReadPhase,
  writerRows,buildAuditPlan,uniqueSpan,parseAudit,controller,selectionPrompt,parseChoice,buildChooserPlan,
  auditedRows,score,run};
