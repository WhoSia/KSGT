'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chat, resolveProvider } = require('./provider_client_v01.cjs');
const { MODEL, packet, messages } = require('./r923_actual_role_pipeline_v01.cjs');

const ARMS = ['generic', 'anchored'];
const THREE_ARMS = ['generic', 'plain', 'anchored'];
const REVISION_SETTINGS = Object.freeze({ provider: 'groq', model: MODEL, temperature: 0, maxTokens: 1450 });
const KINDS = new Set(['source', 'transition', 'repetition', 'ending']);
const NOTE_GUIDE = 'F와 U 뒤의 숫자는 각각 facts와 uncertainties의 1번부터 시작하는 위치다. 각 제안은 해당 구절을 원천과 대조한 뒤 반영한다.';
const sha = (value) => createHash('sha256')
  .update(typeof value === 'string' ? value : JSON.stringify(value))
  .digest('hex');

function locate(draft, quote) {
  if (typeof quote !== 'string' || quote !== quote.trim() || !quote || quote.length > 220) {
    throw Error('INVALID_DRAFT_QUOTE');
  }
  const start = draft.indexOf(quote);
  if (start < 0 || draft.indexOf(quote, start + 1) >= 0) throw Error('QUOTE_MUST_MATCH_ONCE');
  return { start, end: start + quote.length };
}

function compileNotes(source, draft, notes) {
  if (!Array.isArray(notes) || notes.length > 3) throw Error('AT_MOST_THREE_NOTES');
  const ranges = [];
  const compiled = notes.map(({ kind, quotes, refs, impact, edit }) => {
    if (!KINDS.has(kind) || !Array.isArray(quotes) ||
        quotes.length !== (kind === 'repetition' ? 2 : 1)) throw Error('INVALID_NOTE_KIND_OR_QUOTES');
    for (const quote of quotes) {
      const range = locate(draft, quote);
      if (ranges.some(({ start, end }) => range.start < end && start < range.end)) {
        throw Error('OVERLAPPING_DRAFT_QUOTES');
      }
      ranges.push(range);
    }
    if (!Array.isArray(refs) || !refs.length || refs.length > 4 || new Set(refs).size !== refs.length) {
      throw Error('INVALID_SOURCE_REFS');
    }
    for (const id of refs) {
      const match = typeof id === 'string' && /^([FU])([1-9][0-9]*)$/.exec(id);
      const entries = match && (match[1] === 'F' ? source.facts : source.uncertainties);
      if (!entries || !entries[Number(match[2]) - 1]) throw Error('UNKNOWN_SOURCE_REF');
    }
    if ([impact, edit].some((field) => typeof field !== 'string' ||
        !field.trim() || field.length > 100)) throw Error('INVALID_COMPACT_NOTE_TEXT');
    return { kind, quotes, refs, impact, edit };
  });
  return compiled;
}

function renderPlainNotes(notes) {
  return [NOTE_GUIDE, ...notes.map(({ kind, quotes, refs, impact, edit }) =>
    `유형은 ${kind}. 초안 구절은 ${quotes.map((quote) => JSON.stringify(quote)).join(' / ')}. 관련 원천은 ${refs.join(', ')}. 독자 영향은 ${impact} 수정 제안은 ${edit}`)]
    .join('\n');
}

function buildRevisionCells(task, draft, proposals, arms) {
  const source = packet(task);
  const notes = compileNotes(source, draft, proposals);
  const baseline = messages(task, 'GENERIC_REVISION', { draft });
  return arms.map((arm) => {
    if (!THREE_ARMS.includes(arm)) throw Error('UNKNOWN_REVISION_ARM');
    let prompt = baseline;
    if (arm !== 'generic' && notes.length) {
      const user = JSON.parse(baseline[1].content);
      user.anchoredEditNotes = arm === 'anchored'
        ? { guide: NOTE_GUIDE, notes }
        : renderPlainNotes(notes);
      prompt = [baseline[0], { role: 'user', content: JSON.stringify(user) }];
    }
    return { sourceWork: task.sourceWork, arm, sourceSha256: sha(source), draftSha256: sha(draft),
      promptSha256: sha(prompt), noteCount: arm === 'generic' ? 0 : notes.length, prompt };
  });
}

function prepare(cohort, archive, annotations, { threeArms = false } = {}) {
  if (archive?.schema !== 'ksgt.r923.real-groq-pipeline.v1' ||
      annotations?.schema !== 'ksgt.r924.anchored-notes.v1' ||
      !Array.isArray(archive.records) || !Array.isArray(annotations.works) ||
      !Array.isArray(cohort?.tasks) || !cohort.tasks.length) throw Error('INVALID_REPLAY_INPUT');
  const ids = cohort.tasks.map(({ sourceWork }) => sourceWork);
  for (const works of [cohort.tasks, archive.records, annotations.works]) {
    if (works.length !== ids.length ||
        new Set(works.map(({ sourceWork }) => sourceWork)).size !== ids.length ||
        works.some(({ sourceWork }) => !ids.includes(sourceWork))) throw Error('REPLAY_COVERAGE_MISMATCH');
  }
  return cohort.tasks.flatMap((task, index) => {
    const source = packet(task);
    const old = archive.records.find(({ sourceWork }) => sourceWork === task.sourceWork);
    const proposed = annotations.works.find(({ sourceWork }) => sourceWork === task.sourceWork);
    const draft = old.draft?.text;
    if (typeof draft !== 'string' || !draft.trim() || old.draft.stage !== 'RICH_DRAFT' ||
        old.draft.status !== 'GENERATED' || old.draft.finishReason !== 'stop' ||
        sha(source) !== old.sourceSha256 || sha(source) !== proposed.sourceSha256 ||
        sha(draft) !== old.draft.textSha256 || sha(draft) !== proposed.draftSha256) {
      throw Error('SOURCE_OR_DRAFT_SHA_MISMATCH');
    }
    const rotation = index % THREE_ARMS.length;
    const order = threeArms
      ? THREE_ARMS.slice(rotation).concat(THREE_ARMS.slice(0, rotation))
      : index % 2 ? [...ARMS].reverse() : ARMS;
    return buildRevisionCells(task, draft, proposed.notes, order);
  });
}

function receipt(cell, result) {
  const { text, finishReason, usage, responseModel, latencyMs } = result ?? {};
  if (typeof text !== 'string' || !text.trim() ||
      !['prompt_tokens', 'completion_tokens', 'total_tokens'].every((key) =>
        Number.isInteger(usage?.[key]) && usage[key] >= 0)) throw Error('INVALID_PROVIDER_RESULT');
  return { status: finishReason === 'stop' ? 'GENERATED' : 'INCOMPLETE',
    text, textSha256: sha(text), finishReason, usage, responseModel, latencyMs,
    paragraphCount: text.trim().split(/\r?\n[ \t]*\r?\n+/).length, promptSha256: cell.promptSha256 };
}

async function run(cells, { invoke = chat, before = () => {}, record = () => {} } = {}) {
  const results = [];
  for (const cell of cells) {
    before(cell);
    let outcome;
    try {
      const result = await invoke({ ...REVISION_SETTINGS, messages: cell.prompt });
      outcome = receipt(cell, result);
    } catch (error) {
      outcome = { status: 'FAILED', errorClass: Number.isInteger(error?.status)
        ? 'PROVIDER_HTTP_' + error.status : 'REQUEST_OR_RECEIPT_FAILED' };
    }
    const { prompt, ...identity } = cell;
    const entry = { ...identity, ...outcome };
    record(entry);
    results.push(entry);
  }
  return results;
}

function writePrivate(filename, contents) {
  const temp = filename + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(contents, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  fs.renameSync(temp, filename);
}

async function main([mode, archivePath, notesPath, output, ...rest]) {
  const live = ['--execute', '--execute-three'].includes(mode);
  const threeArms = ['--dry-run-three', '--execute-three'].includes(mode);
  if ((!live && !['--dry-run', '--dry-run-three'].includes(mode)) ||
      !archivePath || !notesPath || Boolean(output) !== live || rest.length) {
    throw Error('USAGE: --dry-run[-three] ARCHIVE_JSON NOTES_JSON | --execute[-three] ARCHIVE_JSON NOTES_JSON NEW_OUTPUT_DIR');
  }
  const read = (name) => JSON.parse(fs.readFileSync(name, 'utf8'));
  const cohort = read(path.join(__dirname, 'fixtures', 'global_document_dev_v01.json'));
  const annotations = read(notesPath);
  const cells = prepare(cohort, read(archivePath), annotations, { threeArms });
  if (!live) {
    console.log(JSON.stringify({ mode: 'DRY_RUN', planned: cells.map(({ prompt, ...cell }) => cell),
      providerRequests: 0 }, null, 2));
    return;
  }
  resolveProvider('groq');
  fs.mkdirSync(output, { mode: 0o700 });
  writePrivate(path.join(output, 'plan.json'), { settings: REVISION_SETTINGS,
    archiveSha256: createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex'), cells });
  const results = await run(cells, {
    record: (entry) => writePrivate(path.join(output, entry.sourceWork + '_' + entry.arm + '.json'), entry),
  });
  const safe = results.map(({ text, ...entry }) => entry);
  writePrivate(path.join(output, 'summary.json'), { settings: REVISION_SETTINGS, cells: safe });
  console.log(JSON.stringify({ providerRequests: results.length, generated: results.filter(
    ({ status }) => status === 'GENERATED').length }));
  if (results.some(({ status }) => status !== 'GENERATED')) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { REVISION_SETTINGS, buildRevisionCells, compileNotes, prepare, run };
