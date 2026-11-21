'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildPlan } = require('./r931_scene_paragraphs_v01.cjs');
const { buildPlan: previousPlan } = require('./r930_genre_relations_v01.cjs');

test('each pair changes only the paragraph constraint', () => {
  const plan = buildPlan();
  assert.equal(plan.length, 12);
  assert.equal(new Set(plan.map(({ id }) => id)).size, 12);
  for (let index = 0; index < plan.length; index += 2) {
    const pair = plan.slice(index, index + 2);
    assert.equal(pair[0].sourceWork, pair[1].sourceWork);
    assert.equal(pair[0].condition, index % 4 === 0 ? 'fixed' : 'free');
    const fixed = pair.find(({ condition }) => condition === 'fixed');
    const free = pair.find(({ condition }) => condition === 'free');
    assert.equal(fixed.prompt[0].content.replace('세 문단의 본문만', '본문만'), free.prompt[0].content);
    assert.deepEqual(fixed.prompt[1], free.prompt[1]);
    assert.notEqual(fixed.promptSha256, free.promptSha256);
    assert.deepEqual(Object.keys(JSON.parse(fixed.prompt[1].content)),
      ['audience', 'goal', 'license', 'facts', 'instruction']);
  }
});

test('the replay controls reuse the exact previous direct-generation prompt', () => {
  const plan = buildPlan();
  for (const source of ['GATE', 'ENVELOPE']) {
    const old = previousPlan().find(({ id }) => id === 'R930_' + source + '_direct');
    const fixed = plan.find(({ id }) => id === 'R931_' + source + '_fixed');
    assert.deepEqual(fixed.prompt, old.prompt);
    assert.equal(fixed.promptSha256, old.promptSha256);
  }
});
