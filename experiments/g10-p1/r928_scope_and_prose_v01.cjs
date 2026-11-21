'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { run, REVISION_SETTINGS } = require('./r924_anchored_revision_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');

const sha = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
const load = (name) => read(path.join(__dirname, 'fixtures', name));

function render(paragraphs) {
  return paragraphs.map((sentences) => sentences.join(' ')).join('\n\n');
}

function validateParagraphs(paragraphs) {
  if (!Array.isArray(paragraphs) || paragraphs.length !== 3 || paragraphs.some((p) =>
    !Array.isArray(p) || !p.length || p.some((s) => typeof s !== 'string' ||
      !s.trim() || s !== s.trim() || /[\r\n]/.test(s)))) throw Error('INVALID_DRAFT_UNITS');
}

function applyPatch(paragraphs, raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('PATCH_EXPECTED');
  if (parsed.action === 'KEEP' && Object.keys(parsed).length === 1) {
    return { action: 'KEEP', text: render(paragraphs), changed: [] };
  }
  if (parsed.action !== 'PATCH' || Object.keys(parsed).length !== 2 ||
    !Array.isArray(parsed.edits) || parsed.edits.length < 1 || parsed.edits.length > 2) {
    throw Error('INVALID_PATCH_ACTION');
  }
  const changed = new Set();
  const next = paragraphs.map((p) => [...p]);
  for (const edit of parsed.edits) {
    if (!edit || Object.keys(edit).length !== 3 ||
      !Number.isInteger(edit.paragraph) || !Number.isInteger(edit.sentence) ||
      typeof edit.text !== 'string' || !edit.text.trim() ||
      /[\r\n]/.test(edit.text) || edit.text.length > 300 ||
      /[.!?。！？]["'”’)]?\s+\S/u.test(edit.text)) throw Error('INVALID_PATCH_UNIT');
    const { paragraph, sentence, text } = edit;
    const p = paragraph - 1, s = sentence - 1;
    const key = `${paragraph}.${sentence}`;
    if (!next[p]?.[s] || changed.has(key) || next[p][s] === text.trim()) throw Error('INVALID_PATCH_TARGET');
    next[p][s] = text.trim();
    changed.add(key);
  }
  return { action: 'PATCH', text: render(next), changed: [...changed] };
}

function modelPrompt(system, details) {
  return [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(details) }];
}

function prepareRevision(data) {
  if (data.schema !== 'ksgt.r928.selective-revision.v1') throw Error('WRONG_REVISION_FIXTURE');
  return data.works.flatMap(({ id, genre, audience, purpose, facts, clean, target }, index) => {
    validateParagraphs(clean);
    const faulty = clean.map((p) => [...p]);
    const p = target.paragraph - 1, s = target.sentence - 1;
    if (typeof clean[p]?.[s] !== 'string' || target.faulty === clean[p][s]) throw Error('BAD_PLANTED_TARGET');
    faulty[p][s] = target.faulty;
    validateParagraphs(faulty);
    return ['clean', 'faulty'].flatMap((variant, v) => {
      const paragraphs = v ? faulty : clean;
      const draft = render(paragraphs);
      const numbered = paragraphs.map((sentences, pIndex) => sentences.map((text, sIndex) => ({
        paragraph: pIndex + 1, sentence: sIndex + 1, text,
      })));
      const common = { genre, audience, purpose, facts, draft, numbered };
      const orders = (index + v) % 2 ? ['patch', 'rewrite'] : ['rewrite', 'patch'];
      return orders.map((condition) => {
        const instruction = condition === 'rewrite'
          ? '완성된 한국어 본문만 출력한다. 변경할 필요가 없으면 입력 본문을 그대로 반환해도 된다.'
          : 'JSON 객체 하나만 출력한다. 변경이 필요 없으면 {"action":"KEEP"}. 필요한 경우 {"action":"PATCH","edits":[{"paragraph":1,"sentence":1,"text":"대체할 한 문장."}]}처럼 정확한 문단과 문장을 지정한다. 수정은 최대 두 문장이다. 마크다운 코드 울타리를 붙이지 않는다.';
        return { id: `${id}_${variant}_${condition}`, sourceWork: id, variant, condition, paragraphs,
          draftSha256: sha(draft), prompt: modelPrompt('한국어 편집자다. 원천과 초안을 대조한다. 정확한 사실과 그 범위는 보존하고, 원천을 벗어난 내용을 바로잡는다. 자연스럽고 분명하게 쓴다. 초안의 세 문단을 유지한다.', { ...common, instruction }) };
      });
    });
  });
}

function prepareGeneration(data) {
  if (data.schema !== 'ksgt.r928.global-generation.v1') throw Error('WRONG_GENERATION_FIXTURE');
  const policies = ['direct', 'outline', 'reader_state'];
  return data.works.flatMap(({ id, genre, audience, purpose, facts, outline, readerState }, i) =>
    policies.slice(i).concat(policies.slice(0, i)).map((condition) => {
      const payload = { genre, audience, purpose, facts,
        instruction: '독자가 목적을 이룰 수 있도록 한국어로 세 문단을 쓴다. 필요한 정보 순서와 문단 전환을 스스로 구성하고, 문장 호응과 지시 대상을 확인한다. 원천의 확실성 범위를 지킨다. 완성 본문만 출력한다.' };
      if (condition !== 'direct') payload.outline = outline;
      if (condition === 'reader_state') payload.readerState = readerState;
      return { id: `${id}_${condition}`, sourceWork: id, condition,
        prompt: modelPrompt('한국어 산문을 쓴다. 원천에 없는 사건, 조건, 지식, 약속을 추가하지 않는다.', payload) };
    }));
}

function buildPlan() {
  const cells = prepareRevision(load('r928_selective_revision_v01.json')).concat(
    prepareGeneration(load('r928_global_generation_v01.json')));
  if (cells.length !== 21 || new Set(cells.map(({ id }) => id)).size !== 21 ||
    cells.some(({ id }) => !/^R928_[A-Z]+_[a-z_]+$/.test(id))) throw Error('WRONG_R928_PLAN_SIZE');
  return cells.map((cell) => ({ ...cell, promptSha256: sha(cell.prompt) }));
}

async function executePlan(plan, directory, { invoke } = {}) {
  const planHash = sha({ settings: REVISION_SETTINGS, plan });
  fs.mkdirSync(directory, { mode: 0o700 });
  const rows = [];
  await run(plan, {
    invoke,
    before: ({ id, promptSha256 }) => write(path.join(directory, id + '.attempt.json'), { id, promptSha256, planHash }),
    record: ({ paragraphs, ...received }) => {
      let final = null;
      let outcome = received.status;
      if (outcome === 'GENERATED') {
        if (received.condition === 'patch') {
          try {
            final = applyPatch(paragraphs, received.text);
          } catch {
            outcome = 'INVALID_PATCH';
          }
        } else {
          final = { action: received.condition, text: received.text, changed: null };
        }
      }
      const row = { ...received, outcome, final, finalSha256: final && sha(final.text),
        finalParagraphCount: final && final.text.trim().split(/\r?\n[ \t]*\r?\n+/).length };
      write(path.join(directory, row.id + '.result.json'), row);
      const { text, final: finalBody, ...summary } = row;
      rows.push({ ...summary, action: finalBody?.action ?? null, changed: finalBody?.changed ?? null });
    },
  });
  const summary = { settings: REVISION_SETTINGS, planHash, rows };
  write(path.join(directory, 'summary.json'), summary);
  return summary;
}

async function main([mode, directory, ...extra]) {
  if (extra.length || !((mode === '--plan' && !directory) || (mode === '--execute' && directory))) {
    throw Error('USAGE: --plan | --execute OUTPUT_DIR');
  }
  const plan = buildPlan();
  if (mode === '--plan') {
    console.log(JSON.stringify({ settings: REVISION_SETTINGS, planHash: sha({ settings: REVISION_SETTINGS, plan }),
      cells: plan.map(({ prompt, paragraphs, ...identity }) => identity) }, null, 2));
    return;
  }
  resolveProvider('groq');
  const result = await executePlan(plan, directory);
  const accepted = result.rows.filter(({ outcome }) => outcome === 'GENERATED').length;
  console.log(JSON.stringify({ attempted: result.rows.length, accepted, planHash: result.planHash }));
  if (accepted !== plan.length) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = { applyPatch, prepareRevision, prepareGeneration, buildPlan, executePlan, render };
