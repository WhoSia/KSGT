"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { render, audit } = require("./notice-scope.cjs");
const cases = require("./notice-scope-fixtures.json");
const by = id => cases.find(x => x.id === id);

test("generated text yields source-verifiable scope and action spans", () => {
  for (const plan of cases) {
    const text = render(plan);
    const result = audit(plan, text);
    assert.equal(result.status, "supported", plan.id);
    for (const [id, e] of Object.entries(result.evidence)) {
      assert.equal(text.slice(...e.actionSpan), "- " + plan.actions[id]);
      assert.equal(text.slice(...e.scopeSpan).includes("에게만"), e.mode === "only");
    }
  }
});

test("a familiar participant and every action phrase cannot mask widened applicability", () => {
  const plan = by("TRIPOD");
  const text = render(plan).replace("에게만", "에게");
  assert.ok(text.includes(plan.audiences.late));
  assert.ok(Object.values(plan.actions).every(s => text.includes(s)));
  assert.deepEqual(audit(plan, text).issues, [{ kind: "mode", id: "return" }, { kind: "mode", id: "log" }]);
});

test("the same action can be unconditionally required or limited to an audience", () => {
  const plan = by("EXHIBIT");
  const text = render(plan);
  const a = "- " + plan.actions.room;
  const b = "- " + plan.actions.sign;
  const changed = text.replace(a, "@@").replace(b, a).replace("@@", b);
  assert.equal(audit(plan, changed).status, "rejected");
  assert.ok(audit(plan, changed).issues.some(i => i.kind === "audience" && i.id === "room"));
});

test("order inside a procedure and missing actions are accounted for", () => {
  const plan = by("TRIPOD");
  const [h,a,b] = render(plan).split("\n");
  assert.equal(audit(plan, [h,b,a].join("\n")).status, "rejected");
  assert.deepEqual(audit(plan, [h,a].join("\n")).issues, [{ kind: "missing", id: "log" }]);
  assert.ok(audit(plan, [h,a,b,b].join("\n")).issues.some(i => i.kind === "duplicate"));
});

test("an unsupported but plausible free-form notice remains undecided", () => {
  const plan = by("BADGE");
  assert.equal(audit(plan, "임시 출입증을 빌린 분만 퇴실할 때 출입증을 안내대에 돌려주세요.").status, "unsupported");
});

test("a plan cannot silently orphan an action or give it overlapping rules", () => {
  const plan = structuredClone(by("EXHIBIT"));
  plan.rules.pop();
  assert.throws(() => render(plan), /UNBOUND_ACTION/);
  plan.rules.push({ audience: "all", mode: "all", actions: ["number", "sign"] });
  assert.throws(() => render(plan), /UNKNOWN_OR_DUPLICATE_ACTION/);
});
