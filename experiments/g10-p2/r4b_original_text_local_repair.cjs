"use strict";
/** G10-P2 R4b source-work-exposed minimal edit vs full rewrite.
 * No semantic entitlement is derived from a matching source quote.
 * Original R4a real model outputs are recovered from a sealed Actions artifact.
 */
const fs=require("node:fs"),path=require("node:path");
const {createHash}=require("node:crypto");
const {executePlan}=require("../g10-p1/r928_scope_and_prose_v01.cjs");
const {REVISION_SETTINGS}=require("../g10-p1/r924_anchored_revision_v01.cjs");
const {resolveProvider}=require("../g10-p1/provider_client_v01.cjs");
const prior=require("./r4a_full_prose_selection_v01.cjs");
const spec=require("./fixtures/r4b_real_prose_local_repair_v01.json");
const hash=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const CONDITIONS=["patch","rewrite"],OLD_ARTIFACT="06a89aed5ed3794aa85c6697cd290ff5abc282434af25f237f2e01ef4f691051";
const assert=(yes,msg)=>{if(!yes)throw Error(msg)};
const read=f=>JSON.parse(fs.readFileSync(f,"utf8"));
function unique(text,part){
 if(typeof text!=="string"||typeof part!=="string"||!part)return null;
 const i=text.indexOf(part);
 return i>=0&&text.indexOf(part,i+1)<0?[i,i+part.length]:null;
}
function validateSpec(){
 assert(spec.schema==="ksgt.g10p2.r4b.prior-real-text-local-repair.v1"&&
  spec.sourceArtifactSha256===OLD_ARTIFACT&&Array.isArray(spec.cases)&&spec.cases.length===10,
  "BAD_R4B_COHORT");
 assert(new Set(spec.cases.map(x=>x.id)).size===10,"DUPLICATED_R4B_CASE");
 assert(spec.cases.filter(x=>x.goldStatus==="ISSUE").length===6&&
  spec.cases.filter(x=>x.goldStatus==="NO_TARGET").length===4,"BAD_R4B_CASE_BALANCE");
 for(const x of spec.cases){
  assert(/^R4B_R4A_(CHAT|SCI|NOTICE|SCENE)_[A-Z]+_(direct|rich)$/.test(x.id) &&
   /^R4A_(CHAT|SCI|NOTICE|SCENE)_[A-Z]+$/.test(x.sourceWork) &&
   ["direct","rich"].includes(x.priorArm)&&
   x.id==="R4B_"+x.sourceWork+"_"+x.priorArm&&
   /^[a-f0-9]{64}$/.test(x.originalTextSha256) &&
   Number.isInteger(x.sourceFactIndex)&&x.sourceFactIndex>0&&
   typeof x.issue==="string"&&x.issue.length>=12 &&
   typeof x.before==="string"&&typeof x.referenceAfter==="string","BAD_R4B_CASE");
  if(x.goldStatus==="ISSUE")assert(x.before.length>3&&x.before!==x.referenceAfter,
   "BAD_FIXED_TARGET");
  if(x.goldStatus==="NO_TARGET")assert(x.before===""&&x.referenceAfter==="",
   "NO_TARGET_MUST_HAVE_NO_ORACLE_REPLACEMENT");
 }
 return spec;
}
function originals(root){
 validateSpec();
 // R4a scorer validates *all 60* original model replies and both source-audit packets.
 const r4a=prior.score(root),full=prior.writerRows(root);
 assert(r4a.successfulCalls===60&&r4a.sourceWorks===12,"R4A_ORIGINAL_INCOMPLETE");
 const m=new Map(full.map(row=>[row.work.id,row]));
 return spec.cases.map(x=>{
  const row=m.get(x.sourceWork);
  assert(row&&x.sourceFactIndex<=row.work.facts.length,"BAD_R4B_SOURCE_FACT_INDEX");
  const candidate=row[x.priorArm];
  assert(candidate?.textSha256===x.originalTextSha256 &&
    hash(candidate.text)===x.originalTextSha256,"R4A_ORIGINAL_SHA_MISMATCH_"+x.id);
  if(x.goldStatus==="ISSUE")assert(unique(candidate.text,x.before),
   "R4B_ISSUE_SPAN_NOT_UNIQUE_"+x.id);
  const sourceFact=row.work.facts[x.sourceFactIndex-1];
  assert(typeof sourceFact==="string"&&sourceFact.length>8,"SOURCE_FACT_MISSING");
  return {x,work:row.work,candidate:candidate.text,
   candidateSha256:candidate.textSha256,sourceFact};
 });
}
const SYSTEM="원천 사실을 먼저 확인한 뒤 한국어 완성문을 편집한다. 출력이 허가되지 않은 약속·장소·인과·인물의 새 사건을 포함하는지 판단하고, 이미 적합한 표현은 유지한다. 지시된 목표 오류와 무관한 다른 문장은 가능한 한 그대로 둔다.";
const PATCH="JSON 객체 하나만 출력한다. 수정할 필요가 없으면 {\"action\":\"KEEP\"}만 반환한다. 정확하게 지정된 위험 구절에만 단일 변경이 필요한 경우 {\"action\":\"PATCH\",\"before\":\"원본에서 연속해 나온 대상 구절\",\"after\":\"대체 구절\"}을 반환한다. before는 반드시 지정된 의심 구절과 완전히 같아야 한다. after는 빈 문자열(그 구절만 삭제)이어도 된다. 자신이 확실하게 원천을 통해 허가할 수 없다면 KEEP을 선택한다. 그 외 설명과 코드블록은 쓰지 않는다.";
const REWRITE="한국어 완성문 전체만 출력한다. 원래 사실과 독자의 목적은 지키되, 지정된 문제를 해결하기 위한 필요한 편집만 한다. 고칠 부분이 없거나 확실한 근거가 없다면 원본 초안을 그대로 반환할 수 있다. 수정 범위를 제한하지는 않지만 추가 사실·약속·시간·장소를 만들지 않는다. JSON, 코드블록, 해설은 출력하지 않는다.";
function buildPlan(root){
 const items=originals(root),output=[];
 items.forEach((a,index)=>{
  const order=index%2?["rewrite","patch"]:["patch","rewrite"];
  order.forEach(condition=>{
   const detail={genre:a.work.genre,reader:a.work.audience,
    writingPurpose:a.work.purpose,writingTask:a.work.task,
    sourceFacts:a.work.facts,license:a.work.license||a.work.risk,
    candidate:a.candidate,
    candidateSha256:a.candidateSha256,
    developerTarget: a.x.goldStatus==="ISSUE"
      ?{status:"SUSPECTED_POST_HOC",before:a.x.before,
         sourceFactIndex:a.x.sourceFactIndex,sourceFact:a.sourceFact,
         reason:a.x.issue}
      :{status:"NO_TARGET_IDENTIFIED",before:"",
         note:"여기서 지정한 목표 결함이 없다. 원본이 완벽하다는 정답 표지는 아니다."},
    outputContract:condition==="patch"?PATCH:REWRITE};
   const prompt=[{role:"system",content:SYSTEM},{role:"user",content:JSON.stringify(detail)}];
   output.push({id:a.x.id+"_"+condition,sourceWork:a.x.sourceWork,
    condition,sourceSha256:hash(a.work.facts),originalTextSha256:a.candidateSha256,
    prompt,promptSha256:hash(prompt)});
  });
 });
 assert(output.length===20&&new Set(output.map(x=>x.id)).size===20,"BAD_R4B_PLAN");
 return output;
}
function planHash(p){return hash({settings:REVISION_SETTINGS,plan:p});}
function checkReceipts(dir,p){
 const expected=planHash(p),summary=read(path.join(dir,"summary.json"));
 assert(summary.planHash===expected&&summary.rows?.length===20,"R4B_PLAN_SUMMARY_MISMATCH");
 const out=new Map(p.map(cell=>{
  const attempt=read(path.join(dir,cell.id+".attempt.json"));
  const result=read(path.join(dir,cell.id+".result.json"));
  assert(attempt.id===cell.id&&attempt.promptSha256===cell.promptSha256&&
   attempt.planHash===expected&&result.id===cell.id&&
   result.promptSha256===cell.promptSha256,"R4B_RECEIPT_MISMATCH_"+cell.id);
  if(result.outcome==="GENERATED")assert(typeof result.text==="string"&&
   hash(result.text)===result.textSha256&&
   result.finishReason==="stop"&&Number.isInteger(result.usage?.total_tokens),
   "R4B_RESPONSE_SHA_OR_USAGE_MISMATCH_"+cell.id);
  return [cell.id,result];
 }));
 for(const extension of [".attempt.json",".result.json"]){
  const ids=fs.readdirSync(dir).filter(n=>n.endsWith(extension))
   .map(n=>n.slice(0,-extension.length));
  assert(ids.length===p.length&&ids.every(id=>out.has(id)),"R4B_RECEIPT_COUNT_MISMATCH");
 }
 return out;
}
function patchVerdict(original,caseData,text){
 let obj;try{obj=JSON.parse(text.trim());}catch{return {status:"INVALID_PATCH_NON_JSON",result:original}};
 if(!obj||typeof obj!=="object"||Array.isArray(obj))
  return {status:"INVALID_PATCH_SCHEMA",result:original};
 if(obj.action==="KEEP"&&Object.keys(obj).length===1){
  return {status:caseData.goldStatus==="ISSUE"?"KEEP_WITH_TARGET_REMAINING":"KEEP_NO_TARGET",
   result:original,changed:false};
 }
 if(obj.action!=="PATCH"||Object.keys(obj).sort().join("|")!=="action|after|before"||
  typeof obj.before!=="string"||typeof obj.after!=="string"||obj.after.length>350||
  obj.after.includes("\n")||obj.after.includes("\r"))
  return {status:"INVALID_PATCH_SCHEMA",result:original};
 if(caseData.goldStatus==="NO_TARGET")
  return {status:"REJECT_UNPROMPTED_PATCH",result:original,
   unpromptedCandidateBefore:obj.before};
 if(obj.before!==caseData.before||!unique(original,obj.before))
  return {status:"REJECT_WRONG_OR_DUPLICATED_SPAN",result:original};
 if(obj.after===obj.before)
  return {status:"INVALID_IDENTITY_PATCH",result:original};
 const result=original.replace(obj.before,obj.after);
 return {status:"APPLIED_UNVERIFIED",result,changed:true,
  beforeSha256:hash(original),afterSha256:hash(result),changedChars:obj.before.length+obj.after.length,
  before:obj.before,after:obj.after};
}
function referencePatch(original,caseData){
 if(caseData.goldStatus==="NO_TARGET")return {status:"NO_TARGET_REFERENCE_KEEP",result:original};
 assert(unique(original,caseData.before),"MISSING_REFERENCE_TARGET");
 return {status:"AUTHOR_REFERENCE_TARGET_ONLY",result:original.replace(caseData.before,caseData.referenceAfter)};
}
function rewriteVerdict(original,text,flag){
 if(typeof text!=="string"||!text.trim())return {status:"INVALID_REWRITE",result:original};
 return {status:text===original?"KEEP_ORIGINAL":flag==="NO_TARGET"?"UNPROMPTED_GLOBAL_EDIT":"GLOBAL_REWRITE",
  result:text,changedChars:text===original?0:original.length+text.length,
  retainedTarget:null};
}
function score(originalRoot,outputDir){
 const inputs=originals(originalRoot),plan=buildPlan(originalRoot),results=checkReceipts(outputDir,plan);
 const rows=inputs.map(({x,work,candidate,candidateSha256,sourceFact})=>{
  const patch=results.get(x.id+"_patch"),rewrite=results.get(x.id+"_rewrite");
  const local=patch.outcome==="GENERATED"?
    patchVerdict(candidate,x,patch.text):{status:"CALL_"+patch.outcome,result:candidate};
  const full=rewrite.outcome==="GENERATED"?
    rewriteVerdict(candidate,rewrite.text,x.goldStatus):{status:"CALL_"+rewrite.outcome,result:candidate};
  const reference=referencePatch(candidate,x);
  const target= x.goldStatus==="ISSUE" ? {
   originalSpan:unique(candidate,x.before),
   remainedInModelPatch:Boolean(unique(local.result,x.before)),
   remainedInFullRewrite:Boolean(unique(full.result,x.before)),
   removedByReference:!reference.result.includes(x.before)} :null;
  return {id:x.id,work:x.sourceWork,arm:x.priorArm,genre:work.genre,
   targetLabelAuthority:"POST_HOC_SINGLE_INVESTIGATOR",
   issue:x.issue,sourceFactIndex:x.sourceFactIndex,sourceFact,
   sourceSha256:hash(work.facts),originalTextSha256:candidateSha256,
   goldStatus:x.goldStatus,
   patch:{status:local.status,resultSha256:hash(local.result),changed:local.result!==candidate,
    output:local.result,modelResponseSha256:patch.textSha256,usage:patch.usage,
    latencyMs:patch.latencyMs??null,relativeLength:local.result.length-candidate.length},
   rewrite:{status:full.status,resultSha256:hash(full.result),changed:full.result!==candidate,
    output:full.result,modelResponseSha256:rewrite.textSha256,usage:rewrite.usage,
    latencyMs:rewrite.latencyMs??null,relativeLength:full.result.length-candidate.length},
   authorReference:{status:reference.status,resultSha256:hash(reference.result),
    output:reference.result,changed:reference.result!==candidate},
   target
  };
 });
 const sum=fn=>rows.reduce((n,r)=>n+fn(r),0);
 return {schema:"ksgt.g10p2.r4b.prior-prose-targeted-development.v1",
  authority:"POST_HOC_INVESTIGATOR_TARGETS_NOT_INDEPENDENT_SEMANTIC_GOLD",
  sourceWorkUnits:new Set(rows.map(r=>r.work)).size,priorTextCases:rows.length,
  newProviderCalls:20,newIndependentReaderGold:0,
  modelPatchApplied:rows.filter(r=>r.patch.status==="APPLIED_UNVERIFIED").length,
  modelPatchKeeps:rows.filter(r=>r.patch.status.startsWith("KEEP")).length,
  modelPatchInvalidOrRejected:rows.filter(r=>!["APPLIED_UNVERIFIED","KEEP_NO_TARGET",
   "KEEP_WITH_TARGET_REMAINING"].includes(r.patch.status)).length,
  rewriteAltered:rows.filter(r=>r.rewrite.changed).length,
  noTargetUnpromptedRewrites:rows.filter(r=>r.goldStatus==="NO_TARGET"&&r.rewrite.changed).length,
  targetSpanRemovedByModelPatch:rows.filter(r=>r.target&&!r.target.remainedInModelPatch).length,
  targetSpanRemovedByFullRewrite:rows.filter(r=>r.target&&!r.target.remainedInFullRewrite).length,
  patchTokens:sum(r=>r.patch.usage?.total_tokens||0),
  rewriteTokens:sum(r=>r.rewrite.usage?.total_tokens||0),
  totalTokens:sum(r=>(r.patch.usage?.total_tokens||0)+(r.rewrite.usage?.total_tokens||0)),
  claims:{independentHumanQualityAdvantage:"NOT_TESTED",
   targetDisappearance:"STRING_BASED_NOT_SEMANTIC_LICENSE",
   authorReference:"ORACLE_ONE_TARGET_NOT_GLOBAL_PROSE_GOLD"},rows};
}
async function main(args){
 const [mode,originalDir,targetDir,...rest]=args;
 if(rest.length||!["--plan","--execute","--score"].includes(mode)||
  !originalDir||((mode!=="--plan")!==Boolean(targetDir)))
  throw Error("USAGE --plan ORIGINAL_R4A | --execute ORIGINAL_R4A NEW_DIR | --score ORIGINAL_R4A DIR");
 if(mode==="--plan"){
  const plan=buildPlan(originalDir);
  console.log(JSON.stringify({status:"R4B_PRE_REGISTERED_AUTHOR_EXPOSED",calls:20,
   hash:planHash(plan),cells:plan.map(({prompt,...identity})=>identity)},null,2));
 }
 if(mode==="--execute"){
  resolveProvider("groq");
  assert(!fs.existsSync(targetDir),"REFUSE_EXISTING_R4B_OUTPUT");
  const output=await executePlan(buildPlan(originalDir),targetDir);
  console.log(JSON.stringify({attempts:output.rows.length,generated:output.rows.filter(r=>r.outcome==="GENERATED").length,
   planHash:output.planHash}));
  if(output.rows.some(r=>r.outcome!=="GENERATED"))process.exitCode=1;
 }
 if(mode==="--score")console.log(JSON.stringify(score(originalDir,targetDir),null,2));
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={validateSpec,unique,originals,buildPlan,planHash,checkReceipts,
 patchVerdict,referencePatch,rewriteVerdict,score};
