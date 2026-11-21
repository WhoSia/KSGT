"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { works, extractAnnotatedState, compile } = require("./actor-evidence.cjs");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");

const SYSTEM = "이어질 문장에서 주어를 생략해도 행위자가 한 명으로 식별되면 OMIT, 두 사람 이상으로 해석될 가능성이 남아 있으면 NAME만 출력한다. 인물이 장면에서 떠난 사실만으로 담화의 지시 후보에서 제거하지 말라. 앞 대목에 의도한 사람만 해당 사물 곁에 남았다고 명시하면 그 문장은 별도의 한정 근거다. 새 사건을 가정하지 말고 정확히 NAME 또는 OMIT 네 글자 이내로 답하라.";

function buildPlan() {
  return works().flatMap(w => ["raw", "candidate_inventory"].map(condition => {
    const input = { 앞대목: w.prefix, 의도한_행위자: w.target, 다음_행동: w.action };
    if (condition === "candidate_inventory") input.주석된_가능_행위자 = extractAnnotatedState(w).candidates;
    const prompt = [{ role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(input) }];
    return { id: "R942B_" + w.id + "_" + condition, sourceWork: w.id,
      condition, prompt, promptSha256: createHash("sha256").update(JSON.stringify(prompt)).digest("hex") };
  }));
}
function normalize(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim().toUpperCase();
  return cleaned === "NAME" ? "name" : cleaned === "OMIT" ? "omit" : null;
}
function analyze(root) {
  const plans = new Map(buildPlan().map(c => [c.id, c]));
  return works().map(w => {
    const predicted = compile(w).choice;
    const row = { id: w.id, expected: predicted, stage: w.stage };
    if (root === undefined) return row;
    row.model = {};
    for (const condition of ["raw", "candidate_inventory"]) {
      const id = "R942B_" + w.id + "_" + condition;
      const receipt = JSON.parse(fs.readFileSync(path.join(root, id + ".result.json"), "utf8"));
      if (receipt.id !== id || receipt.promptSha256 !== plans.get(id).promptSha256) {
        throw Error("REQUEST_MISMATCH " + id);
      }
      const chosen = normalize(receipt.text);
      row.model[condition] = { text: receipt.text ?? null, choice: chosen,
        agreesWithAnnotatedRule: chosen === predicted, tokens: receipt.usage?.total_tokens ?? null,
        status: receipt.outcome };
    }
    return row;
  });
}
async function main([mode, root, ...rest]) {
  if (rest.length || (["--plan", "--offline"].includes(mode) ? root :
    !["--execute", "--score"].includes(mode) || !root)) {
    throw Error("USAGE: --plan | --offline | --execute NEW_DIR | --score DIRECTORY");
  }
  if (mode === "--plan") console.log(JSON.stringify(planReceipt(buildPlan()), null, 2));
  if (mode === "--offline" || mode === "--score") console.log(JSON.stringify(analyze(root), null, 2));
  if (mode === "--execute") await executePlan(buildPlan(), root);
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { buildPlan, analyze, normalize };
