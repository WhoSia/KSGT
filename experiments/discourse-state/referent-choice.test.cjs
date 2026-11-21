"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DiscourseState, scopedChoice, run, score } = require("./referent-choice.cjs");
const fixtures = require("./fixtures.json");

test("each contrast holds the utterance and intended referent fixed", () => {
  for (let index = 0; index < fixtures.length; index += 2) {
    const [positive, negative] = fixtures.slice(index, index + 2);
    for (const field of ["name", "omit", "target"]) assert.equal(positive[field], negative[field]);
    assert.equal(scopedChoice(positive), "omit");
    assert.equal(scopedChoice(negative), "name");
  }
});

test("a mention in an unknown state does not justify omission", () => {
  const state = new DiscourseState();
  state.update({ kind: "add", reader: "r", referent: "a" });
  assert.equal(state.candidates("r"), undefined);
});

test("nested scope restores the parent without importing inner mentions", () => {
  const state = new DiscourseState();
  state.update({ kind: "focus", reader: "r", referents: ["outer"] });
  state.update({ kind: "enter" });
  assert.equal(state.candidates("r"), undefined);
  state.update({ kind: "focus", reader: "r", referents: ["middle"] });
  state.update({ kind: "enter" });
  state.update({ kind: "focus", reader: "r", referents: ["inner"] });
  state.update({ kind: "leave" });
  assert.deepEqual([...state.candidates("r")], ["middle"]);
  state.update({ kind: "leave" });
  assert.deepEqual([...state.candidates("r")], ["outer"]);
  assert.throws(() => state.update({ kind: "leave" }), /root frame/);
});

test("uniquely identifying the wrong person still requires a name", () => {
  const [example] = fixtures;
  assert.equal(scopedChoice({ ...example, target: "수빈" }), "name");
});

test("ablation and always-name baseline expose different failure modes", () => {
  const { scores } = run();
  assert.deepEqual(scores.scoped, { safeOmits: 6, unsafeOmits: 0, missedOmits: 0, namedRequired: 6 });
  assert.equal(scores.alwaysName.missedOmits, 6);
  assert.ok(scores.readerOnly.missedOmits > 0);
  assert.ok(scores.scopeOnly.unsafeOmits > 0);
});

test("stale context can cause a false safe result even with the rule present", () => {
  const original = fixtures.find(example => example.id === "competing-reference-b");
  const stale = { ...original, events: original.events.slice(0, -1) };
  assert.equal(score([original], scopedChoice).unsafeOmits, 0);
  assert.equal(score([stale], scopedChoice).unsafeOmits, 1);
});
