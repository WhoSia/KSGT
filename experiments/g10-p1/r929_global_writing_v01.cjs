'use strict';

const { createHash } = require('node:crypto');
const { REVISION_SETTINGS } = require('./r924_anchored_revision_v01.cjs');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const cohort = require('./fixtures/r929_global_writing_v01.json');

const ROLES = ['lead', 'develop', 'close'];
const POLICIES = ['direct', 'flat', 'map'];
const SYSTEM = '한국어로 완성된 글을 쓴다. 원천에서 확인되는 사실과 허가된 표현 범위를 지킨다.';
const INSTRUCTION = '독자와 목적에 맞게 문단마다 할 일을 구분하고, 앞에서 필요한 내용을 밝혀 다음 문단이 이어지게 쓴다. 표현 목표에 맞춰 문장의 호흡과 시점을 고른다. 세 문단의 본문만 출력한다.';
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const isText = (value) => typeof value === 'string' && value.length > 0 && value === value.trim();

function validWork(work) {
  return /^R929_[A-Z]+$/.test(work.id) &&
    ['genre', 'audience', 'purpose', 'aim', 'license', 'task', 'effect'].every((key) => isText(work[key])) &&
    Array.isArray(work.facts) && work.facts.length >= 5 && work.facts.every(isText) &&
    Array.isArray(work.cues) && work.cues.length === 6 &&
    work.cues.every((cue) => Array.isArray(cue) && cue.length === 2 && ROLES.includes(cue[0]) && isText(cue[1])) &&
    ROLES.every((role) => work.cues.filter(([label]) => label === role).length === 2) &&
    new Set(work.cues.map(([, cue]) => cue)).size === 6;
}

function buildPlan(data = cohort) {
  if (data.schema !== 'ksgt.r929.whole-document.v1' || !Array.isArray(data.works) ||
      data.works.length !== 6 || !data.works.every(validWork) ||
      new Set(data.works.map(({ id }) => id)).size !== 6) throw Error('INVALID_R929_COHORT');
  return data.works.flatMap(({ id, genre, audience, purpose, aim, license, facts, cues }, index) => {
    const common = { genre, audience, purpose, aim, license, facts, instruction: INSTRUCTION };
    const notes = cues.map(([, cue]) => cue);
    const paragraphMap = ROLES.map((role) => cues.filter(([label]) => label === role).map(([, cue]) => cue));
    const context = { direct: {}, flat: { 집필메모: notes },
      map: { 문단별집필메모: Object.fromEntries(paragraphMap.map((group, i) => [`${i + 1}문단`, group])) } };
    const offset = index % POLICIES.length;
    const order = POLICIES.slice(offset).concat(POLICIES.slice(0, offset));
    return order.map((condition) => {
      const prompt = [{ role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify({ ...common, ...context[condition] }) }];
      return { id: `${id}_${condition}`, sourceWork: id, condition, prompt, promptSha256: sha(prompt) };
    });
  });
}

function planReceipt(plan) {
  return { settings: REVISION_SETTINGS, planHash: sha({ settings: REVISION_SETTINGS, plan }),
    cells: plan.map(({ prompt, ...identity }) => ({ ...identity,
      promptBytes: Buffer.byteLength(prompt.map(({ content }) => content).join('\n'), 'utf8') })) };
}

async function main([mode, directory, ...extra]) {
  if (extra.length || !((mode === '--plan' && !directory) || (mode === '--execute' && directory))) {
    throw Error('USAGE: --plan | --execute NEW_OUTPUT_DIR');
  }
  const plan = buildPlan();
  if (mode === '--plan') {
    console.log(JSON.stringify(planReceipt(plan), null, 2));
    return;
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

module.exports = { buildPlan, planReceipt };
