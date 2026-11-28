"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createHash}=require("node:crypto");
const a=require("./r5a_realized_prefix_prose.cjs");
const {REVISION_SETTINGS}=require("../../g10-p1/r924_anchored_revision_v01.cjs");
const h=v=>createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
test("eight new exposed source-work groups, two per genre, no repeated declared parents",()=>{
 const v=a.validateFixture(),genres=Object.groupBy(v.works,w=>w.genre);
 assert.equal(v.works.length,8);
 for(const genre of ["chat","science","notice","scene"])assert.equal(genres[genre].length,2);
 assert.equal(new Set(v.works.map(w=>w.parent)).size,8);
 assert.equal(v.status,"AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT_NO_INDEPENDENT_READER_GOLD");
});
test("writer plans contain exactly 16 unique prompt hashes and same five facts within work",()=>{
 const p=a.buildWriterPlan();assert.equal(p.length,16);
 assert.equal(new Set(p.map(x=>x.id)).size,16);
 for(const w of a.fixture.works){
  const cells=p.filter(x=>x.sourceWork===w.id);assert.equal(cells.length,2);
  assert.deepEqual(cells.map(x=>x.sourceSha256),[h(w.facts),h(w.facts)]);
  assert.notEqual(cells[0].promptSha256,cells[1].promptSha256);
 }
});
test("valid claimed meaning requires exact and unique anchor to actual prefix (not human truth)",()=>{
 const p="논문 PDF는 아직 입수하지 못했다. 관련 서지 정보는 있다.";
 const r=a.parseExtraction(JSON.stringify({observations:[
 {index:1,status:"STATED",quote:"논문 PDF는 아직 입수하지 못했다."},
 {index:2,status:"UNCERTAIN",quote:""}]}),p,["원문 PDF 미보유","서지 보유"]);
 assert.equal(r.valid,true);assert.equal(r.authority,"MODEL_EXTRACTOR_ANCHORED_SURFACE_NOT_SEMANTIC_GOLD");
});
test("wrong quote, duplicate quote, non-empty quote with NO status all abstain",()=>{
 const facts=["F1","F2"],p="문구가 반복. 문구가 반복.";
 const base=[{index:1,status:"STATED",quote:"문구가 반복."},{index:2,status:"NOT_STATED",quote:""}];
 for(const observations of [
  base,[{...base[0],quote:"여기에 없음"},base[1]],
  [{...base[0],quote:"문구가 반복."},{...base[1],quote:"오류"}],
  [{...base[0],index:2},base[1]]
 ]){
  assert.equal(a.parseExtraction(JSON.stringify({observations}),p,facts).valid,false);
 }
 assert.equal(a.parseExtraction("{broken",p,facts).observations[0].status,"UNCERTAIN");
});
test("malformed plan statuses never produce external evidence authority",()=>{
 const w=a.fixture.works[0],facts=w.facts;
 const obs={observations:facts.map((_,i)=>({index:i+1,status:"UNCERTAIN",quote:""}))};
 const planned=a.stateFor(w,obs,"plan");
 const observed=a.stateFor(w,obs,"observed");
 assert.equal(planned[w.planFirstFactIndex-1].status,"STATED");
 assert.equal(observed[w.planFirstFactIndex-1].status,"UNCERTAIN");
 assert.equal(planned.filter(x=>x.status==="STATED").length,1);
});
test("same realized prefix and source in both continuations; only state notes differ",()=>{
 const w=a.fixture.works[0],prefix="원문 기록을 함께 확인했다.";
 const stA=w.facts.map((_,i)=>({index:i+1,status:"STATED",quote:"원문"}));
 const stB=w.facts.map((_,i)=>({index:i+1,status:"UNCERTAIN",quote:""}));
 const aP=JSON.parse(a.continuationPrompt(w,prefix,stA)[1].content);
 const bP=JSON.parse(a.continuationPrompt(w,prefix,stB)[1].content);
 assert.deepEqual({...aP,readerStateNotes:null},{...bP,readerStateNotes:null});
 assert.equal(aP.actualPrefix,bP.actualPrefix);
});
test("end-to-end 40-call development replay saves actual complete text and all costs; no quality claim",async()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r5a-"));
 const root=path.join(temporary,"run");
 const invoked=[];
 try{
  const mock=async (plan,dir)=>{
   fs.mkdirSync(dir);
   const planHash=h({settings:REVISION_SETTINGS,plan}),rows=[];
   for(const c of plan){
    const w=a.fixture.works.find(w=>w.id===c.sourceWork);
    const text=c.condition==="direct"?"관측과 미정 정보를 구별하는 온전한 문장.":
     c.condition==="prefix"?w.facts[0]+" 첫 문장이 쓰였다.":
     c.condition==="extract"?
      JSON.stringify({observations:w.facts.map((_,i)=>({index:i+1,
       status:i===0?"STATED":"NOT_STATED",quote:i===0?w.facts[0]:""}))}):
      c.condition==="plan"?"미정인 내용을 정확히 나눴다.":"앞에 적힌 사실에 이어 남은 일을 밝혔다.";
    const r={id:c.id,promptSha256:c.promptSha256,outcome:"GENERATED",text,
     textSha256:h(text),finishReason:"stop",usage:{total_tokens:100,prompt_tokens:60,completion_tokens:40}};
    fs.writeFileSync(path.join(dir,c.id+".attempt.json"),JSON.stringify({id:c.id,promptSha256:c.promptSha256,planHash}));
    fs.writeFileSync(path.join(dir,c.id+".result.json"),JSON.stringify(r));
    rows.push({id:c.id,outcome:"GENERATED"});invoked.push(c);
   }
   fs.writeFileSync(path.join(dir,"summary.json"),JSON.stringify({planHash,rows}));
   return {rows};
  };
  const result=await a.run(root,{execute:mock});
  assert.equal(invoked.length,40);assert.equal(result.callCount,40);
  assert.equal(result.completeTexts,24);assert.equal(result.extractionValid,8);
  assert.equal(result.statusContrastWorks,0);assert.equal(result.providerTokens.fullResearchAllCalls,4000);
  assert.equal(result.providerTokens.directTotal,800);
  assert.equal(result.providerTokens.planTotalAllocated,1600);
  assert.equal(result.providerTokens.observedTotalAllocated,2400);
  assert.equal(result.realIndependentReaderRatings,0);
  assert.equal(result.proseQualityAdvantage,"UNESTABLISHED");
  assert.equal(fs.existsSync(path.join(root,"final-score.json")),true);
  const reread=a.score(root);assert.equal(reread.rows[0].completions.plan.fullText.startsWith(reread.rows[0].sharedPrefix.text),true);
  await assert.rejects(()=>a.run(root,{execute:mock}),/REFUSE_EXISTING_R5A_OUTPUT/);
  // Corrupt a preserved response SHA; the scorer must stop before producing a summary.
  const p=path.join(root,"writers",a.fixture.works[0].id+"_direct.result.json");
  const old=JSON.parse(fs.readFileSync(p));old.text="tampered";fs.writeFileSync(p,JSON.stringify(old));
  assert.throws(()=>a.score(root),/INCOMPLETE_OR_BAD_SHA/);
 }finally{fs.rmSync(temporary,{recursive:true,force:true})}
});
