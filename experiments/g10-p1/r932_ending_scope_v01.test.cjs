'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { splitEnding, buildPlan } = require('./r932_ending_scope_v01.cjs');

test('split preserves the exact leading whitespace and textual prefix', () => {
  assert.deepEqual(splitEnding('앞이다.\n\n  뒤다. 끝이다.'), {
    prefix: '앞이다.\n\n  ',
    ending: '뒤다. 끝이다.',
  });
  assert.throws(() => splitEnding('하나다.'), /NEED_AT_LEAST_THREE_SENTENCES/);
});

test('each matched pair receives the same source, draft, and suffix', () => {
  const plan = buildPlan();
  assert.equal(plan.length, 12);
  assert.equal(new Set(plan.map((cell) => cell.id)).size, 12);
  for (let i = 0; i < plan.length; i += 2) {
    const [first, second] = plan.slice(i, i + 2);
    assert.notEqual(first.condition, second.condition);
    assert.equal(first.prompt[0].content, second.prompt[0].content);
    const { instruction: firstInstruction, ...firstInput } = JSON.parse(first.prompt[1].content);
    const { instruction: secondInstruction, ...secondInput } = JSON.parse(second.prompt[1].content);
    assert.notEqual(firstInstruction, secondInstruction);
    assert.deepEqual(firstInput, secondInput);
  }
});
