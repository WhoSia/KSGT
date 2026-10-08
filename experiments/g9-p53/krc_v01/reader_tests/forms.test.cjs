"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const {assemble}=require("../reader_forms.cjs");
const briefs=require("../../natural_writing_pilot_briefs.json");
function fake(){
 const docs=briefs.briefs.flatMap(b=>["B_GENERIC","A_SURFACE_ABLATION","K_TYPED_PLAN"].map(arm=>({
  brief:b.id,arm,status:"COMPLETED",text:b.id+" "+arm+" 문단 첫째입니다.\n\n둘째 문단입니다."
 })));
 return {schema:"ksgt.krc.v0.1.controlled-generation.v1",documents:docs};
}
test("Six contexts × three balanced reader forms, allocation key separated",()=>{
 const r=assemble(fake());
 a.equal(r.blinded.forms.length,3);
 a.equal(r.mapping.entries.length,18);
 a.equal(new Set(r.mapping.entries.map(x=>x.trial_id)).size,18);
 for(const form of r.blinded.forms){
  a.equal(form.trials.length,6);
  a.equal(new Set(form.trials.map(x=>x.brief_id)).size,6);
  for(const trial of form.trials){
   a.equal(trial.evidence_facts.length,5);
   a.equal(trial.status,"READY_FOR_HUMAN");
   a(!Object.hasOwn(trial,"left_arm"));
   a(!Object.hasOwn(trial,"right_arm"));
   a.equal(trial.empty_response_schema.preference,null);
  }
 }
});
test("Within each brief, all three distinct arm pairs are assessed once",()=>{
 const keys=assemble(fake()).mapping.entries;
 for(const b of briefs.briefs){
  const set=keys.filter(x=>x.brief_id===b.id).map(x=>[x.left_arm,x.right_arm].sort().join("|"));
  a.equal(new Set(set).size,3);
 }
});
test("Unavailable text is an explicit incomplete human trial, not fabricated",()=>{
 const r=fake();r.documents[0].text=null;r.documents[0].status="MODEL_ERROR";
 const out=assemble(r);
 a(out.blinded.forms.some(f=>f.trials.some(t=>t.status==="MISSING_MODEL_OUTPUT")));
});
