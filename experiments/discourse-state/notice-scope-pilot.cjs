"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const { render, audit } = require("./notice-scope.cjs");
const plans = require("./notice-scope-fixtures.json");

const SYSTEM = "주어진 내용을 독자가 바로 쓸 수 있는 짧은 한국어 공지로 쓴다. 계획에서 같은 범위 아래 묶인 절차는 모두 해당 대상에게 적용되고, 배타 한정이 있는 경우에만 그 대상에게만 적용된다고 쓴다. 전원에게 적용되는 별도 절차는 분명히 구분한다. 절차의 순서와 세부 내용을 모두 보존한다. 제목이나 작업 과정 없이 자연스러운 최종 공지만 제공한다. 형식은 자유다.";

function buildPlan() {
  return plans.map(plan => {
    const prompt = [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({
      규칙: plan.rules.map(rule => ({
        대상: rule.audience === "all" ? "모든 이용자" : plan.audiences[rule.audience],
        배타_한정: rule.mode === "only",
        절차: rule.actions.map(id => plan.actions[id]),
      })),
    }) }];
    return { id: "R940_" + plan.id, sourceWork: plan.id, condition: "one",
      promptSha256: createHash("sha256").update(JSON.stringify(prompt)).digest("hex"), prompt };
  });
}

function mutations(plan, text) {
  const results = [];
  const nonUniversal = plan.rules.find(rule => rule.mode !== "all");
  if (nonUniversal) {
    const before = plan.audiences[nonUniversal.audience] + (nonUniversal.mode === "only" ? "에게만" : "에게");
    const after = plan.audiences[nonUniversal.audience] + (nonUniversal.mode === "only" ? "에게" : "에게만");
    results.push({ kind: "toggle_exclusivity", text: text.replace(before + " 적용됩니다.", after + " 적용됩니다.") });
  }
  if (plan.rules.length > 1) {
    const a = "- " + plan.actions[plan.rules[0].actions.at(-1)];
    const b = "- " + plan.actions[plan.rules[1].actions[0]];
    results.push({ kind: "swap_audiences", text: text.replace(a, "@@").replace(b, a).replace("@@", b) });
  }
  const pair = plan.rules.find(r => r.actions.length >= 2);
  if (pair) {
    const [a,b] = pair.actions.map(id => "- " + plan.actions[id]);
    results.push({ kind: "reverse_order", text: text.replace(a + "\n" + b, b + "\n" + a) });
  }
  const end = text.split("\n").at(-1);
  results.push({ kind: "duplicate", text: text + "\n" + end });
  results.push({ kind: "omit", text: text.slice(0, -(end.length + 1)) });
  return results;
}

function analyze(root) {
  const byPlan = new Map(buildPlan().map(c => [c.sourceWork, c]));
  return plans.map(plan => {
    const text = render(plan);
    const changed = mutations(plan, text).map(m => ({
      kind: m.kind, text: m.text,
      allPhrases: [...Object.values(plan.audiences), ...Object.values(plan.actions)].every(p => m.text.includes(p)),
      audit: audit(plan, m.text),
    }));
    if (!root) return { work: plan.id, text, audit: audit(plan, text), changed };
    const c = byPlan.get(plan.id);
    const row = JSON.parse(fs.readFileSync(path.join(root, c.id + ".result.json"), "utf8"));
    if (row.id !== c.id || row.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
    return { work: plan.id, text, audit: audit(plan, text), changed,
      model: { text: row.text ?? null, tokens: row.usage?.total_tokens ?? null, status: row.outcome,
        audit: row.text ? audit(plan, row.text.trim()) : null } };
  });
}

async function main([mode, root, ...rest]) {
  if (rest.length || (["--plan", "--offline"].includes(mode) ? root : !["--execute", "--score"].includes(mode) || !root)) {
    throw Error("USAGE: --plan | --offline | --execute NEW_DIRECTORY | --score DIRECTORY");
  }
  if (mode === "--plan") console.log(JSON.stringify(planReceipt(buildPlan()), null, 2));
  if (mode === "--offline" || mode === "--score") console.log(JSON.stringify(analyze(root), null, 2));
  if (mode === "--execute") await executePlan(buildPlan(), root);
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { analyze };
