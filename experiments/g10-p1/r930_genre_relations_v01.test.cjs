'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildPlan } = require('./r930_genre_relations_v01.cjs');
const cohort = require('./fixtures/r930_genre_relations_v01.json');

test('three arms share the brief and the two assisted arms share exact cue content', () => {
  const plan = buildPlan();
  assert.equal(new Set(plan.map((cell) => cell.id)).size, 18);
  const orders = new Set();
  for (const work of cohort.works) {
    const cells = plan.filter((cell) => cell.sourceWork === work.id);
    orders.add(cells.map((cell) => cell.condition).join('/'));
    const arms = Object.fromEntries(cells.map((cell) => {
      assert.equal(cell.prompt.some((message) => message.content.includes(work.task) || message.content.includes(work.effect)), false);
      assert.equal(cell.prompt[0].content, cells[0].prompt[0].content);
      return [cell.condition, JSON.parse(cell.prompt[1].content)];
    }));
    const { 집필메모: flat, ...flatBrief } = arms.flat;
    const { 집필메모: grouped, ...groupedBrief } = arms.grouped;
    assert.deepEqual(flatBrief, arms.direct);
    assert.deepEqual(groupedBrief, arms.direct);
    assert.deepEqual(flat.toSorted(), Object.values(grouped).flat().toSorted());
    assert.notDeepEqual(flat, Object.values(grouped).flat());
  }
  assert.equal(orders.size, 6);
});

test('invalid work identifiers, duplicate annotations and missing genres fail before execution', () => {
  const badId = structuredClone(cohort);
  badId.works[0].id = '../notice';
  assert.throws(() => buildPlan(badId), /INVALID_R930_COHORT/);
  const repeated = structuredClone(cohort);
  repeated.works[0].relation[1][0] = repeated.works[0].relation[0][0];
  assert.throws(() => buildPlan(repeated), /INVALID_R930_COHORT/);
  const missingGenre = structuredClone(cohort);
  missingGenre.works[0].genre = 'scene';
  assert.throws(() => buildPlan(missingGenre), /INVALID_R930_COHORT/);
});
