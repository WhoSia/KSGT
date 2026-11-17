'use strict';

const { createHash } = require('node:crypto');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { planReceipt } = require('./r929_global_writing_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const cohort = require('./fixtures/r930_genre_relations_v01.json');

const NAMES = Object.freeze({
  notice: ['먼저 가를 조건과 배정', '다음 조건과 예외'],
  science: ['관측과 경쟁 설명', '가르는 관측과 결과 해석'],
  scene: ['시작 시점과 동작', '시점·호흡의 이동과 마지막 감각'],
});
const ORDERS = [
  ['direct', 'flat', 'grouped'], ['grouped', 'flat', 'direct'],
  ['flat', 'grouped', 'direct'], ['direct', 'grouped', 'flat'],
  ['grouped', 'direct', 'flat'], ['flat', 'direct', 'grouped'],
];
const WRITING = Object.freeze({
  notice: '독자가 자기 조건에 해당하는 조치를 바로 찾게 쓴다. 조건의 적용 범위와 예외를 분명히 한다.',
  science: '관측, 가능한 설명, 다음 관측을 순서대로 연결한다. 측정이나 실험의 실제 여부와 결론의 범위를 분명히 한다.',
  scene: '장면 안에서 사건을 알아볼 수 있게 쓰고 시점과 문장 길이를 조절한다. 소재 목록을 옮겨 적지 않고 본문으로 구성한다.',
});
const validString = (value) => typeof value === 'string' && value.trim().length > 0;

function validWork(work) {
  return work && /^R930_[A-Z]+$/.test(work.id) && Object.hasOwn(NAMES, work.genre) &&
    ['audience', 'goal', 'license', 'task', 'effect'].every((key) => validString(work[key])) &&
    Array.isArray(work.facts) && work.facts.length >= 4 && work.facts.every(validString) &&
    Array.isArray(work.relation) && work.relation.length === 2 &&
    work.relation.every((group) => Array.isArray(group) && group.length >= 1 && group.length <= 2 && group.every(validString)) &&
    work.relation.flat().length >= 3 && new Set(work.relation.flat()).size === work.relation.flat().length;
}

function buildPlan(data = cohort) {
  if (data.schema !== 'ksgt.r930.genre-relations.v1' || !Array.isArray(data.works) ||
      data.works.length !== ORDERS.length || !data.works.every(validWork) ||
      new Set(data.works.map(({ id }) => id)).size !== ORDERS.length ||
      Object.keys(NAMES).some((genre) => data.works.filter((work) => work.genre === genre).length !== 2)) {
    throw Error('INVALID_R930_COHORT');
  }
  return data.works.flatMap(({ id, genre, audience, goal, license, facts, relation }, index) => {
    const [first, second] = relation;
    const flat = [second[0], first[0], second[1], first[1]].filter(Boolean);
    const grouped = Object.fromEntries(NAMES[genre].map((name, i) => [name, relation[i]]));
    const base = { audience, goal, license, facts, instruction: WRITING[genre] };
    const notes = { direct: {}, flat: { 집필메모: flat }, grouped: { 집필메모: grouped } };
    return ORDERS[index].map((condition) => {
      const prompt = [
        { role: 'system', content: '주어진 원천과 표현 범위 안에서 한국어 완성문을 쓴다. 제목, 문단 번호, 마크다운, 작성 안내 없이 세 문단의 본문만 쓴다.' },
        { role: 'user', content: JSON.stringify({ ...base, ...notes[condition] }) },
      ];
      const promptSha256 = createHash('sha256').update(JSON.stringify(prompt)).digest('hex');
      return { id: `${id}_${condition}`, sourceWork: id, condition, prompt, promptSha256 };
    });
  });
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

module.exports = { buildPlan };
