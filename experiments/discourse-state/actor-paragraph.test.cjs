"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { works, buildPlan, compile } = require("./actor-paragraph.cjs");

test("the same next action changes its subject surface as actor competition changes", () => {
  const cases = works();
  assert.equal(cases.length, 12);
  for (let i = 0; i < cases.length; i += 3) {
    const [single, competing, resolved] = cases.slice(i, i + 3);
    assert.equal(single.action, competing.action);
    assert.equal(competing.action, resolved.action);
    assert.ok(resolved.prefix.includes(resolved.other));
    assert.deepEqual([single, competing, resolved].map(w => compile(w).choice), ["omit", "name", "omit"]);
    assert.equal(compile(competing).text, competing.prefix + " " + competing.subject + " " + competing.action);
  }
});

test("the prose model receives the intended actor without the authority classification", () => {
  assert.equal(new Set(buildPlan().map(c => c.id)).size, works().length);
  for (const [i, c] of buildPlan().entries()) {
    const w = works()[i];
    const details = JSON.parse(c.prompt[1].content);
    assert.deepEqual(details, { 앞문단: w.prefix, 의도한_행위자: w.target, 다음_행동: w.action });
  }
});

test("unknown state forces the author-supplied name in the controlled channel", () => {
  const w = works()[0];
  assert.equal(compile({ ...w, events: [] }).choice, "name");
});

test("paired baseline changes the instruction on permissible omission only", () => {
  const { buildPlan: paired } = require("./actor-omission-pilot.cjs");
  const plan = paired();
  assert.equal(plan.length, 24);
  for (let i = 0; i < plan.length; i += 2) {
    const pair = plan.slice(i, i + 2);
    const a = pair.find(c => c.condition === "allow");
    const b = pair.find(c => c.condition === "must");
    assert.equal(a.sourceWork, b.sourceWork);
    assert.deepEqual(a.prompt[1], b.prompt[1]);
    assert.equal(a.prompt[0].content.replace("독자가 한 사람으로 좁힐 수 있으면 주어는 생략해도 된다.",
      "독자가 한 사람으로 좁힐 수 있으면 이어지는 문장에서는 주어를 생략한다."), b.prompt[0].content);
  }
});
