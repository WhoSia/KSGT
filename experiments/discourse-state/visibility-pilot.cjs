"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const { resolveProvider } = require("../g10-p1/provider_client_v01.cjs");
const works = require("./visibility-fixtures.json");

const SYSTEM = "제공된 자료로 자연스러운 한국어 본문을 쓴다. 없는 사건, 대상이나 의무를 추가하지 않는다. 늦게 공개하기로 한 사실을 첫 문장에서 밝히지 않는다. 후속 문장은 이전 문장과의 관계를 지키며, 지정 어구는 있는 그대로 넣는다. 공지에서 하나의 적용 조건이 두 절차에 걸리면 두 절차 모두에 걸린다고 명시한다. 본문 외에는 쓰지 않는다.";
const STAGED = ["concealed", "visible"];
const sha = value => createHash("sha256").update(value).digest("hex");
const finished = r => r.outcome === "GENERATED" && r.finishReason === "stop" && Boolean(r.text?.trim());

function makeCell(w, arm, phase, details) {
  const prompt = [{ role: "system", content: SYSTEM },
    { role: "user", content: JSON.stringify({ 장르: w.genre, ...details }) }];
  return { id: `R938_${w.id}_${arm}_${phase}`, condition: arm, sourceWork: w.id,
    promptSha256: sha(JSON.stringify(prompt)), prompt };
}

function first(w, arm) {
  if (arm === "one") {
    return makeCell(w, arm, "first", {
      첫_문장_자료: w.opening, 둘째_문장_자료: [w.closing, w.reveal],
      두_문장의_관계: w.relation, 둘째_문장에_보존할_어구: w.protect,
      출력: "두 문장을 각각 한 줄에 쓴다. 공개는 둘째 문장에 한다.",
    });
  }
  if (!STAGED.includes(arm)) throw Error("INVALID_ARM");
  return makeCell(w, arm, "first", {
    첫_문장_자료: w.opening, 두_문장의_관계: w.relation,
    둘째_문장에서_공개할_내용: arm === "visible" ? w.reveal : null,
    출력: "첫 문장만 한 줄에 쓴다. 보류된 사실은 둘째 문장에서 공개한다.",
  });
}

function second(w, arm, prefix) {
  return makeCell(w, arm, "second", {
    첫_문장에서_실제로_쓴_내용: prefix,
    원래_첫_문장_자료: w.opening,
    둘째_문장_자료: [w.closing, w.reveal],
    두_문장의_관계: w.relation, 둘째_문장에_보존할_어구: w.protect,
    출력: "이어지는 둘째 문장만 한 줄에 쓴다. 후속 자료와 공개 사실을 표현한다.",
  });
}

function firstPhase() {
  return works.flatMap((w, index) => (index % 2 ? ["visible", "concealed", "one"] : ["one", "concealed", "visible"])
    .map(arm => first(w, arm)));
}

function readRow(root, c) {
  const r = JSON.parse(fs.readFileSync(path.join(root, c.id + ".result.json"), "utf8"));
  if (r.id !== c.id || r.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
  return r;
}

function splitOne(text) {
  return text.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function score(root) {
  return works.flatMap(w => ["one", ...STAGED].map(arm => {
    const f = readRow(path.join(root, "first"), first(w, arm));
    const rows = [f];
    let prefix = f.text || "";
    let tail = "";
    let validLines = false;
    if (arm === "one") {
      const lines = splitOne(prefix);
      [prefix = "", tail = ""] = lines;
      validLines = finished(f) && lines.length === 2;
    } else if (finished(f)) {
      const s = readRow(path.join(root, "second"), second(w, arm, prefix));
      rows.push(s);
      tail = s.text || "";
      validLines = finished(s) && splitOne(prefix).length === 1 && splitOne(tail).length === 1;
    }
    return { work: w.id, arm, prefix, tail, validLines,
      earlyMention: f.text ? prefix.includes(w.focus) : null,
      lateMention: tail.includes(w.focus),
      protectExact: tail.includes(w.protect),
      tokens: rows.every(r => Number.isInteger(r.usage?.total_tokens))
        ? rows.reduce((sum, r) => sum + r.usage.total_tokens, 0) : null };
  }));
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
  await executePlan(firstPhase(), initial);
  const followup = works.flatMap(w => STAGED.flatMap(arm => {
    const f = readRow(initial, first(w, arm));
    return finished(f) ? [second(w, arm, f.text)] : [];
  }));
  fs.writeFileSync(path.join(root, "second-plan.json"), JSON.stringify(planReceipt(followup), null, 2) + "\n",
    { flag: "wx" });
  await executePlan(followup, path.join(root, "second"));
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message); process.exitCode = 1;
});
module.exports = { first, second, firstPhase };
