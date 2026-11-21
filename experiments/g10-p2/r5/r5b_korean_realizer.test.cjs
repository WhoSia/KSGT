"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createHash}=require("node:crypto");
const r=require("./r5b_korean_realizer.cjs");
const r5a=require("./r5a_realized_prefix_prose.cjs");
const sha=v=>createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
test("locked R5a eight historical prompts match all prior output/prompt hashes",()=>{
 assert.equal(r.validate(),true);
 const w=r5a.fixture.works;
 assert.equal(w.length,8);
});
test("24 actual new writer arms only, eight old provider calls never counted as new",()=>{
 const p=r.buildPlan();
 assert.equal(p.length,24);
 assert.equal(new Set(p.map(x=>x.id)).size,24);
 for(const w of r5a.fixture.works){
  const items=p.filter(x=>x.sourceWork===w.id);
  assert.equal(items.length,3);
  assert.deepEqual(new Set(items.map(x=>x.arm)),new Set(["K20","B120","K120"]));
  assert.equal(new Set(items.map(x=>x.sourceSha256)).size,1);
 }
});
test("unmodified B120 direct prompt byte-identical to historical 20B direct",()=>{
 const p=r.buildPlan();
 for(const w of r5a.fixture.works){
  const b=p.find(x=>x.id===w.id+"_B120");
  const old=r5a.writerPrompt(w,"direct");
  assert.equal(b.promptSha256,sha(old));
  assert.deepEqual(b.prompt,old);
  assert.equal(b.model,"openai/gpt-oss-120b");
 }
});
test("K20 and K120 craft instructions identical, model change outside prompt only",()=>{
 const p=r.buildPlan();
 for(const w of r5a.fixture.works){
  const a=p.find(x=>x.id===w.id+"_K20");
  const b=p.find(x=>x.id===w.id+"_K120");
  assert.equal(a.promptSha256,b.promptSha256);
  assert.deepEqual(a.prompt,b.prompt);
  assert.equal(a.model,"openai/gpt-oss-20b");
  assert.equal(b.model,"openai/gpt-oss-120b");
  assert.deepEqual(JSON.parse(a.prompt[1].content).sourceFacts,w.facts);
  assert.ok(JSON.parse(a.prompt[1].content).koreanRealization.genrePolicy.length>30);
 }
});
test("K20 craft changes only style policy and not original task/facts",()=>{
 for(const w of r5a.fixture.works){
  const original=JSON.parse(r5a.writerPrompt(w,"direct")[1].content);
  const craft=JSON.parse(r.craftPrompt(w)[1].content);
  const {koreanRealization,...rest}=craft;
  assert.deepEqual(rest,original);
  assert.ok(koreanRealization.genrePolicy.includes("문")||koreanRealization.genrePolicy.includes("실"));
 }
});
test("provider run is sealed, full retry refusal, model IDs verified and corrupted text SHA rejected",async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r5b-"));
 const out=path.join(root,"new");
 let calls=0;
 try{
  const fn=async ({model,messages})=>{
   calls++;
   return {text:"이 문장은 새로운 원천 사실을 추가하지 않습니다. 작성 목적에 맞춘 자연스러운 한국어 본문입니다.",
    responseModel:model,finishReason:"stop",usage:{total_tokens:300,prompt_tokens:200,completion_tokens:100},latencyMs:23};
  };
  const z=await r.run(out,{invoke:fn});
  assert.equal(z.generated,24);
  assert.equal(calls,24);
  const actual=r.strictRead(out);
  assert.equal(actual.size,24);
  assert.equal(actual.get(r5a.fixture.works[0].id+"_K120").responseModel,"openai/gpt-oss-120b");
  await assert.rejects(()=>r.run(out,{invoke:fn}),/REFUSE_EXISTING_R5B_OUTPUT/);
  const p=path.join(out,"responses",r5a.fixture.works[0].id+"_K20.result.json");
  const val=JSON.parse(fs.readFileSync(p));val.text+=" altered";fs.writeFileSync(p,JSON.stringify(val));
  assert.throws(()=>r.strictRead(out),/RESULT_TEXT_MODEL_OR_TOKEN_INVALID/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test("failed provider leaves inspectable raw receipts and cannot masquerade as generation",async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r5b-"));
 const out=path.join(root,"fail");
 let calls=0;
 try{
  await assert.rejects(()=>r.run(out,{invoke:async()=>{calls++;throw Error("SIMULATED_HTTP_FAILURE")}}),
    /R5B_PARTIAL_OUTPUT_PRESERVED/);
  assert.equal(calls,24);
  const dir=path.join(out,"responses");
  assert.equal(fs.readdirSync(dir).filter(f=>f.endsWith(".result.json")).length,24);
  assert.throws(()=>r.strictRead(out),/RESULT_TEXT_MODEL_OR_TOKEN_INVALID/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test("owner-facing packet uses plain readable Markdown with complete Korean texts and no forced HTML",()=>{
 const rows=r5a.fixture.works.map(w=>({id:w.id,genre:w.genre,task:w.task,
  risk:w.risk,sourceFacts:w.facts,outputs:Object.fromEntries(
   ["B20","K20","B120","K120"].map(k=>[k,{text:"가상의 한국어 문장입니다."}]))}));
 const packet=r.makeOwnerPacket({rows});
 assert.equal((packet.match(/### 원고 A/g)||[]).length,8);
 assert.equal((packet.match(/### 원고 D/g)||[]).length,8);
 assert.equal((packet.match(/## 블라인드 표지 해독표/g)||[]).length,1);
 assert.equal(/<html|<script|<!DOCTYPE/i.test(packet),false);
});
test("stereotyped phrase diagnostics never imply quality measurement",()=>{
 const x=r.phraseNotes("그저 마치 그저");assert.equal(x["그저"],2);
 assert.equal(x["단순히"],0);
});
