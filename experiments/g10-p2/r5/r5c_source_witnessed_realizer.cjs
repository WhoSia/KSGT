"use strict";
// R5c: genuinely executable Korean surface repair; no claims that string checks are semantic gold.
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const {chat,resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const r5a=require("./r5a_realized_prefix_prose.cjs");
const frozen=require("./fixtures/r5c_frozen_strong_draft_eight_targets_v01.json");
const MODEL="openai/gpt-oss-120b",SETTINGS=Object.freeze({provider:"groq",temperature:0,maxTokens:1450,model:MODEL});
const H=v=>createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
const must=(yes,name)=>{if(!yes)throw Error(name)};
const validKeys=(o,keys)=>!!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).sort().join("|")===keys.slice().sort().join("|");
const STEPS=["PATCH","REWRITE"];
function sourceFor(id){const w=r5a.fixture.works.find(x=>x.id===id);must(w,"UNKNOWN_SOURCE_"+id);return w}
function manifestCheck(){
 r5a.validateFixture();
 must(frozen.schema==="ksgt.g10p2.r5c.frozen-8-target-v1"&&
 frozen.studyAuthority==="AUTHOR_VISIBLE_FROZEN_DEVELOPMENT_TARGETS_NOT_INDEPENDENT_SOURCE_GOLD"&&
 frozen.sourceModel===MODEL&&frozen.targets.length===8,"BAD_R5C_FROZEN");
 must(new Set(frozen.targets.map(x=>x.sourceWork)).size===8,"DUP_TARGET");
 for(const x of frozen.targets){
  const w=sourceFor(x.sourceWork);
  must(/^[a-f0-9]{64}$/.test(x.originalTextSha256)&&
       /^[a-f0-9]{64}$/.test(x.originalPromptSha256),"BAD_FROZEN_SHA");
  must(x.originalTotalTokens>=150&&
       x.originalPromptSha256===H(r5a.writerPrompt(w,"direct")),"BAD_ORIGINAL_PROMPT");
  must(typeof x.quote==="string"&&x.quote.length>=15&&x.quote.length<=300&&
       typeof x.diagnosis==="string"&&x.diagnosis.length>=30&&
       Array.isArray(x.refs)&&x.refs.length&&
       x.refs.every(n=>Number.isInteger(n)&&n>=1&&n<=w.facts.length)&&
       new Set(x.refs).size===x.refs.length,"INVALID_SOURCE_WITNESS");
 }
 return true;
}
function oldDrafts(oldRoot){
 manifestCheck();
 const dir=path.join(oldRoot,"r5b-live","responses");
 const results=new Map();
 for(const target of frozen.targets){
  const id=target.sourceWork;const o=JSON.parse(fs.readFileSync(path.join(dir,id+"_B120.result.json"),"utf8"));
  must(o.sourceWork===id&&o.arm==="B120"&&
       o.modelRequested===MODEL&&o.responseModel===MODEL&&
       o.promptSha256===target.originalPromptSha256&&
       o.textSha256===target.originalTextSha256&&
       H(o.text)===target.originalTextSha256&&o.usage.total_tokens===target.originalTotalTokens&&
       o.status==="GENERATED"&&o.finishReason==="stop","B120_COLD_ORIGINAL_MISMATCH_"+id);
  must(o.text.indexOf(target.quote)>=0&&
       o.text.indexOf(target.quote)===o.text.lastIndexOf(target.quote),"QUOTE_NOT_UNIQUE_"+id);
  results.set(id,{target,original:o.text,sha:o.textSha256,oldTokens:o.usage.total_tokens,w:sourceFor(id)});
 }
 must(results.size===8,"EXPECTED_EIGHT_B120_DRAFTS");return results;
}
function promptCell(record,arm){
 const {target,original,w}=record;
 must(STEPS.includes(arm),"UNKNOWN_ARM");
 const common={
  originalCompleteKoreanText:original,task:w.task,genre:w.genre,
  intendedReader:w.audience,writingPurpose:w.purpose,
  sourceFacts:w.facts,license:w.license,
  hardRisk:w.risk,problem:{
   exactQuote:target.quote,kind:target.kind,investigatorDiagnosis:target.diagnosis,
   factReferences1Based:target.refs
  },
  universalPolicy:"한국어 표현의 자연스러운 호흡·어휘·정보 순서를 존중한다. 원천에 없는 사건·약속·시각·인과·확실성·새 등장인물을 추가하지 않는다. 진단한 문제를 고치되 다른 중요한 사실을 훼손하지 않는다."
 };
 const outputRule=arm==="PATCH"?
  "원문에서 지정한 exactQuote 한 구절만 수정할 수 있다. 고칠 필요가 없으면 NO_OP로 답한다. 다른 구절은 절대로 변경하지 않는다. 한국어 자연스러운 표현을 중시한다. **오직 단일 JSON 객체**를 출력한다: {\"decision\":\"REPLACE\" 또는 \"NO_OP\",\"quote\":\"입력의 exactQuote와 글자 단위로 동일\",\"replacement\":\"교체할 한국어 구절, 삭제이면 빈 문자열\",\"reason\":\"100자 이내 이유\"}. NO_OP이면 replacement 빈 문자열. JSON 밖의 마크다운·설명 불허.":
  "같은 결함 진단과 원천 사실을 사용하되 한 구절만 고칠 의무는 없다. 전체 문서를 처음부터 자연스럽게 재작성한다. 유용한 모든 원천 정보를 유지하고 환각, 장황한 반복, 공허한 마지막 설명을 제거한다. **완성된 본문만 출력**하며 JSON이나 해설을 쓰지 않는다.";
 const prompt=[{role:"system",content:"당신은 원천 사실을 존중하는 한국어 산문 편집자다. 원문 밖의 사실을 추가하지 않는다."},
  {role:"user",content:JSON.stringify({...common,outputRule})}];
 return {id:target.sourceWork+"_"+arm,sourceWork:target.sourceWork,arm,model:MODEL,
   priorTextSha256:target.originalTextSha256,sourceSha256:H(w.facts),prompt,promptSha256:H(prompt)};
}
function plan(oldRoot){
 const originals=oldDrafts(oldRoot),cells=[];
 for(const [i,w] of r5a.fixture.works.entries()){
  const items=i%2===0?STEPS:[...STEPS].reverse();
  for(const a of items)cells.push(promptCell(originals.get(w.id),a));
 }
 must(cells.length===16&&new Set(cells.map(c=>c.id)).size===16,"BAD_PLAN_LENGTH");
 return cells;
}
function planHash(cells){return H({schema:"ksgt.g10p2.r5c.live-call-plan.v1",settings:SETTINGS,cells});}
function put(file,obj){fs.writeFileSync(file,JSON.stringify(obj,null,2)+"\n",{flag:"wx",mode:0o600})}
function numericTokens(s){
 return new Set((s.normalize("NFKC").match(/\d+(?:[.,]\d+)*/g)||[]).map(t=>t.replace(/,/g,"")));
}
function validatePatch(raw,record){
 const {original,target,w}=record;
 let obj;try{obj=JSON.parse(raw.trim())}catch{return {status:"REJECTED",reason:"NON_JSON",text:original}};
 if(!validKeys(obj,["decision","quote","replacement","reason"])||
    !["REPLACE","NO_OP"].includes(obj.decision)||obj.quote!==target.quote||
    typeof obj.replacement!=="string"||obj.replacement.length>600||
    typeof obj.reason!=="string"||obj.reason.length>200)
    return {status:"REJECTED",reason:"SCHEMA_QUOTE_OR_LENGTH",text:original};
 if(obj.decision==="NO_OP"){
  if(obj.replacement!=="")return {status:"REJECTED",reason:"BAD_NOOP",text:original};
  return {status:"NO_OP",reason:obj.reason,text:original};
 }
 if(obj.replacement===target.quote)return {status:"NO_OP",reason:"IDENTICAL_REPLACEMENT",text:original};
 const authorized=numericTokens(w.facts.join(" ")),proposed=numericTokens(obj.replacement);
 if([...proposed].some(n=>!authorized.has(n)))return {status:"REJECTED",reason:"NOVEL_NUMERIC_NOT_IN_SOURCE",text:original};
 const pos=original.indexOf(target.quote),next=original.slice(0,pos)+obj.replacement+original.slice(pos+target.quote.length);
 if(pos<0||original.indexOf(target.quote,pos+1)>=0)return {status:"REJECTED",reason:"NONUNIQUE_TARGET",text:original};
 if(next===original)return {status:"NO_OP",reason:"SAME_TEXT",text:original};
 return {status:"APPLIED",reason:obj.reason,originalSpan:target.quote,replacement:obj.replacement,text:next,
  hasOriginalQuoteStill:next.includes(target.quote),
  exactOutsideSpanIdentity:next.startsWith(original.slice(0,pos))&&
    next.endsWith(original.slice(pos+target.quote.length))};
}
function readReceipts(root,cells){
 const dir=path.join(root,"responses"),summary=JSON.parse(fs.readFileSync(path.join(dir,"summary.json"),"utf8"));
 const h=planHash(cells);must(summary.planHash===h&&summary.rows.length===cells.length,"R5C_SUMMARY_OR_PLAN_MISMATCH");
 const exp=new Set(cells.map(x=>x.id));
 for(const ext of [".attempt.json",".result.json"]){
  const ids=fs.readdirSync(dir).filter(f=>f.endsWith(ext)).map(f=>f.slice(0,-ext.length));
  must(ids.length===exp.size&&ids.every(x=>exp.has(x)),"R5C_MISSING_OR_EXTRA_RAW_"+ext);
 }
 return new Map(cells.map(c=>{
  const a=JSON.parse(fs.readFileSync(path.join(dir,c.id+".attempt.json"),"utf8"));
  const r=JSON.parse(fs.readFileSync(path.join(dir,c.id+".result.json"),"utf8"));
  must(a.id===c.id&&a.planHash===h&&a.promptSha256===c.promptSha256&&
   r.id===c.id&&r.promptSha256===c.promptSha256&&r.sourceSha256===c.sourceSha256&&
   r.priorTextSha256===c.priorTextSha256&&r.modelRequested===MODEL&&r.responseModel===MODEL&&
   r.status==="GENERATED"&&r.finishReason==="stop"&&H(r.text)===r.textSha256&&
   Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0,"R5C_RAW_RECEIPT_INVALID_"+c.id);
  return [c.id,r];
 }));
}
function score(root,oldRoot){
 const old=oldDrafts(oldRoot),cells=plan(oldRoot),responses=readReceipts(root,cells);
 const rows=r5a.fixture.works.map(w=>{
  const o=old.get(w.id);const patch=responses.get(w.id+"_PATCH"),rewrite=responses.get(w.id+"_REWRITE");
  const runPatch=validatePatch(patch.text,o);
  return {sourceWork:w.id,genre:w.genre,sourceFacts:w.facts,task:w.task,target:o.target,
   original:{text:o.original,sha256:o.sha,tokens:o.oldTokens},
   exactSpanEdit:{status:runPatch.status,reason:runPatch.reason,
    sourceSyntaxAuthority:"STRING_ANCHOR_AND_NUMERIC_GUARD_NOT_SEMANTIC_GOLD",
    text:runPatch.text,sha256:H(runPatch.text),newCallTokens:patch.usage.total_tokens,
    modelRawReply:patch.text,exactOutsideSpanIdentity:runPatch.exactOutsideSpanIdentity??true,
    targetPhraseStillPresent:runPatch.text.includes(o.target.quote)},
   entireRewrite:{text:rewrite.text,sha256:rewrite.textSha256,newCallTokens:rewrite.usage.total_tokens,
    targetPhraseStillPresent:rewrite.text.includes(o.target.quote)}};
 });
 const statuses=Object.fromEntries(["APPLIED","NO_OP","REJECTED"].map(x=>[x,rows.filter(r=>r.exactSpanEdit.status===x).length]));
 return {schema:"ksgt.g10p2.r5c.source-witnessed-minimal-edit.v1",studyStatus:"REAL_120B_WRITER_CALLS_EXPOSED_DEVELOPMENT_HUMAN_QUALITY_UNPROVEN",
  sourceWorks:8,newProviderCalls:16,reusedHistoricalB120Calls:8,wholeDocuments:24,
  outcomes:statuses,providerTokens:{
    oldB120OriginalPrior:rows.reduce((v,r)=>v+r.original.tokens,0),
    strictEditNew:rows.reduce((v,r)=>v+r.exactSpanEdit.newCallTokens,0),
    fullRewriteNew:rows.reduce((v,r)=>v+r.entireRewrite.newCallTokens,0),
    actualAllNewCalls:rows.reduce((v,r)=>v+r.exactSpanEdit.newCallTokens+r.entireRewrite.newCallTokens,0)},
  humanReaderVotes:0,independentSemanticGold:0,qualitySuperiority:"UNPROVEN",
  autoPatchAcceptanceIsNaturalnessOrSemanticScore:false,rows};
}
function readingPacket(s){
 const part=["# R5c — 실제 한국어 산문: 원천 근거 최소 수정과 완전 재작성 (8개 글감 × 3편)",
 "모든 원고는 실제 120B 모델 출력과 실행형 문자구간 편집으로 구성되었다. **원문 B120**은 과거 R5b에서 확보했고, 두 수정 유형은 R5c의 새로운 실제 호출이다. 개발자 원천 공개 검토용이며 HTML/모집 설문이 아니다.",
 "직접 비교할 때 작품의 자연스러움과 원천이 허용하는 사건·확실성·절차를 함께 보아야 한다. 한 구절 삭제가 성공해도 작품 전체 품질 우위를 뜻하지 않는다."];
 for(let i=0;i<s.rows.length;i++){
  const r=s.rows[i],order=i%2===0?["original","exactSpanEdit","entireRewrite"]:["entireRewrite","original","exactSpanEdit"];
  part.push("---\n\n## "+(i+1)+". "+r.sourceWork+" · "+r.genre+"\n\n**요청**: "+r.task+
   "\n\n**원천**:\n"+r.sourceFacts.map((x,j)=>(j+1)+". "+x).join("\n")+
   "\n\n**고정한 원문 오류 구절**: "+r.target.quote+"\n\n**문제 유형**: "+r.target.kind+
   "\n\n**원천 근거 및 진단**: "+r.target.diagnosis);
  order.forEach((a,j)=>part.push("\n### 원고 "+["A","B","C"][j]+"\n\n"+r[a].text));
  part.push("\n*해독표*: "+order.map((a,j)=>["A","B","C"][j]+"="+a).join(" · ")+
   " · 엄격 편집 상태="+r.exactSpanEdit.status+"("+r.exactSpanEdit.reason+")");
 }
 return part.join("\n\n")+"\n";
}
async function run(root,oldRoot,{invoke=chat}={}){
 must(!fs.existsSync(root),"REFUSE_EXISTING_R5C_OUTPUT");
 const cells=plan(oldRoot);
 fs.mkdirSync(root,{recursive:false,mode:0o700});
 put(path.join(root,"frozen-plan.json"),{planHash:planHash(cells),cells:cells.map(({prompt,...x})=>x),sourceOriginalRun:44899223057});
 const dir=path.join(root,"responses");fs.mkdirSync(dir,{mode:0o700});
 const rows=[];
 for(const cell of cells){
  put(path.join(dir,cell.id+".attempt.json"),{
   id:cell.id,promptSha256:cell.promptSha256,sourceSha256:cell.sourceSha256,
   priorTextSha256:cell.priorTextSha256,planHash:planHash(cells)});
  let r;
  try{
   const o=await invoke({provider:"groq",model:MODEL,messages:cell.prompt,
      temperature:SETTINGS.temperature,maxTokens:SETTINGS.maxTokens});
   r={id:cell.id,sourceWork:cell.sourceWork,arm:cell.arm,
     promptSha256:cell.promptSha256,sourceSha256:cell.sourceSha256,
     priorTextSha256:cell.priorTextSha256,modelRequested:MODEL,responseModel:o.responseModel,
     status:o.finishReason==="stop"?"GENERATED":"INCOMPLETE",finishReason:o.finishReason,
     text:o.text,textSha256:H(o.text),usage:o.usage,latencyMs:o.latencyMs};
  }catch(e){
   r={id:cell.id,sourceWork:cell.sourceWork,arm:cell.arm,promptSha256:cell.promptSha256,
     sourceSha256:cell.sourceSha256,priorTextSha256:cell.priorTextSha256,
     modelRequested:MODEL,status:"PROVIDER_ERROR",failureCode:e.status||e.code||e.message||"UNKNOWN"};
  }
  put(path.join(dir,cell.id+".result.json"),r);
  rows.push({id:r.id,status:r.status,totalTokens:r.usage?.total_tokens||0});
 }
 put(path.join(dir,"summary.json"),{planHash:planHash(cells),rows});
 must(rows.every(r=>r.status==="GENERATED"),"R5C_PARTIAL_RUN_NO_SCORE");
 const s=score(root,oldRoot);put(path.join(root,"final-score.json"),s);
 fs.writeFileSync(path.join(root,"plain-Korean-comparison.md"),readingPacket(s),{flag:"wx",mode:0o600});
 return s;
}
async function main(args){
 const [mode,...items]=args;
 if(mode==="--preflight"&&items.length===1){
  const list=plan(items[0]);
  console.log(JSON.stringify({study:"R5c",oldDraftCount:8,plannedNewCalls:list.length,
   hash:planHash(list),callMap:list.map(({prompt,...o})=>o)}));return;
 }
 if(mode==="--execute"&&items.length===2){
  resolveProvider("groq");const s=await run(items[0],items[1]),{rows,...head}=s;
  console.log("R5c-real-complete",JSON.stringify(head));return;
 }
 if(mode==="--score"&&items.length===2){
  const s=score(items[0],items[1]),{rows,...head}=s;console.log(JSON.stringify(head,null,2));return;
 }
 throw Error("USAGE --preflight OLD_R5B_ARTIFACT | --execute NEW_DIR OLD_R5B_ARTIFACT | --score NEW_DIR OLD_R5B_ARTIFACT");
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error("R5C_RETAINED_ERROR",e.message);process.exitCode=1;});
module.exports={frozen,manifestCheck,oldDrafts,promptCell,plan,planHash,validatePatch,numericTokens,readReceipts,score,readingPacket,run};
