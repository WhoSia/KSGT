"use strict";
/** P60-P1: authored canaries expose preference-by-validity selection reversal.
 * Scores here are toy numbers, NOT Korean-reader measurements.
 */
const assert = require("node:assert/strict");
function summarize(works, arm) {
  if (!Array.isArray(works) || !works.length) throw Error("NO_SOURCE_WORKS");
  if (!["A", "B"].includes(arm)) throw Error("INVALID_ARM");
  if (new Set(works.map(w=>w.workId)).size !== works.length) throw Error("DUPLICATE_WORK");
  let eligible=0, known=0, unknown=0, qualifiedScore=0;
  for (const w of works) {
    const x=w[arm];
    if (!x || !["PASS","FAIL","HOLD"].includes(x.admissibility)) throw Error("BAD_ADMISSIBILITY");
    if (x.admissibility === "FAIL") {
      if (x.quality!==null) throw Error("INVALID_QUALITY_ON_REJECTED_CANDIDATE");
      continue;
    }
    if (x.admissibility === "HOLD") {
      if (x.quality!==null) throw Error("UNVERIFIED_QUALITY_PROMOTION");
      unknown++;
      continue;
    }
    eligible++;
    if (typeof x.quality !== "number" || !Number.isFinite(x.quality) || x.quality<0 || x.quality>1)
      throw Error("INVALID_QUALIFIED_SCORE");
    known++; qualifiedScore+=x.quality;
  }
  const n=works.length;
  return {arm,works:n,eligible,unknown,sourceEligibilityRate:eligible/n,
    qualityAmongAdmitted:known?qualifiedScore/known:null,
    qualifiedScoreBounds:[qualifiedScore/n,(qualifiedScore+unknown)/n],
    denominatorWarning:"POST_TREATMENT_CONDITIONAL_SELECTION",
    authority:"AUTHORED_TOY_NOT_HUMAN_WRITING_SCORE"};
}
function fixture(){
  return [
    {workId:"easy",A:{admissibility:"PASS",quality:0.7},B:{admissibility:"PASS",quality:0.8}},
    {workId:"hard",A:{admissibility:"PASS",quality:0.2},B:{admissibility:"FAIL",quality:null}}
  ];
}
function test(){
  const toy=fixture(),a=summarize(toy,"A"),b=summarize(toy,"B");
  // Naively conditioning on each arm's own surviving outputs makes B look better.
  assert.ok(b.qualityAmongAdmitted>a.qualityAmongAdmitted);
  // But on the fixed original source-work pool, A has greater qualified value.
  assert.ok(a.qualifiedScoreBounds[0]>b.qualifiedScoreBounds[1]);
  assert.deepEqual([a.qualityAmongAdmitted,b.qualityAmongAdmitted],[0.44999999999999996,0.8]);
  assert.deepEqual([a.eligible,b.eligible],[2,1]);
  const held=fixture();held[1].B={admissibility:"HOLD",quality:null};
  assert.deepEqual(summarize(held,"B").qualifiedScoreBounds,[0.4,0.9]);
  assert.throws(()=>summarize([{...toy[0]}, {...toy[0]}],"A"),/DUPLICATE_WORK/);
  assert.throws(()=>summarize([{...toy[0],B:{admissibility:"FAIL",quality:.9}}],"B"),/INVALID_QUALITY_ON_REJECTED/);
  assert.throws(()=>summarize([{...toy[0],B:{admissibility:"HOLD",quality:.9}}],"B"),/UNVERIFIED_QUALITY_PROMOTION/);
  assert.throws(()=>summarize([{...toy[0],B:{admissibility:"PASS",quality:1.1}}],"B"),/INVALID_QUALIFIED_SCORE/);
  assert.throws(()=>summarize([],"A"),/NO_SOURCE_WORKS/);
  console.log(JSON.stringify({test:"PASS",stage:"G9-P60",phase:"P1",sourceWorks:2,
    armA:a,armB:b,negativeControls:5,
    conclusion:"CONDITIONAL_QUALITY_RANK_REVERSAL_UNDER_DIFFERENTIAL_ADMISSIBILITY",
    observedKoreanHumanQualitySamples:0}));
}
if(require.main===module)test();
module.exports={summarize,fixture,test};
