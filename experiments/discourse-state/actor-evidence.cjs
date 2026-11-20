"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const briefs = require("./actor-evidence-fixtures.json");

const STAGES = [
  { id: "solo", events: ["opening"], expected: "omit_allowed" },
  { id: "compete", events: ["opening", "competing"], expected: "name_required" },
  { id: "exit_only", events: ["opening", "competing", "exit"], expected: "name_required" },
  { id: "sole_evidence", events: ["opening", "competing", "exit", "anchor"], expected: "omit_allowed" },
  { id: "return", events: ["opening", "competing", "exit", "anchor", "return"], expected: "name_required" }
];
const SYSTEM = "소설의 앞 대목에 이어지는 한국어 문장 한 줄을 써라. 의도한 행위자와 제시된 다음 행동을 그대로 보존한다. 그 행동의 주체로 해석될 수 있는 사람이 여러 명이면 이름을 쓰고, 한 명만 남으면 주어를 생략한다. 인물이 방을 나갔다는 사실만으로 그 인물이 다음 문장의 주체가 될 가능성이 완전히 사라졌다고 단정하지 않는다. 분석 과정, 제목, 새 사건을 보태지 않는다.";

function works() {
  return briefs.flatMap(brief => STAGES.map(stage => {
    const prefix = stage.events.map(key => brief[key]).join(" ");
    return { ...brief, id: brief.id + "_" + stage.id, prefix,
      eventKeys: [...stage.events], expected: stage.expected, stage: stage.id };
  }));
}
function sourceSpan(prefix, passage, minimum) {
  const start = prefix.indexOf(passage, minimum);
  if (start < minimum || prefix.indexOf(passage, start + 1) !== -1) {
    throw Error("UNSUPPORTED_SOURCE_EVIDENCE");
  }
  return [start, start + passage.length];
}
function extractAnnotatedState(work) {
  const active = new Set();
  const evidence = [];
  let previousEnd = 0;
  for (const key of work.eventKeys) {
    const span = sourceSpan(work.prefix, work[key], previousEnd);
    previousEnd = span[1];
    if (key === "opening") {
      if (!work.opening.includes(work.target)) throw Error("UNSUPPORTED_OPENING");
      active.add(work.target);
    } else if (key === "competing") {
      if (!work.competing.includes(work.other)) throw Error("UNSUPPORTED_COMPETITOR");
      active.add(work.other);
    } else if (key === "exit") {
      // Leaving the room does not automatically discharge discourse reference.
      if (!work.exit.includes(work.other)) throw Error("UNSUPPORTED_DEPARTURE");
    } else if (key === "anchor") {
      if (!work.anchor.includes(work.target + "만")) throw Error("UNSUPPORTED_EXCLUSION");
      active.clear();
      active.add(work.target);
    } else if (key === "return") {
      if (!work.return.includes(work.other)) throw Error("UNSUPPORTED_RETURN");
      active.add(work.other);
    } else throw Error("UNKNOWN_EVENT");
    evidence.push({ kind: key, span, text: work.prefix.slice(...span),
      remaining: [...active] });
  }
  if (!active.has(work.target)) throw Error("TARGET_NOT_CANDIDATE");
  return { candidates: [...active], evidence };
}
function compile(work) {
  const state = extractAnnotatedState(work);
  const choice = state.candidates.length === 1 ? "omit" : "name";
  return { ...state, choice, text: work.prefix + " " +
    (choice === "name" ? work.subject + " " : "") + work.action };
}
function naiveDeparture(work) {
  const state = new Set();
  for (const key of work.eventKeys) {
    if (key === "opening") state.add(work.target);
    if (key === "competing" || key === "return") state.add(work.other);
    if (key === "exit") state.delete(work.other);
    if (key === "anchor") { state.clear(); state.add(work.target); }
  }
  return state.size === 1 && state.has(work.target) ? "omit" : "name";
}
function buildPlan() {
  return works().flatMap(work => ["raw", "candidate_inventory"].map(condition => {
    const user = { 앞대목: work.prefix, 의도한_행위자: work.target,
      다음_행동: work.action };
    if (condition === "candidate_inventory") {
      user.주석된_후보 = extractAnnotatedState(work).candidates;
    }
    const prompt = [{ role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(user) }];
    return { id: "R942_" + work.id + "_" + condition, sourceWork: work.id,
      condition, promptSha256: createHash("sha256").update(JSON.stringify(prompt)).digest("hex"),
      prompt };
  }));
}
function analyze(root) {
  const plans = new Map(buildPlan().map(p => [p.id, p]));
  return works().map(work => {
    const row = { id: work.id, stage: work.stage, expected: work.expected,
      prefix: work.prefix, target: work.target, action: work.action,
      compiled: compile(work), naive: naiveDeparture(work) };
    if (root === undefined) return row;
    row.model = {};
    for (const condition of ["raw", "candidate_inventory"]) {
      const id = "R942_" + work.id + "_" + condition;
      const record = JSON.parse(fs.readFileSync(path.join(root, id + ".result.json"), "utf8"));
      if (record.id !== id || record.promptSha256 !== plans.get(id).promptSha256) {
        throw Error("REQUEST_MISMATCH " + id);
      }
      const output = typeof record.text === "string" ? record.text.trim() : null;
      row.model[condition] = { status: record.outcome, text: output,
        tokens: record.usage?.total_tokens ?? null,
        namedLiteral: output === null ? null : output.includes(work.target),
        actionLiteral: output === null ? null : output.includes(work.action) };
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
module.exports = { STAGES, works, sourceSpan, extractAnnotatedState,
  compile, naiveDeparture, buildPlan, analyze };
