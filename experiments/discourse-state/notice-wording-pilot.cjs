"use strict";

const { render, audit, reviseScope } = require("./notice-scope.cjs");
const originals = require("./notice-scope-fixtures.json");
const alternatives = require("./notice-alternatives.json");

function swap(text, first, second) {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  if (a < 0 || b < a + first.length) throw Error("INVALID_SWAP");
  return text.slice(0, a) + second + text.slice(a + first.length, b) + first + text.slice(b + second.length);
}

function run() {
  return originals.map(original => {
    const plan = { ...original, alternatives: alternatives[original.id] };
    const layouts = ["list", "paragraph"].flatMap(format => [false, true].map(alternate => {
      const text = render(plan, { format, alternate });
      return { format, alternate, text, audit: audit(plan, text) };
    }));
    const text = layouts.find(x => x.format === "paragraph" && x.alternate).text;
    const errors = [];
    const scoped = plan.rules.findIndex(r => r.mode !== "all");
    if (scoped >= 0) {
      const rule = plan.rules[scoped];
      const next = { audience: rule.audience, mode: rule.mode === "only" ? "applies" : "only" };
      const revised = reviseScope(plan, text, scoped, next);
      errors.push({ kind: "exclusivity", text: revised.text, audit: audit(plan, revised.text), amendedPlanAudit: revised.audit });
    }
    if (plan.rules.length > 1) {
      const a = plan.alternatives[plan.rules[0].actions.at(-1)];
      const b = plan.alternatives[plan.rules[1].actions[0]];
      const changed = swap(text, a, b);
      errors.push({ kind: "cross_scope", text: changed, audit: audit(plan, changed) });
    }
    const pair = plan.rules.find(r => r.actions.length >= 2);
    if (pair) {
      const [a, b] = pair.actions.map(id => plan.alternatives[id]);
      const changed = swap(text, a, b);
      errors.push({ kind: "order", text: changed, audit: audit(plan, changed) });
    }
    return { id: plan.id, layouts, errors };
  });
}

if (require.main === module) console.log(JSON.stringify(run(), null, 2));
module.exports = { run };
