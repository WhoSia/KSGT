"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const x=require("./r4b_whitespace_alignment_v01.cjs");
const spec=require("./fixtures/r4b_real_prose_local_repair_v01.json").cases;
const get=id=>spec.find(c=>c.id.includes(id));
test("exact frozen target can be replaced without modifying prefix or suffix",()=>{
 const t=get("NOTICE_CHEM_direct"),text="앞 "+t.before+"끝";
 const res=x.align(text,t,{action:"PATCH",before:t.before,after:""});
 assert.equal(res.status,"EXACT_APPLIED_UNVERIFIED");
 assert.equal(res.output,"앞 끝");
});
test("leading whitespace dropped from the quote can be aligned only to author span",()=>{
 const t=get("CHAT_UPLOAD_rich"),text="소개."+t.before+" 완료.";
 const res=x.align(text,t,{action:"PATCH",before:t.before.trim(),after:""});
 assert.equal(res.status,"EDGE_WHITESPACE_ALIGNED_UNVERIFIED");
 assert.equal(res.output,"소개. 완료.");
 assert.equal(res.originalSha256.length,64);
});
test("trailing whitespace dropped from the quote can be aligned only to author span",()=>{
 const t=get("NOTICE_CHEM_rich"),text="여기서 "+t.before+"제출한다.";
 const res=x.align(text,t,{action:"PATCH",before:t.before.trim(),after:""});
 assert.equal(res.status,"EDGE_WHITESPACE_ALIGNED_UNVERIFIED");
 assert.equal(res.output,"여기서 제출한다.");
});
test("internal spacing or content changes are forbidden, even if similar in meaning",()=>{
 const t=get("SCENE_NOTE_rich"),text="첫 문장."+t.before+"끝.";
 for(const before of ["그 작은 종이  조각은 바람에 흔들리듯 가볍게 펴졌다.",
   "그 작은 종이 조각은 바람에 흔들리듯 펴졌다.",
   "그 작은 종이 조각은 바람에 흔들리듯 가볍게 접혔다."]){
  assert.equal(x.align(text,t,{action:"PATCH",before,after:""}).status,"REJECT_CONTENT_CHANGED");
 }
});
test("a duplicate target witness cannot be resolved by guess",()=>{
 const t=get("SCENE_NOTE_rich"),text="문장."+t.before+t.before+"끝.";
 const res=x.align(text,t,{action:"PATCH",before:t.before.trim(),after:""});
 assert.equal(res.status,"REJECT_NOT_UNIQUE_ORIGINAL");
});
test("NO_TARGET is never patched by speculative model edits",()=>{
 const t=get("NOTICE_ROOM_direct");
 const res=x.align("문장 원문",t,{action:"PATCH",before:"문장",after:"변형"});
 assert.equal(res.status,"REJECT_NOT_A_TARGET");
});
test("adding undocumented keys or newlines is rejected",()=>{
 const t=get("NOTICE_CHEM_direct"),text="앞 "+t.before+"끝";
 for(const o of [{action:"PATCH",before:t.before,after:"",why:"good"},
  {action:"PATCH",before:t.before,after:"새\n사실"},
  {action:"KEEP",before:t.before,after:""}]){
  assert.equal(x.align(text,t,o).status,"REJECT_BAD_PROPOSAL");
 }
});
