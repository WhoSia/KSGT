"use strict";
/** R2b: inspect *actual* R9.34 model texts, not newly authored model outputs.
 * Raw original text is fetched as a read-only Actions artifact; never commit it.
 * Author key is development-only; no reader or independent semantic gold.
 */
const fs=require("node:fs");
const path=require("node:path");
const {createHash}=require("node:crypto");
const {S,parseStrict}=require("./r2_attribution_extractor.cjs");
const {executePlan}=require("../g10-p1/r928_scope_and_prose_v01.cjs");
const {planReceipt}=require("../g10-p1/r929_global_writing_v01.cjs");
const {resolveProvider}=require("../g10-p1/provider_client_v01.cjs");
const fixture=require("./fixtures/r2b_r934_exposed_prose_audit_v01.json");
const ARMS=["direct","rich","guided"],CONDITIONS=["binary","attribution"];
const PLAN_HASH="c7fbc97f59e6a14a7673a087df90bdc3e2798d91256a7e2bc970ebead2516dc9";
const sha=value=>createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"));}
function validFixture(data=fixture){
  if(data.schema!=="ksgt.g10p2.r2b.p1-exposed-real-prose.v1"||
     data.sourceArtifact!==14650903417||
     data.sourceArtifactSha256!=="f27a6d8fd23c4a3bec2fad70c41497d73f3d50d4f865b32bff156d0dbcfbf48b"||
     !Array.isArray(data.works)||data.works.length!==8||
     new Set(data.works.map(w=>w.id)).size!==8)
    throw Error("INVALID_R2B_SOURCE_OR_FIXTURE");
  const genres={};
  for(const w of data.works){
    genres[w.genre]=(genres[w.genre]||0)+1;
    if(!/^(CHAT|SCI|NOTICE|LIT)_[A-Z]+$/.test(w.id)||typeof w.proposition!=="string"||
       w.proposition.length<14 || ARMS.some(arm=>!["YES","NO","INDETERMINATE"].includes(w.labels?.[arm])))
      throw Error("INVALID_R2B_WORK_OR_AUTHOR_KEY");
  }
  if(["chat","science","notice","scene"].some(g=>genres[g]!==2))throw Error("INVALID_R2B_GENRE_BALANCE");
  return data;
}
function loadOriginal(originalDirectory){
  validFixture();
  const safe=readJson(path.join(originalDirectory,"r934-plan-safe.json"));
  if(safe.planHash!==PLAN_HASH||safe.cells?.length!==36||
     new Set(safe.cells.map(c=>c.id)).size!==36)throw Error("R934_PLAN_PROVENANCE_MISMATCH");
  const known=new Map(safe.cells.map(c=>[c.id,c]));
  const recovered=new Map();
  for(const c of safe.cells){
    const r=readJson(path.join(originalDirectory,"r934-run",c.id+".result.json"));
    if(r.id!==c.id||r.sourceWork!==c.sourceWork||r.condition!==c.condition||
      r.promptSha256!==c.promptSha256||
      r.outcome!=="GENERATED"||r.finishReason!=="stop"||
      typeof r.text!=="string"||sha(r.text)!==r.textSha256)
      throw Error("R934_ORIGINAL_RESPONSE_MISMATCH_"+c.id);
    recovered.set(c.id,r);
  }
  return {safe,recovered};
}
function fullTexts(originalDirectory){
  const {recovered}=loadOriginal(originalDirectory), output=[];
  for(const work of fixture.works){
    for(const priorArm of ARMS) {
      const originalId="R934_"+work.id+"_"+priorArm;
      const r=recovered.get(originalId);
      if(!r)throw Error("MISSING_REQUIRED_R934_ORIGINAL_"+originalId);
      output.push({id:"P2R2B_"+work.id+"_"+priorArm,
        originalId,sourceWork:work.id,genre:work.genre,
        priorArm,proposition:work.proposition,snippet:r.text,
        priorTextSha256:r.textSha256,authorJudgment:work.labels[priorArm]});
    }
  }
  return output;
}
function buildPlan(originalDirectory){
  const plan=[];
  for(const [i,ex] of fullTexts(originalDirectory).entries()){
    const order=i%2?["attribution","binary"]:["binary","attribution"];
    for(const condition of order){
      const prompt=[{role:"system",content:S[condition]},
        {role:"user",content:JSON.stringify({
          검토할_목표_명제:ex.proposition,실제로_독자가_읽은_문단:ex.snippet
        })}];
      plan.push({id:ex.id+"_"+condition,sourceWork:ex.sourceWork,
        condition,priorArm:ex.priorArm,originalSha256:ex.priorTextSha256,
        prompt,promptSha256:sha(prompt)});
    }
  }
  if(plan.length!==48||new Set(plan.map(c=>c.id)).size!==48)throw Error("INVALID_R2B_REQUEST_SET");
  return plan;
}
function score(originalDirectory,outputDirectory){
  const examples=fullTexts(originalDirectory),plan=buildPlan(originalDirectory);
  const hash=planReceipt(plan).planHash;
  const summary=readJson(path.join(outputDirectory,"summary.json"));
  if(summary.planHash!==hash||summary.rows?.length!==plan.length)throw Error("INVALID_R2B_SUMMARY");
  const lookup=new Map(plan.map(c=>[c.id,c]));
  for(const suffix of [".attempt.json",".result.json"]){
    const actual=new Set(fs.readdirSync(outputDirectory).filter(f=>f.endsWith(suffix))
      .map(f=>f.slice(0,-suffix.length)));
    if(actual.size!==plan.length||[...actual].some(id=>!lookup.has(id)))
      throw Error("UNACCOUNTED_R2B_RECEIPT");
  }
  const rows=[];
  for(const ex of examples){
    const record={id:ex.id,work:ex.sourceWork,genre:ex.genre,priorArm:ex.priorArm,
      priorTextSha256:ex.priorTextSha256,authorJudgment:ex.authorJudgment,model:{}};
    for(const condition of CONDITIONS){
      const id=ex.id+"_"+condition;
      const planCell=lookup.get(id);
      const attempt=readJson(path.join(outputDirectory,id+".attempt.json"));
      const result=readJson(path.join(outputDirectory,id+".result.json"));
      if(attempt.id!==id||attempt.promptSha256!==planCell.promptSha256||
        attempt.planHash!==hash||result.id!==id||result.promptSha256!==planCell.promptSha256)
        throw Error("MISMATCHED_R2B_REQUEST_"+id);
      if(result.outcome==="GENERATED"&&(typeof result.text!=="string"||
        sha(result.text)!==result.textSha256))throw Error("ALTERED_R2B_MODEL_OUTPUT_"+id);
      const parsed=result.outcome==="GENERATED"?parseStrict(result.text,condition,ex.snippet):
        {valid:false,reason:"CALL_"+result.outcome};
      const guess=parsed.valid?parsed.status:null;
      const asserted=guess==="ASSERTED";
      record.model[condition]={...parsed,rawOutcome:result.outcome,claimed:guess,
        predictedAsserted:parsed.valid?asserted:null,
        correctDecidable:ex.authorJudgment==="INDETERMINATE"?null:
          parsed.valid && (asserted===(ex.authorJudgment==="YES")),
        falsePositive:parsed.valid&&asserted&&ex.authorJudgment==="NO",
        falseNegative:parsed.valid&&!asserted&&ex.authorJudgment==="YES",
        usage:result.usage??null,latencyMs:result.latencyMs??null,
        modelResponseSha256:result.textSha256??null};
    }
    rows.push(record);
  }
  return {schema:"ksgt.g10p2.r2b.scored.development.v1",
    evidenceAuthority:"SINGLE_INVESTIGATOR_LABELS_ON_PRIOR_MODEL_GENERATED_PROSE",
    originalRun:44782747496,originalPlanHash:PLAN_HASH,
    priorSourceWorks:8,priorGeneratedTexts:24,newModelAttempts:48,rows};
}
function aggregate(result){
  return Object.fromEntries(CONDITIONS.map(condition=>{
    const x=result.rows.map(r=>r.model[condition]);
    return [condition,{modelAttempts:x.length,valid:x.filter(a=>a.valid).length,
      decidedGold:result.rows.filter(r=>r.authorJudgment!=="INDETERMINATE").length,
      correctOnDecided:x.filter(a=>a.correctDecidable===true).length,
      errorsOnDecided:x.filter(a=>a.correctDecidable===false).length,
      falsePositives:x.filter(a=>a.falsePositive).length,
      falseNegatives:x.filter(a=>a.falseNegative).length,
      evidenceAnchored:x.filter(a=>a.valid&&a.evidenceStatus==="ANCHORED").length,
      promptTokens:x.reduce((n,a)=>n+(a.usage?.prompt_tokens||0),0),
      completionTokens:x.reduce((n,a)=>n+(a.usage?.completion_tokens||0),0),
      totalTokens:x.reduce((n,a)=>n+(a.usage?.total_tokens||0),0),
      examples:result.rows.map(r=>({id:r.id,gold:r.authorJudgment,
        predicted:r.model[condition].claimed,valid:r.model[condition].valid}))}];
  }));
}
async function main(args){
  const [mode,originalDirectory,other,...extra]=args;
  if(extra.length||!["--plan","--execute","--score","--offline"].includes(mode)||
    !originalDirectory||(["--execute","--score"].includes(mode)!==Boolean(other)))
    throw Error("USAGE: --offline/--plan R934_ARCHIVE_DIR | --execute R934_ARCHIVE_DIR NEW_OUT | --score R934_ARCHIVE_DIR OUT");
  if(mode==="--offline")return console.log(JSON.stringify({
    works:fixture.works.length,texts:fullTexts(originalDirectory).length,
    modelCalls:0,authorLabels:Object.fromEntries(["YES","NO","INDETERMINATE"].map(l=>
      [l,fullTexts(originalDirectory).filter(r=>r.authorJudgment===l).length]))},null,2));
  if(mode==="--plan")return console.log(JSON.stringify(planReceipt(buildPlan(originalDirectory)),null,2));
  if(mode==="--execute"){
    resolveProvider("groq");
    const done=await executePlan(buildPlan(originalDirectory),other);
    const ok=done.rows.filter(row=>row.outcome==="GENERATED").length;
    console.log(JSON.stringify({attempted:done.rows.length,generated:ok,planHash:done.planHash}));
    if(ok!==48)process.exitCode=1;
  }
  if(mode==="--score"){
    const scored=score(originalDirectory,other);
    console.log(JSON.stringify({metrics:aggregate(scored),results:scored},null,2));
  }
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={fixture,ARMS,CONDITIONS,PLAN_HASH,validFixture,loadOriginal,fullTexts,
  buildPlan,score,aggregate};
