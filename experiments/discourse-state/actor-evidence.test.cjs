"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { works, compile, extractAnnotatedState, naiveDeparture,
  buildPlan } = require("./actor-evidence.cjs");

test("source excerpts have ordered evidence offsets in actual prefix", () => {
  for (const w of works()) {
    const state = extractAnnotatedState(w);
    assert.equal(state.evidence.length, w.eventKeys.length);
    let previous = 0;
    for (const item of state.evidence) {
      assert.ok(item.span[0] >= previous);
      assert.equal(w.prefix.slice(...item.span), item.text);
      previous = item.span[1];
    }
  }
});
test("departure alone is insufficient for omission, in all four briefs", () => {
  for (let i = 0; i < works().length; i += 5) {
    const [solo, compete, left, anchored, returned] = works().slice(i, i + 5);
    assert.deepEqual([solo, compete, left, anchored, returned].map(w => compile(w).choice),
      ["omit", "name", "name", "omit", "name"]);
    assert.equal(naiveDeparture(left), "omit");
    assert.equal(compile(left).candidates.length, 2);
    assert.equal(compile(anchored).candidates.length, 1);
    assert.equal(compile(returned).candidates.length, 2);
    assert.ok(compile(left).text.includes(left.subject + " " + left.action));
  }
});
test("evidence tampering or reordering fails closed", () => {
  for (let i = 0; i < works().length; i += 5) {
    const w = works()[i + 3];
    assert.throws(() => extractAnnotatedState({ ...w,
      prefix: w.prefix.replace("만", "도") }), /UNSUPPORTED_SOURCE_EVIDENCE/);
    assert.throws(() => extractAnnotatedState({ ...w,
      prefix: w.prefix.replace(w.exit, "누군가 밖으로 나갔다.") }), /UNSUPPORTED_SOURCE_EVIDENCE/);
    assert.throws(() => extractAnnotatedState({ ...w,
      prefix: [w.opening, w.exit, w.competing, w.anchor].join(" ") }), /UNSUPPORTED_SOURCE_EVIDENCE/);
  }
});
test("matched model arms differ in candidate inventory only, never gold", () => {
  const plan = buildPlan();
  assert.equal(plan.length, 40);
  assert.equal(new Set(plan.map(x => x.id)).size, 40);
  const all = works();
  for (let i = 0; i < plan.length; i += 2) {
    const [raw, annotated] = plan.slice(i, i + 2);
    assert.deepEqual(raw.prompt[0], annotated.prompt[0]);
    const a = JSON.parse(raw.prompt[1].content);
    const b = JSON.parse(annotated.prompt[1].content);
    assert.deepEqual(Object.keys(a), ["앞대목", "의도한_행위자", "다음_행동"]);
    assert.deepEqual(Object.keys(b), [...Object.keys(a), "주석된_후보"]);
    assert.deepEqual(b.주석된_후보, extractAnnotatedState(all[i / 2]).candidates);
    assert.ok(!JSON.stringify(b).includes("name_required"));
  }
});
test("target and source action stay fixed through the five transitions", () => {
  for (let i = 0; i < works().length; i += 5) {
    const block = works().slice(i, i + 5);
    for (const field of ["target", "subject", "action", "other"])
      assert.equal(new Set(block.map(w => w[field])).size, 1);
    assert.deepEqual(block.map(w => w.expected),
      ["omit_allowed", "name_required", "name_required", "omit_allowed", "name_required"]);
  }
});
