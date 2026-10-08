// G9-P59: authored stimuli, not human observations. Run: node experiments/g9-p59/reader_choice_probe.cjs
"use strict";
const assert = require("node:assert/strict");
const cases = [
  {id:"P59-U1", condition:"unique", genre:"report", group:"과학 동아리 학생", n:12, competitors:0,
   context:"과학 동아리 학생 12명이 발표회에 참가했다.", keep:"그중 4명은 직접 제작한 장치를 소개했다.",
   explicit:"과학 동아리 학생 12명 중 4명은 직접 제작한 장치를 소개했다.", target:4},
  {id:"P59-C1", condition:"competing", genre:"report", group:"과학 동아리 학생", n:12, competitors:1,
   context:"과학 동아리 학생 12명과 수학 동아리 학생 8명이 발표회에 참가했다.", keep:"그중 4명은 직접 제작한 장치를 소개했다.",
   explicit:"과학 동아리 학생 12명 중 4명은 직접 제작한 장치를 소개했다.", target:4},
  {id:"P59-U2", condition:"unique", genre:"narrative", group:"마을 주민", n:10, competitors:0,
   context:"마을 주민 10명이 회관에 모였다.", keep:"그중 3명은 예전 사진을 가져왔다.",
   explicit:"마을 주민 10명 중 3명은 예전 사진을 가져왔다.", target:3},
  {id:"P59-C2", condition:"competing", genre:"narrative", group:"마을 주민", n:10, competitors:1,
   context:"마을 주민 10명과 방문객 6명이 회관에 모였다.", keep:"그중 3명은 예전 사진을 가져왔다.",
   explicit:"마을 주민 10명 중 3명은 예전 사진을 가져왔다.", target:3}
];
function audit(item) {
  assert.equal(typeof item.context, "string");
  assert.equal(typeof item.keep, "string");
  assert.equal(typeof item.explicit, "string");
  assert.ok(Number.isInteger(item.n) && Number.isInteger(item.target) && item.target > 0 && item.target < item.n);
  assert.equal(item.keep.match(/그중/g)?.length,1,"Exactly one anaphoric target");
  assert.ok(item.explicit.includes(item.group + " " + item.n + "명 중"),"Explicit target exact anchor");
  assert.ok(item.keep.includes(item.target + "명") && item.explicit.includes(item.target + "명"));
  assert.ok(item.context.includes(item.group + " " + item.n + "명"),"Antecedent must be quoted exactly");
  assert.equal(item.condition==="competing", item.competitors>0);
  assert.ok(item.keep!==item.explicit);
  return {id:item.id, structural_guard:"PASS", semantic_gold:"NOT_OBSERVED", human_preference:"NOT_OBSERVED"};
}
const results=cases.map(audit);
const cell=new Set(cases.map(x=>x.genre+"|"+x.condition));
assert.equal(cell.size,4);
assert.equal(new Set(cases.map(x=>x.id)).size,cases.length);
assert.deepEqual(cases.map(x=>x.condition),["unique","competing","unique","competing"]);
console.log(JSON.stringify({stage:"G9-P59",status:"SYNTHETIC_STRUCTURE_ONLY",count:results.length,results,holds:[
 "Counterbalancing, reader-state manipulation, independent referent gold and human preference remain unobserved",
 "Unique vs competing contexts differ in number of entities: causal identification requires improved matched controls",
 "RESTRUCTURE remains free-response, not automatically scored",
 "Current guard is string-level, not independent Korean semantic entailment"
]},null,2));
