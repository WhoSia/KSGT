"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");
const { resolveProvider } = require("../g10-p1/provider_client_v01.cjs");
const briefs = require("./disclosure-fixtures.json");

const SYSTEM = "제공된 자료로 자연스러운 한국어 본문을 쓴다. 사실, 행위의 순서와 적용 범위를 지킨다. 자료에 없는 사건, 의무, 반응과 묘사는 덧붙이지 않는다. 제목이나 설명 없이 본문만 쓴다.";
const sha = value => createHash("sha256").update(value).digest("hex");

function compile(brief, timing) {
  if (timing !== "early" && timing !== "late") throw Error("INVALID_DISCLOSURE_TIMING");
  const [first, second, focus] = brief.anchors;
  const atStart = timing === "early";
  return [
    {
      자료: atStart ? [brief.opening, brief.reveal] : [brief.opening],
      반드시_넣을_표현: atStart ? [first, focus] : [first],
    },
    {
      자료: atStart ? [brief.closing] : [brief.closing, brief.reveal],
      반드시_넣을_표현: atStart ? [second] : [second, focus],
    },
  ];
}

function works() {
  return briefs.flatMap((brief, index) => (index % 2 ? ["late", "early"] : ["early", "late"])
    .map(timing => ({ ...brief, timing, key: brief.id + "_" + timing, plan: compile(brief, timing) })));
}

function common(work) {
  return { 장르: work.genre, 예상_독자: work.audience };
}

function cell(work, condition, details) {
  const prompt = [{ role: "system", content: SYSTEM },
    { role: "user", content: JSON.stringify({ ...common(work), ...details }) }];
  return { id: "R937_" + work.key + "_" + condition, sourceWork: work.key, condition,
    promptSha256: sha(JSON.stringify(prompt)), prompt };
}

function firstPhase() {
  return works().flatMap((w, index) => {
    const [first, second] = w.plan;
    const direct = cell(w, "direct", {
      원자료: [w.opening, w.closing, w.reveal],
      공개_시점: w.timing === "early" ? "첫 문장에서만 새 정보를 밝힌다." : "둘째 문장에서만 새 정보를 밝힌다.",
      문장_순서: "첫 문장에 첫 사건 또는 첫 절차를, 둘째 문장에 다음 사건 또는 다음 절차를 쓴다.",
      지정_표현: [w.anchors[0], w.anchors[1], w.anchors[2]],
      출력: "문장 두 개를 각각 한 줄씩 쓴다. 사용 범위가 뒤에서 나오면 앞 문장에는 범위가 있음을 드러내도 좋다.",
    });
    const planned = cell(w, "plan", {
      문장별_자료와_공개_순서: [first, second],
      출력: "첫 문장과 둘째 문장을 한 줄씩 쓴다. 새로 제공된 사실과 문장별 지정 표현을 해당 문장에 넣고 이미 밝힌 정보를 반복하지 않는다. 사용 범위가 뒤에서 나오면 앞 문장에는 범위가 있음을 드러내도 좋다.",
    });
    const observed = cell(w, "start", {
      첫_문장_자료: first,
      출력: "첫 문장 한 줄만 쓴다. 현재 문장의 자료만 사용한다. 공지는 적용 범위를 후속 문장에서 정할 수 있도록 단정의 범위를 넓히지 않는다.",
    });
    const order = [direct, planned, observed];
    return order.map((_, i) => order[(i + index) % order.length]);
  });
}

const lines = text => text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const finished = r => r.outcome === "GENERATED" && r.finishReason === "stop";

function acceptsStart(work, text) {
  const [first, second, focus] = work.anchors;
  return lines(text).length === 1 && text.includes(first) && !text.includes(second) &&
    text.includes(focus) === (work.timing === "early");
}

function continuation(work, prefix) {
  if (!acceptsStart(work, prefix)) throw Error("INVALID_FIRST_LINE");
  return cell(work, "end", {
    실제로_쓴_첫_문장: prefix,
    독자에게_전달한_자료: work.plan[0].자료,
    후속_문장_자료: work.plan[1],
    출력: "이어지는 둘째 문장 한 줄만 쓴다. 이미 공개한 정보는 이어받고 새 자료와 지정 표현을 넣는다. 공지에서 적용 대상이 제시되면 두 절차 모두 그 대상에만 적용된다고 명확히 쓴다.",
  });
}

function readRow(root, id) {
  return JSON.parse(fs.readFileSync(path.join(root, id + ".result.json"), "utf8"));
}

function check(work, text) {
  const pair = lines(text);
  if (pair.length !== 2) return false;
  const [first, second, focus] = work.anchors;
  return pair[0].includes(first) && !pair[1].includes(first) &&
    pair[1].includes(second) && !pair[0].includes(second) &&
    pair[0].includes(focus) === (work.timing === "early") &&
    pair[1].includes(focus) === (work.timing === "late");
}

function score(root) {
  return works().flatMap(w => ["direct", "plan", "compiled"].map(arm => {
    const prefix = "R937_" + w.key + "_";
    const one = readRow(path.join(root, "first"), prefix + (arm === "compiled" ? "start" : arm));
    let requests = [one];
    let accepted = finished(one);
    let text = one.text || "";
    if (arm === "compiled") {
      accepted = accepted && acceptsStart(w, text);
      if (accepted) {
        const end = readRow(path.join(root, "second"), prefix + "end");
        if (end.promptSha256 !== continuation(w, text).promptSha256) throw Error("PREFIX_SHA_MISMATCH");
        requests = [...requests, end];
        accepted = finished(end) && lines(end.text).length === 1;
        text += "\n" + (end.text || "");
      }
    }
    const tokenCounts = requests.map(r => r.usage?.total_tokens);
    const tokens = tokenCounts.every(Number.isInteger) ? tokenCounts.reduce((a, b) => a + b, 0) : null;
    return { work: w.key, arm, timing: w.timing, accepted, order: accepted && check(w, text),
      requests: requests.length, tokens, text };
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
  const first = path.join(root, "first");
  await executePlan(firstPhase(), first);
  const second = works().flatMap(w => {
    const row = readRow(first, "R937_" + w.key + "_start");
    return finished(row) && acceptsStart(w, row.text) ? [continuation(w, row.text)] : [];
  });
  fs.writeFileSync(path.join(root, "second-plan.json"), JSON.stringify(planReceipt(second), null, 2) + "\n",
    { flag: "wx" });
  await executePlan(second, path.join(root, "second"));
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { compile, works, firstPhase, acceptsStart, continuation, check };
