"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r5c_source_witnessed_realizer.cjs");
const base=require("./r5a_realized_prefix_prose.cjs");
const {createHash}=require("node:crypto");
const sha=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const sample=()=>{
 const w=base.fixture.works.find(w=>w.id==="R5A_NOTICE_SHOW");
 const quote="안내하겠습니다.";
 const original="설치 장소는 아직 미정입니다. 안내하겠습니다. 작품을 가져오기 전 안내를 확인하세요.";
 const target={sourceWork:w.id,quote,kind:"INVENTED_FUTURE_PROMISE",
  diagnosis:"원천에 알림 발송 약속은 없으므로 발송한다는 확정 진술을 삭제한다.",refs:[3,5],
  originalTextSha256:sha(original)};
 return {w,original,target,sha:sha(original)};
};
test("eight originally selected whole-document quote targets are frozen before actual editing",()=>{
 assert.equal(r.manifestCheck(),true);
 assert.equal(r.frozen.targets.length,8);
 assert.equal(new Set(r.frozen.targets.map(t=>t.sourceWork)).size,8);
 for(const t of r.frozen.targets)assert.equal(t.originalTextSha256.length,64);
});
test("paired PATCH and REWRITE prompts see identical source facts, writer task and exact defect; differ only output scope",()=>{
 const one=sample();
 const a=r.promptCell(one,"PATCH"),b=r.promptCell(one,"REWRITE");
 assert.equal(a.model,b.model);
 assert.equal(a.priorTextSha256,b.priorTextSha256);
 const x=JSON.parse(a.prompt[1].content),y=JSON.parse(b.prompt[1].content);
 assert.deepEqual({...x,outputRule:null},{...y,outputRule:null});
 assert.equal(x.problem.exactQuote,one.target.quote);
 assert.equal(x.sourceFacts.length,5);
 assert.notEqual(a.promptSha256,b.promptSha256);
});
test("anchored one-span replacement changes only quoted section and keeps both outside regions byte-for-byte",()=>{
 const one=sample();
 const res=r.validatePatch(JSON.stringify({
  decision:"REPLACE",quote:one.target.quote,
  replacement:"",reason:"발송 약속이 없음"}),one);
 assert.equal(res.status,"APPLIED");
 assert.equal(res.text,"설치 장소는 아직 미정입니다.  작품을 가져오기 전 안내를 확인하세요.");
 assert.equal(res.exactOutsideSpanIdentity,true);
 assert.equal(res.hasOriginalQuoteStill,false);
});
test("source-clause numeric gate rejects invented notice cutoff 23:59 while allowing 4/5 class periods",()=>{
 const one=sample();
 let bad=r.validatePatch(JSON.stringify({decision:"REPLACE",quote:one.target.quote,
  replacement:"월요일 23:59까지 안내하겠습니다.",reason:"가짜 시각"}),one);
 assert.equal(bad.status,"REJECTED");
 assert.equal(bad.reason,"NOVEL_NUMERIC_NOT_IN_SOURCE");
 assert.equal(bad.text,one.original);
 const book=base.fixture.works.find(w=>w.id==="R5A_NOTICE_BOOK");
 const o={w:book,original:"공지 원문","target":{quote:"공지 원문"}};
 const good=r.validatePatch(JSON.stringify({decision:"REPLACE",quote:"공지 원문",
  replacement:"수요일 4교시에는 대출 창구가 운영되지 않으며 5교시에는 이용할 수 있습니다.",reason:"원천 교시 유지"}),o);
 assert.equal(good.status,"APPLIED");
});
test("invalid JSON, wrong anchor and empty-input fallback never overwrite original",()=>{
 const o=sample();
 for(const raw of ["{broken",JSON.stringify({decision:"REPLACE",quote:"다른 구절",replacement:"삭제",reason:"틀림"}),JSON.stringify({decision:"REPLACE",quote:o.target.quote,replacement:"문구만"})]){
  const x=r.validatePatch(raw,o);
  assert.equal(x.status,"REJECTED");
  assert.equal(x.text,o.original);
 }
});
test("no-op is honest, bad no-op is rejected and an identical patch cannot be credited",()=>{
 const o=sample();
 const noop=r.validatePatch(JSON.stringify({decision:"NO_OP",quote:o.target.quote,replacement:"",reason:"현 상태 유지"}),o);
 assert.equal(noop.status,"NO_OP");
 assert.equal(noop.text,o.original);
 assert.equal(r.validatePatch(JSON.stringify({decision:"NO_OP",quote:o.target.quote,replacement:"강제 변경",reason:"틀림"}),o).status,"REJECTED");
 assert.equal(r.validatePatch(JSON.stringify({decision:"REPLACE",quote:o.target.quote,replacement:o.target.quote,reason:"그대로"}),o).status,"NO_OP");
});
test("mechanical source-new digits are only a necessary constraint, never semantic truth",()=>{
 const digits=r.numericTokens("5교시와 42초, 550 nm");
 assert.deepEqual([...digits].sort(),["42","5","550"]);
 assert.equal(typeof r.validatePatch,"function");
});
test("plain Markdown reading packet contains complete real-written slots and no HTML form",()=>{
 const w=sample().w;
 const row={sourceWork:w.id,genre:w.genre,sourceFacts:w.facts,task:w.task,
  target:sample().target,original:{text:"직접 생성"},exactSpanEdit:{text:"짧은 부분 수정",status:"APPLIED",reason:"정상"},
  entireRewrite:{text:"완전 재작성"}};
 const txt=r.readingPacket({rows:[row]});
 assert.ok(txt.includes("### 원고 A"));
 assert.ok(txt.includes("### 원고 C"));
 assert.equal(/<form|<html|<input|<script/i.test(txt),false);
});
