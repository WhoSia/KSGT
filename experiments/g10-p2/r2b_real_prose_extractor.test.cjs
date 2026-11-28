"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createHash}=require("node:crypto");
const r=require("./r2b_real_prose_extractor.cjs");
const {planReceipt}=require("../g10-p1/r929_global_writing_v01.cjs");
const sourceWorks=require("../g10-p1/fixtures/r934_reader_cohort_v01.json");
const sha=s=>createHash("sha256").update(s).digest("hex");

function temp(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r2b-"));
 try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function fakeOriginal(base){
 const dir=path.join(base,"original");fs.mkdirSync(path.join(dir,"r934-run"),{recursive:true});
 const cells=[];
 for(const work of sourceWorks){
   for(const arm of r.ARMS){
     const id="R934_"+work.id+"_"+arm;
     const text="원본을 확인하는 문단 "+id+"입니다.";
     const hash=sha(id+"fake-prompt");
     cells.push({id,sourceWork:work.id,condition:arm,promptSha256:hash});
     fs.writeFileSync(path.join(dir,"r934-run",id+".result.json"),JSON.stringify({
       id,sourceWork:work.id,condition:arm,promptSha256:hash,outcome:"GENERATED",
       finishReason:"stop",text,textSha256:sha(text)
     }));
   }
 }
 fs.writeFileSync(path.join(dir,"r934-plan-safe.json"),JSON.stringify({
   planHash:r.PLAN_HASH,cells
 }));
 return dir;
}
test("eight previously exposed source works have a frozen cross-arm author key",()=>{
 assert.equal(r.validFixture(),r.fixture);
 assert.equal(r.fixture.works.length,8);
 let list=r.fixture.works.flatMap(w=>r.ARMS.map(arm=>w.labels[arm]));
 assert.equal(list.filter(x=>x==="YES").length,10);
 assert.equal(list.filter(x=>x==="NO").length,12);
 assert.equal(list.filter(x=>x==="INDETERMINATE").length,2);
 const altered=JSON.parse(JSON.stringify(r.fixture));
 altered.works[0].labels.direct="FAKE";
 assert.throws(()=>r.validFixture(altered),/INVALID_R2B_WORK/);
});
test("R9.34 prior completion provenance is checked across all 36, not 24 selected",()=>{
 temp(base=>{
   const dir=fakeOriginal(base);
   assert.equal(r.loadOriginal(dir).recovered.size,36);
   const s=r.fullTexts(dir);
   assert.equal(s.length,24);
   assert.equal(s.filter(x=>x.priorArm==="guided").length,8);
   const target=path.join(dir,"r934-run","R934_CHAT_REQUEST_direct.result.json");
   const d=JSON.parse(fs.readFileSync(target));
   d.text="raw content modified silently";
   fs.writeFileSync(target,JSON.stringify(d));
   assert.throws(()=>r.loadOriginal(dir),/R934_ORIGINAL_RESPONSE_MISMATCH/);
 });
});
test("two extraction arms share exact original prose and exclude gold labels",()=>{
 temp(base=>{
   const dir=fakeOriginal(base);
   const p=r.buildPlan(dir);
   assert.equal(p.length,48);
   assert.equal(new Set(p.map(x=>x.id)).size,48);
   for(let i=0;i<24;i++){
     const [a,b]=p.slice(2*i,2*i+2);
     assert.notEqual(a.condition,b.condition);
     assert.equal(a.originalSha256,b.originalSha256);
     assert.deepEqual(a.prompt[1],b.prompt[1]);
     const payload=JSON.parse(a.prompt[1].content);
     assert.deepEqual(Object.keys(payload),["검토할_목표_명제","실제로_독자가_읽은_문단"]);
     assert.ok(!a.prompt[1].content.includes("INDETERMINATE"));
   }
 });
});
test("source score verifies plan, every final model response and author-side uncertain denominator",()=>{
 temp(base=>{
  const dir=fakeOriginal(base),out=path.join(base,"result");fs.mkdirSync(out);
  const plan=r.buildPlan(dir),planHash=planReceipt(plan).planHash;
  const judge=new Map(r.fullTexts(dir).map(x=>[x.id,x.authorJudgment]));
  for(const c of plan){
    const condition=c.condition,workId=c.id.slice(0,-("_"+condition).length);
    const gold=judge.get(workId);
    const status=gold==="YES"?"ASSERTED":gold==="NO"?
      (condition==="binary"?"NOT_ASSERTED":"ABSENT"):"UNKNOWN";
    const snippet=JSON.parse(c.prompt[1].content).실제로_독자가_읽은_문단;
    const text=JSON.stringify({status,evidence:status==="ASSERTED"?snippet:""});
    fs.writeFileSync(path.join(out,c.id+".attempt.json"),JSON.stringify({
      id:c.id,planHash,promptSha256:c.promptSha256
    }));
    fs.writeFileSync(path.join(out,c.id+".result.json"),JSON.stringify({
      id:c.id,promptSha256:c.promptSha256,outcome:"GENERATED",
      text,textSha256:sha(text),usage:{prompt_tokens:9,completion_tokens:4,total_tokens:13}
    }));
  }
  fs.writeFileSync(path.join(out,"summary.json"),JSON.stringify({
    planHash,rows:plan.map(x=>({id:x.id}))
  }));
  const result=r.score(dir,out),summary=r.aggregate(result);
  assert.equal(result.rows.length,24);
  assert.equal(summary.binary.decidedGold,22);
  assert.equal(summary.binary.correctOnDecided,22);
  assert.equal(summary.attribution.correctOnDecided,22);
  assert.equal(summary.binary.modelAttempts,24);
  assert.equal(summary.binary.totalTokens,312);
  const name=plan[0].id+".result.json",target=path.join(out,name);
  const d=JSON.parse(fs.readFileSync(target));d.text+=" manipulated";
  fs.writeFileSync(target,JSON.stringify(d));
  assert.throws(()=>r.score(dir,out),/ALTERED_R2B_MODEL_OUTPUT/);
 });
});
test("corrupt original plan cannot be substituted with the model classifier plan",()=>{
 temp(base=>{
   const dir=fakeOriginal(base);
   const f=path.join(dir,"r934-plan-safe.json");
   const p=JSON.parse(fs.readFileSync(f));p.planHash="tampered";
   fs.writeFileSync(f,JSON.stringify(p));
   assert.throws(()=>r.fullTexts(dir),/R934_PLAN_PROVENANCE_MISMATCH/);
 });
});
