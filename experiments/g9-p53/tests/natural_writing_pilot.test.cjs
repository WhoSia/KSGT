"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const briefs=require("../natural_writing_pilot_briefs.json");
const samples=require("../natural_writing_prototype_specimens.json");
test("Exactly six independently authored task briefs, two genres by three items",()=>{
 assert.equal(briefs.briefs.length,6);
 assert.equal(new Set(briefs.briefs.map(b=>b.id)).size,6);
 for(const g of ["science_explainer","scene_essay"])assert.equal(briefs.briefs.filter(b=>b.genre===g).length,3);
 for(const b of briefs.briefs){assert.equal(b.facts.length,5);assert(b.unknown.length>=3);assert.deepEqual(b.target_chars,[240,400]);}
});
test("Three arms remain distinct with no fabricated baseline outputs",()=>{
 assert.deepEqual(Object.keys(briefs.arms),["B","A","K"]);
 assert.equal(briefs.controls.one_model_for_all,"MODEL_AND_VERSION_NOT_YET_SELECTED_NO_CLAIM_OF_COMPLETED_COMPARISON");
 assert.equal(samples.status,"ILLUSTRATIVE_K_CONDITION_PROTOTYPES_NOT_COMPARATIVE_MODEL_OUTPUTS");
});
test("Only two illustrative K prototypes exist; no human scores or AI benchmark claim",()=>{
 assert.equal(samples.drafts.length,2);
 for(const draft of samples.drafts){assert(briefs.briefs.some(b=>b.id===draft.id));assert(draft.text.includes("\n\n"));assert(!Object.hasOwn(draft,"reader_score"));}
 assert(!Object.hasOwn(samples,"results"));
});
