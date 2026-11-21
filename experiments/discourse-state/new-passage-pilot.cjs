"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { choose, DiscourseState, scopedChoice } = require("./referent-choice.cjs");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const { resolveProvider } = require("../g10-p1/provider_client_v01.cjs");
const fixtures = require("./new-passage-fixtures.json");

const ARMS = ["history", "state", "extract"];
const POLICY = "후속 문장에서 주어를 빼도 수신자가 행동 주체를 의도한 사람 한 명으로 정할 수 있을 때 생략형을 선택한다. 다른 인물도 문맥상 가능하거나 앞 상황을 알 수 없으면 이름을 넣는다.";
const EXTRACT = "후속 문장의 생략된 주어를 수신자가 알아들을 때, 문맥상 가능한 이야기 속 행동 주체를 모두 판정한다. 수신자가 과거 대화나 지금 이어지는 화제를 알 수 없으면 null을 쓴다. 말하는 이나 수신자 자신은 행동 주체라는 근거가 있을 때만 넣는다. 설명 없이 인물 이름의 JSON 배열 또는 null만 반환한다.";
const sha = (s) => createHash("sha256").update(s).digest("hex");

function works() {
  return fixtures.flatMap(({ id, variants, ...pair }, index) =>
    variants.map((variant, position) => {
      const { reader, allowOmit, events } = variant;
      const state = new DiscourseState();
      for (const event of events) state.update(event);
      const referents = state.candidates(reader);
      const snapshot = referents ? [...referents] : null;
      const gold = allowOmit ? "omit" : "name";
      const omitFirst = (index + position) % 2 === 0;
      const keys = omitFirst ? { A: "omit", B: "name" } : { A: "name", B: "omit" };
      const alternatives = {
        A: omitFirst ? pair.omitted : pair.named,
        B: omitFirst ? pair.named : pair.omitted,
      };
      return { ...pair, ...variant, snapshot, id: id + (position ? "_B" : "_A"), gold, keys, alternatives };
    }));
}

function buildPlan() {
  return works().flatMap((work, i) => {
    const ordered = ARMS.map((_, at) => ARMS[(i + at) % ARMS.length]);
    return ordered.map(condition => {
      const common = { 수신자: work.reader };
      const observation = condition === "state"
        ? { ...common, 수신자가_떠올릴_수_있는_행동주체: work.snapshot }
        : { ...common, 앞_문단: work.passage };
      const payload = condition === "extract"
        ? { ...observation, 후속_문장: work.omitted, 인물_후보: [work.target, work.distractor].sort() }
        : { ...observation, 의도한_행동주체: work.target, 문장_후보: work.alternatives };
      const prompt = [
        { role: "system", content: condition === "extract" ? EXTRACT : POLICY + " A 또는 B 한 글자만 답한다." },
        { role: "user", content: JSON.stringify(payload) },
      ];
      return { id: "R936_" + work.id + "_" + condition, sourceWork: work.id,
        condition, promptSha256: sha(JSON.stringify(prompt)), prompt };
    });
  });
}

function parseState(text, work) {
  let data;
  try { data = JSON.parse(text); } catch { return undefined; }
  if (data === null) return null;
  if (!Array.isArray(data) || new Set(data).size !== data.length ||
    data.some(name => name !== work.target && name !== work.distractor)) return undefined;
  return data;
}

function outcomeFor(text, work, condition) {
  if (condition === "extract") {
    const state = parseState(text, work);
    if (state === undefined) return { choice: "name", valid: false, state: null };
    return { choice: choose(state && new Set(state), work.target), valid: true, state };
  }
  const answer = text.trim();
  const choice = Object.hasOwn(work.keys, answer) ? work.keys[answer] : null;
  return { choice: choice ?? null, valid: Boolean(choice) };
}

function scoreRun(directory, read = file => JSON.parse(fs.readFileSync(file, "utf8"))) {
  const decisions = [];
  const stats = {};
  for (const work of works()) {
    for (const arm of [...ARMS, "controller"]) {
      const id = "R936_" + work.id + "_" + arm;
      const result = arm === "controller" ? null : read(path.join(directory, id + ".result.json"));
      const recovered = result ? result.outcome === "GENERATED" && result.finishReason === "stop" : true;
      const outcome = result
        ? recovered ? outcomeFor(result.text, work, arm) : { choice: null, valid: false }
        : { choice: scopedChoice(work), valid: true };
      const count = stats[arm] ??= { complete: 0, valid: 0, correct: 0, safeOmits: 0, unsafeOmits: 0,
        missedOmits: 0, exactStates: 0, measuredUsage: 0, promptTokens: 0, completionTokens: 0 };
      if (recovered) count.complete++;
      if (outcome.valid) count.valid++;
      if (outcome.choice === work.gold) count.correct++;
      if (outcome.choice === "omit") count[work.gold === "omit" ? "safeOmits" : "unsafeOmits"]++;
      if (outcome.choice === "name" && work.gold === "omit") count.missedOmits++;
      if (arm === "extract" && outcome.valid &&
          JSON.stringify(outcome.state && [...outcome.state].sort()) === JSON.stringify(work.active && [...work.active].sort())) count.exactStates++;
      if (result?.usage && Number.isInteger(result.usage.prompt_tokens) && Number.isInteger(result.usage.completion_tokens)) {
        count.measuredUsage++;
        count.promptTokens += result.usage.prompt_tokens;
        count.completionTokens += result.usage.completion_tokens;
      }
      decisions.push({ id, expected: work.gold, referenceState: work.active, ...outcome, raw: result?.text ?? null });
    }
  }
  return { stats, decisions };
}

async function main([mode, dir, ...rest]) {
  if (rest.length || (mode === "--plan" ? dir : !["--execute", "--score"].includes(mode) || !dir)) {
    throw Error("USAGE: --plan | --execute NEW_DIRECTORY | --score DIRECTORY");
  }
  if (mode === "--plan") console.log(JSON.stringify(planReceipt(buildPlan()), null, 2));
  if (mode === "--score") console.log(JSON.stringify(scoreRun(dir), null, 2));
  if (mode === "--execute") {
    resolveProvider("groq");
    const summary = await executePlan(buildPlan(), dir);
    if (summary.rows.some(row => row.outcome !== "GENERATED")) process.exitCode = 1;
  }
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { buildPlan, works, outcomeFor, scoreRun };
