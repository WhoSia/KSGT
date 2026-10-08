"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {sha,assertPreseal,singlePass,applyRecipe,cargoLoss,emitCandidateSet,packetRun}=require("../rival_edit.cjs");
const preseal=require("../rival_edit_preseal.json");

test("frozen operator budget is checked, no dependency on protected packet",()=>{
  assert.doesNotThrow(()=>assertPreseal());
  const changed=structuredClone(preseal);
  changed.candidate_budget.seeds=[1,2,3,4];
  assert.throws(()=>assertPreseal(changed),/PRESEAL_MISMATCH/);
});
test("single-pass avoids cascading complementary paraphrase substitutions",()=>{
  assert.equal(singlePass("하지만 그러나",preseal.frozen_transform_map.connective),"그러나 하지만");
  assert.equal(applyRecipe("하지만 수업에 참여했습니다.","STYLEKQC_GENERIC",0),"그러나 수업에 참여했습니다.");
});
test("KoLLA candidate0 performs orthography only without inventing honorific/ref changes",()=>{
  assert.equal(applyRecipe("몇일 뒤에 할께","KOLLA_K2_GENERIC",0),"며칠 뒤에 할게");
  assert.equal(applyRecipe("비가 와요","KOLLA_K1_HARD_CARGO",0),"비가 와요");
  assert.equal(applyRecipe("오늘 할수 있다","KOLLA_K2_GENERIC",1),"오늘 할 수 있다");
});
test("stable four attempts; candidate0 is not best-of-four",()=>{
  const source="오늘 몇일 뒤에 할께?";
  const item={item_id:"P50-KOLLA_K1_HARD_CARGO-01",lane:"KOLLA_K1_HARD_CARGO",
    source,source_sha256:sha(source),task:"minimal Korean correction",protected_tokens:[]};
  const rows=emitCandidateSet(item);
  assert.equal(rows.length,4);
  assert.deepEqual(rows.map(a=>a.index),[0,1,2,3]);
  assert.deepEqual(rows.map(a=>a.seed),[5101,5102,5103,5104]);
  assert.equal(rows[0].candidate,"오늘 며칠 뒤에 할게?");
  assert.equal(rows[1].candidate,"오늘 며칠 뒤에 할게?");
  assert.equal(rows[0].identity,false);
});
test("hard cargo preservation check is one-sided diagnostic, not semantic gold",()=>{
  assert.deepEqual(cargoLoss("9시에 만나요.","9시에 만나요.",[["NUMBER","9"]]),[]);
  const missing=cargoLoss("9시에 만나요.","10시에 만나요.",[["NUMBER","9"]]);
  assert.equal(missing[0].missing,1);
  assert.equal(missing[0].kind,"NUMBER");
});
test("source packet cannot be substituted with synthetic PIA data",()=>{
  const row={item_id:"P50-STYLEKQC_GENERIC-01",lane:"STYLEKQC_GENERIC",
    source:"하지만 갑니다",source_sha256:sha("하지만 갑니다"),
    task:"meaning-preserving Korean paraphrase",protected_tokens:[]};
  assert.equal(emitCandidateSet(row).length,4);
  assert.throws(()=>packetRun(Buffer.from(JSON.stringify(row)+"\n")) ,/SOURCE_PACKET_SHA_MISMATCH/);
});
test("unknown source lane, spurious protected tokens, or unsealed task fail",()=>{
  const src="하지만 갑니다";
  const row={item_id:"P50-STYLEKQC_GENERIC-01",lane:"STYLEKQC_GENERIC",source:src,
    source_sha256:sha(src),task:"minimal Korean correction",protected_tokens:[]};
  assert.throws(()=>emitCandidateSet(row),/SOURCE_PACKET_INTEGRITY/);
  row.task="meaning-preserving Korean paraphrase";row.protected_tokens=[["X","123"]];
  assert.throws(()=>emitCandidateSet(row),/PROTECTED_TOKEN_INVALID/);
});
