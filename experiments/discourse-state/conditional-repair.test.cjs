"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { works, firstPhase, action, applyPatch } = require("./conditional-repair.cjs");

const received = text => ({ outcome: "GENERATED", finishReason: "stop", text });

test("paired drafts hold source and target relation fixed", () => {
  const rows = works();
  assert.equal(rows.length, 12);
  assert.equal(firstPhase().length, 24);
  for (let i = 0; i < rows.length; i += 2) {
    assert.deepEqual(rows[i].facts, rows[i + 1].facts);
    assert.equal(rows[i].relation, rows[i + 1].relation);
    assert.equal([rows[i].first !== rows[i + 1].first, rows[i].second !== rows[i + 1].second].filter(Boolean).length, 1);
  }
  for (const c of firstPhase()) assert.ok(!Object.hasOwn(JSON.parse(c.prompt[1].content), "gold"));
});

test("invalid judgments and visible early fact cannot trigger a patch", () => {
  const rows = works();
  assert.equal(action(rows[0], received("REPAIR")), "repair");
  assert.equal(action(rows[0], received("KEEP because it is good")), "unresolved");
  assert.equal(action(rows.find(w => w.id === "PASS_changed"), received("REPAIR")), "hold");
});

test("a patch cannot publish if it adds a line or drops a required phrase", () => {
  const old = works()[0];
  assert.equal(applyPatch(old, received("저녁 연습 참가자는 기록한다.")).accepted, false);
  assert.equal(applyPatch(old, received(old.second + "\n한 줄 추가.")).second, old.second);
  assert.deepEqual(applyPatch(old, received(old.second)), { second: old.second, accepted: true });
});

test("paired feedback changes the defect field alone", () => {
  const { buildPlan } = require("./repair-feedback.cjs");
  const plan = buildPlan();
  assert.equal(plan.length, 8);
  assert.equal(new Set(plan.map(c => c.sourceWork)).size, 4);
  for (let i = 0; i < plan.length; i += 2) {
    const pair = plan.slice(i, i + 2);
    const a = pair.find(c => c.condition === "generic");
    const b = pair.find(c => c.condition === "annotated");
    assert.equal(a.sourceWork, b.sourceWork);
    assert.deepEqual(a.prompt[0], b.prompt[0]);
    const { 확인된_결함과_고칠_관계, ...matched } = JSON.parse(b.prompt[1].content);
    assert.equal(typeof 확인된_결함과_고칠_관계, "string");
    assert.deepEqual(JSON.parse(a.prompt[1].content), matched);
  }
});
