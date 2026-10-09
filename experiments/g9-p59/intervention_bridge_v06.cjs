"use strict";
const assert=require("node:assert/strict");
const {scenes,makeRows}=require("./dataset_v05.cjs");
const {interveneBelief,intendedMessageInvariant,targetAlignedOracle,entropy}=require("./intervention_v06.cjs");
function test(){
 const rows=makeRows();let pairs=0;
 for(const row of rows){
  const scene=scenes.find(s=>s.id===row.source.sceneId);
  const ids=scene.groups.map(g=>g[0]),target=row.intent.targetId;
  const other=ids.find(x=>x!==target);
  assert.ok(other);
  const packet={source:row.source.fact,meaning:row.intent,candidates:row.alternatives};
  const a=interveneBelief(packet,{[target]:0.8,[other]:0.2});
  const b=interveneBelief(packet,{[target]:0.2,[other]:0.8});
  assert.ok(intendedMessageInvariant(a,b));
  assert.equal(entropy(a.readerState.belief),entropy(b.readerState.belief));
  assert.equal(targetAlignedOracle(a.readerState.belief,target).choice,"KEEP");
  assert.equal(targetAlignedOracle(b.readerState.belief,target).choice,"EXPLICIT");
  pairs++;
 }
 assert.equal(pairs,32);
 console.log(JSON.stringify({test:"PASS",version:"v0.6",pairs,interventions:2*pairs,authority:"SYNTHETIC_TOY_NOT_HUMAN_OR_NEURAL"}));
}
if(require.main===module)test();
module.exports={test};
