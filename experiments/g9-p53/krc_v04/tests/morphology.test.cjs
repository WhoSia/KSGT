"use strict";
const test=require("node:test"),a=require("node:assert/strict");
const M=require("../morphology.cjs");
const compiler=require("../compiler.cjs");
const source=require("../fact_frames.json");
test("Hangul coda-aware markers generate correct nominative, object, topic and instrumental",()=>{
 const cases=[
 ["책","NOMINATIVE",{},"책이"],["버스","NOMINATIVE",{},"버스가"],
 ["종이띠","TOPIC",{given:true},"종이띠는"],["연필","TOPIC",{given:true},"연필은"],
 ["온도","ACCUSATIVE",{},"온도를"],["빛","ACCUSATIVE",{},"빛을"],
 ["바람","INSTRUMENTAL",{},"바람으로"],["연필","INSTRUMENTAL",{},"연필로"],
 ["길","INSTRUMENTAL",{},"길로"],["종이","INSTRUMENTAL",{},"종이로"]
 ];
 for(const [stem,role,context,want] of cases)
  a.equal(M.mark(stem,role,context).surface,want);
});
test("Topic and ellipsis require meaningful licensed discourse state",()=>{
 a.throws(()=>M.mark("버스","TOPIC",{}),/UNLICENSED_TOPIC_INFORMATION_STATE/);
 a.throws(()=>M.mark("나","TOPIC",{given:true,exclusiveContrast:true}),/UNLICENSED_CONTRASTIVE_TOPIC/);
 a.equal(M.mark("나","TOPIC",{given:true,exclusiveContrast:true,contrastWarrant:true}).surface,"나는");
 a.throws(()=>M.mark("model","NOMINATIVE"),/UNKNOWN_HANGUL_CODA/);
 a.throws(()=>M.mark("한글1","NOMINATIVE"),/NONNOMINAL_MATERIAL/);
 a.throws(()=>M.mark("","NOMINATIVE"),/EMPTY_NOMINAL/);
});
test("Five source-licensed case obligations are validated against actual fragments",()=>{
 let found=0;
 for(const b of source.briefs)for(const f of b.atoms){
  compiler.validate(f);
  for(const ob of f.case_obligations||[]){
   const r=M.verifyInSegments(f,ob);
   a.equal(r.licensed,true);found++;
  }
 }
 a.equal(found,5);
});
test("Mutating case-bearing phrase is a typed source custody violation",()=>{
 const f=structuredClone(source.briefs[1].atoms[3]);
 f.segments[1]="버스는";
 a.throws(()=>compiler.validate(f),/MORPHOLOGICAL_CASE_CUSTODY_MISMATCH/);
});
