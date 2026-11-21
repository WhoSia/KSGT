"use strict";
/**
 * G10-P2 R2: a real-model extraction diagnostic, not a Korean reader simulator.
 * The target proposition is a query, NOT part of the realized reader text.
 * A literal evidence span certifies provenance only, not semantic entailment.
 */
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { resolveProvider } = require("../g10-p1/provider_client_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const cohort = require("./fixtures/r2_attribution_8works_40cases_v01.json");

const GOLD = ["ASSERTED","DENIED","ATTRIBUTED","QUESTION","ABSENT"];
const CONDITIONS = ["binary","attribution"];
const ALLOWED = {
  binary:new Set(["ASSERTED","NOT_ASSERTED","UNKNOWN"]),
  attribution:new Set([...GOLD,"UNKNOWN"])
};
const S = Object.freeze({
  binary:"문단이 목표 명제를 글쓴이가 확정한 사실로 서술했는지 판정한다. 목표 명제는 질문으로만 제공된 것이며 실제 독자가 읽은 본문이 아니다. 다른 화자의 발언·소문·부정·미확인·질문을 사실로 확정하지 않는다. JSON 객체 하나만 출력한다. 키는 status, evidence 두 개뿐이다. status는 ASSERTED, NOT_ASSERTED, UNKNOWN 중 하나다. evidence는 실제 본문에 연속해서 등장하는 근거 구절 한 곳의 문자열이다. 해당 구절이 없으면 빈 문자열이다. 이유 설명, 코드블록, 나머지 문장은 금지한다.",
  attribution:"목표 명제를 글쓴이가 확정적으로 단정했는지, 부정했는지, 타인의 주장으로만 소개했는지, 확인되지 않은 질문으로 남겼는지, 아예 언급하지 않았는지를 구분한다. 목표 명제는 질문이며 본문에 포함된 발언이 아니다. status는 ASSERTED(글쓴이가 단정함), DENIED(글쓴이가 명제를 부정함), ATTRIBUTED(타인에게 귀속하고 확정하지 않음), QUESTION(아직 확인할 질문), ABSENT(관련 명제를 언급하지 않음), UNKNOWN(판별 불가) 중 하나다. JSON 객체 하나만 출력한다. 키는 status, evidence 두 개뿐이다. evidence는 실제 본문의 짧은 연속된 문자열 하나여야 하며 없으면 빈 문자열이다. 분석·코드블록·나머지 문장을 쓰지 않는다."
});
function hash(v) { return createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex"); }
function validCorpus(data=cohort) {
  if(data.schema!=="ksgt.g10p2.r2.authored-dev.v1"||!Array.isArray(data.works)||
      data.works.length!==8||new Set(data.works.map(w=>w.id)).size!==8)throw Error("INVALID_R2_WORK_COUNT");
  const genres=new Map();
  for(const w of data.works) {
    if(!/^(CHAT|SCI|NOTICE|SCENE)_[A-Z]+$/.test(w.id) ||
      typeof w.proposition!=="string"||w.proposition.length<10 ||
      !["chat","science","notice","scene"].includes(w.genre))throw Error("INVALID_R2_WORK");
    genres.set(w.genre,(genres.get(w.genre)||0)+1);
    if(!Array.isArray(w.cases)||w.cases.length!==5||
       new Set(w.cases.map(c=>c.status)).size!==5||
       w.cases.some(c=>!GOLD.includes(c.status)||typeof c.snippet!=="string"||
         c.snippet.length<14||!c.snippet.includes(".") && !c.snippet.includes("다.")))throw Error("INVALID_R2_CASE");
  }
  if([...genres.values()].some(x=>x!==2)||genres.size!==4)throw Error("UNBALANCED_GENRES");
  return data;
}
function examples() {
  validCorpus();
  return cohort.works.flatMap(w=>w.cases.map((v,index)=>({
    id:w.id+"_"+index,sourceWork:w.id,genre:w.genre,proposition:w.proposition,
    snippet:v.snippet,gold:v.status,variantIndex:index
  })));
}
function buildPlan() {
  const result=[];
  for(const [idx,ex] of examples().entries()){
    const order=idx%2?["attribution","binary"]:["binary","attribution"];
    for(const condition of order){
      const prompt=[{role:"system",content:S[condition]},{
        role:"user",content:JSON.stringify({
          검토할_목표_명제:ex.proposition,실제로_독자가_읽은_문단:ex.snippet
        })
      }];
      result.push({id:"P2R2_"+ex.id+"_"+condition,sourceWork:ex.sourceWork,
        condition,prompt,promptSha256:hash(prompt)});
    }
  }
  if(result.length!==80||new Set(result.map(c=>c.id)).size!==80)throw Error("INVALID_R2_PLAN");
  return result;
}
function exactEvidence(snippet,evidence) {
  if(typeof evidence!=="string")return {status:"NOT_STRING",span:null};
  if(evidence==="")return {status:"EMPTY",span:null};
  if(evidence.length>240||evidence!==evidence.trim())return {status:"BAD_FORMAT",span:null};
  const start=snippet.indexOf(evidence);
  if(start<0)return {status:"NOT_IN_REALIZED_TEXT",span:null};
  if(snippet.indexOf(evidence,start+1)>=0)return {status:"NONUNIQUE",span:null};
  return {status:"ANCHORED",span:[start,start+evidence.length]};
}
function parseStrict(text,condition,snippet) {
  if(typeof text!=="string")return {valid:false,reason:"NO_TEXT"};
  let obj;try {obj=JSON.parse(text.trim());}catch{return {valid:false,reason:"NON_JSON"}}
  if(!obj||typeof obj!=="object"||Array.isArray(obj)||
      Object.keys(obj).sort().join("|")!=="evidence|status"||
      !ALLOWED[condition]?.has(obj.status))return {valid:false,reason:"BAD_SCHEMA"};
  const evidence=exactEvidence(snippet,obj.evidence);
  if(evidence.status==="NOT_STRING"||evidence.status==="BAD_FORMAT"||
    evidence.status==="NOT_IN_REALIZED_TEXT"||evidence.status==="NONUNIQUE")
    return {valid:false,reason:"UNSUPPORTED_EVIDENCE",claimed:obj.status,evidence};
  if(obj.status==="ASSERTED" && evidence.status!=="ANCHORED")
    return {valid:false,reason:"ASSERTED_WITHOUT_WITNESS",claimed:obj.status,evidence};
  if(condition==="attribution" &&
    ["DENIED","ATTRIBUTED","QUESTION"].includes(obj.status) &&
    evidence.status!=="ANCHORED")
    return {valid:false,reason:"MENTION_WITHOUT_WITNESS",claimed:obj.status,evidence};
  return {valid:true,status:obj.status,evidence:obj.evidence,evidenceStatus:evidence.status,
    evidenceSpan:evidence.span};
}
function derivedState(label) {
  if(label==="ASSERTED")return {mentioned:true,committed:true,negated:false};
  if(label==="DENIED")return {mentioned:true,committed:false,negated:true};
  if(label==="ATTRIBUTED"||label==="QUESTION")return {mentioned:true,committed:false,negated:false};
  if(label==="ABSENT")return {mentioned:false,committed:false,negated:false};
  return {mentioned:null,committed:null,negated:null};
}
function mergeLedger(prior,extraction) {
  const next={mentioned:Boolean(prior?.mentioned),commitment:prior?.commitment||"UNSET",
    unresolved:Boolean(prior?.unresolved),trail:[...(prior?.trail||[])]};
  if(!extraction?.valid||extraction.status==="UNKNOWN"){
    next.unresolved=true;next.trail.push("UNKNOWN");return next;
  }
  const status=extraction.status;
  if(status!=="ABSENT")next.mentioned=true;
  if(status==="ASSERTED"||status==="DENIED"){
    if(next.commitment==="UNSET")next.commitment=status;
    else if(next.commitment!==status)next.commitment="CONFLICT";
  }
  next.trail.push(status);
  return next;
}
function score(root) {
  const plan=buildPlan(), index=new Map(plan.map(c=>[c.id,c]));
  const planHash=planReceipt(plan).planHash;
  const summary=JSON.parse(fs.readFileSync(path.join(root,"summary.json"),"utf8"));
  if(summary.planHash!==planHash||summary.rows?.length!==plan.length)
    throw Error("INVALID_R2_SUMMARY");
  for(const suffix of [".attempt.json",".result.json"]){
    const observed=new Set(fs.readdirSync(root).filter(f=>f.endsWith(suffix)).map(f=>f.slice(0,-suffix.length)));
    if(observed.size!==plan.length||[...observed].some(id=>!index.has(id)))
      throw Error("UNACCOUNTED_R2_RECEIPTS");
  }
  const rows=[];
  for(const ex of examples()){
    const item={id:ex.id,sourceWork:ex.sourceWork,genre:ex.genre,gold:ex.gold,
      goldMentioned:derivedState(ex.gold).mentioned,goldCommitted:ex.gold==="ASSERTED",model:{}};
    for(const condition of CONDITIONS) {
      const id="P2R2_"+ex.id+"_"+condition;
      const result=JSON.parse(fs.readFileSync(path.join(root,id+".result.json"),"utf8"));
      const attempt=JSON.parse(fs.readFileSync(path.join(root,id+".attempt.json"),"utf8"));
      if(attempt.id!==id||result.id!==id||result.promptSha256!==index.get(id).promptSha256||
        attempt.promptSha256!==index.get(id).promptSha256||attempt.planHash!==planHash)
        throw Error("MISMATCHED_REQUEST_RECEIPT_"+id);
      if(result.outcome==="GENERATED" &&
        (typeof result.text!=="string"||hash(result.text)!==result.textSha256))
        throw Error("RESPONSE_BYTES_MISMATCH_"+id);
      const output=result.outcome==="GENERATED" ?parseStrict(result.text,condition,ex.snippet):
        {valid:false,reason:"CALL_"+result.outcome};
      const claimed=output.valid?output.status:null;
      item.model[condition]={...output,rawStatus:result.outcome,claimed,rawTextSha256:result.textSha256||null,
        usage:result.usage??null,latencyMs:result.latencyMs??null,
        correctAssertion:output.valid ? (claimed==="ASSERTED")===(ex.gold==="ASSERTED"):false,
        correctSubclass:condition==="attribution"&&output.valid&&claimed===ex.gold,
        falsePositiveAssertion:output.valid&&claimed==="ASSERTED"&&ex.gold!=="ASSERTED",
        falseNegativeAssertion:output.valid&&claimed!=="ASSERTED"&&ex.gold==="ASSERTED"};
    }
    rows.push(item);
  }
  return {schema:"ksgt.g10p2.r2.scored.dev.v1",
    warning:"AUTHOR_SIDE_LABELS_ONLY_NO_INDEPENDENT_KOREAN_READER_GOLD",
    providerAttempts:plan.length,works:cohort.works.length,cases:rows.length,rows};
}
function aggregate(result) {
  return Object.fromEntries(CONDITIONS.map(condition=>{
    const x=result.rows.map(r=>r.model[condition]);
    const total=x.reduce((s,r)=>s+(r.usage?.total_tokens??0),0);
    const prompt=x.reduce((s,r)=>s+(r.usage?.prompt_tokens??0),0);
    const completion=x.reduce((s,r)=>s+(r.usage?.completion_tokens??0),0);
    return [condition,{attempts:x.length,generated:x.filter(r=>r.rawStatus==="GENERATED").length,
      valid:x.filter(r=>r.valid).length,correctAssertion:x.filter(r=>r.correctAssertion).length,
      falsePositiveAssertion:x.filter(r=>r.falsePositiveAssertion).length,
      falseNegativeAssertion:x.filter(r=>r.falseNegativeAssertion).length,
      correctSubclass:condition==="attribution"?x.filter(r=>r.correctSubclass).length:null,
      evidenceAnchored:x.filter(r=>r.valid&&r.evidenceStatus==="ANCHORED").length,
      abstentions:x.filter(r=>r.claimed==="UNKNOWN").length,
      promptTokens:prompt,completionTokens:completion,totalTokens:total,
      byGold:Object.fromEntries(GOLD.map(g=>[g,result.rows.filter(r=>r.gold===g)
        .map(r=>({id:r.id,claim:r.model[condition].claimed,valid:r.model[condition].valid}))]))}];
  }));
}
async function main(args) {
  const [mode,root,...extra]=args;
  if(extra.length||!["--plan","--execute","--score","--offline"].includes(mode)||
    (["--execute","--score"].includes(mode)!==Boolean(root)))throw Error("USAGE --plan | --offline | --execute NEW_DIR | --score EXISTING_DIR");
  if(mode==="--plan")return console.log(JSON.stringify(planReceipt(buildPlan()),null,2));
  if(mode==="--offline")return console.log(JSON.stringify({works:cohort.works.length,
    cases:examples().length,goldCounts:Object.fromEntries(GOLD.map(k=>[k,examples().filter(x=>x.gold===k).length])),
    modelCalls:0},null,2));
  if(mode==="--execute") {
    resolveProvider("groq");
    const output=await executePlan(buildPlan(),root);
    const ok=output.rows.filter(r=>r.outcome==="GENERATED").length;
    console.log(JSON.stringify({generated:ok,attempts:output.rows.length,planHash:output.planHash}));
    if(ok!==80)process.exitCode=1;
  }
  if(mode==="--score"){
    const result=score(root);
    console.log(JSON.stringify({metrics:aggregate(result),results:result},null,2));
  }
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={cohort,GOLD,CONDITIONS,S,validCorpus,examples,buildPlan,exactEvidence,parseStrict,
  derivedState,mergeLedger,score,aggregate};
