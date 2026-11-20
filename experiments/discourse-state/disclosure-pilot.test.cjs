"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { compile, works, firstPhase, acceptsStart, continuation, check } = require("./disclosure-pilot.cjs");

test("changing disclosure keeps the three source facts fixed", () => {
  for (const w of works()) {
    for (const placement of ["early", "late"]) {
      const plan = compile(w, placement);
      assert.deepEqual(plan.flatMap(s => s.자료).sort(), [w.opening, w.closing, w.reveal].sort());
      assert.equal(plan[0].자료.includes(w.reveal), placement === "early");
      assert.equal(plan[1].자료.includes(w.reveal), placement === "late");
    }
  }
});

test("the late first request cannot see the reveal or second event", () => {
  const cells = firstPhase();
  assert.equal(cells.length, 24);
  assert.equal(new Set(cells.map(c => c.id)).size, cells.length);
  for (const w of works().filter(w => w.timing === "late")) {
    const start = cells.find(c => c.sourceWork === w.key && c.condition === "start").prompt[1].content;
    for (const blocked of [w.reveal, w.closing, w.anchors[1], w.anchors[2]]) {
      assert.ok(!start.includes(blocked));
    }
  }
});

test("the following prompt carries the accepted prose and changes when that prose changes", () => {
  const w = works().find(w => w.timing === "late");
  const prefix = "문 옆 탁자에 누군가 녹음기를 올려놓았다.";
  const changed = "누군가 녹음기를 문 옆 탁자에 올려놓았다.";
  assert.ok(acceptsStart(w, prefix));
  const next = continuation(w, prefix);
  assert.ok(next.prompt[1].content.includes(prefix));
  assert.notEqual(next.promptSha256, continuation(w, changed).promptSha256);
  assert.throws(() => continuation(w, "윤서가 녹음기를 내려놓았다."), /INVALID_FIRST_LINE/);
});

test("the order score distinguishes early and late even when all phrases occur", () => {
  const early = works().find(w => w.id === "RECORDER" && w.timing === "early");
  const late = works().find(w => w.id === "RECORDER" && w.timing === "late");
  const earlyText = "윤서가 녹음기를 놓았다.\n그는 스위치를 눌렀다.";
  const lateText = "한 사람이 녹음기를 놓았다.\n스위치를 누른 사람은 윤서였다.";
  assert.equal(check(early, earlyText), true);
  assert.equal(check(late, earlyText), false);
  assert.equal(check(early, lateText), false);
  assert.equal(check(late, lateText), true);
  assert.equal(check(early, earlyText + "\n추가."), false);
});
