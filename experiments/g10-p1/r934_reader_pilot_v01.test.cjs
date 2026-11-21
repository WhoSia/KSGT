'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildPlan } = require('./r934_reader_pilot_v01.cjs');

test('the 12 works have three same-source arms and no reader scoring key in prompts', () => {
  const cells = buildPlan();
  assert.equal(cells.length, 36);
  assert.equal(new Set(cells.map(({ id }) => id)).size, 36);
  const orders = new Map();
  for (let i = 0; i < cells.length; i += 3) {
    const triple = cells.slice(i, i + 3);
    assert.equal(new Set(triple.map(({ sourceWork }) => sourceWork)).size, 1);
    const order = triple.map(({ condition }) => condition).join('/');
    orders.set(order, (orders.get(order) ?? 0) + 1);
    assert.equal(new Set(triple.map(({ prompt }) => prompt[0].content)).size, 1);
    const inputs = Object.fromEntries(triple.map(({ condition, prompt }) =>
      [condition, JSON.parse(prompt[1].content)]));
    const { writingAdvice, discourseCue, ...common } = inputs.guided;
    assert.deepEqual(inputs.direct, common);
    assert.deepEqual(inputs.rich, { ...common, writingAdvice });
    assert.ok(discourseCue);
    assert.deepEqual(Object.keys(common), ['genre', 'request', 'audience', 'facts']);
  }
  assert.deepEqual([...orders.values()], [2, 2, 2, 2, 2, 2]);
});
