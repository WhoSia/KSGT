'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { freezePublic, verifyPlan, execute } = require('./r926_repeated_revision_v01.cjs');
const probes = require('./fixtures/r926_public_revision_probes_v01.json');

function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ksgt-r926-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return path.join(root, 'run');
}

const completion = () => ({ text: '교정 결과입니다.', finishReason: 'stop',
  usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 } });

test('two rounds preserve exact prompt bytes and use all six condition orders', () => {
  const plan = freezePublic(probes);
  verifyPlan(plan);
  const orders = new Set();
  assert.equal(plan.cells.length, 18);
  for (let offset = 0; offset < 18; offset += 3) {
    const block = plan.cells.slice(offset, offset + 3);
    assert.equal(new Set(block.map(({ sourceSha256, draftSha256 }) =>
      [sourceSha256, draftSha256].join())).size, 1);
    assert.deepEqual(block.map(({ position }) => position), [1, 2, 3]);
    orders.add(block.map(({ arm }) => arm).join(','));
  }
  assert.equal(orders.size, 6);
  for (const cell of plan.cells.slice(0, 9)) {
    const repeated = plan.cells.find((a) => a.round === 2 &&
      a.sourceWork === cell.sourceWork && a.arm === cell.arm);
    assert.equal(cell.promptSha256, repeated.promptSha256);
    assert.deepEqual(cell.prompt, repeated.prompt);
  }
});

test('a changed plan is rejected before the first call', async (t) => {
  const plan = freezePublic(probes);
  plan.cells[0].prompt[1].content += ' ';
  await assert.rejects(execute(plan, sandbox(t), {
    invoke: () => assert.fail('provider must not be contacted'),
  }), /PLAN_SHA_MISMATCH/);
});

test('started and completed cells survive a resume without duplicate calls', async (t) => {
  const directory = sandbox(t);
  const plan = freezePublic(probes);
  let count = 0;
  const first = await execute(plan, directory, { invoke: () => {
    const cell = plan.cells[count++];
    assert.ok(fs.existsSync(path.join(directory, cell.id + '.attempt.json')));
    return completion();
  } });
  assert.equal(count, 18);
  assert.ok(first.cells.every((row) => row.status === 'GENERATED' && !Object.hasOwn(row, 'text')));
  // Simulate a lost receipt after submission and two cells never submitted.
  for (const cell of plan.cells.slice(-3)) {
    fs.unlinkSync(path.join(directory, cell.id + '.result.json'));
  }
  for (const cell of plan.cells.slice(-2)) {
    fs.unlinkSync(path.join(directory, cell.id + '.attempt.json'));
  }
  const second = await execute(plan, directory, { resume: true, invoke: () => {
    count++;
    return completion();
  } });
  assert.equal(count, 20);
  assert.equal(second.cells.at(-3).status, 'UNKNOWN_AFTER_ATTEMPT');
  assert.equal(second.cells.filter(({ status }) => status === 'GENERATED').length, 17);
});

test('tampered checkpoint rejects a resume before contacting the provider', async (t) => {
  const directory = sandbox(t);
  const plan = freezePublic(probes);
  await execute(plan, directory, { invoke: completion });
  const file = path.join(directory, plan.cells[0].id + '.result.json');
  const outcome = JSON.parse(fs.readFileSync(file));
  fs.writeFileSync(file, JSON.stringify({ ...outcome, text: '조작' }));
  await assert.rejects(execute(plan, directory, { resume: true,
    invoke: () => assert.fail('provider must not be contacted') }), /CHECKPOINT_MISMATCH/);
});
