"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r4b_original_text_local_repair.cjs");
const fixture=require("./fixtures/r4b_real_prose_local_repair_v01.json");

function spec(id){return fixture.cases.find(x=>x.id===id);}
test("R4b cohort freezes ten real prior-text SHA references, not fresh independent works",()=>{
 assert.equal(r.validateSpec(),fixture);
 assert.equal(fixture.cases.length,10);
 assert.equal(new Set(fixture.cases.map(x=>x.id)).size,10);
 assert.equal(fixture.cases.filter(x=>x.goldStatus==="ISSUE").length,6);
 assert.equal(fixture.cases.filter(x=>x.goldStatus==="NO_TARGET").length,4);
 assert.equal(fixture.sourceArtifactId,14698104554);
 const previous=new Set(require("./fixtures/r4a_new_full_prose_12works_v01.json").works.map(x=>x.id));
 assert.ok(fixture.cases.every(x=>previous.has(x.sourceWork)));
});
test("target span uniqueness is exact bytes, not normalized semantic proof",()=>{
 assert.deepEqual(r.unique("ab cd","cd"),[3,5]);
 assert.equal(r.unique("ab ab","ab"),null);
 assert.equal(r.unique("a b","ab"),null);
 assert.equal(r.unique("a b",""),null);
});
test("KEEP never changes original bytes, including on a suspected defect",()=>{
 const x=spec("R4B_R4A_CHAT_UPLOAD_direct"),original="본문\n"+x.before+"\n후속";
 const out=r.patchVerdict(original,x,'{"action":"KEEP"}');
 assert.equal(out.status,"KEEP_WITH_TARGET_REMAINING");
 assert.equal(out.result,original);
 assert.equal(out.changed,false);
 const control=spec("R4B_R4A_NOTICE_ROOM_direct");
 assert.equal(r.patchVerdict(original,control,'{"action":"KEEP"}').status,"KEEP_NO_TARGET");
});
test("bounded patch only replaces the unique author-flagged span and never rewrites elsewhere",()=>{
 const x=spec("R4B_R4A_NOTICE_CHEM_direct"),original="앞. 과학실 담당 교실에 제출한다. 뒤.";
 const out=r.patchVerdict(original,x,JSON.stringify({action:"PATCH",
   before:x.before,after:""}));
 assert.equal(out.status,"APPLIED_UNVERIFIED");
 assert.equal(out.result,"앞. 제출한다. 뒤.");
 assert.equal(out.changed,true);
 assert.equal(out.beforeSha256.length,64);
 assert.notEqual(out.beforeSha256,out.afterSha256);
});
test("reject unrelated patch even if it appears in source and model claims it is safe",()=>{
 const x=spec("R4B_R4A_NOTICE_CHEM_direct"),original="과학실 담당 교실에 제출한다. 접수 중.";
 const wrong=r.patchVerdict(original,x,JSON.stringify({action:"PATCH",
   before:"접수 중.",after:"접수 마감."}));
 assert.equal(wrong.status,"REJECT_WRONG_OR_DUPLICATED_SPAN");
 assert.equal(wrong.result,original);
});
test("reject overly broad, malformed, invisible, duplicated and self-identical edits",()=>{
 const x=spec("R4B_R4A_NOTICE_CHEM_direct"),original="과학실 담당 교실에 제출한다.";
 const valid={action:"PATCH",before:x.before,after:""};
 for(const invalid of [
  "가상의 설명",
  JSON.stringify({action:"KEEP",reason:"다르게 고침"}),
  JSON.stringify({...valid,after:"A".repeat(351)}),
  JSON.stringify({...valid,after:"줄바꿈\n추가"}),
  JSON.stringify({...valid,after:x.before}),
  JSON.stringify({...valid,additional:false}),
 ]){
  assert.notEqual(r.patchVerdict(original,x,invalid).status,"APPLIED_UNVERIFIED");
 }
 const dup=original+" "+original;
 assert.equal(r.patchVerdict(dup,x,JSON.stringify(valid)).status,"REJECT_WRONG_OR_DUPLICATED_SPAN");
});
test("NO_TARGET never treats an unsolicited model patch as a validated source correction",()=>{
 const x=spec("R4B_R4A_CHAT_SHIFT_direct"),original="아직 보정하지 않았습니다.";
 const a=r.patchVerdict(original,x,JSON.stringify({action:"PATCH",
   before:"않았습니다",after:"했습니다"}));
 assert.equal(a.status,"REJECT_UNPROMPTED_PATCH");
 assert.equal(a.result,original);
 const b=r.rewriteVerdict(original,"보정했습니다.",x.goldStatus);
 assert.equal(b.status,"UNPROMPTED_GLOBAL_EDIT");
});
test("researcher reference is one target only and cannot certify whole document",()=>{
 const x=spec("R4B_R4A_SCI_SEED_rich"),s=x.before+" 다른 오류는 그대로 있습니다.";
 const ref=r.referencePatch(s,x);
 assert.equal(ref.status,"AUTHOR_REFERENCE_TARGET_ONLY");
 assert.equal(ref.result,x.referenceAfter+" 다른 오류는 그대로 있습니다.");
 assert.equal(r.referencePatch(s,spec("R4B_R4A_NOTICE_ROOM_direct")).result,s);
});
test("full rewrite is measured separately from target deletion and is not automatically scored correct",()=>{
 const text="원문 첫 문장. 원문 둘째 문장.";
 const unchanged=r.rewriteVerdict(text,text,"ISSUE");
 assert.equal(unchanged.status,"KEEP_ORIGINAL");
 const changed=r.rewriteVerdict(text,"전혀 다른 문단","ISSUE");
 assert.equal(changed.status,"GLOBAL_REWRITE");
 assert.ok(changed.changedChars>0);
});
test("source-work exact link and model request validation cannot reclassify post-hoc targets as gold",()=>{
 assert.match(fixture.status,/POST_HOC/);
 assert.match(fixture.annotationScope,/NOT_GLOBAL/);
 for(const c of fixture.cases){
  assert.ok(c.originalTextSha256.length===64);
  assert.ok(c.issue.length>15);
  if(c.goldStatus==="NO_TARGET")assert.equal(c.referenceAfter,"");
 }
});
