"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const G=require("../generate.cjs");
const cfg=require("../constitution.json"),source=require("../new_briefs.json");
test("six frozen tasks, one seed per brief, unchanged context for all arms",()=>{
 assert.doesNotThrow(G.check);
 assert.equal(G.order().length,6);
 for(const b of source.briefs){
  const arms=G.order().filter(x=>x.brief===b.id);
  assert.equal(arms.length,3);
  const prompts=arms.map(x=>G.condition(b,x.arm));
  assert(prompts.every(x=>x[0].content===prompts[0][0].content));
  assert(prompts.every(x=>b.facts.every(f=>x[1].content.includes(f))));
  assert(!prompts[0][0].content.includes("인용부호"));
 }
});
test("no old negative prompt enumeration, no hidden word-ban on any arm",()=>{
 for(const b of source.briefs){
  for(const a of ["B_CLEAN","U_PLAIN_PLAN","K_TYPED_PLAN"]){
   const v=JSON.stringify(G.condition(b,a));
   for(const s of ["인사말:","인용부호:","목록:","제목:","KRC에서 형식 검증한"])
    assert(!v.includes(s),"Forbidden prior-meta cue "+s);
  }
 }
});
test("no automatic claims or retries and experimental baseline competence gate",()=>{
 assert.equal(cfg.design.retries,0);
 assert.equal(cfg.design.n_outputs,6);
 assert.equal(cfg.reader_status,"OLD_V01_SURVEY_CANCELLED");
 assert.equal(cfg.gate.semantic.includes("human independent"),true);
});
test("a mocked six-output run does not invent human or semantic success",async()=>{
 let calls=0;
 const mock=async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:"주어진 사실을 설명했다.\n\n정보가 부족한 부분을 남겨 두었다."}}]})}};
 const r=await G.run("http://mock",mock);
 assert.equal(calls,6);
 assert.equal(r.completed,6);
 assert.equal(r.semantic_verdict,"NOT_ADJUDICATED");
 assert.equal(r.comparative_krc_result,"NOT_ADJUDICATED");
});
