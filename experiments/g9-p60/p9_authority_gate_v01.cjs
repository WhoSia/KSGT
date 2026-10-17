'use strict';
// Bounded KSGT P9/P60 authority gate. Not a Korean semantic judge.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const ACTIONS = new Set(['KEEP', 'CONCISE', 'EXPLICIT']);
const PURPOSES = new Set(['SCIENTIFIC_ACCURACY', 'TECHNICAL_CONCISION', 'INFORMATION_PRIORITY', 'LITERARY_VOICE']);
const H = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex');

function adjudicate(record, registry = {}) {
  if (!record || typeof record !== 'object') return {schema: 'SCHEMA_INVALID', reason: 'record'};
  if (!ACTIONS.has(record.action) || !PURPOSES.has(record.task_purpose)) return {schema: 'SCHEMA_INVALID', reason: 'action_or_purpose'};
  if (typeof record.source_work_id !== 'string' || !record.source_work_id.trim() ||
      typeof record.source_text !== 'string' || !record.source_text.trim() ||
      typeof record.candidate_text !== 'string' || !record.candidate_text.trim())
    return {schema: 'SCHEMA_INVALID', reason: 'required_field'};
  const registered = registry[record.locator];
  const provenance = typeof record.locator === 'string' && registered &&
    registered.work_id === record.source_work_id &&
    registered.source_sha256 === H(record.source_text) ? 'LOCAL_REGISTRY_MATCH' : 'PROVENANCE_UNVERIFIED';
  // Pure string equality is a bounded invariant; no general meaning entailment is claimed.
  const changed = record.source_text !== record.candidate_text;
  return {
    schema: 'SCHEMA_VALID',
    provenance,
    semantic: changed ? 'SEMANTIC_UNVERIFIED' : 'IDENTICAL_TEXT_ONLY',
    reader_gain: 'HUMAN_GAIN_NOT_MEASURED',
    action: record.action,
    evidence_authority: 'HOLD',
  };
}

function splitAudit(rows, assignment) {
  if (!Array.isArray(rows) || !rows.length) return {status: 'INSUFFICIENT_INDEPENDENT_WORKS'};
  const works = new Map();
  for (const row of rows) {
    if (!row.source_work_id || !assignment[row.item_id]) return {status: 'INVALID_SPLIT'};
    const split = assignment[row.item_id];
    if (works.has(row.source_work_id) && works.get(row.source_work_id) !== split) return {status: 'WORK_LEAKAGE'};
    works.set(row.source_work_id, split);
  }
  if (works.size < 2) return {status: 'INSUFFICIENT_INDEPENDENT_WORKS'};
  return {status: 'DECLARED_WORKS_DISJOINT_NOT_EXTERNALLY_VERIFIED', declared_works: works.size};
}

function selfTest() {
  const src = '민지가 철수를 도왔다.';
  const base = {item_id:'a',action:'KEEP',task_purpose:'SCIENTIFIC_ACCURACY',source_work_id:'w1',source_text:src,candidate_text:src,locator:'source:1'};
  const reg = {'source:1':{work_id:'w1',source_sha256:H(src)}};
  assert.equal(adjudicate(base,reg).semantic,'IDENTICAL_TEXT_ONLY');
  assert.equal(adjudicate({...base,candidate_text:'철수가 민지를 도왔다.'},reg).semantic,'SEMANTIC_UNVERIFIED');
  assert.equal(adjudicate({...base,locator:'Kang2017:INVENTED'},reg).provenance,'PROVENANCE_UNVERIFIED');
  assert.equal(adjudicate({...base,task_purpose:'FREE_STRING'},reg).schema,'SCHEMA_INVALID');
  assert.equal(adjudicate({...base,action:'HOLD'},reg).schema,'SCHEMA_INVALID');
  assert.equal(adjudicate(base,reg).reader_gain,'HUMAN_GAIN_NOT_MEASURED');
  assert.equal(splitAudit([{item_id:'a',source_work_id:'w1'},{item_id:'b',source_work_id:'w1'}],{a:'train',b:'test'}).status,'WORK_LEAKAGE');
  assert.equal(splitAudit([{item_id:'a',source_work_id:'w1'},{item_id:'b',source_work_id:'w1'}],{a:'train',b:'train'}).status,'INSUFFICIENT_INDEPENDENT_WORKS');
  assert.equal(splitAudit([{item_id:'a',source_work_id:'w1'},{item_id:'b',source_work_id:'w2'}],{a:'train',b:'test'}).status,'DECLARED_WORKS_DISJOINT_NOT_EXTERNALLY_VERIFIED');
  console.log('P9_AUTHORITY_GATE_9_OF_9_PASS');
}
if (require.main === module) selfTest();
module.exports = {adjudicate,splitAudit};
