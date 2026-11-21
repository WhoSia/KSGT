"use strict";
/* KSGT R5i: post-hoc author-conditioned, ZERO-new-model-call clause aggregation.
 * Source trace is the original R5h 16-real-call raw final-score JSON.
 * Note: reusing exposed development text, not a preregistered blind evaluation.
 */
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const r=require("./r5h_korean_role_bound_micro_realizer.cjs");
const ORIGINAL_R5H_SCORE_SHA256="ed62b1f3a8f1772dad92eb4c14d38b1c6f710f16c577f8c9020cbd294a7b9216";
const sha=x=>createHash("sha256").update(typeof x==="string"||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest("hex");
const ok=(b,s)=>{if(!b)throw Error(s)};
const AP={
 "손에 쥐고 있었다.":"손에 쥔 채",
 "손에 들고 있었다.":"손에 든 채",
 "손안에 두고 있었다.":"손안에 둔 채",
 "손안에 쥐고 있었다.":"손안에 쥔 채",
 "손안에 들고 있었다.":"손안에 든 채"
};
const BP={
 "바라보고 있었다.":"바라보며",
 "서 있었다.":"서서",
 "시선을 두고 있었다.":"시선을 두며",
 "바라봤다.":"바라보며"
};
function converb(predicate,rules){
 for(const [ending,replacement] of Object.entries(rules)){
  if(predicate.endsWith(ending))return predicate.slice(0,-ending.length)+replacement;
 }
 return null;
}
function recoverSourcePredicates(w,trace){
 ok(trace.length===6&&trace.every((t,i)=>t.frameID==="S"+(i+1)),"R5I_FROZEN_TRACE_FIDS_CHANGED");
 return trace.map((t,i)=>{
  const source=w.frames[i];
  ok(t.actorID===source.subjectEntityID&&t.sourceSHA256===sha(source.sourceFact)&&
    Number.isInteger(t.predicateVariant)&&[0,1].includes(t.predicateVariant),
    "R5I_SOURCE_ROLE_OR_SOURCETEXT_CHANGED_"+w.id+"_"+source.id);
  const originalPredicate=source.predicateChoices[t.predicateVariant];
  // Keep output provenance of each R5h phrase rather than silently replacing original.
  ok(t.outputSHA256===sha(t.outputText),"R5I_ORIGINAL_CLAUSE_SHA_FAIL");
  if(t.actorID===null)ok(t.outputText===originalPredicate,"R5I_BACKGROUND_CLAUSE_WAS_CHANGED");
  else{
   const subject=w.entities.find(e=>e.id===t.actorID).name;
   const licensedPrefix=t.subjectForm==="ZERO"?"":subject+r.particle(subject,t.subjectForm)+" ";
   ok(t.outputText===licensedPrefix+originalPredicate,
    "R5I_ORIGINAL_PREDICATE_OR_SUBJECT_CHANGED_"+source.id);
  }
  return originalPredicate;
 });
}
function fusePair(w,trace,pred,startIndex,rules){
 const left=trace[startIndex],right=trace[startIndex+1],actorID=left.actorID;
 ok(actorID!==null&&actorID===right.actorID,"R5I_REFUSE_TO_FUSE_DIFFERENT_ACTORS");
 const name=w.entities.find(e=>e.id===actorID).name;
 const connected=converb(pred[startIndex],rules);
 if(connected===null){
  return {text:left.outputText+" "+right.outputText,joined:false,actorID,
   sourceFrameIDs:[left.frameID,right.frameID],reason:"UNKNOWN_MORPHOLOGICAL_ENDING_USE_VERBATIM_SOURCE"};
 }
 const result=name+r.particle(name,"TOPIC")+" "+connected+" "+pred[startIndex+1];
 ok(result.endsWith(".")&&result.includes(name),"R5I_FUSED_CLAUSE_BAD");
 return {text:result,joined:true,actorID,sourceFrameIDs:[left.frameID,right.frameID],
   reason:"EXACT_AUTHOR_VERIFIED_SOURCE_CLAUSE_AGGREGATION"};
}
function aggregate(w,compiled){
 const trace=compiled.trace;
 const pred=recoverSourcePredicates(w,trace);
 const s=[
  {text:trace[0].outputText,joined:false,actorID:null,sourceFrameIDs:["S1"],reason:"ORIGINAL_BACKGROUND"},
  fusePair(w,trace,pred,1,AP),
  fusePair(w,trace,pred,3,BP),
  {text:trace[5].outputText,joined:false,actorID:null,sourceFrameIDs:["S6"],reason:"ORIGINAL_UNRESOLVED_ENDING"}
 ];
 const output=s.map(x=>x.text).join(" ");
 ok(s.flatMap(x=>x.sourceFrameIDs).join(",")==="S1,S2,S3,S4,S5,S6",
   "R5I_SOURCE_FACT_DROPPED_REORDERED_OR_DUPLICATED");
 ok(s[1].actorID==="A"&&s[2].actorID==="B"&&
   s[1].text.includes(w.entities[0].name)&&s[2].text.includes(w.entities[1].name),
   "R5I_WRONG_CHARACTER_OWNS_SOURCE_PREDICATE");
 return {sourceWork:w.id,text:output,outputSHA256:sha(output),
   aggregatedSentenceCount:s.length,declaredFrameFactsCovered:6,
   roleBindingsPreservedUnderTrustedSourcePredicates:true,
   joinedSourcePairs:s.filter(x=>x.joined).length,segments:s};
}
function validateExactSource(raw){
 ok(Buffer.isBuffer(raw)&&sha(raw)===ORIGINAL_R5H_SCORE_SHA256,
   "R5I_REFUSE_NON_ORIGINAL_R5H_SOURCE_SCORE");
 const score=JSON.parse(raw.toString("utf8"));
 ok(score.schema==="ksgt.g10p2.r5h.actual-korean-argument-binding-micro-realizer.v1"&&
    score.newProviderCalls===16&&score.originalSourceScenes===8&&
    score.completeKoreanProseTexts===24&&score.rows.length===8,
    "R5I_R5H_RECEIPT_SCOPE_ERROR");
 r.validate();
 return score;
}
function derive(raw){
 const src=validateExactSource(raw);
 const map=new Map(r.fixture.works.map(w=>[w.id,w]));
 const rows=src.rows.map(row=>{
  const work=map.get(row.sourceWork);
  ok(work&&r.sha===undefined,"R5I_UNEXPECTED_SOURCE_WORK");
  ok(row.source.namedCharacters.every((x,i)=>x.id===work.entities[i].id&&x.name===work.entities[i].name),
   "R5I_HIDDEN_SOURCE_ROLE_REPLACE");
  const reconstructedSelected=r.render(work,row.selector.selectedIndices),
        reconstructedDefault=r.render(work,r.defaultIndices(work));
  ok(reconstructedSelected.text===row.compiledSelected.text&&
    reconstructedDefault.text===row.compiledDefault.text,"R5I_R5H_COMPILATION_NOT_REPRODUCIBLE");
  return {sourceWork:row.sourceWork,
   sourceLicense:row.license,sourceTask:row.task,
   actualDirect120B:row.direct.text,
   originalR5hSelected:row.compiledSelected.text,
   originalR5hDefault:row.compiledDefault.text,
   aggregatedSelected:aggregate(work,reconstructedSelected),
   aggregatedDefault:aggregate(work,reconstructedDefault),
   priorModelCosts:{direct120bTokens:row.direct.modelTokens,
     roleBoundSelector120bTokens:row.selector.modelTokens},
   newModelCalls:0};
 });
 const n=p=>rows.reduce((s,r)=>s+r[p].joinedSourcePairs,0);
 return {schema:"ksgt.g10p2.r5i.zero-model-korean-clause-aggregation.v1",
  sourceOriginalSHA256:ORIGINAL_R5H_SCORE_SHA256,
  originalActualProviderCallsReused:16,newProviderCalls:0,
  reusedStrongDirect120BProseTexts:8,newCompleteAggregatedKoreanTexts:16,
  oldCompiledFullTextsReused:16,sourceWorks:8,
  selectedAggregatedSourcePairs:n("aggregatedSelected"),
  defaultAggregatedSourcePairs:n("aggregatedDefault"),
  sourceFrameFactsPerText:6,
  independentNativeReaders:0,independentSemanticGold:0,
  naturalnessSuperiority:"NOT_PROVEN_DEVELOPER_POSTHOC",
  inputModelTokens:src.byArm,
  rows};
}
function readingPacket(s){
 const out=["# KSGT R5i — 실제 R5h 문단의 논항 보존형 절 결합 (신규 모델 호출 0회)",
  "이번에는 이미 완료한 16회 R5h 실제 모델 답변을 그대로 재사용한다. 추가 생성 16편은 원천 S2+S3(인물 A), S4+S5(인물 B)의 문장 두 쌍을 코드를 통해 결합했다. 미리 정한 어미 변환만 허용하며 의미 보존은 연구자 작성 틀을 전제한다.",
  "모든 판독은 연구자용 사후 개발 비교이며, 강한 직접 LLM과의 한국어 미학적 우위는 독립 판정이 아니다."];
 for(const [i,row] of s.rows.entries()){
  out.push("\n---\n\n## "+(i+1)+". "+row.sourceWork+"\n\n**원천 제약:** "+row.sourceLicense);
  out.push("### 실제 직접 120B 한국어 완성문\n\n"+row.actualDirect120B);
  out.push("### 기존 역할 결속 + 120B 문장 선택 6문장\n\n"+row.originalR5hSelected);
  out.push("### 새 역할 결속 + 사후 절 결합 4문장\n\n"+row.aggregatedSelected.text);
  out.push("### 0-모델호출 기본 절 결합 4문장\n\n"+row.aggregatedDefault.text);
  out.push("**명시적 출처 논항 추적:**\n"+
    row.aggregatedSelected.segments.map(x=>x.sourceFrameIDs.join("+")+
    " / 주체 "+(x.actorID||"배경·마무리")+" / 결합 여부 "+x.joined+
    " / "+x.text).join("\n"));
 }
 return out.join("\n\n")+"\n";
}
function writeOnce(f,s){fs.writeFileSync(f,s,{flag:"wx",mode:0o600})}
function main(args){
 if(args[0]==="--execute"&&args.length===3){
  const [_,original,out]=args;
  ok(!fs.existsSync(out),"R5I_REFUSE_OVERWRITE");
  const s=derive(fs.readFileSync(original));
  fs.mkdirSync(out,{recursive:false,mode:0o700});
  writeOnce(path.join(out,"compiled-aggregate-score.json"),JSON.stringify(s,null,2)+"\n");
  writeOnce(path.join(out,"plain-Korean-four-way-source-sentences.md"),readingPacket(s));
  const {rows,...meta}=s;console.log(JSON.stringify(meta,null,2));return;
 }
 if(args[0]==="--score"&&args.length===2){
  const s=derive(fs.readFileSync(args[1])),{rows,...meta}=s;
  console.log(JSON.stringify(meta,null,2));return;
 }
 throw Error("USAGE --execute EXACT_R5H_SCORE_JSON NEW_OUTPUT_DIR | --score EXACT_R5H_SCORE_JSON");
}
if(require.main===module)try{main(process.argv.slice(2))}catch(e){console.error("R5I_FAILED_SOURCE_HOLD",e.message);process.exitCode=1}
module.exports={ORIGINAL_R5H_SCORE_SHA256,AP,BP,converb,recoverSourcePredicates,
 fusePair,aggregate,validateExactSource,derive,readingPacket};
