'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildPlan, planReceipt } = require('./r929_global_writing_v01.cjs');
const cohort = require('./fixtures/r929_global_writing_v01.json');

test('all 18 plans share paired briefs and no scoring answers enter a prompt', () => {
  const plan = buildPlan();
  assert.equal(new Set(plan.map(({ id }) => id)).size, 18);
  for (const work of cohort.works) {
    const arms = Object.fromEntries(plan.filter(({ sourceWork }) => sourceWork === work.id)
      .map(({ condition, prompt }) => {
        assert.equal(prompt.some(({ content }) => content.includes(work.task) || content.includes(work.effect)), false);
        return [condition, JSON.parse(prompt[1].content)];
      }));
    const { 집필메모: flatNotes, ...flatBase } = arms.flat;
    const { 문단별집필메모: paragraphMap, ...mapBase } = arms.map;
    assert.deepEqual(flatBase, arms.direct);
    assert.deepEqual(mapBase, arms.direct);
    assert.deepEqual(flatNotes.toSorted(), Object.values(paragraphMap).flat().toSorted());
    assert.notDeepEqual(flatNotes, Object.values(paragraphMap).flat());
    assert.deepEqual(Object.values(paragraphMap).map((notes) => notes.length), [2, 2, 2]);
  }
});

test('the dry-run receipt is reproducible and omits prompts', () => {
  const p = planReceipt(buildPlan());
  assert.deepEqual(p, planReceipt(buildPlan()));
  assert.match(p.planHash, /^[a-f0-9]{64}$/);
  assert.ok(p.cells.every((cell) => !('prompt' in cell) && cell.promptBytes > 0));
});

test('duplicate work IDs and invalid cue assignments cannot reach a provider', () => {
  const duplicate = structuredClone(cohort);
  duplicate.works[1].id = duplicate.works[0].id;
  assert.throws(() => buildPlan(duplicate), /INVALID_R929_COHORT/);
  const roles = structuredClone(cohort);
  roles.works[0].cues[0][0] = 'close';
  assert.throws(() => buildPlan(roles), /INVALID_R929_COHORT/);
});
