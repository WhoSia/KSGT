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
