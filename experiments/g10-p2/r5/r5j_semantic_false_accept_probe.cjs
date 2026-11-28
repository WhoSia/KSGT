'use strict';
// Deliberate adversarial falsification of R5j v01's guarantee.
// This script should print a FALSE_ACCEPT; it is NOT a safety regression PASS.
const assert=require('node:assert/strict');
const {decide}=require('./r5j_reference_guard.cjs');
const src={actor:'준서',previousActor:'준서',object:'유리창',previousObject:'유리창',competitorActors:['준서'],
  explicit:'준서는 유리창에 손을 대지 않았다.',elliptical:'준서는 유리창에 손을 댔다.'};
const result=decide({...src,license:{actor:src.actor,object:src.object,explicit:src.explicit,
  elliptical:src.elliptical,sourceFactId:'S5'}});
assert.equal(result.decision,'LICENSED_ELLIPSIS');
console.log(JSON.stringify({case:'unverified_license_changes_negation',observed:result.decision,
  correctSafetyDecision:'KEEP_EXPLICIT',verdict:'CONFIRMED_FALSE_ACCEPT',newIndependentGold:0}));
