'use strict';

const { createHash } = require('node:crypto');
const { buildPlan: priorPlan } = require('./r931_scene_paragraphs_v01.cjs');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { planReceipt } = require('./r929_global_writing_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const priorDrafts = require('./fixtures/r932_r931_replays_v01.json');
const works = require('./fixtures/r933_source_wording_v01.json');

const sha = (str) => createHash('sha256').update(str).digest('hex');
const editSystem = '한국어 단편 장면을 편집한다. 문법과 원천 사건에 어긋나는 부분을 바로잡고 정확한 표현은 보존한다. 원천에 없는 행동, 감각, 대사, 감정은 추가하지 않는다. 완성 본문만 출력한다. 이미 정확하고 자연스러우면 그대로 둔다.';
const defaultScene = {
  audience: '생활 단편 독자',
  goal: '인물의 동작과 그 순서가 보이는 짧은 삼인칭 장면',
  license: '적힌 행동과 감각만 사용한다. 대사와 감정, 동기를 추가하지 않는다.',
  instruction: '장면 안에서 사건을 알아볼 수 있게 쓰고 시점과 문장 길이를 조절한다. 소재 목록을 옮겨 적지 않고 본문으로 구성한다.',
};

function buildPlan() {
  const old = new Map(priorPlan().map((c) => [c.id, c]));
  const archived = new Map(priorDrafts.map((d) => [d.id, d]));
  const freeSystem = old.get('R931_GATE_free').prompt[0].content;
  return works.flatMap(({ id, replay, target, facts, draft, compact, explicit }, index) => {
    const source = replay ? JSON.parse(old.get(replay).prompt[1].content)
      : { ...defaultScene, facts };
    if (replay) {
      const entry = archived.get(replay);
      if (sha(entry.text) !== entry.textSha256 || entry.promptSha256 !== old.get(replay).promptSha256) {
        throw new Error('R931_REPLAY_MISMATCH');
      }
      draft = entry.text;
    }
    if (source.facts[target] !== compact || explicit === compact || !explicit || !draft) {
      throw new Error('INVALID_SOURCE_WORDING_PAIR');
    }
    const modes = index % 2 ? ['revise', 'generate'] : ['generate', 'revise'];
    return modes.flatMap((mode, mi) => {
      const order = (index + mi) % 2 ? ['explicit', 'compact'] : ['compact', 'explicit'];
      return order.map((condition) => {
        const changedFacts = source.facts.slice();
        if (condition === 'explicit') changedFacts[target] = explicit;
        const data = { ...source, facts: changedFacts };
        if (mode === 'revise') data.draft = draft;
        const prompt = [
          { role: 'system', content: mode === 'generate' ? freeSystem : editSystem },
          { role: 'user', content: JSON.stringify(data) },
        ];
        return {
          id: `R933_${id}_${mode}_${condition}`,
          sourceWork: `R933_${id}`,
          condition,
          mode,
          target,
          ...(mode === 'revise' ? { draftSha256: sha(draft) } : {}),
          promptSha256: sha(JSON.stringify(prompt)),
          prompt,
        };
      });
    });
  });
}

async function main([mode, directory, ...extra]) {
  if (extra.length || !(mode === '--plan' && !directory || mode === '--execute' && directory)) {
    throw new Error('USAGE: --plan | --execute NEW_OUTPUT_DIR');
  }
  const plan = buildPlan();
  if (mode === '--plan') {
    console.log(JSON.stringify(planReceipt(plan), null, 2));
    return;
  }
  resolveProvider('groq');
  const result = await executePlan(plan, directory);
  if (result.rows.some(({ outcome }) => outcome !== 'GENERATED')) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { buildPlan };
