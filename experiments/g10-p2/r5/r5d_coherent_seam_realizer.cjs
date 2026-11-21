"use strict";
// R5d: manually identified discourse seam, executed as one bounded region patch.
// This is not a learned dependency graph or a validated native-reader model.
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const {chat,resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const r5c=require("./r5c_source_witnessed_realizer.cjs");
const book=require("./fixtures/r5d_frozen_four_discourse_seam_edges_v01.json");
const MODEL="openai/gpt-oss-120b",MAX=1450;
const sha=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const req=(x,n)=>{if(!x)throw Error(n)};
function selectedCases(oldRoot){
 const old=r5c.oldDrafts(oldRoot);
 req(book.schema==="ksgt.g10p2.r5d.predeclared-coherent-regions.v1"&&
 book.authority==="ADAPTIVE_DEVELOPER_SUBSET_AFTER_R5C_NOT_FRESH_HOLDOUT"&&
 book.model===MODEL&&book.cases.length===4,"BAD_R5D_CASEBOOK");
 req(new Set(book.cases.map(x=>x.sourceWork)).size===4,"DUP_R5D_SOURCE");
 return book.cases.map(entry=>{
  const base=old.get(entry.sourceWork);req(base,"R5D_SOURCE_NOT_FOUND");
  const text=base.original;
  for(const [k,q] of [["from",entry.from],["through",entry.through]]){
   req(typeof q==="string"&&q.length>6&&text.indexOf(q)>=0&&
     text.indexOf(q)===text.lastIndexOf(q),"R5D_INVALID_UNIQUE_"+k);
  }
  const a=text.indexOf(entry.from),b=text.indexOf(entry.through,a);
  req(b>=a&&a>=0,"R5D_ORDER_INVALID");
  const region=text.slice(a,b+entry.through.length);
  req(region.includes(base.target.quote)&&region.length<=Math.ceil(text.length*.4)&&
      region.length>base.target.quote.length,"R5D_NOT_BOUNDED_COHERENT");
  return {...base,seam:entry,seamQuote:region,seamStart:a,seamEnd:b+entry.through.length,
    regionRatio:region.length/text.length};
 });
}
function plan(oldRoot){
 const samples=selectedCases(oldRoot);
 const list=samples.map(o=>{
  const prompt=[{role:"system",content:"한국어 장르에 맞는 자연스러운 문장 실현과 원천 사실 보존을 동시에 담당한다. 실제 글의 인접 문장 간 연결까지 생각한다."},
   {role:"user",content:JSON.stringify({
    originalCompleteText:o.original,
    writerTask:o.w.task,genre:o.w.genre,audience:o.w.audience,
    sourceFacts:o.w.facts,sourceLicense:o.w.license,
    originalProblemQuote:o.target.quote,originalSourceWitness:o.target.refs,
    requiredWholeReplacementSpan:o.seamQuote,
    discourseDependency:o.seam.dependency,
    hypothesis:"삭제 또는 교체가 그때, 그 순간, 발걸음을 멈추다, 인과관계의 확실성처럼 주변 문맥에 미치는 영향을 한 구간 안에서 함께 수정한다.",
    outputRule:"교체 가능한 영역은 requiredWholeReplacementSpan의 정확한 한 번 등장하는 구간뿐이다. 전체 원문과 이어 붙여 읽었을 때 매끄러운 한국어를 작성한다. 필요 없으면 NO_OP. JSON 객체만 출력: {\"decision\":\"REPLACE\" 또는 \"NO_OP\",\"quote\":\"requiredWholeReplacementSpan 원문과 글자 단위 동일\",\"replacement\":\"해당 구간의 최종 한국어 문장들\",\"reason\":\"100자 이내\"}. 앞·뒤 문장과 연결되고 원천에 없는 사건이나 숫자나 확실성 강화가 없어야 한다."
   })}];
  return {id:o.w.id+"_SEAM",sourceWork:o.w.id,genre:o.w.genre,arm:"SEAM",
    priorTextSha256:o.sha,regionSha256:sha(o.seamQuote),sourceSha256:sha(o.w.facts),
    model:MODEL,prompt,promptSha256:sha(prompt)};
 });
 return list;
}
function planHash(xs){return sha({schema:"ksgt.g10p2.r5d.seam-calls.v1",model:MODEL,temperature:0,maxTokens:MAX,plan:xs})}
function write(file,obj){fs.writeFileSync(file,JSON.stringify(obj,null,2)+"\n",{flag:"wx",mode:0o600})}
function readReceipts(root,cells){
 const dir=path.join(root,"responses"),x=JSON.parse(fs.readFileSync(path.join(dir,"summary.json"),"utf8"));
 req(x.planHash===planHash(cells)&&x.rows?.length===cells.length,"R5D_SUMMARY_BAD");
 return new Map(cells.map(c=>{
  const attempt=JSON.parse(fs.readFileSync(path.join(dir,c.id+".attempt.json"),"utf8"));
  const row=JSON.parse(fs.readFileSync(path.join(dir,c.id+".result.json"),"utf8"));
  req(attempt.id===c.id&&attempt.planHash===planHash(cells)&&
    attempt.promptSha256===c.promptSha256&&row.id===c.id&&
    row.priorTextSha256===c.priorTextSha256&&row.regionSha256===c.regionSha256&&
    row.sourceSha256===c.sourceSha256&&row.promptSha256===c.promptSha256&&
    row.status==="GENERATED"&&row.finishReason==="stop"&&
    row.responseModel===MODEL&&row.modelRequested===MODEL&&
    row.textSha256===sha(row.text)&&Number.isInteger(row.usage?.total_tokens),
    "R5D_BAD_RECEIPT_"+c.id);
  return [c.id,row];
 }));
}
function score(root,oldR5b,priorR5c){
 const earlier=r5c.score(priorR5c,oldR5b),targets=selectedCases(oldR5b),cells=plan(oldR5b);
 const receipts=readReceipts(root,cells);
 const rows=targets.map(t=>{
  const old=earlier.rows.find(x=>x.sourceWork===t.w.id),r=receipts.get(t.w.id+"_SEAM");
  req(old,"R5D_MISSING_PREVIOUS_COMPARATOR");
  const merged=r5c.validatePatch(r.text,{...t,target:{...t.target,quote:t.seamQuote}});
  return {id:t.w.id,genre:t.w.genre,sourceFacts:t.w.facts,task:t.w.task,
   sourceRisk:t.w.risk,originalDefectQuote:t.target.quote,
   dependency:t.seam.dependency,continuitySpan:t.seamQuote,
   preservedOutsideRatio:1-t.regionRatio,
   previousB120:{text:t.original,sha256:t.sha,tokens:t.oldTokens},
   previousSingleSpan:{text:old.exactSpanEdit.text,status:old.exactSpanEdit.status,
     newCallTokens:old.exactSpanEdit.newCallTokens},
   previousFullRewrite:{text:old.entireRewrite.text,newCallTokens:old.entireRewrite.newCallTokens},
   seamEdit:{status:merged.status,reason:merged.reason,text:merged.text,sha256:sha(merged.text),
    newCallTokens:r.usage.total_tokens,mechanicalOutsideIdentity:merged.exactOutsideSpanIdentity??true}};
 });
 const states=Object.fromEntries(["APPLIED","REJECTED","NO_OP"].map(x=>[x,rows.filter(t=>t.seamEdit.status===x).length]));
 return {schema:"ksgt.g10p2.r5d.coherent-seam-development.v1",sourceWorks:4,newProviderCalls:4,
  previousR5bB120CallsReused:4,previousR5cModelCallsReused:8,comparableWholeTexts:16,
  outcomes:states,providerTokens:{newSeam:rows.reduce((n,r)=>n+r.seamEdit.newCallTokens,0),
    originalB120Historical:rows.reduce((n,r)=>n+r.previousB120.tokens,0),
    previousR5cSingleSpan:rows.reduce((n,r)=>n+r.previousSingleSpan.newCallTokens,0),
    previousR5cFullRewrite:rows.reduce((n,r)=>n+r.previousFullRewrite.newCallTokens,0)},
  actualIndependentNativeReaderVotes:0,independentSourceGold:0,
  confirmedProseQualitySuperiority:"NONE",originalSourceAuthority:"POSTHOC_SELECTED_EXPOSED_DEVELOPMENT",rows};
}
function readingPacket(s){
 const lines=["# R5d — 실제 완성문 네 가지 비교: 강한 직접 글 / 한 구절 수정 / 전체 재작성 / 연결 구간 수정",
 "원본 작품과 네 원고는 모두 같은 원천을 사용한다. 이전 원고를 이번에 새로 생성했다고 계산하지 않는다. 형식상 적용된 수정은 한국어 품질 향상을 보장하지 않는다."];
 const order=["previousB120","previousSingleSpan","previousFullRewrite","seamEdit"];
 for(const r of s.rows){
  lines.push("---\n\n## "+r.id+" · "+r.genre+"\n\n**작성 요청**: "+r.task+
   "\n\n**원천 사실**\n"+r.sourceFacts.map((x,i)=>(i+1)+". "+x).join("\n")+
   "\n\n**이전 결함**: "+r.originalDefectQuote+
   "\n\n**연결 근거**: "+r.dependency);
  for(const [i,arm] of order.entries())lines.push("### 원고 "+["A","B","C","D"][i]+
   "\n\n"+r[arm].text);
  lines.push("**적용 판정 (형식만)**: "+r.seamEdit.status+" / "+r.seamEdit.reason);
 }
 return lines.join("\n\n")+"\n";
}
async function run(root,oldR5b,priorR5c,{invoke=chat}={}){
 req(!fs.existsSync(root),"REFUSE_EXISTING_R5D_RUN");
 const cells=plan(oldR5b);
 // Read the previous exact real responses now, fail before any model call.
 const old=r5c.score(priorR5c,oldR5b);
 req(old.rows.length===8,"PRIOR_R5C_SOURCE_NOT_VERIFIED");
 fs.mkdirSync(root,{recursive:false,mode:0o700});
 write(path.join(root,"frozen-plan.json"),{planHash:planHash(cells),
  cells:cells.map(({prompt,...x})=>x),previousOriginalRun:44899223057,previousRepairRun:44900323773});
 const dir=path.join(root,"responses");fs.mkdirSync(dir,{mode:0o700});const rows=[];
 for(const cell of cells){
  write(path.join(dir,cell.id+".attempt.json"),{
   id:cell.id,promptSha256:cell.promptSha256,planHash:planHash(cells)});
  let row;
  try{
   const r=await invoke({provider:"groq",model:MODEL,messages:cell.prompt,temperature:0,maxTokens:MAX});
   row={id:cell.id,sourceWork:cell.sourceWork,promptSha256:cell.promptSha256,
    priorTextSha256:cell.priorTextSha256,regionSha256:cell.regionSha256,sourceSha256:cell.sourceSha256,
    modelRequested:MODEL,responseModel:r.responseModel,finishReason:r.finishReason,
    status:r.finishReason==="stop"?"GENERATED":"INCOMPLETE",text:r.text,
    textSha256:sha(r.text),usage:r.usage,latencyMs:r.latencyMs};
  }catch(e){
   row={id:cell.id,sourceWork:cell.sourceWork,promptSha256:cell.promptSha256,
    status:"PROVIDER_ERROR",errorCode:e.status||e.code||e.message||"UNKNOWN"};
  }
  write(path.join(dir,cell.id+".result.json"),row);
  rows.push({id:cell.id,status:row.status,tokens:row.usage?.total_tokens||0});
 }
 write(path.join(dir,"summary.json"),{planHash:planHash(cells),rows});
 req(rows.every(x=>x.status==="GENERATED"),"R5D_INCOMPLETE_RAW_RETAINED");
 const result=score(root,oldR5b,priorR5c);
 write(path.join(root,"final-score.json"),result);
 fs.writeFileSync(path.join(root,"plain-Korean-fourway-prose.md"),readingPacket(result),{flag:"wx",mode:0o600});
 return result;
}
async function main(args){
 const [mode,...rest]=args;
 if(mode==="--preflight"&&rest.length===1){
  const cells=plan(rest[0]);console.log(JSON.stringify({calls:cells.length,
   previousB120Originals:4,planHash:planHash(cells),
   works:cells.map(({prompt,...cell})=>cell)}));return;
 }
 if(mode==="--execute"&&rest.length===3){
  resolveProvider("groq");const s=await run(rest[0],rest[1],rest[2]),{rows,...totals}=s;
  console.log("R5d-real-generation",JSON.stringify(totals));return;
 }
 if(mode==="--score"&&rest.length===3){
  const s=score(rest[0],rest[1],rest[2]),{rows,...totals}=s;console.log(JSON.stringify(totals,null,2));return;
 }
 throw Error("USAGE --preflight R5B_ORIGINAL | --execute NEW_DIR R5B_ORIGINAL R5C_ORIGINAL | --score NEW_DIR R5B_ORIGINAL R5C_ORIGINAL");
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error("R5D_FAILED_BUT_RAW_PRESERVED",e.message);process.exitCode=1;});
module.exports={selectedCases,plan,planHash,readReceipts,score,readingPacket,run};
