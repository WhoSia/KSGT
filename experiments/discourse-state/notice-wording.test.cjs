"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { render, audit, reviseScope } = require("./notice-scope.cjs");
const alternatives = require("./notice-alternatives.json");
const plans = require("./notice-scope-fixtures.json").map(p => ({ ...p, alternatives: alternatives[p.id] }));

test("both layouts, both wordings and their text spans bind the same action IDs", () => {
  for (const plan of plans) {
    assert.deepEqual(Object.keys(plan.alternatives).sort(), Object.keys(plan.actions).sort());
    for (const format of ["list", "paragraph"]) {
      const base = audit(plan, render(plan, { format }));
      for (const alternate of [false, true]) {
        const text = render(plan, { format, alternate });
        const result = audit(plan, text);
        assert.equal(result.status, "supported", plan.id);
        for (const [id, e] of Object.entries(result.evidence)) {
          const scope = ({ audience, mode, before }) => ({ audience, mode, before });
          assert.deepEqual(scope(e), scope(base.evidence[id]));
          assert.equal(text.slice(...e.actionSpan), (format === "list" ? "- " : "") +
            (alternate ? plan.alternatives[id] : plan.actions[id]));
        }
      }
    }
  }
});

test("paragraph exclusivity repair preserves the rest and the paragraph header style", () => {
  const plan = plans.find(p => p.id === "EXHIBIT");
  const text = render(plan, { format: "paragraph", alternate: true });
  const revised = reviseScope(plan, text, 0, { audience: "first", mode: "applies" });
  assert.equal(revised.text, text.replace("에게만 적용되는 절차입니다.", "에게 적용되는 절차입니다."));
  assert.equal(audit(plan, revised.text).status, "rejected");
  assert.equal(audit(revised.plan, revised.text).status, "supported");
});

test("unlisted and colliding wordings are kept out of accepted action evidence", () => {
  const plan = plans.find(p => p.id === "BADGE");
  const text = render(plan, { format: "paragraph" }).replace("반납하세요.", "챙겨가세요.");
  assert.equal(audit(plan, text).status, "unsupported");
  assert.throws(() => render({ ...plan, alternatives: { handover: plan.actions.handover } }), /INVALID_ACTION_WORDING/);
});
