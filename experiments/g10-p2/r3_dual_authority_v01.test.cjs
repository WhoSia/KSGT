"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const x=require("./r3_dual_authority_v01.cjs");

const entries=()=>x.fixture.works;
const decide=(work,ex)=>x.crossCheck({workId:work.id,realizedText:ex.text,evidence:ex.text,hypothesis:ex.hypothesis});

test("every four-genre relation comes from an exact P1 original source fact",()=>{
 assert.deepEqual(new Set(entries().map(w=>w.id)),
  new Set(["CHAT_CHECK","SCI_SCALE","NOTICE_SETUP","LIT_SHADOW"]));
 for(const w of entries()){
   const license=x.loadLicense(w.id);
   assert.deepEqual(license.sourceWhole.slice(...license.sourceSpan),license.sourceText);
   assert.ok(license.sourceId.endsWith(".F"+w.factIndex));
   assert.deepEqual(license.license,w.relation);
 }
});
test("author-frozen 12 counterexamples exhaustively meet declared closed contract",()=>{
 const result=x.diagnostic().flatMap(w=>w.outcomes);
 assert.equal(result.length,12);
 assert.deepEqual(result.reduce((acc,o)=>(acc[o.observed]=(acc[o.observed]||0)+1,acc),{}),
  {ALLOW:4,REJECT:7,MENTION_ONLY:1});
 for(const row of result)assert.equal(row.expected,row.observed,row.id);
});
test("source exact witness and output exact witness are separate provenance coordinates",()=>{
 const work=entries()[0],good=work.examples[0];
 const court=decide(work,good);
 assert.equal(court.decision,"ALLOW");
 assert.equal(court.proof.sourceText,x.loadLicense(work.id).sourceText);
 assert.equal(good.text.slice(...court.proof.surfaceSpan),good.text);
 assert.equal(court.proof.sourceId,x.loadLicense(work.id).sourceId);
});
test("a reviewer cannot launder nonlicensed model certainty through a matching phrase",()=>{
 const work=entries().find(w=>w.id==="LIT_SHADOW"),bad=work.examples[1],good=work.examples[0];
 const spoof={...good.hypothesis};
 const assessment=x.crossCheck({workId:work.id,realizedText:bad.text,evidence:bad.text,hypothesis:spoof});
 assert.equal(assessment.decision,"ABSTAIN");
 assert.equal(assessment.reason,"NO_INDEPENDENT_SURFACE_RELATION_CERTIFICATE");
});
test("even an approved sentence quoted inside a denial is not a valid global assertion",()=>{
 const work=entries()[0],good=work.examples[0];
 const text="“"+good.text+"”는 확인되지 않았다는 문장이다.";
 const assessment=x.crossCheck({workId:work.id,realizedText:text,
   evidence:good.text,hypothesis:good.hypothesis});
 assert.equal(assessment.decision,"ABSTAIN");
});
test("changed actors, broadened duty scope and unconditional scientific assumptions are rejected",()=>{
 const cases=[["LIT_SHADOW","reversed_actor"],["NOTICE_SETUP","broadened_scope"],
  ["SCI_SCALE","promoted_premise"],["SCI_SCALE","unconditional_result"],
  ["CHAT_CHECK","changed_time"],["CHAT_CHECK","new_promise"]];
 for(const [workId,caseId] of cases){
   const work=entries().find(w=>w.id===workId),ex=work.examples.find(x=>x.id===caseId);
   assert.equal(decide(work,ex).decision,"REJECT",workId+" "+caseId);
 }
});
test("quoted or attributed text can be mentioned without becoming a source-authorized fact",()=>{
 const w=entries().find(x=>x.id==="LIT_SHADOW"),ex=w.examples.find(x=>x.id==="quoted_not_fact");
 const res=decide(w,ex);
 assert.equal(res.decision,"MENTION_ONLY");
 assert.notEqual(res.decision,"ALLOW");
});
test("misquoted evidence and duplicate evidence fail closed",()=>{
 const w=entries()[0],ex=w.examples[0];
 assert.equal(x.crossCheck({workId:w.id,realizedText:ex.text,
   evidence:"만들어낸 문장",hypothesis:ex.hypothesis}).decision,"ABSTAIN");
 assert.equal(x.crossCheck({workId:w.id,realizedText:ex.text+" "+ex.text,
   evidence:ex.text,hypothesis:ex.hypothesis}).decision,"ABSTAIN");
 assert.equal(x.uniqueSpan("abc abc","abc"),null);
});
test("KEEP does not change a completely licensed line",()=>{
 const w=entries()[0],ex=w.examples[0];
 const review=x.reviewText(w.id,[ex.text],[{evidence:ex.text,hypothesis:ex.hypothesis}]);
 assert.equal(review.decision,"KEEP");
 assert.equal(review.text,ex.text);
 assert.equal(review.modelCalls,0);
 assert.equal(review.unknownOrUnsafe,0);
});
test("unsupported passage returns byte-identical ABSTAIN instead of fabricated repair",()=>{
 const w=entries()[0],ex=w.examples[0],unsupported="새로 쓴 문장이 진짜인지 확인할 수 없다.";
 const lines=[ex.text,unsupported];
 const result=x.reviewText(w.id,lines,[{evidence:ex.text,hypothesis:ex.hypothesis},
   {evidence:unsupported,hypothesis:ex.hypothesis}]);
 assert.equal(result.decision,"ABSTAIN");
 assert.equal(result.text,lines.join("\n"));
 assert.equal(result.modelCalls,0);
});
test("unknown work id and invalid source claims are never silently admitted",()=>{
 assert.throws(()=>x.loadLicense("NOT_REAL"),/UNKNOWN_SOURCE_WORK/);
 const w=entries()[0],ex=w.examples[0];
 const malformed={...ex.hypothesis,model_guess:"APPROVED"};
 assert.equal(x.crossCheck({workId:w.id,realizedText:ex.text,
   evidence:ex.text,hypothesis:malformed}).decision,"ABSTAIN");
});
