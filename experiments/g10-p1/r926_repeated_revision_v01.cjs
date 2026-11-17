'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { resolveProvider } = require('./provider_client_v01.cjs');
const { REVISION_SETTINGS, buildRevisionCells, prepare, run } = require('./r924_anchored_revision_v01.cjs');

const ARMS = ['generic', 'plain', 'anchored'];
const COHORT = 'global_document_dev_v01.json';
const PUBLIC_PROBES = 'r926_public_revision_probes_v01.json';
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function finishPlan(base, cohortKind) {
  const works = [...new Set(base.map(({ sourceWork }) => sourceWork))];
  if (works.length !== 3 || base.length !== 9 || works.some((work) =>
    !/^[A-Z0-9_]+$/.test(work) || new Set(base.filter((cell) => cell.sourceWork === work)
      .map(({ arm }) => arm)).size !== 3)) throw Error('THREE_COMPLETE_WORKS_REQUIRED');
  const cells = [1, 2].flatMap((round) => works.flatMap((sourceWork, index) => {
    const rotated = ARMS.slice(index).concat(ARMS.slice(0, index));
    const order = round === 1 ? rotated : rotated.reverse();
    return order.map((arm, position) => ({
      ...base.find((cell) => cell.sourceWork === sourceWork && cell.arm === arm),
      id: `r${round}_${sourceWork}_${arm}`, round, position: position + 1,
    }));
  }));
  const sealed = { schema: 'ksgt.r926.repeat-plan.v1', cohortKind, settings: REVISION_SETTINGS, cells };
  return { ...sealed, planSha256: sha(sealed) };
}

function freezeHistorical(cohort, archive, notes) {
  return finishPlan(prepare(cohort, archive, notes, { threeArms: true }), 'R923_ARCHIVED_GROQ_DRAFTS');
}

function freezePublic(probes) {
  if (probes?.schema !== 'ksgt.r926.authored-public-probes.v1' || !Array.isArray(probes.cases)) {
    throw Error('INVALID_PUBLIC_PROBES');
  }
  return finishPlan(probes.cases.flatMap(({ task, draft, notes }) =>
    buildRevisionCells(task, draft, notes, ARMS)), 'R926_AUTHORED_PUBLIC_PROBES');
}

function verifyPlan({ planSha256, ...sealed }) {
  if (sealed.schema !== 'ksgt.r926.repeat-plan.v1' || planSha256 !== sha(sealed) ||
      JSON.stringify(sealed.settings) !== JSON.stringify(REVISION_SETTINGS)) throw Error('PLAN_SHA_MISMATCH');
  const rebuilt = finishPlan(sealed.cells.filter(({ round }) => round === 1), sealed.cohortKind);
  if (rebuilt.planSha256 !== planSha256 ||
      sealed.cells.some(({ prompt, promptSha256 }) => sha(prompt) !== promptSha256)) {
    throw Error('PLAN_CELLS_MISMATCH');
  }
}

function read(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function writeNew(filename, data) {
  const temp = filename + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  fs.linkSync(temp, filename);
  fs.unlinkSync(temp);
}

function state(cell, directory, planSha256) {
  const attempted = path.join(directory, cell.id + '.attempt.json');
  const result = path.join(directory, cell.id + '.result.json');
  if (!fs.existsSync(attempted)) {
    if (fs.existsSync(result)) throw Error('RESULT_WITHOUT_ATTEMPT');
    return 'NOT_STARTED';
  }
  const marker = read(attempted);
  if (marker.id !== cell.id || marker.promptSha256 !== cell.promptSha256 ||
      marker.planSha256 !== planSha256) throw Error('ATTEMPT_PLAN_MISMATCH');
  if (!fs.existsSync(result)) return 'UNKNOWN_AFTER_ATTEMPT';
  const row = read(result);
  if (row.id !== cell.id || row.promptSha256 !== cell.promptSha256 ||
      row.draftSha256 !== cell.draftSha256 || row.sourceSha256 !== cell.sourceSha256 ||
      !['GENERATED', 'FAILED', 'INCOMPLETE'].includes(row.status) ||
      (row.status !== 'FAILED' && (typeof row.text !== 'string' ||
        createHash('sha256').update(row.text).digest('hex') !== row.textSha256))) {
    throw Error('CHECKPOINT_MISMATCH');
  }
  return row.status;
}

function summary(plan, directory) {
  const rows = plan.cells.map(({ prompt, ...cell }) => {
    const status = state(cell, directory, plan.planSha256);
    const file = path.join(directory, cell.id + '.result.json');
    if (!fs.existsSync(file)) return { ...cell, status };
    const { text, ...receipt } = read(file);
    return receipt;
  });
  return { schema: 'ksgt.r926.repeat-summary.v1', cohortKind: plan.cohortKind,
    planSha256: plan.planSha256, cells: rows };
}

async function execute(plan, directory, { resume = false, invoke } = {}) {
  verifyPlan(plan);
  const pending = path.join(directory, 'plan.json');
  if (!resume) {
    fs.mkdirSync(directory, { mode: 0o700 });
    writeNew(pending, plan);
  } else {
    const recorded = read(pending);
    verifyPlan(recorded);
    if (recorded.planSha256 !== plan.planSha256) throw Error('RUN_PLAN_MISMATCH');
  }
  const notStarted = plan.cells.filter((cell) => state(cell, directory, plan.planSha256) === 'NOT_STARTED');
  await run(notStarted, {
    invoke,
    before: ({ id, promptSha256 }) => writeNew(path.join(directory, id + '.attempt.json'),
      { id, promptSha256, planSha256: plan.planSha256 }),
    record: (row) => writeNew(path.join(directory, row.id + '.result.json'), row),
  });
  return summary(plan, directory);
}

async function main([mode, ...args]) {
  const fixture = (name) => read(path.join(__dirname, 'fixtures', name));
  if (mode === '--freeze-historical' && args.length === 3) {
    const [archive, notes, output] = args;
    writeNew(output, freezeHistorical(fixture(COHORT), read(archive), read(notes)));
    return;
  }
  if (mode === '--plan-public' && args.length === 0) {
    const { cells, ...plan } = freezePublic(fixture(PUBLIC_PROBES));
    console.log(JSON.stringify({ ...plan, cells: cells.map(({ prompt, ...cell }) => cell) }, null, 2));
    return;
  }
  if (!['--execute', '--resume', '--execute-public'].includes(mode) || args.length !== 2) {
    throw Error('USAGE: --freeze-historical ARCHIVE NOTES PLAN | --plan-public | --execute PLAN OUTPUT_DIR | --resume PLAN OUTPUT_DIR | --execute-public OUTPUT_DIR SUMMARY');
  }
  const isPublic = mode === '--execute-public';
  const plan = isPublic ? freezePublic(fixture(PUBLIC_PROBES)) : read(args[0]);
  const directory = isPublic ? args[0] : args[1];
  resolveProvider('groq');
  const result = await execute(plan, directory, { resume: mode === '--resume' });
  if (isPublic) writeNew(args[1], result);
  console.log(JSON.stringify({ cohortKind: result.cohortKind, planned: result.cells.length,
    recordedAttempts: result.cells.filter(({ status }) => status !== 'NOT_STARTED').length,
    complete: result.cells.filter(({ status }) => status === 'GENERATED').length }));
  if (result.cells.some(({ status }) => status !== 'GENERATED')) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { freezeHistorical, freezePublic, verifyPlan, execute };
