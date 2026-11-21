"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r4b_human_gate_packets_v01.cjs");
const source=require("./fixtures/r4a_new_full_prose_12works_v01.json");
const mk=()=>{
 const w=new Map(source.works.map(x=>[x.id,x]));
 return [
 ["CHAT_UPLOAD","direct"],["CHAT_UPLOAD","rich"],
 ["NOTICE_CHEM","direct"],["NOTICE_CHEM","rich"],
 ["SCI_SEED","rich"],["SCENE_NOTE","rich"]
 ].map(([name,arm])=>{
 const sourceWork="R4A_"+name,work=w.get(sourceWork);
 return {id:name+"_"+arm,sourceWork,genre:work.genre,work,
  modelLocalPatch:"국소 수정 결과 "+name+" "+arm,
  fullRewrite:"전체 재작성 결과 "+name+" "+arm,
  rawOriginalSha:"abcdef".repeat(10)+"abcd"};
 });
};
test("two panels include no duplicate source work within a reader's form",()=>{
 const d=mk();
 for(const p of ["P","Q"])for(const v of [1,2]){
  const out=r.renderForm(d,p,v,"A");
  assert.equal(out.key.rows.length,4);
  assert.equal(new Set(out.key.rows.map(x=>x.sourceWork)).size,4);
 }
});
test("A reader view has no raw source fact list, model method identity or private source answer",()=>{
 const d=mk();
 const x=r.renderForm(d,"P",1,"A");
 assert.ok(x.text.includes("최초"));
 assert.ok(x.text.includes("글 A에서 읽은 답"));
 assert.ok(!x.text.includes("**원천 사실:**"));
 assert.ok(!x.text.includes("MODEL_FULL_REWRITE"));
 assert.ok(!x.text.includes(d[0].work.answer));
});
test("B source audit has exact source list but no author method identity",()=>{
 const d=mk(),x=r.renderForm(d,"Q",1,"B");
 assert.ok(x.text.includes("**원천 사실:**"));
 assert.ok(x.text.includes(d[1].work.facts[0]));
 assert.ok(x.text.includes(d[5].work.license));
 assert.ok(x.text.includes("원천에 없는 구절"));
 assert.ok(!x.text.includes("MODEL_LOCAL_PATCH"));
});
test("paired A/B order balances the same source work across version 1 and 2",()=>{
 const d=mk();
 for(const p of ["P","Q"]){
  const a=r.renderForm(d,p,1,"A").key.rows,
    b=r.renderForm(d,p,2,"A").key.rows;
  for(const c of a){
   const other=b.find(x=>x.id===c.id);
   assert.ok(other);
   assert.notEqual(c.A,other.A);
   assert.equal(c.shaA,other.shaB);
  }
 }
});
test("method mapping and source answer remain only in private mapping",()=>{
 const d=mk(),x=r.renderForm(d,"P",1,"A");
 assert.equal(x.key.rows[0].shaA.length,64);
 assert.ok(x.key.rows[0].sourceAnswer);
 assert.ok(x.key.rows[0].A.includes("MODEL_"));
 assert.ok(!x.text.includes("sourceAnswer"));
});
test("invalid panel/stage/version must fail, never silently leak mapping",()=>{
 const d=mk();
 assert.throws(()=>r.renderForm(d,"P",0,"A"),/INVALID_FORM_SELECTORS/);
 assert.throws(()=>r.renderForm(d,"P",1,"P"),/INVALID_FORM_SELECTORS/);
 assert.throws(()=>r.renderForm(d,"BLAH",1,"B"),/INVALID_FORM_SELECTORS/);
});
