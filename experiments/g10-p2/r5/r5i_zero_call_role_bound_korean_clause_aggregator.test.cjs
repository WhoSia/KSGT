"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const h=require("./r5h_korean_role_bound_micro_realizer.cjs");
const i=require("./r5i_zero_call_role_bound_korean_clause_aggregator.cjs");
test("R5i has a frozen actual R5h original source-JSON hash and rejects substituted source",()=>{
 a.equal(i.ORIGINAL_R5H_SCORE_SHA256,"ed62b1f3a8f1772dad92eb4c14d38b1c6f710f16c577f8c9020cbd294a7b9216");
 a.throws(()=>i.validateExactSource(Buffer.from('{"newProviderCalls":16}')),/R5I_REFUSE_NON_ORIGINAL_R5H_SOURCE_SCORE/);
});
test("Korean selected-clause converb is a restricted grammar, never a free string replace",()=>{
 a.equal(i.converb("접힌 지도를 손에 쥐고 있었다.",i.AP),"접힌 지도를 손에 쥔 채");
 a.equal(i.converb("접힌 지도를 손에 들고 있었다.",i.AP),"접힌 지도를 손에 든 채");
 a.equal(i.converb("편지를 손안에 두고 있었다.",i.AP),"편지를 손안에 둔 채");
 a.equal(i.converb("그는 종이를 쥐고 있었다.",i.AP),null);
 a.equal(i.converb("창 앞에 서 있었다.",i.BP),"창 앞에 서서");
 a.equal(i.converb("벽의 그림을 바라보고 있었다.",i.BP),"벽의 그림을 바라보며");
 a.equal(i.converb("빈 액자에 시선을 두고 있었다.",i.BP),"빈 액자에 시선을 두며");
 a.equal(i.converb("창 밖으로 달려 나갔다.",i.BP),null);
});
test("all author-defined original R5h default scenes become four-clause native Korean without losing source frames",()=>{
 h.validate();
 for(const w of h.fixture.works){
  const old=h.render(w,h.defaultIndices(w));
  const anew=i.aggregate(w,old);
  a.equal(anew.aggregatedSentenceCount,4);
  a.equal(anew.declaredFrameFactsCovered,6);
  a.equal(anew.joinedSourcePairs,2,w.id);
  a.equal(anew.segments[1].actorID,"A",w.id);
  a.equal(anew.segments[2].actorID,"B",w.id);
  a.deepEqual(anew.segments.flatMap(x=>x.sourceFrameIDs),["S1","S2","S3","S4","S5","S6"]);
  a.ok(anew.segments[1].text.startsWith(w.entities[0].name+h.particle(w.entities[0].name,"TOPIC")));
  a.ok(anew.segments[2].text.startsWith(w.entities[1].name+h.particle(w.entities[1].name,"TOPIC")));
  a.equal(anew.segments[0].text,old.trace[0].outputText);
  a.equal(anew.segments[3].text,old.trace[5].outputText);
 }
});
test("no silent repairs of tampered original actor assignments or clause variants",()=>{
 const w=h.fixture.works[0],good=h.render(w,h.defaultIndices(w));
 const bad=structuredClone(good);bad.trace[1].actorID="B";
 a.throws(()=>i.aggregate(w,bad),/R5I_SOURCE_ROLE_OR_SOURCETEXT_CHANGED/);
 const bad2=structuredClone(good);bad2.trace[1].outputText="서진은 접힌 지도를 손에 들고 있었다.";
 a.throws(()=>i.aggregate(w,bad2),/R5I_ORIGINAL_CLAUSE_SHA_FAIL|R5I_ORIGINAL_PREDICATE_OR_SUBJECT_CHANGED/);
});
test("unsupported converb never invents a new predicate or changes actor; fallback preserves full source clauses",()=>{
 const w=h.fixture.works[7],p=h.render(w,h.defaultIndices(w)),alt=structuredClone(p);
 const fake=[...p.trace];fake[1]={
  ...fake[1],outputText:"서아는 이름표를 붙인 상자 하나를 열지 않은 채 들고 있었다.",
  predicateVariant:1
 };
 const crypto=require("node:crypto");
 fake[1].outputSHA256=crypto.createHash("sha256").update(fake[1].outputText).digest("hex");
 const fixed=i.aggregate(w,{...alt,trace:fake});
 a.equal(fixed.segments[1].joined,false);
 a.ok(fixed.segments[1].text.includes("서아는"));
 a.ok(fixed.segments[1].text.includes("작업대"));
});
test("R5i packet provides actual direct writing alongside before and after compiled Korean prose",()=>{
 const w=h.fixture.works[0],old=h.render(w,h.defaultIndices(w)),newOne=i.aggregate(w,old);
 const s=i.readingPacket({rows:[{sourceWork:w.id,sourceLicense:w.license,
  actualDirect120B:"유나는 지도를 들고 있었다. 서진은 서랍을 바라봤다.",
  originalR5hSelected:old.text,aggregatedSelected:newOne,aggregatedDefault:newOne}]});
 a.ok(s.includes("실제 직접 120B"));
 a.ok(s.includes("사후 절 결합"));
 a.ok(s.includes("논항 추적"));
 a.ok(s.includes("S2+S3"));
 a.equal(/<form|<html|<script/.test(s),false);
});
