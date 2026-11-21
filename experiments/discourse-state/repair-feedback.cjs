"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { works, patch, applyPatch } = require("./conditional-repair.cjs");
const { executePlan } = require("../g10-p1/r928_scope_and_prose_v01.cjs");
const { planReceipt } = require("../g10-p1/r929_global_writing_v01.cjs");

const defects = {
  KEY_changed: "둘째 문장의 저녁 연습 조건은 기록지 작성에만 붙어 있다. 그 조건이 열쇠를 넣는 일과 반납 시각을 기록하는 일 모두를 한정하게 수정한다.",
  NUMBER_changed: "이 절차가 대기실 이동만 가리킬 수 있다. 참가 번호 확인과 대기실 이동을 각각 같은 최초 참가 조건 아래에 묶는다.",
  LABEL_changed: "은채가 새 인물로 들어온 것처럼 읽힐 수 있다. 상자를 연 인물과 우편 봉투를 꺼낸 은채가 한 사람임을 둘째 문장에서 연결한다.",
  MAP_changed: "둘째 문장이 다른 사람이라고 하므로 행위자가 갈린다. 가죽 가방을 내려놓은 사람이 접힌 지도를 꺼냈고 그 사람이 영서임을 명시한다.",
};

function buildPlan() {
  return works().filter(w => Object.hasOwn(defects, w.id)).flatMap((w, i) => {
    const generic = patch(w);
    const payload = JSON.parse(generic.prompt[1].content);
    const directedPrompt = [generic.prompt[0], { role: "user",
      content: JSON.stringify({ ...payload, 확인된_결함과_고칠_관계: defects[w.id] }) }];
    const annotated = { ...generic, id: `R939b_${w.id}_annotated`, condition: "annotated",
      promptSha256: createHash("sha256").update(JSON.stringify(directedPrompt)).digest("hex"),
      prompt: directedPrompt };
    const repeat = { ...generic, id: `R939b_${w.id}_generic`, condition: "generic" };
    return i % 2 === 0 ? [repeat, annotated] : [annotated, repeat];
  });
}

function score(root) {
  const index = new Map(works().map(w => [w.id, w]));
  return buildPlan().map(c => {
    const row = JSON.parse(fs.readFileSync(path.join(root, c.id + ".result.json"), "utf8"));
    if (row.id !== c.id || row.promptSha256 !== c.promptSha256) throw Error("REQUEST_MISMATCH " + c.id);
    const w = index.get(c.sourceWork);
    const revised = applyPatch(w, row);
    return { work: w.id, arm: c.condition, original: [w.first, w.second],
      revised: [w.first, revised.second], applied: revised.accepted, raw: row.text ?? null,
      tokens: row.usage?.total_tokens ?? null };
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
  console.error(error.message); process.exitCode = 1;
});
module.exports = { buildPlan };
