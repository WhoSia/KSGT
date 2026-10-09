"use strict";
// KSGT G9-P59: deterministic counterbalanced reader-state fixtures.
// No human judgements and no causal effect estimates.
const assert = require("node:assert/strict");
const groups = [
 {id:"science",name:"과학 동아리 학생",count:12},
 {id:"math",name:"수학 동아리 학생",count:8}
];
function item(target,order,readerKnowledge) {
 assert.ok(["science","math"].includes(target));
 assert.ok(["forward","reverse"].includes(order));
 assert.ok(["full","limited"].includes(readerKnowledge));
 const arranged=order==="forward"?groups:[...groups].reverse();
 const selected=groups.find(x=>x.id===target);
 const facts=arranged.map(x=>x.name+" "+x.count+"명").join("과 ")+"이 발표회에 참가했다.";
 const briefing=readerKnowledge==="full" ? selected.name+"이 장치 발표를 맡았다." : "발표회에서는 여러 활동이 진행됐다.";
 const keep="그중 4명은 직접 제작한 장치를 소개했다.";
 const explicit=selected.name+" "+selected.count+"명 중 4명은 직접 제작한 장치를 소개했다.";
 return {id:[target,order,readerKnowledge].join("-"),target,order,readerKnowledge,
  facts,briefing,keep,explicit,groupCount:2,selectedCount:4,sourceCount:selected.count,
  annotationAuthority:"SYNTHETIC_INTENDED_TARGET_ONLY",humanGold:null};
}
const items=groups.flatMap(g=>["forward","reverse"].flatMap(o=>["full","limited"].map(k=>item(g.id,o,k))));
function validate(rows) {
 assert.equal(rows.length,8);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 const facts=new Set(rows.map(x=>x.facts));
 assert.equal(facts.size,2,"Target and reader-knowledge swaps may not modify shared source facts");
 for(const r of rows) {
  assert.equal(r.groupCount,2);
  assert.ok(r.selectedCount>0&&r.selectedCount<r.sourceCount);
  assert.equal(r.keep,"그중 4명은 직접 제작한 장치를 소개했다.");
  assert.ok(r.facts.includes("과학 동아리 학생 12명"));
  assert.ok(r.facts.includes("수학 동아리 학생 8명"));
  assert.ok(r.explicit.includes(" 중 4명은"));
  assert.equal(r.humanGold,null);
  assert.equal(r.annotationAuthority,"SYNTHETIC_INTENDED_TARGET_ONLY");
 }
 for(const g of groups) for(const o of ["forward","reverse"]) {
  const pair=items.filter(x=>x.target===g.id&&x.order===o);
  assert.equal(pair.length,2);
  assert.equal(pair[0].facts,pair[1].facts);
  assert.equal(pair[0].keep,pair[1].keep);
  assert.equal(pair[0].explicit,pair[1].explicit);
  assert.notEqual(pair[0].briefing,pair[1].briefing);
 }
 return true;
}
validate(items);
if(require.main===module) console.log(JSON.stringify({stage:"G9-P59",version:"reader-state-v02",status:"STRUCTURAL_GUARD_ONLY",count:items.length,
 warnings:["Target group is an authored intention, not an independently recovered referent","Reader-knowledge briefing changes visible text; lexical confounding remains","Limited-reader condition may have no uniquely correct referent","No human preference, Korean semantic accuracy, or causal effect is identified"],items},null,2));
module.exports={groups,item,items,validate};
