const assert = require("node:assert/strict");
const test = require("node:test");
const contract = require("../../source_conditioned_entry_court.json");
const {prepareSourceEntry,sealCandidatePool,assertFrozenPairedArms} = require("../dist/entry.js");

const source = {
  sourceId: "PIA_FROZEN_TEST_1",
  text: "오늘 시험은 오전 9시에 시작한다.",
  frozenTaskInstruction: "원래 의미를 유지하면서 문장을 다듬기",
  frozenPacketSha256: "a060600028c0726ca67d368ec37aed38c39b6961f29d0653a5ef71b10b341fa7",
  permitsNoOp: false
};
const tokens = (s) => Array.from(s).length;

test("frozen prompt is exactly assembled and candidate policy is fixed", () => {
  const entry = prepareSourceEntry(contract,source,tokens);
  assert.equal(entry.kind,"READY");
  const expected=contract.serialized_primary_route.template
    .replace("{FROZEN_TASK_INSTRUCTION}",source.frozenTaskInstruction)
    .replace("{SOURCE_TEXT}",source.text);
  assert.equal(entry.prompt,expected);
  assert.equal(entry.maxNewTokens,256);
  assert.deepEqual(entry.attempts.map(a=>a.seed),[20261007,20261008,20261009,20261010]);
});
test("source is never silently truncated and input anomalies stay typed", () => {
  const large = prepareSourceEntry(contract,source,()=>769);
  assert.equal(large.kind,"HOLD");
  assert.equal(large.reason,"SOURCE_TOO_LONG");
  assert.equal(large.promptTokens,769);
  const empty=prepareSourceEntry(contract,{...source,text:"   "},tokens);
  assert.equal(empty.reason,"SOURCE_EMPTY");
  const collision=prepareSourceEntry(contract,{...source,text:"가【수정문】나"},tokens);
  assert.equal(collision.reason,"SOURCE_DELIMITER_COLLISION");
});
test("injected placeholders in task text cannot change source interpolation", () => {
  const task="{SOURCE_TEXT} 뒤의 문자열도 요구사항 데이터";
  const e=prepareSourceEntry(contract,{...source,frozenTaskInstruction:task},tokens);
  assert.equal(e.kind,"READY");
  assert.ok(e.prompt.includes(task));
  assert.ok(e.prompt.includes(source.text));
});
test("four attempt receipts preserve no-op/duplicates without PIA scoring", () => {
  const e=prepareSourceEntry(contract,source,tokens);
  assert.equal(e.kind,"READY");
  const text=[source.text,source.text,"시험은 오늘 오전 9시에 시작한다.","오늘 시험은 9시에 시작합니다."];
  const attempts=text.map((v,i)=>({index:i,seed:e.attempts[i].seed,generatedTokens:12,stopReason:"EOS",rawCandidateText:v}));
  const pool=sealCandidatePool(source,e,"S0_final",attempts);
  assert.equal(pool.primaryCandidate,source.text);
  assert.deepEqual(pool.identityFlags,[true,true,false,false]);
  assert.equal(pool.uniqueNonemptyCandidateCount,3);
  assert.equal(pool.rawAttempts.length,4);
  assert.equal(pool.authority,"TRANSPORT_ONLY_NOT_PIA_CLASSIFICATION");
  assert.throws(()=>sealCandidatePool(source,e,"S0_final",attempts.slice(0,3)));
  assert.throws(()=>sealCandidatePool(source,e,"S0_final",attempts.toReversed()));
});
test("any candidate substitution invalidates paired U/K court",()=>{
  const same={proposerFamily:"SLM_AR",checkpointId:"S0_final",sourceId:source.sourceId,candidateSetSha256:"frozen-hash",candidateBudget:4};
  assert.doesNotThrow(()=>assertFrozenPairedArms({...same,arm:"U"},{...same,arm:"K"}));
  assert.throws(()=>assertFrozenPairedArms({...same,arm:"U"},{...same,candidateSetSha256:"altered",arm:"K"}),/substitution/);
  assert.throws(()=>assertFrozenPairedArms({...same,arm:"U"},{...same,checkpointId:"S1_final",arm:"K"}),/substitution/);
});
test("post-preseal sampling drift is rejected",()=>{
  const broken=structuredClone(contract);
  broken.candidate_generation.sampling.temperature=0.7;
  assert.throws(()=>prepareSourceEntry(broken,source,tokens),/Sampling policy/);
});
