const assert = require("node:assert/strict");
const test = require("node:test");
const {createHash} = require("node:crypto");
const sha = (x) => createHash("sha256").update(x,"utf8").digest("hex");
const canonicalContract = require("../../source_conditioned_entry_court.json");
const contract = structuredClone(canonicalContract);
const {prepareSourceEntry,sealCandidatePool,assertFrozenPairedArms} = require("../dist/entry.js");

const source = {
  sourceId: "P50-KOLLA_K1_HARD_CARGO-01",
  text: "오늘 시험은 오전 9시에 시작한다.",
  frozenTaskInstruction: "minimal Korean correction",
  frozenPacketSha256: "a060600028c0726ca67d368ec37aed38c39b6961f29d0653a5ef71b10b341fa7",
  frozenSourceSha256: sha("오늘 시험은 오전 9시에 시작한다."),
  permitsNoOp: false
};
const tokens = (s) => Array.from(s).length;
// A synthetic unit fixture must never be accepted by the canonical 24-item registry.
contract.serialized_primary_route.frozen_source_admission.source_sha256_by_id["P50-KOLLA_K1_HARD_CARGO-01"] = source.frozenSourceSha256;
contract.serialized_primary_route.frozen_source_admission.source_sha256_by_id["P50-STYLEKQC_GENERIC-01"] = source.frozenSourceSha256;

test("frozen prompt is exactly assembled and candidate policy is fixed", () => {
  const entry = prepareSourceEntry(contract,source,tokens,sha);
  assert.equal(entry.kind,"READY");
  const expected=contract.serialized_primary_route.template
    .replace("{FROZEN_TASK_INSTRUCTION}",contract.serialized_primary_route.frozen_task_map[source.frozenTaskInstruction])
    .replace("{SOURCE_TEXT}",source.text);
  assert.equal(entry.prompt,expected);
  assert.equal(entry.maxNewTokens,256);
  assert.deepEqual(entry.attempts.map(a=>a.seed),[20261007,20261008,20261009,20261010]);
});
test("source is never silently truncated and input anomalies stay typed", () => {
  const large = prepareSourceEntry(contract,source,()=>769,sha);
  assert.equal(large.kind,"HOLD");
  assert.equal(large.reason,"SOURCE_TOO_LONG");
  assert.equal(large.promptTokens,769);
  const empty=prepareSourceEntry(contract,{...source,text:"   "},tokens,sha);
  assert.equal(empty.reason,"SOURCE_EMPTY");
  const collision=prepareSourceEntry(contract,{...source,text:"가【수정문】나"},tokens,sha);
  assert.equal(collision.reason,"SOURCE_DELIMITER_COLLISION");
});
test("unrecognized task is held rather than hallucinating a task", () => {
  const e=prepareSourceEntry(contract,{...source,frozenTaskInstruction:"invented task"},tokens,sha);
  assert.equal(e.kind,"HOLD");
  assert.equal(e.reason,"UNKNOWN_FROZEN_TASK");
});
test("both frozen task families resolve to different Korean instructions", () => {
  const a=prepareSourceEntry(contract,source,tokens,sha);
  const b=prepareSourceEntry(contract,{...source,sourceId:"P50-STYLEKQC_GENERIC-01",frozenTaskInstruction:"meaning-preserving Korean paraphrase"},tokens,sha);
  assert.equal(a.kind,"READY");
  assert.equal(b.kind,"READY");
  assert.notEqual(a.prompt,b.prompt);
  assert.ok(b.prompt.includes("표현이 다른 한국어 문장"));
});
test("source placeholder-like text remains source data", () => {
  const raw="문장 {FROZEN_TASK_INSTRUCTION} {SOURCE_TEXT} 그대로";
  const e=prepareSourceEntry(contract,{...source,text:raw,frozenSourceSha256:sha(raw)},tokens,sha);
  assert.equal(e.kind,"READY");
  assert.ok(e.prompt.includes(raw));
});
test("four attempt receipts preserve no-op/duplicates without PIA scoring", () => {
  const e=prepareSourceEntry(contract,source,tokens,sha);
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
  assert.throws(()=>prepareSourceEntry(broken,source,tokens,sha),/Sampling policy/);
});

test("packet identity, lane and source integrity are enforced",()=>{
  assert.equal(prepareSourceEntry(contract,{...source,sourceId:"FAKE"},tokens,sha).reason,"SOURCE_ID_OUT_OF_PACKET");
  assert.equal(prepareSourceEntry(contract,{...source,frozenPacketSha256:"wrong"},tokens,sha).reason,"PACKET_HASH_MISMATCH");
  assert.equal(prepareSourceEntry(contract,{...source,text:"바뀐 원문"},tokens,sha).reason,"SOURCE_CONTENT_HASH_MISMATCH");
  assert.equal(prepareSourceEntry(contract,{...source,permitsNoOp:true},tokens,sha).reason,"NOOP_PERMISSION_CONFLICT");
  assert.equal(prepareSourceEntry(contract,{...source,frozenTaskInstruction:"meaning-preserving Korean paraphrase"},tokens,sha).reason,"TASK_LANE_MISMATCH");
});

test("canonical registry rejects synthetic item text even with valid-looking ID", () => {
  const r=prepareSourceEntry(canonicalContract,source,tokens,sha);
  assert.equal(r.kind,"HOLD");
  assert.equal(r.reason,"SOURCE_ID_HASH_BINDING_MISMATCH");
});
