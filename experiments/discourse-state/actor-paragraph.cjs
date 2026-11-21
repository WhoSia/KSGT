"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { DiscourseState, choose } = require("./referent-choice.cjs");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const fixtures = require("./actor-paragraph-fixtures.json");

const SYSTEM = "주어진 소설에 이어지는 한국어 문장 한 줄을 쓴다. 행동과 의도한 행위자를 유지한다. 앞 대목에 행동 주체로 가능한 사람이 여러 명이면 의도한 사람의 이름을 써서 밝힌다. 독자가 한 사람으로 좁힐 수 있으면 주어는 생략해도 된다. 제목이나 설명을 쓰지 않는다.";
const reader = "reader";

function works() {
  return fixtures.flatMap(f => [
    { ...f, id: f.id + "_single", prefix: f.opening, gold: "omit_allowed",
      events: [{ kind: "focus", reader, referents: [f.target] }] },
    { ...f, id: f.id + "_compete", prefix: f.opening + " " + f.competing, gold: "name_required",
      events: [{ kind: "focus", reader, referents: [f.target] }, { kind: "add", reader, referent: f.other }] },
    { ...f, id: f.id + "_resolved", prefix: f.opening + " " + f.competing + " " + f.exit, gold: "omit_allowed",
      events: [{ kind: "focus", reader, referents: [f.target, f.other] },
        { kind: "focus", reader, referents: [f.target] }] },
  ]);
}

function buildPlan() {
  return works().map(w => {
    const prompt = [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({
      앞문단: w.prefix, 의도한_행위자: w.target, 다음_행동: w.action,
    }) }];
    return { id: "R941_" + w.id, condition: "prose", sourceWork: w.id,
      promptSha256: createHash("sha256").update(JSON.stringify(prompt)).digest("hex"), prompt };
  });
}

function compile(w) {
  const state = new DiscourseState();
  for (const event of w.events) state.update(event);
  const active = state.candidates(reader);
  const choice = choose(active, w.target);
  return { active: active ? [...active] : null, choice,
    text: w.prefix + " " + (choice === "name" ? w.subject + " " : "") + w.action };
}

function analyze(root) {
  const byWork = new Map(buildPlan().map(c => [c.sourceWork, c]));
  return works().map(w => {
    const result = { id: w.id, gold: w.gold, prefix: w.prefix, sourceAction: w.action,
      target: w.target, other: w.other, controlled: compile(w) };
    if (!root) return result;
    const c = byWork.get(w.id);
    const row = JSON.parse(fs.readFileSync(path.join(root, c.id + ".result.json"), "utf8"));
    if (row.id !== c.id || row.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
    return { ...result, model: { text: row.text ?? null, tokens: row.usage?.total_tokens ?? null,
      status: row.outcome } };
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
module.exports = { works, buildPlan, compile };
