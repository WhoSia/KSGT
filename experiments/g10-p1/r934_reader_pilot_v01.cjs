'use strict';

const { createHash } = require('node:crypto');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { planReceipt } = require('./r929_global_writing_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const works = require('./fixtures/r934_reader_cohort_v01.json');

const ORDERS = [
  ['direct', 'rich', 'guided'], ['rich', 'guided', 'direct'], ['guided', 'direct', 'rich'],
  ['guided', 'rich', 'direct'], ['rich', 'direct', 'guided'], ['direct', 'guided', 'rich'],
];
const SYSTEM = '한국어로 완성된 글을 쓴다. 제공된 사실과 불확실성은 정확히 지키고 원천에 없는 새로운 사실, 조건, 사건은 추가하지 않는다. 장르와 독자에게 맞는 분량으로 완성된 본문만 쓴다.';
const RICH = '독자에게 필요한 정보를 제때 제시한다. 문장 사이의 시간·원인·조건 관계를 분명히 하고, 이미 전달한 내용을 다시 설명하는 문장은 줄인다. 원천에 맞는 표현과 문단을 스스로 고른다.';
const sha = (text) => createHash('sha256').update(text).digest('hex');

function buildPlan() {
  if (works.length !== 12 || new Set(works.map((work) => work.id)).size !== 12) {
    throw new Error('INVALID_R934_COHORT');
  }
  return works.flatMap(({ id, genre, request, audience, facts, cue }, i) =>
    ORDERS[i % ORDERS.length].map((condition) => {
      const payload = { genre, request, audience, facts };
      if (condition !== 'direct') payload.writingAdvice = RICH;
      if (condition === 'guided') payload.discourseCue = cue;
      const prompt = [{ role: 'system', content: SYSTEM }, { role: 'user', content: JSON.stringify(payload) }];
      return { id: `R934_${id}_${condition}`, sourceWork: id, condition, genre,
        promptSha256: sha(JSON.stringify(prompt)), prompt };
    }));
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
