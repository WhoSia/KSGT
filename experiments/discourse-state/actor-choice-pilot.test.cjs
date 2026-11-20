"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { buildPlan, analyze, normalize } = require("./actor-choice-pilot.cjs");
const { works } = require("./actor-evidence.cjs");

test("decision pilot matches every source across two non-oracular arms", () => {
  const plans = buildPlan();
  assert.equal(plans.length, 40);
  assert.equal(new Set(plans.map(x => x.id)).size, 40);
  for (let i = 0; i < plans.length; i += 2) {
    const [raw, candidate] = plans.slice(i, i + 2);
    assert.deepEqual(raw.prompt[0], candidate.prompt[0]);
    const a = JSON.parse(raw.prompt[1].content);
    const b = JSON.parse(candidate.prompt[1].content);
    assert.equal(Object.keys(b).length, Object.keys(a).length + 1);
    assert.deepEqual(Object.keys(a), ["앞대목", "의도한_행위자", "다음_행동"]);
    assert.ok(!JSON.stringify(b).includes("omit_allowed"));
    assert.ok(!JSON.stringify(b).includes("name_required"));
  }
  assert.equal(analyze().length, works().length);
});
test("explicit-choice parser refuses prose and invented labels", () => {
  assert.equal(normalize("OMIT\n"), "omit");
  assert.equal(normalize("name"), "name");
  for (const s of ["OMIT because of focus", '{"choice":"OMIT"}', "BOTH", "", null])
    assert.equal(normalize(s), null);
});
