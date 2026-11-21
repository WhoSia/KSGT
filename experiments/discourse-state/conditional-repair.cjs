"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const { resolveProvider } = require("../g10-p1/provider_client_v01.cjs");
const fixtures = require("./repair-fixtures.json");

const SYSTEM = "한국어 두 문장을 원자료에 맞게 검토한다. 첫 문장에는 뒤에 밝힐 정보를 쓰지 않으며 둘째 문장에 공개한다. 인물 둘이 동일해야 한다면 문맥에서 식별 가능해야 한다. 공지의 배타 조건은 주어진 두 절차에 모두 적용되어야 한다.";
const sha = value => createHash("sha256").update(value).digest("hex");
const lines = s => (s || "").trim().split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const complete = row => row.outcome === "GENERATED" && row.finishReason === "stop" && Boolean(row.text?.trim());

function works() {
  return fixtures.flatMap(({ id, facts, relation, release, protect, first, clean, changed, changedFirst }) => {
    const common = { facts, relation, release, protect };
    return [
      { ...common, id: id + "_clean", gold: "keep", first, second: clean },
      { ...common, id: id + "_changed", gold: changedFirst ? "hold" : "repair",
        first: changedFirst || first, second: changed || clean },
    ];
  });
}

function cell(w, kind, task) {
  const prompt = [{ role: "system", content: SYSTEM },
    { role: "user", content: JSON.stringify({
      원자료: w.facts, 문장_사이의_관계: w.relation, 둘째_문장에서_공개할_어구: w.release,
      둘째_문장에_보존할_어구: w.protect, 원래_첫_문장: w.first, 원래_둘째_문장: w.second, 작업: task,
    }) }];
  return { id: `R939_${w.id}_${kind}`, sourceWork: w.id, condition: kind,
    promptSha256: sha(JSON.stringify(prompt)), prompt };
}

function firstPhase() {
  return works().flatMap((w, i) => {
    const detect = cell(w, "detect", "지금 문단에 결함이 없으면 KEEP, 둘째 문장만 수정하면 관계·사실·공개 순서를 지킬 수 있으면 REPAIR, 첫 문장을 수정해야 하면 HOLD만 답한다.");
    const rewrite = cell(w, "rewrite", "원자료와 공개 순서에 맞는 두 문장을 새로 쓴다. 각 문장 한 줄. 사실과 조건을 보존하고, 필요한 내용만 바꾼다.");
    return i % 2 === 0 ? [detect, rewrite] : [rewrite, detect];
  });
}

function patch(w) {
  return cell(w, "local", "첫 문장은 그대로 두고 둘째 문장에 있는 잘못을 고친다. 원자료와 둘째 문장에 남겨야 할 정보를 보존한다. 고친 둘째 문장 한 줄만 답한다.");
}

function action(w, row) {
  if (w.first.includes(w.release)) return "hold";
  if (!complete(row)) return "unresolved";
  const normalized = row.text.trim().toLowerCase();
  return ["keep", "repair", "hold"].includes(normalized) ? normalized : "unresolved";
}

function applyPatch(w, row) {
  const s = lines(row.text);
  if (!complete(row) || s.length !== 1 || !s[0].includes(w.release) || !s[0].includes(w.protect)) {
    return { second: w.second, accepted: false };
  }
  return { second: s[0], accepted: true };
}

function readRow(dir, c) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, c.id + ".result.json"), "utf8"));
  if (r.id !== c.id || r.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
  return r;
}

function score(root) {
  const initial = new Map(firstPhase().map(c => [c.id, c]));
  return works().map(w => {
    const get = kind => readRow(path.join(root, "first"), initial.get(`R939_${w.id}_${kind}`));
    const det = get("detect"), rewrite = get("rewrite");
    const judged = action(w, det);
    const local = judged === "repair" ? readRow(path.join(root, "second"), patch(w)) : null;
    const result = local ? applyPatch(w, local) : { second: w.second, accepted: false };
    const fullLines = lines(rewrite.text);
    const tokens = [det, ...(local ? [local] : [])].map(r => r.usage?.total_tokens);
    return { id: w.id, gold: w.gold, judged, detectorText: det.text ?? null,
      original: [w.first, w.second], selective: [w.first, result.second], localAttempted: Boolean(local),
      localApplied: result.accepted, full: fullLines, fullCompleted: complete(rewrite) && fullLines.length === 2,
      selectiveTokens: tokens.every(Number.isInteger) ? tokens.reduce((a, b) => a + b, 0) : null,
      rewriteTokens: rewrite.usage?.total_tokens ?? null };
  });
}

async function main([mode, root, ...rest]) {
  if (rest.length || (mode === "--plan" ? root : !["--execute", "--score"].includes(mode) || !root)) {
    throw Error("USAGE: --plan | --execute NEW_DIRECTORY | --score DIRECTORY");
  }
  if (mode === "--plan") console.log(JSON.stringify(planReceipt(firstPhase()), null, 2));
  if (mode === "--score") console.log(JSON.stringify(score(root), null, 2));
  if (mode !== "--execute") return;
  resolveProvider("groq");
  fs.mkdirSync(root);
  const initial = path.join(root, "first");
  const plan = firstPhase();
  await executePlan(plan, initial);
  const cases = new Map(works().map(w => [w.id, w]));
  const followup = plan.filter(c => c.condition === "detect").flatMap(c => {
    const w = cases.get(c.sourceWork);
    return action(w, readRow(initial, c)) === "repair" ? [patch(w)] : [];
  });
  fs.writeFileSync(path.join(root, "second-plan.json"), JSON.stringify(planReceipt(followup), null, 2) + "\n",
    { flag: "wx" });
  await executePlan(followup, path.join(root, "second"));
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message); process.exitCode = 1;
});
module.exports = { works, firstPhase, action, applyPatch, patch };
