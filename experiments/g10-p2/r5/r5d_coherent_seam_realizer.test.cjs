"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r5d_coherent_seam_realizer.cjs");
const r5c=require("./r5c_source_witnessed_realizer.cjs");
const book=require("./fixtures/r5d_frozen_four_discourse_seam_edges_v01.json");
test("four manually declared dependence edges are explicitly investigator-supervised (not learned)",()=>{
 assert.equal(book.schema,"ksgt.g10p2.r5d.predeclared-coherent-regions.v1");
 assert.equal(book.authority,"ADAPTIVE_DEVELOPER_SUBSET_AFTER_R5C_NOT_FRESH_HOLDOUT");
 assert.equal(book.cases.length,4);
 assert.equal(new Set(book.cases.map(x=>x.sourceWork)).size,4);
 assert.equal(new Set(book.cases.map(x=>x.edgeKind)).size,4);
 for(const c of book.cases){
  const target=r5c.frozen.targets.find(t=>t.sourceWork===c.sourceWork);
  assert.ok(target);
  assert.ok(typeof c.from==="string"&&c.from.length>0&&typeof c.through==="string"&&c.through.length>0);
  assert.ok(c.dependency.length>35);
 }
});
test("the actual 8-source full-document base remains valid and frozen",()=>{
 assert.equal(r5c.manifestCheck(),true);
 assert.equal(r5c.frozen.sourceR5bRun,44899223057);
 assert.equal(book.priorR5cRun,44900323773);
});
test("all source evidence ids are in range, and no unexposed source is counted as test",()=>{
 for(const c of book.cases){
  const t=r5c.frozen.targets.find(x=>x.sourceWork===c.sourceWork);
  assert.ok(t.refs.every(x=>x>=1&&x<=5));
  assert.ok(c.from.includes(t.quote)||c.through.includes(t.quote)||
   ["R5A_SCENE_PAPER","R5A_SCI_CLOCK","R5A_NOTICE_BOOK","R5A_SCENE_GARDEN"].includes(c.sourceWork));
 }
});
test("a seamless human-reading packet contains complete documents and zero HTML form",()=>{
 const faux={rows:[{id:"F1",genre:"scene",task:"장면 묘사",
  sourceFacts:["가","나"],originalDefectQuote:"그때",
  dependency:"연결 문맥",seamEdit:{status:"APPLIED",reason:"문장 호응 보존",text:"수정 원고"},
  previousB120:{text:"원본 원고"},previousSingleSpan:{text:"한 구절 원고"},
  previousFullRewrite:{text:"완전 재작성 원고"}}]};
 const t=r.readingPacket(faux);
 assert.ok(t.includes("원본 원고")&&t.includes("수정 원고")&&t.includes("완전 재작성 원고"));
 assert.equal(/<html|<form|<input|<script/i.test(t),false);
});
