"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const P=require("../planner.cjs");
const source=require("../../natural_writing_pilot_briefs.json");
const constitution=require("../constitution.json");
test("Six source-backed typed plans validate and cover exactly five facts once",()=>{
 for(const b of source.briefs){
  const p=P.construct(b.id);a.equal(P.check(p),true);
  a.equal(p.facts.length,5);a.equal(p.unknowns.length,b.unknown.length);
  const ids=p.slots.flatMap(s=>s.fact_ids).sort();
  a.deepEqual(ids,["F1","F2","F3","F4","F5"]);
  a.equal(p.edges.length,p.slots.length-1);
 }
});
test("Reject invented fact, changed role, unsupported causality and changed discourse edge",()=>{
 const p=P.construct("EX01");
 const q=structuredClone(p);q.slots[0].fact_ids.push("F99");
 a.throws(()=>P.check(q),/UNKNOWN_FACT_REFERENCE/);
 const r=structuredClone(p);r.edges[1].relation="CAUSE_ASSERTED";
 a.throws(()=>P.check(r),/EDGE_ORDER|ILLEGAL_CAUSAL_EDGE/);
 const s=structuredClone(p);s.facts[0].claim="실험자는 10도라고 측정했다";
 a.throws(()=>P.check(s),/FACT_NOT_FROM_SOURCE/);
 const t=structuredClone(p);t.unknowns[0].assertion_policy="OBSERVED";
 a.throws(()=>P.check(t),/UNKNOWN_ROLE_CHANGED/);
});
test("All eighteen generation jobs unique with fixed seeds and arm order independent of quality",()=>{
 const q=P.order();a.equal(q.length,18);
 a.equal(new Set(q.map(x=>x.brief+"|"+x.arm)).size,18);
 for(const b of source.briefs){
  const rs=q.filter(x=>x.brief===b.id);
  a.deepEqual(new Set(rs.map(x=>x.arm)),new Set(P.armNames));
  a.equal(P.seed(b.id),6400+source.briefs.indexOf(b));
 }
 a.deepEqual(P.order(),q);
});
test("B baseline and A surface ban cannot receive typed plan, K does",()=>{
 for(const b of source.briefs){
  const generic=P.compilePrompt(b.id,"B_GENERIC"),ablation=P.compilePrompt(b.id,"A_SURFACE_ABLATION"),k=P.compilePrompt(b.id,"K_TYPED_PLAN");
  for(const msgs of [generic,ablation,k]){
   a.equal(msgs.length,2);
   a.equal(msgs[0].content,generic[0].content);
   for(const f of b.facts)a(msgs[1].content.includes(f));
   for(const u of b.unknown)a(msgs[1].content.includes(u));
  }
  a(!generic[1].content.includes("KRC에서 형식 검증"));
  a(!ablation[1].content.includes("KRC에서 형식 검증"));
  a(k[1].content.includes("KRC에서 형식 검증"));
  a(ablation[1].content.includes("추가 문체 규칙"));
 }
});
test("No scalar judge, no post-result revision loop or invented human observations",()=>{
 a.equal(constitution.experimental_protocol.generation.retries,0);
 a.equal(constitution.experimental_protocol.generation.regeneration_after_critic,0);
 a.equal(constitution.experimental_protocol.evaluation.human_review.startsWith("Not performed"),true);
 a.equal(constitution.status,"FROZEN_PRE_CONTROLLED_GENERATION");
});
