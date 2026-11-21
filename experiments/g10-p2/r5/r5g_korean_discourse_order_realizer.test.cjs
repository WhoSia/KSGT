"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r5g_korean_discourse_order_realizer.cjs");
const {createHash}=require("node:crypto");
test("eight genuinely new researcher-authored six-fact Korean DAGs have four balanced genres",()=>{
 assert.equal(r.validateFixture(),r.fixture);
 assert.equal(r.fixture.works.length,8);
 assert.equal(r.fixture.works.reduce((n,w)=>n+w.nodes.length,0),48);
 const tally=Object.fromEntries(r.KINDS.map(k=>[k,r.fixture.works.filter(w=>w.genre===k).length]));
 assert.deepEqual(tally,{science:2,notice:2,chat:2,scene:2});
 assert.ok(r.fixture.authority.includes("INVESTIGATOR_SYNTHETIC"));
});
test("enumerating each six-source DAG yields legal topological orders and actual chosen max objective",()=>{
 for(const w of r.fixture.works){
  const options=r.enumerate(w);const plan=r.solve(w),byID=new Map(w.nodes.map(n=>[n.id,n]));
  assert.ok(options.length>=1&&options.length<=720,w.id);
  assert.deepEqual(plan.orderedIDs.length,6);
  const positions=Object.fromEntries(plan.orderedIDs.map((id,i)=>[id,i]));
  for(const n of w.nodes){
   for(const before of n.requires)assert.ok(positions[before]<positions[n.id],w.id+" "+before+"->"+n.id);
  }
  assert.equal(plan.objectiveScore,Math.max(...options.map(ids=>r.scoreOrder(w,ids))));
  for(const planID of plan.orderedIDs)assert.ok(byID.has(planID));
 }
});
test("the plan is independent of the arbitrary order in which six source facts are input",()=>{
 for(const w of r.fixture.works){
  const reversed={...w,nodes:[...w.nodes].reverse()};
  const a=r.solve(w),b=r.solve(reversed);
  assert.deepEqual(a.orderedIDs,b.orderedIDs);
  assert.equal(a.objectiveScore,b.objectiveScore);
  assert.equal(a.validOrders,b.validOrders);
 }
});
test("source dependency cycles result in no feasible schedule, never a silent factual rewrite",()=>{
 const w=r.fixture.works[0];
 const cycle=structuredClone(w);
 const f1=cycle.nodes.find(n=>n.id==="F1");
 f1.requires.push("F6");
 assert.deepEqual(r.enumerate(cycle),[]);
 assert.throws(()=>r.solve(cycle),/NO_FEASIBLE_SOURCE_PLAN/);
});
test("solver scoring refuses plans that put dependents before facts or repeat facts",()=>{
 const w=r.fixture.works[0];
 assert.throws(()=>r.scoreOrder(w,["F1","F1","F3","F4","F5","F6"]),/R5G_SCORE_PERMUTATION_INVALID/);
 const reverse=["F6","F5","F4","F3","F2","F1"];
 assert.throws(()=>r.scoreOrder(w,reverse),/R5G_SCORE_DEPENDENCY_VIOLATION/);
});
test("strong DIRECT and LATTICE see the same 48 source facts and constraints; extra content is the computed order",()=>{
 for(const w of r.fixture.works){
  const a=r.messages(w,"DIRECT"),b=r.messages(w,"LATTICE");
  assert.equal(a[0].content,b[0].content);
  const x=JSON.parse(a[1].content),y=JSON.parse(b[1].content);
  assert.ok(y.compiledSourceBoundDiscoursePlan);
  const {compiledSourceBoundDiscoursePlan,...body}=y;
  assert.deepEqual(body,x);
  assert.deepEqual(compiledSourceBoundDiscoursePlan.orderedIDs,r.solve(w).orderedIDs);
  assert.deepEqual(x.originalUnorderedSourceNodes.map(n=>n.text),w.nodes.map(n=>n.text));
 }
});
test("exact planned new model call count 16, alternating order with both arms for all works",()=>{
 const calls=r.planCalls();
 assert.equal(calls.length,16);
 assert.equal(new Set(calls.map(c=>c.id)).size,16);
 assert.equal(calls.filter(c=>c.arm==="DIRECT").length,8);
 assert.equal(calls.filter(c=>c.arm==="LATTICE").length,8);
 assert.equal(calls[0].arm,"DIRECT");
 assert.equal(calls[2].arm,"LATTICE");
 assert.equal(r.planHash(calls).length,64);
 for(const c of calls){
  assert.equal(c.sourceSHA256.length,64);
  assert.equal(c.planSHA256.length,64);
  assert.equal(c.promptSHA256.length,64);
 }
});
test("novel numeric lexical tokens flag source-inconsistent novel time/measurements; they are not a semantic score",()=>{
 const orig=r.numericTokens("10cm와 20cm, 30cm 사이를 조사했다.");
 assert.deepEqual([...orig].sort(),["10","20","30"]);
 assert.equal([...r.numericTokens("오후 2:30부터 3시")].length,3);
});
test("whole prose packet includes both complete long Korean texts and source dependency plan without HTML",()=>{
 const w=r.fixture.works[0],t={sourceWork:w.id,genre:w.genre,task:w.task,license:w.license,audience:w.audience,
  originalSourceNodes:w.nodes,selectedPlan:r.solve(w),outputs:{
  DIRECT:{text:"직접 한국어 본문으로 자연스럽게 완결한 글",providerTokens:500,novelNumericTokens:[]},
  LATTICE:{text:"의미 관계를 반영해 완결한 비교 한국어 문단",providerTokens:650,novelNumericTokens:[]}}};
 const s=r.readingPacket({rows:[t]});
 assert.ok(s.includes("직접 한국어 본문")&&s.includes("의미 관계를 반영"));
 assert.ok(s.includes("F1")&&s.includes("원천 사실")&&s.includes("실행형 계산 결과"));
 assert.equal(/<form|<html|<input|<script/i.test(s),false);
});
