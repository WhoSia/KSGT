"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { buildPlan: base, works } = require("./actor-paragraph.cjs");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");

const permitted = "독자가 한 사람으로 좁힐 수 있으면 주어는 생략해도 된다.";
const required = "독자가 한 사람으로 좁힐 수 있으면 이어지는 문장에서는 주어를 생략한다.";

function buildPlan() {
  return base().flatMap((c, i) => {
    if (!c.prompt[0].content.includes(permitted)) throw Error("MISSING_BASELINE_WORDING");
    const prompt = [{ ...c.prompt[0], content: c.prompt[0].content.replace(permitted, required) }, c.prompt[1]];
    const allow = { ...c, id: "R941b_" + c.sourceWork + "_allow", condition: "allow" };
    const must = { ...c, id: "R941b_" + c.sourceWork + "_must", condition: "must", prompt,
      promptSha256: createHash("sha256").update(JSON.stringify(prompt)).digest("hex") };
    return i % 2 ? [must, allow] : [allow, must];
  });
}

function score(root) {
  const byId = new Map(works().map(w => [w.id, w]));
  return buildPlan().map(c => {
    const row = JSON.parse(fs.readFileSync(path.join(root, c.id + ".result.json"), "utf8"));
    if (row.id !== c.id || row.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
    const w = byId.get(c.sourceWork);
    return { id: w.id, condition: c.condition, gold: w.gold,
      target: w.target, other: w.other, sourceAction: w.action,
      text: row.text ?? null, tokens: row.usage?.total_tokens ?? null, status: row.outcome };
  });
}

async function main([mode, root, ...rest]) {
  if (rest.length || (mode === "--plan" ? root : !["--execute", "--score"].includes(mode) || !root)) {
    throw Error("USAGE: --plan | --execute NEW_DIRECTORY | --score DIRECTORY");
  }
  if (mode === "--plan") console.log(JSON.stringify(planReceipt(buildPlan()), null, 2));
  if (mode === "--score") console.log(JSON.stringify(score(root), null, 2));
  if (mode === "--execute") await executePlan(buildPlan(), root);
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { buildPlan };
