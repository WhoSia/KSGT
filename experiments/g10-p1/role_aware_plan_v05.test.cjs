"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {order,plan}=require("./role_aware_plan_v05.cjs");
const cohort=require("./fixtures/challenge_cohort_v01.json");
test("science plan first introduces experimental setup, then temporal observations and measurement limit",()=>{
 const p=plan(cohort.tasks[0]);const s=p.order;
 assert.ok(["F3","F6"].includes(s[0]));
 assert.ok(s.indexOf("F3")<s.indexOf("F4"));
 assert.ok(s.indexOf("F4")<s.indexOf("F1"));
 assert.ok(s.indexOf("F1")<s.indexOf("F2"));
 assert.ok(s.indexOf("F5")<s.indexOf("F4"));
 assert.equal(p.schema,"ksgt.g10.p1.role-aware-compact-plan.v05");
});
test("notice preserves author licensed orientation before the lab, and condition-bearing source IDs",()=>{
 const p=plan(cohort.tasks[2]);
 assert.ok(p.order.indexOf("F2")<p.order.indexOf("F3"));
 assert.ok(p.criticalFactIds.includes("F1"));
 assert.ok(p.criticalFactIds.includes("F4"));
 assert.ok(p.prompt.includes("부정의 극성"));
});
test("narrative preserves author temporal edges without claiming coreference validity",()=>{
 const p=plan(cohort.tasks[1]);
 assert.ok(p.order.indexOf("F2")<p.order.indexOf("F1"));
 assert.ok(p.order.indexOf("F1")<p.order.indexOf("F5"));
 assert.ok(p.order.indexOf("F5")<p.order.indexOf("F4"));
});
test("cycles in author temporal/background constraints are rejected",()=>{
 const t={...cohort.tasks[0],relations:[{from:1,to:3,type:"TEMPORAL_NEXT"},{from:3,to:1,type:"TEMPORAL_NEXT"}]};
 assert.throws(()=>order(t),/SOURCE_ORDER_RELATION_CYCLE/);
});
test("corrective plan never inserts unprovided facts",()=>{
 const p=plan(cohort.tasks[0]);
 assert.ok(!p.prompt.includes("실험에서 인과가 입증"));
 assert.ok(p.prompt.length<500);
 assert.equal(p.interpretation,"HEURISTIC_ROLE_ORDER_WITH_EXPLICIT_AUTHOR_GRAPH_EDGES_NO_SEMANTIC_GOLD");
});
