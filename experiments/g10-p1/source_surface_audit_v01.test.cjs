"use strict";const test=require("node:test"),assert=require("node:assert/strict");
const {surfaceNumbers,audit}=require("./source_surface_audit_v01.cjs");
const task={id:"C",genre:"science_explainer",audience:"학생",purpose:"사실 설명",
 facts:["12개의 표본에서 4명이 응답했다.","관찰은 3일 동안 이루어졌다."],
 uncertainties:["5일 이후 결과는 아직 확인되지 않았다."]};
test("source and output comparable numeric forms",()=>{
 assert.deepEqual(surfaceNumbers("12개와 4명, 3일"),["12개","4명","3일"]);
});
test("unsupported output number becomes a diagnostic, not a semantic verdict",()=>{
 const r=audit(task,"12개의 표본에서 7명이 답했다.");
 assert.ok(r.unlicensedSurfaceCandidates.includes("7명"));
 assert.equal(r.epistemicStatus,"DIAGNOSTIC_ONLY_NOT_SEMANTIC_JUDGMENT");
});
test("missing numbers may be stylistic omission, never automatic source failure",()=>{
 const r=audit(task,"일부 표본에서 여러 사람이 응답했다.");
 assert.ok(r.unmentionedSourceNumericStrings.length>0);
 assert.ok(!JSON.stringify(r).includes("SEMANTIC_FAIL"));
});
test("empty numeric observations are handled without imaginary statistics",()=>{
 const t={...task,facts:["실험은 끝났다."],uncertainties:[]};
 const r=audit(t,"결과를 정리했다.");assert.deepEqual(r.sourceNumericStrings,[]);
 assert.deepEqual(r.outputNumericStrings,[]);
});
