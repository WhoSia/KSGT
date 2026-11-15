'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { compileNotes, prepare, run } = require('./r924_anchored_revision_v01.cjs');
const { messages, packet } = require('./r923_actual_role_pipeline_v01.cjs');

const hash = (value) => createHash('sha256').update(value).digest('hex');
const task = { sourceWork: 'DEV_TEST', genre: 'public_notice', audience: '학생',
  purpose: '구별한다.', facts: ['행사는 무료다.'], uncertainties: ['준비물은 미정이다.'] };
const draft = '참가는 무료다.\n\n실습비를 받지 않는다.\n\n준비물은 아직 정해지지 않았다.';
const note = { kind: 'repetition', quotes: ['참가는 무료다.', '실습비를 받지 않는다.'],
  refs: ['F1'], impact: '같은 내용이 두 번 나온다.', edit: '한 번만 쓴다.' };

function inputs(notes = [note]) {
  const sourceSha256 = hash(JSON.stringify(packet(task)));
  const draftSha256 = hash(draft);
  return [
    { tasks: [task] },
    { schema: 'ksgt.r923.real-groq-pipeline.v1', records: [{ sourceWork: task.sourceWork, sourceSha256,
      draft: { stage: 'RICH_DRAFT', status: 'GENERATED', finishReason: 'stop',
        text: draft, textSha256: draftSha256 } }] },
    { schema: 'ksgt.r924.anchored-notes.v1', works: [{ sourceWork: task.sourceWork, sourceSha256,
      draftSha256, notes }] },
  ];
}

test('generic prompt is exactly the R9.23 comparator; anchored adds only its notes', () => {
  const [generic, anchored] = prepare(...inputs());
  assert.deepEqual(generic.prompt, messages(task, 'GENERIC_REVISION', { draft }));
  assert.deepEqual(generic.prompt[0], anchored.prompt[0]);
  const { anchoredEditNotes, ...shared } = JSON.parse(anchored.prompt[1].content);
  assert.deepEqual(shared, JSON.parse(generic.prompt[1].content));
  assert.equal(anchored.draftSha256, generic.draftSha256);
  assert.equal(anchored.sourceSha256, generic.sourceSha256);
  assert.deepEqual(anchoredEditNotes.notes, [note]);
  assert.notEqual(anchored.promptSha256, generic.promptSha256);
});

test('an empty note list yields identical arm prompts', () => {
  const [generic, anchored] = prepare(...inputs([]));
  assert.equal(generic.promptSha256, anchored.promptSha256);
});

test('rejects one or two copies of the same claimed repetition span', () => {
  for (const quotes of [[note.quotes[0]], [note.quotes[0], note.quotes[0]]]) {
    assert.throws(() => compileNotes(task, draft, [{ ...note, quotes }]),
      /INVALID_NOTE_KIND_OR_QUOTES|OVERLAPPING_DRAFT_QUOTES/);
  }
});

test('rejects spans absent, ambiguous, or overlapping with another note', () => {
  assert.throws(() => compileNotes(task, draft, [
    { ...note, quotes: ['없는 문장.', note.quotes[1]] },
  ]), /QUOTE_MUST_MATCH_ONCE/);
  assert.throws(() => compileNotes(task, draft + draft, [note]), /QUOTE_MUST_MATCH_ONCE/);
  assert.throws(() => compileNotes(task, draft, [note, {
    ...note, kind: 'source', quotes: ['참가는 무료다'],
  }]), /OVERLAPPING_DRAFT_QUOTES/);
});

test('rejects missing, invalid, and duplicate references and oversized commentary', () => {
  for (const refs of [[], ['F01'], ['F2'], ['U2'], ['F1', 'F1']]) {
    assert.throws(() => compileNotes(task, draft, [{ ...note, refs }]), /SOURCE_REF/);
  }
  assert.throws(() => compileNotes(task, draft, [{ ...note, edit: '가'.repeat(101) }]),
    /INVALID_COMPACT_NOTE_TEXT/);
  assert.throws(() => compileNotes(task, draft, Array(4).fill(note)), /AT_MOST_THREE_NOTES/);
});

test('rejects edited archive bytes, incomplete drafts and stale annotations', () => {
  for (const change of [
    ([, archive]) => { archive.records[0].draft.text += ' '; },
    ([, archive]) => { archive.records[0].draft.finishReason = 'length'; },
    ([,, annotations]) => { annotations.works[0].sourceSha256 = 'stale'; },
    ([,, annotations]) => { annotations.works[0].draftSha256 = 'stale'; },
  ]) {
    const args = inputs();
    change(args);
    assert.throws(() => prepare(...args), /SOURCE_OR_DRAFT_SHA_MISMATCH/);
  }
});

test('rejects a duplicate or unknown work instead of silently substituting a draft', () => {
  for (const replacement of [[{ sourceWork: 'UNKNOWN' }], [...inputs()[2].works, ...inputs()[2].works]]) {
    const args = inputs();
    args[2].works = replacement;
    assert.throws(() => prepare(...args), /REPLAY_COVERAGE_MISMATCH/);
  }
});

test('both arms get identical model settings and exactly one attempted call each', async () => {
  const requests = [], saved = [];
  const results = await run(prepare(...inputs()), {
    invoke: async (options) => {
      requests.push(options);
      return { text: draft, finishReason: 'stop', usage: {
        prompt_tokens: 10, completion_tokens: 5, total_tokens: 15,
      } };
    },
    record: (entry) => saved.push(entry),
  });
  assert.equal(requests.length, 2);
  const settings = requests.map(({ messages: _, ...options }) => options);
  assert.deepEqual(settings[0], settings[1]);
  assert.deepEqual(results, saved);
  assert.ok(results.every((entry) => entry.status === 'GENERATED' && entry.paragraphCount === 3));
  assert.ok(results.every((entry) => !Object.hasOwn(entry, 'prompt')));
});

test('a truncated first call is retained and the second arm runs independently', async () => {
  let count = 0;
  const results = await run(prepare(...inputs()), { invoke: async () => {
    if (count++ === 0) return { text: '일부 출력', finishReason: 'length',
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } };
    throw Object.assign(Error('private response detail'), { status: 429 });
  } });
  assert.equal(count, 2);
  assert.equal(results[0].status, 'INCOMPLETE');
  assert.equal(results[0].usage.total_tokens, 15);
  assert.equal(results[1].status, 'FAILED');
  assert.equal(results[1].errorClass, 'PROVIDER_HTTP_429');
  assert.doesNotMatch(JSON.stringify(results), /private response detail/);
});

test('missing usage cannot become a completed provider result', async () => {
  const results = await run(prepare(...inputs()), {
    invoke: async () => ({ text: draft, finishReason: 'stop' }),
  });
  assert.ok(results.every((entry) => entry.status === 'FAILED'));
});
