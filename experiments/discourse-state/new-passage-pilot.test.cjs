"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { scopedChoice } = require("./referent-choice.cjs");
const { buildPlan, works, outcomeFor } = require("./new-passage-pilot.cjs");

test("matched tasks freeze the candidate strings and balance their placement", () => {
  const rows = works();
  assert.equal(rows.length, 12);
  assert.equal(rows.filter(row => row.gold === "omit").length, 6);
  assert.equal(rows.filter(row => row.gold === "omit" && row.keys.A === "omit").length, 3);
  assert.equal(rows.filter(row => row.gold === "name" && row.keys.A === "name").length, 3);
  for (let index = 0; index < rows.length; index += 2) {
    const [a, b] = rows.slice(index, index + 2);
    for (const key of ["target", "named", "omitted"]) assert.equal(a[key], b[key]);
  }
});

test("annotated events recover the frozen reader-state labels", () => {
  for (const work of works()) {
    const { snapshot, gold, active } = work;
    assert.deepEqual(snapshot, active);
    assert.equal(scopedChoice(work), gold);
  }
});

test("history and state model prompts share the same rule, target and alternatives", () => {
  const plan = buildPlan();
  assert.equal(new Set(plan.map(cell => cell.id)).size, 36);
  for (const work of works()) {
    const cell = arm => plan.find(cell => cell.sourceWork === work.id && cell.condition === arm);
    const history = cell("history");
    const state = cell("state");
    assert.deepEqual(history.prompt[0], state.prompt[0]);
    const [h,s] = [history, state].map(p => JSON.parse(p.prompt[1].content));
    for (const key of ["의도한_행동주체","문장_후보","수신자"]) assert.deepEqual(h[key], s[key]);
    const extract = JSON.parse(cell("extract").prompt[1].content);
    assert.equal(extract.앞_문단, h.앞_문단);
    assert.equal(extract.후속_문장, work.omitted);
    assert.ok(!Object.hasOwn(extract,"의도한_행동주체"));
    assert.ok(!Object.hasOwn(extract,"수신자가_떠올릴_수_있는_행동주체"));
  }
});

test("selection and extraction decode exactly and handle unknowns", () => {
  const [work] = works();
  assert.equal(outcomeFor("toString", work, "history").valid, false);
  assert.equal(outcomeFor("A", work, "history").choice, work.keys.A);
  assert.deepEqual(outcomeFor("null", work, "extract"), { choice: "name", valid: true, state: null });
  assert.equal(outcomeFor(JSON.stringify([work.target]), work, "extract").choice, "omit");
  assert.equal(outcomeFor(JSON.stringify([work.target, work.distractor]), work, "extract").choice, "name");
  assert.equal(outcomeFor(JSON.stringify([work.target, work.target]), work, "extract").valid, false);
});
