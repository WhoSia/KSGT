'use strict';

const { createHash } = require('node:crypto');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { planReceipt } = require('./r929_global_writing_v01.cjs');
const { buildPlan: previousPlan } = require('./r930_genre_relations_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const freshWorks = require('./fixtures/r931_scene_paragraphs_v01.json');

const FIXED = '세 문단의 본문만 쓴다.';
const FREE = '본문만 쓴다.';
const REPLAY = ['R930_GATE', 'R930_ENVELOPE'];

function buildPlan() {
  const previous = previousPlan().filter(({ sourceWork, condition }) =>
    condition === 'direct' && REPLAY.includes(sourceWork));
  if (previous.length !== REPLAY.length || freshWorks.length !== 4) {
    throw new Error('WRONG_R931_COHORT');
  }
  const template = previous[0].prompt;
  if (!template[0].content.endsWith(FIXED) ||
      previous.some(({ prompt }) => prompt[0].content !== template[0].content)) {
    throw new Error('CHANGED_R930_TEMPLATE');
  }
  const { instruction } = JSON.parse(template[1].content);
  const works = [
    ...previous.map(({ sourceWork, prompt }) => ({
      id: sourceWork.replace('R930_', 'R931_'), prompt,
    })),
    ...freshWorks.map(({ id, audience, goal, license, facts }) => ({
      id, prompt: [template[0], { role: 'user', content: JSON.stringify({
        audience, goal, license, facts, instruction,
      }) }],
    })),
  ];
  if (new Set(works.map(({ id }) => id)).size !== works.length ||
      works.some(({ id }) => !/^R931_[A-Z]+$/.test(id))) {
    throw new Error('WRONG_R931_WORK_IDS');
  }
  return works.flatMap(({ id, prompt }, index) => {
    const conditions = index % 2 === 0 ? ['fixed', 'free'] : ['free', 'fixed'];
    return conditions.map((condition) => {
      const system = condition === 'fixed' ? prompt[0].content :
        prompt[0].content.slice(0, -FIXED.length) + FREE;
      const messages = [{ role: 'system', content: system }, { ...prompt[1] }];
      return {
        id: id + '_' + condition,
        sourceWork: id,
        condition,
        prompt: messages,
        promptSha256: createHash('sha256').update(JSON.stringify(messages)).digest('hex'),
      };
    });
  });
}

async function main([mode, directory, ...extra]) {
  const plan = buildPlan();
  if (mode === '--plan' && !directory) {
    console.log(JSON.stringify(planReceipt(plan), null, 2));
    return;
  }
  if (mode !== '--execute' || !directory || extra.length) {
    throw new Error('USAGE: --plan | --execute NEW_OUTPUT_DIR');
  }
  resolveProvider('groq');
  const result = await executePlan(plan, directory);
  const generated = result.rows.filter(({ outcome }) => outcome === 'GENERATED').length;
  console.log(JSON.stringify({ attempted: result.rows.length, generated, planHash: result.planHash }));
  if (generated !== plan.length) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { buildPlan };
