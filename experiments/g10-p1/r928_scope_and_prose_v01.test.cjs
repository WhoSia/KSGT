'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { applyPatch, buildPlan, executePlan, render } = require('./r928_scope_and_prose_v01.cjs');
const paragraphs = [['처음.','이어서.'], ['중간.'], ['마지막.']];

test('KEEP returns original bytes and patch changes only the selected sentence', () => {
  assert.equal(applyPatch(paragraphs, '{"action":"KEEP"}').text, render(paragraphs));
  const patched = applyPatch(paragraphs, '{"action":"PATCH","edits":[{"paragraph":1,"sentence":2,"text":"다르게."}]}');
  assert.deepEqual(patched.changed, ['1.2']);
  assert.equal(patched.text, '처음. 다르게.\n\n중간.\n\n마지막.');
});

test('invalid position, duplicate position or multiline edit cannot commit a partial revision', () => {
  for (const edits of [
    [{ paragraph: 1, sentence: 1, text: '변경.' }, { paragraph: 0, sentence: 1, text: '오류.' }],
    [{ paragraph: 1, sentence: 1, text: '변경.' }, { paragraph: 1, sentence: 1, text: '중복.' }],
    [{ paragraph: 2, sentence: 1, text: '중간.\n\n침범.' }],
    [{ paragraph: 2, sentence: 1, text: '첫 문장. 다음 문장.' }],
  ]) {
    assert.throws(() => applyPatch(paragraphs, JSON.stringify({ action: 'PATCH', edits })), /INVALID_PATCH/);
    assert.equal(render(paragraphs), '처음. 이어서.\n\n중간.\n\n마지막.');
  }
});

test('revision shares factual inputs and no draft or task leaks its planted variant label', () => {
  const plan = buildPlan();
  const edit = plan.filter((r) => r.variant);
  assert.equal(edit.length, 12);
  for (const row of edit.filter((r) => r.condition === 'patch')) {
    const partner = edit.find((r) => r.variant === row.variant && r.sourceWork === row.sourceWork && r.condition === 'rewrite');
    const { instruction, ...input } = JSON.parse(row.prompt[1].content);
    const { instruction: other, ...otherInput } = JSON.parse(partner.prompt[1].content);
    assert.deepEqual(input, otherInput);
    assert.ok(input.draft);
    assert.ok(!Object.hasOwn(input, 'variant') && !Object.hasOwn(input, 'target'));
  }
});

test('reader-state cues add to the same outline and the direct arm has the same facts', () => {
  const generated = buildPlan().filter((row) => !row.variant);
  assert.equal(generated.length, 9);
  for (const row of generated.filter((r) => r.condition === 'reader_state')) {
    const input = (c) => JSON.parse(generated.find((r) => r.sourceWork === row.sourceWork && r.condition === c).prompt[1].content);
    const { readerState, ...outlineInput } = input('reader_state');
    const { outline, ...directInput } = input('outline');
    assert.deepEqual(outlineInput, input('outline'));
    assert.deepEqual(directInput, input('direct'));
    assert.equal(readerState.length, 3);
  }
});

test('malformed provider patch is archived without treating it as KEEP', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ksgt-r928-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const [cell] = buildPlan().filter((r) => r.condition === 'patch');
  const output = await executePlan([cell], path.join(root, 'test'), { invoke: async () => {
    assert.ok(fs.existsSync(path.join(root, 'test', cell.id + '.attempt.json')));
    return { text: '잘못된 응답', finishReason: 'stop', usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 } };
  } });
  assert.equal(output.rows[0].status, 'GENERATED');
  assert.equal(output.rows[0].outcome, 'INVALID_PATCH');
  assert.equal(output.rows[0].finalSha256, null);
  assert.ok(!Object.hasOwn(output.rows[0], 'text'));
});
