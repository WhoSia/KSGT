"use strict";
/* G10-P2 R5a author-exposed *real prose* sensitivity experiment.
   Bounded controller question: actual-prefix state vs intended/plan state.
   No claim of independent reader outcomes; no score promotes quality authority.
*/
const fs=require("node:fs"),path=require("node:path");
const {createHash}=require("node:crypto");
const {executePlan}=require("../../g10-p1/r928_scope_and_prose_v01.cjs");
const {REVISION_SETTINGS}=require("../../g10-p1/r924_anchored_revision_v01.cjs");
const {resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const fixture=require("./fixtures/r5a_eight_prefix_source_works_v01.json");
const sha=value=>createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
const ok=(test,label)=>{if(!test)throw Error(label)};
const KINDS=["chat","science","notice","scene"],STATES=new Set(["STATED","NOT_STATED","UNCERTAIN"]);
const GENERAL="한국어 원천 자료와 작성 목적을 정확히 따르며 실제 독자가 쓸 수 있는 자연스러운 글을 작성한다. 의무·장소·시점·인과관계·확실성을 바꾸지 않으며, 확실하지 않은 내용은 사실처럼 추가하지 않는다. 문장만 출력하고 제목이나 작성 지침은 출력하지 않는다.";
const EXTRACTION="실제로 이미 작성된 접두사에서 독자가 확인할 수 있는 원천 사실을 분류한다. 원천의 모든 사실에 대해 1번부터 차례로 index,status,quote가 있는 JSON 객체 한 개를 출력한다. 최상위 키는 observations 하나이고 배열의 각 원소 키는 index,status,quote 정확히 셋이다. status는 STATED, NOT_STATED, UNCERTAIN 중 하나다. STATED일 때 quote는 실제 접두사에서 복사한 한 번만 등장하는 연속 부분 문자열이어야 한다. 나머지 status는 quote 빈 문자열을 사용한다. 단어가 일치한다는 이유로 원문과 다른 조건·행위자·시점의 내용을 STATED로 판정하지 않는다. 발화가 다른 경우 또는 의미 판정이 어렵다면 UNCERTAIN을 사용한다. 형식 밖 설명은 출력하지 않는다.";
const NEXT="위에 작성된 접두사를 보존하면서 그 바로 다음에 이어질 한국어 본문만 작성한다. 접두사와 같은 문장을 다시 쓰지 않는다. 원천의 필수 정보를 빠뜨리지 않으면서 두세 문장 정도로 자연스럽게 마무리한다. 원천에 없는 사건·절차·약속을 만들지 않는다. 장르에 맞지 않는 요약형 결말 해설을 덧붙이지 않는다.";
function validateFixture(x=fixture){
 ok(x.schema==="ksgt.g10p2.r5a.prefix-development.v1"&&
 x.status==="AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT_NO_INDEPENDENT_READER_GOLD"&&
 x.model===REVISION_SETTINGS.model&&x.temperature===REVISION_SETTINGS.temperature&&
 x.maxTokens===REVISION_SETTINGS.maxTokens&&
 Array.isArray(x.works)&&x.works.length===8,"INVALID_R5A_FIXTURE");
 const ids=new Set(),parents=new Set(),tally=Object.fromEntries(KINDS.map(k=>[k,0]));
 for(const w of x.works){
  ok(/^R5A_(CHAT|SCI|NOTICE|SCENE)_[A-Z]+$/.test(w.id)&&!ids.has(w.id),"DUPLICATED_OR_BAD_SOURCE_ID");
  ids.add(w.id);
  ok(typeof w.parent==="string"&&w.parent.startsWith("AUTHOR_R5A_")&&!parents.has(w.parent),"DUPLICATED_PARENT");
  parents.add(w.parent);
  ok(KINDS.includes(w.genre),"INVALID_GENRE");tally[w.genre]++;
  for(const k of ["audience","purpose","task","risk","readerQuestion","license"])
   ok(typeof w[k]==="string"&&w[k].length>=12,"MISSING_FIELD_"+k);
  ok(Array.isArray(w.facts)&&w.facts.length===5&&w.facts.every(t=>typeof t==="string"&&t.length>=20)&&new Set(w.facts).size===5,"INVALID_FACTS");
  ok(Number.isInteger(w.planFirstFactIndex)&&w.planFirstFactIndex>=1&&w.planFirstFactIndex<=w.facts.length,"INVALID_PLAN_FACT");
 }
 ok(Object.values(tally).every(n=>n===2),"GENRE_IMBALANCE");
 return x;
}
function writerPrompt(w,condition){
 const detail={genre:w.genre,reader:w.audience,writingPurpose:w.purpose,task:w.task,sourceFacts:w.facts,
 sourceRisk:w.risk,detailLicense:w.license,instruction:GENERAL};
 if(condition==="prefix")detail.outputBoundary="완성된 본문 앞부분의 첫 두 문장만 작성한다. 마지막 문장까지 결론을 강요하지 않고 뒷부분은 별도 호출에서 이어 쓴다.";
 else detail.outputBoundary="원천의 필수 정보를 모두 반영한 완결된 한국어 산문을 필요한 길이로 작성한다.";
 return [{role:"system",content:"한국어를 자연스럽고 정확하게 쓰는 전문 글쓰기 모델이다."},{role:"user",content:JSON.stringify(detail)}];
}
function buildWriterPlan(){
 validateFixture();
 return fixture.works.flatMap((w,i)=>(i%2?["prefix","direct"]:["direct","prefix"]).map(condition=>{
  const prompt=writerPrompt(w,condition);
  return {id:w.id+"_"+condition,sourceWork:w.id,condition,sourceSha256:sha(w.facts),prompt,promptSha256:sha(prompt)};
 }));
}
const phaseHash=p=>sha({settings:REVISION_SETTINGS,plan:p});
const read=f=>JSON.parse(fs.readFileSync(f,"utf8"));
function readPhase(dir,plan,{complete=true}={}){
 const index=new Map(plan.map(p=>[p.id,p])),summary=read(path.join(dir,"summary.json"));
 ok(summary.planHash===phaseHash(plan)&&summary.rows?.length===plan.length,"PLAN_HASH_MISMATCH");
 for(const suffix of [".result.json",".attempt.json"]){
  const names=fs.readdirSync(dir).filter(f=>f.endsWith(suffix)).map(f=>f.slice(0,-suffix.length));
  ok(names.length===plan.length&&names.every(n=>index.has(n)),"RECEIPT_MISSING_OR_EXTRA");
 }
 return new Map(plan.map(p=>{
  const a=read(path.join(dir,p.id+".attempt.json")),r=read(path.join(dir,p.id+".result.json"));
  ok(a.id===p.id&&r.id===p.id&&a.promptSha256===p.promptSha256&&
   r.promptSha256===p.promptSha256&&a.planHash===phaseHash(plan),"RECEIPT_IDENTITY_MISMATCH");
  if(complete)ok(r.outcome==="GENERATED"&&typeof r.text==="string"&&r.text.trim()&&
   r.textSha256===sha(r.text)&&r.finishReason==="stop"&&
   Number.isInteger(r.usage?.total_tokens),"INCOMPLETE_OR_BAD_SHA_"+p.id);
  return [p.id,r];
 }));
}
function writtenRows(root){
 const original=readPhase(path.join(root,"writers"),buildWriterPlan());
 return fixture.works.map(w=>({w,direct:original.get(w.id+"_direct"),prefix:original.get(w.id+"_prefix")}));
}
function buildExtractPlan(root){
 return writtenRows(root).map(({w,prefix})=>{
  const prompt=[{role:"system",content:EXTRACTION},
   {role:"user",content:JSON.stringify({sourceFacts:w.facts,actualRealizedPrefix:prefix.text,
    warning:"실제로 적힌 글에서 독자가 복원할 수 있는 것을 추정하는 자기모델 검사이며 인간 정답이 아니다."})}];
  return {id:w.id+"_extract",sourceWork:w.id,condition:"extract",
   sourceSha256:sha(w.facts),observedPrefixSha256:prefix.textSha256,
   prompt,promptSha256:sha(prompt)};
 });
}
function parseExtraction(text,prefix,facts){
 let j;try{j=JSON.parse(text.trim())}catch{return {valid:false,reason:"NON_JSON",observations:facts.map((_,i)=>({index:i+1,status:"UNCERTAIN",quote:""}))}};
 if(!j||typeof j!=="object"||Array.isArray(j)||Object.keys(j).join("|")!=="observations"||
 !Array.isArray(j.observations)||j.observations.length!==facts.length)
  return {valid:false,reason:"BAD_SCHEMA",observations:facts.map((_,i)=>({index:i+1,status:"UNCERTAIN",quote:""}))};
 for(let i=0;i<facts.length;i++){
  const v=j.observations[i];
  if(!v||typeof v!=="object"||Array.isArray(v)||
   Object.keys(v).sort().join("|")!=="index|quote|status"||v.index!==i+1||
   !STATES.has(v.status)||typeof v.quote!=="string")return {valid:false,reason:"BAD_OBSERVATION",observations:facts.map((_,k)=>({index:k+1,status:"UNCERTAIN",quote:""}))};
  const at=prefix.indexOf(v.quote);
  if(v.status==="STATED"){
   if(v.quote.length<3||v.quote!==v.quote.trim()||at<0||prefix.indexOf(v.quote,at+1)>=0)
    return {valid:false,reason:"UNANCHORED_QUOTE",observations:facts.map((_,k)=>({index:k+1,status:"UNCERTAIN",quote:""}))};
  }else if(v.quote!=="")return {valid:false,reason:"NONSTATED_QUOTE",observations:facts.map((_,k)=>({index:k+1,status:"UNCERTAIN",quote:""}))};
 }
 return {valid:true,reason:null,observations:j.observations,
  authority:"MODEL_EXTRACTOR_ANCHORED_SURFACE_NOT_SEMANTIC_GOLD"};
}
function sourceRows(root){
 const written=writtenRows(root),plan=buildExtractPlan(root),receipts=readPhase(path.join(root,"extractors"),plan);
 return written.map(row=>({...row,extractReceipt:receipts.get(row.w.id+"_extract"),
  observed:parseExtraction(receipts.get(row.w.id+"_extract").text,row.prefix.text,row.w.facts)}));
}
function stateFor(w,observed,arm){
 if(arm==="observed")return observed.observations.map(v=>({index:v.index,status:v.status,quote:v.quote}));
 // Deliberately planned-not-realized state; it is NOT source or reader gold.
 return w.facts.map((_,i)=>({index:i+1,status:i+1===w.planFirstFactIndex?"STATED":"NOT_STATED",quote:""}));
}
function continuationPrompt(w,prefix,state){
 return [{role:"system",content:"이미 쓰인 실제 한국어 문장의 뒤를 이어 글 전체의 목적을 완수한다."},
  {role:"user",content:JSON.stringify({
   genre:w.genre,reader:w.audience,writingPurpose:w.purpose,task:w.task,
   sourceFacts:w.facts,sourceRisk:w.risk,detailLicense:w.license,actualPrefix:prefix,
   readerStateNotes:state,instruction:NEXT
  })}];
}
function buildContinuationPlan(root){
 return sourceRows(root).flatMap(({w,prefix,observed},i)=>
  (i%2?["plan","observed"]:["observed","plan"]).map(condition=>{
   const prompt=continuationPrompt(w,prefix.text,stateFor(w,observed,condition));
   return {id:w.id+"_"+condition,sourceWork:w.id,condition,
    observedPrefixSha256:prefix.textSha256,sourceSha256:sha(w.facts),
    prompt,promptSha256:sha(prompt)};
  }));
}
function score(root){
 const rows=sourceRows(root),plan=buildContinuationPlan(root),
 receipts=readPhase(path.join(root,"continuations"),plan);
 const outcomes=rows.map(({w,direct,prefix,observed,extractReceipt})=>{
  const outputs={};
  for(const arm of ["observed","plan"]){
   const rec=receipts.get(w.id+"_"+arm);
   const full=prefix.text.trim()+"\n"+rec.text.trim();
   outputs[arm]={fullTextSha256:sha(full),fullText:full,continuationTextSha256:rec.textSha256,
    continuation:rec.text,extraTokens:rec.usage.total_tokens,
    startsByRepeatingPrefix:rec.text.trim().startsWith(prefix.text.trim()),
    action:"PREFIX_PLUS_CONTINUATION"};
  }
  const pred=stateFor(w,observed,"plan").map(x=>x.status);
  const inferred=stateFor(w,observed,"observed").map(x=>x.status);
  return {id:w.id,genre:w.genre,sourceParent:w.parent,sourceSha256:sha(w.facts),
   direct:{text:direct.text,sha256:direct.textSha256,tokens:direct.usage.total_tokens},
   sharedPrefix:{text:prefix.text,sha256:prefix.textSha256,tokens:prefix.usage.total_tokens},
   extractedState:observed,extractorTokens:extractReceipt.usage.total_tokens,
   planState:stateFor(w,observed,"plan"),
   plannedVsObservedStatusesDiffer:pred.some((v,i)=>v!==inferred[i]),
   planFirstFactObserved:observed.observations[w.planFirstFactIndex-1].status==="STATED",
   completions:outputs,returnedTextsIdentical:outputs.observed.fullText===outputs.plan.fullText,
   costs:{direct:direct.usage.total_tokens,
    planOnly:prefix.usage.total_tokens+outputs.plan.extraTokens,
    observedState:prefix.usage.total_tokens+extractReceipt.usage.total_tokens+outputs.observed.extraTokens}};
 });
 const s=k=>outcomes.reduce((t,r)=>t+r.costs[k],0);
 return {schema:"ksgt.g10p2.r5a.realized-prefix-pilot.v1",
   studyStatus:"ACTUAL_MODEL_OUTPUT_DEVELOPMENT_ONLY_NO_INDEPENDENT_READER_GOLD",
   sourceWorks:8,callCount:40,completeTexts:24,
   sourceIdentityAuthority:"AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT",
   extractionValid:outcomes.filter(o=>o.extractedState.valid).length,
   statusContrastWorks:outcomes.filter(o=>o.plannedVsObservedStatusesDiffer).length,
   firstPlannedFactObservedWorks:outcomes.filter(o=>o.planFirstFactObserved).length,
   twoContinuationTextsIdentical:outcomes.filter(o=>o.returnedTextsIdentical).length,
   providerTokens:{directTotal:s("direct"),planTotalAllocated:s("planOnly"),
    observedTotalAllocated:s("observedState"),
    fullResearchAllCalls:outcomes.reduce((t,o)=>t+o.direct.tokens+o.sharedPrefix.tokens+
     o.extractorTokens+o.completions.plan.extraTokens+o.completions.observed.extraTokens,0)},
   realIndependentReaderRatings:0,independentSourceAuditorJudgments:0,
   executableStateEffect:"NOT_TESTED",proseQualityAdvantage:"UNESTABLISHED",
   rows:outcomes};
}
function noOverwrite(file,data){
 fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n",{flag:"wx",mode:0o600});
}
async function run(root,{execute=executePlan}={}){
 validateFixture();
 ok(!fs.existsSync(root),"REFUSE_EXISTING_R5A_OUTPUT");
 fs.mkdirSync(root,{recursive:false,mode:0o700});
 const steps=[
  ["writers",()=>buildWriterPlan()],
  ["extractors",()=>buildExtractPlan(root)],
  ["continuations",()=>buildContinuationPlan(root)]
 ];
 for(const [phase,build] of steps){
  const plan=build();
  noOverwrite(path.join(root,phase+"-frozen-plan.json"),{
   settings:REVISION_SETTINGS,phaseHash:phaseHash(plan),cells:plan.map(({prompt,...other})=>other)});
  await execute(plan,path.join(root,phase));
  readPhase(path.join(root,phase),plan);
 }
 const result=score(root);
 noOverwrite(path.join(root,"final-score.json"),result);
 return result;
}
async function main(args){
 const [mode,directory,...extra]=args;
 if(extra.length||!["--plan","--execute","--score"].includes(mode)||
 (mode!=="--plan"&&!directory)||(mode==="--plan"&&directory))
  throw Error("USAGE --plan | --execute NEW_OUTPUT_DIR | --score EXISTING_OUTPUT_DIR");
 if(mode==="--plan"){
  const plan=buildWriterPlan();
  console.log(JSON.stringify({sourceWorks:fixture.works.length,plannedTotalCalls:40,
   writerPlanHash:phaseHash(plan),works:fixture.works.map(w=>({id:w.id,parent:w.parent,genre:w.genre})),
   cells:plan.map(({prompt,...v})=>v)}));
 }
 if(mode==="--execute"){
  resolveProvider("groq");
  const result=await run(directory),{rows,...totals}=result;
  console.log("R5a-real-prose-run",JSON.stringify(totals));
 }
 if(mode==="--score"){
  const {rows,...totals}=score(directory);
  console.log(JSON.stringify(totals,null,2));
 }
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{
 console.error("R5A_FAILED_RAW_RETAINED",e.message);process.exitCode=1;
});
module.exports={fixture,validateFixture,writerPrompt,buildWriterPlan,readPhase,buildExtractPlan,
 parseExtraction,stateFor,continuationPrompt,buildContinuationPlan,score,run};
