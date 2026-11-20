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
