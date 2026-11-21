'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildPlan } = require('./r933_source_wording_v01.cjs');

test('source wording pairs change one fact string and share the exact draft', () => {
  const plan = buildPlan();
  assert.equal(plan.length, 24);
  assert.equal(new Set(plan.map(({ id }) => id)).size, 24);
  for (let i = 0; i < plan.length; i += 2) {
    const [a, b] = plan.slice(i, i + 2);
    assert.equal(a.mode, b.mode);
    assert.equal(a.sourceWork, b.sourceWork);
    assert.notEqual(a.condition, b.condition);
    assert.equal(a.draftSha256, b.draftSha256);
    assert.deepEqual(a.prompt[0], b.prompt[0]);
    const { facts: af, ...ad } = JSON.parse(a.prompt[1].content);
    const { facts: bf, ...bd } = JSON.parse(b.prompt[1].content);
    assert.deepEqual(ad, bd);
    assert.equal(af.length, bf.length);
    assert.deepEqual(af.flatMap((f, j) => f === bf[j] ? [] : [j]), [a.target]);
    assert.equal(Object.hasOwn(ad, 'draft'), a.mode === 'revise');
  }
});

test('within each mode both source wordings appear first three times', () => {
  const plan = buildPlan();
  const first = plan.filter((_, i) => i % 2 === 0);
  for (const mode of ['generate', 'revise']) {
    for (const condition of ['compact', 'explicit']) {
      assert.equal(first.filter((cell) => cell.mode === mode && cell.condition === condition).length, 3);
    }
  }
});
