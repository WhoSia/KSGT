"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validate,orderByEvidence,build,compactPromptPlan}=require("./discourse_plan_v02.cjs");
const input={id:"OBS",genre:"science_explainer",audience:"고등학생",purpose:"인과 과잉주장 금지",
 facts:["두 화분에 씨앗을 심었다.","창가 화분에서 싹이 더 많았다.","빛의 양은 측정하지 않았다."],
 uncertainties:["빛이 발아를 더 많이 유발했다는 인과 추정"],
 factAnnotations:[{move:"SETUP",evidence:"GIVEN",entity:"화분"},{move:"OBSERVATION",evidence:"OBSERVED",entity:"화분"},{move:"LIMITATION",evidence:"OBSERVED"}],
 relations:[{from:1,to:2,type:"TEMPORAL_NEXT"},{from:3,to:2,type:"LIMITATION"}]};
test("keeps source fact identifiers, no invented content",()=>{
 const p=build(input);assert.deepEqual(p.factOrder,["F1","F2","F3"]);
 assert.equal(p.moves.length,3);assert.deepEqual(p.omittedOrInventedFacts,[]);
 assert.equal(p.relationEdges[1].type,"LIMITATION");
 assert.equal(p.provenance.edgeAuthority,"SOURCE_BRIEF_ANNOTATION");
});
test("explicit temporal edges can reorder without inventing causal relation",()=>{
 const a={...input,relations:[{from:2,to:1,type:"TEMPORAL_NEXT"}]};
 const p=build(a);
 assert.deepEqual(p.factOrder,["F2","F1","F3"]);
 assert.equal(p.relationEdges[0].type,"TEMPORAL_NEXT");
});
test("unannotated source does not imply interpreted relations",()=>{
 const x={id:input.id,genre:input.genre,audience:input.audience,purpose:input.purpose,
  facts:input.facts,uncertainties:input.uncertainties};
 const p=build(x);assert.equal(p.provenance.semanticParsing,"NOT_PERFORMED");
 assert.equal(p.provenance.edgeAuthority,"NONE");
 assert.ok(p.moves.every(m=>m.move==="UNSPECIFIED"));
});
test("invalid relation or unsupported interpretive labels never pass",()=>{
 assert.throws(()=>validate({...input,relations:[{from:1,to:4,type:"TEMPORAL_NEXT"}]}),/INVALID_RELATION/);
 assert.throws(()=>validate({...input,relations:[{from:1,to:2,type:"CAUSES"}]}),/INVALID_RELATION/);
 assert.throws(()=>validate({...input,factAnnotations:[{move:"CAUSE"}]}),/ANNOTATION_LENGTH_MISMATCH/);
 assert.throws(()=>build({...input,relations:[{from:1,to:2,type:"TEMPORAL_NEXT"},{from:2,to:1,type:"TEMPORAL_NEXT"}]}),/CYCLE/);
});
test("compact prompt carries facts IDs/epistemic status but no invented text",()=>{
 const text=compactPromptPlan(input);
 assert.ok(text.includes("F1"));assert.ok(text.includes("F3"));
 assert.ok(text.includes("OBSERVED"));assert.ok(text.includes("LIMITATION"));
 assert.ok(!text.includes("빛이 원인이다"));
});
