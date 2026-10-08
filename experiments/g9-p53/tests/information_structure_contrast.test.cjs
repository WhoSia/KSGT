"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const c=require("../information_structure_contrast_preseal.json");
function check(){
 assert.equal(c.status,"PROSPECTIVE_STIMULI_CONTRACT_NOT_LINGUISTIC_RESULT");
 assert.equal(c.stimuli.length,6);
 const keys=new Set();
 const combinations=new Set();
 for(const s of c.stimuli){
  assert(!keys.has(s.id),"duplicate stimulus id");keys.add(s.id);
  combinations.add(s.kind+"|"+s.subject_morphology);
  const t=s.subject_morphology==="vowel_final"?"는":"은";
  const n=s.subject_morphology==="vowel_final"?"가":"이";
  assert.equal(s.variants.topic,s.stem+t+" "+s.predicate);
  assert.equal(s.variants.nominative,s.stem+n+" "+s.predicate);
  assert(s.antecedent.length>8,"no explicit context");
  assert(s.variants.topic!==s.variants.nominative);
  assert(!s.antecedent.includes("P50-"),"benchmark source contamination marker");
 }
 assert.equal(combinations.size,6);
 assert.equal(c.design.total_stimulus_trials,12);
 assert.equal(c.evidence_authority,"PREREGISTERED_ILLUSTRATIVE_STIMULI_ONLY_NO_HUMAN_OBSERVATION_NO_LINGUISTIC_VERDICT");
}
test("six counterbalanced context by stem-type cells; original predicate preserved",check);
test("each discourse condition occurs in both particle allomorphy conditions",()=>{
 for(const condition of ["WHO_ANSWER","ABOUTNESS_CONTINUATION","ALTERNATIVE_CONTRAST"]){
  const xs=c.stimuli.filter(s=>s.kind===condition);
  assert.equal(xs.length,2);
  assert.deepEqual(new Set(xs.map(s=>s.subject_morphology)),new Set(["vowel_final","consonant_final"]));
 }
});
test("no pre-filled human judgements, candidate agreement or governor scores",()=>{
 for(const s of c.stimuli){
  for(const forbidden of ["correct","rating","accept","governor","human_score","winner"]){
   assert(!Object.hasOwn(s,forbidden));
  }
 }
 assert(!Object.hasOwn(c,"results"));
});
