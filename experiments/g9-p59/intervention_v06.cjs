"use strict";
/** KSGT G9-P59 v0.6 — formal intervention oracle, NOT a trained architecture. */
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const sha = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const TOL = 1e-10;
function validateBelief(belief, targetId) {
  if (!belief || typeof belief !== 'object' || Array.isArray(belief)) throw Error('BAD_BELIEF');
  const values = Object.values(belief);
  if (values.length < 2 || values.some(p => !Number.isFinite(p) || p < 0 || p > 1)) throw Error('BAD_PROBABILITY');
  if (Math.abs(values.reduce((a, b) => a + b, 0) - 1) > TOL) throw Error('NOT_NORMALIZED');
  if (!Object.hasOwn(belief, targetId) || belief[targetId] <= 0) throw Error('TARGET_NOT_SUPPORTED');
  return belief;
}
function entropy(belief) {
  return -Object.values(belief).reduce((s,p) => s + (p ? p * Math.log(p) : 0), 0);
}
function targetInformation(belief,targetId) {
  validateBelief(belief,targetId);
  return -Math.log(belief[targetId]);
}
function targetAlignedOracle(belief,targetId,explicitCost=0.4) {
  validateBelief(belief,targetId);
  if (!Number.isFinite(explicitCost) || explicitCost < 0) throw Error('BAD_COST');
  const keepLoss = targetInformation(belief,targetId);
  const explicitLoss = explicitCost;
  const delta = keepLoss - explicitLoss;
  return {choice:Math.abs(delta)<TOL?'TIE':delta>0?'EXPLICIT':'KEEP', keepLoss,explicitLoss,
          threshold:Math.exp(-explicitCost),delta,authority:'HYPOTHETICAL_ORACLE_NOT_HUMAN_GOLD'};
}
function entropyOnlyPolicy(belief,explicitCost=0.4) {
  return entropy(belief) > explicitCost ? 'EXPLICIT' : 'KEEP';
}
function interveneBelief(packet,belief) {
  if (!packet || !packet.meaning || !packet.source || !packet.candidates) throw Error('BAD_PACKET');
  validateBelief(belief,packet.meaning.targetId);
  return {...structuredClone(packet),readerState:{belief:{...belief},authority:'AUTHORED_COUNTERFACTUAL'},
          intervention:'DO_READER_BELIEF_ONLY'};
}
function intendedMessageInvariant(a,b) {
  return sha({source:a.source,meaning:a.meaning,candidates:a.candidates}) ===
         sha({source:b.source,meaning:b.meaning,candidates:b.candidates});
}
function test() {
  const cost=0.4;
  const pHigh={a:0.8,b:0.2},pLow={a:0.2,b:0.8},pTie={a:0.5,b:0.5};
  const rHigh=targetAlignedOracle(pHigh,'a',cost), rLow=targetAlignedOracle(pLow,'a',cost);
  const rTie=targetAlignedOracle(pTie,'a',cost);
  assert.equal(entropy(pHigh),entropy(pLow),'equal entropy counterexample');
  assert.equal(entropyOnlyPolicy(pHigh,cost),entropyOnlyPolicy(pLow,cost));
  assert.equal(rHigh.choice,'KEEP');assert.equal(rLow.choice,'EXPLICIT');
  assert.equal(rTie.choice,'EXPLICIT');
  assert.ok(Math.abs(rLow.delta - (Math.log(1/0.2)-cost))<TOL);
  // Pure renaming must preserve the target-aligned decision.
  assert.equal(targetAlignedOracle({a:0.2,b:0.8},'b',cost).choice,rHigh.choice);
  // Adding an impossible distractor does not change the aligned decision.
  assert.equal(targetAlignedOracle({a:0.8,b:0.2,c:0},'a',cost).choice,rHigh.choice);
  const packet={source:'과학 동아리 학생 12명과 수학 동아리 학생 8명이 발표회에 참가했다.',meaning:{targetId:'a',subsetCount:4},
                candidates:{KEEP:'그중 4명은 발표했다.',EXPLICIT:'과학 동아리 학생 12명 중 4명은 발표했다.'}};
  const h=interveneBelief(packet,pHigh),l=interveneBelief(packet,pLow);
  assert.ok(intendedMessageInvariant(h,l));
  assert.deepEqual(h.meaning,l.meaning);
  assert.notDeepEqual(h.readerState,l.readerState);
  assert.equal(targetAlignedOracle(h.readerState.belief,h.meaning.targetId).choice,'KEEP');
  assert.equal(targetAlignedOracle(l.readerState.belief,l.meaning.targetId).choice,'EXPLICIT');
  assert.throws(()=>targetAlignedOracle({a:0.5,b:0.4},'a'),/NOT_NORMALIZED/);
  assert.throws(()=>targetAlignedOracle({a:0.1,b:0.9},'c'),/TARGET_NOT_SUPPORTED/);
  assert.throws(()=>targetAlignedOracle({a:0,b:1},'a'),/TARGET_NOT_SUPPORTED/);
  assert.throws(()=>targetAlignedOracle({a:0.5,b:0.5},'a',-1),/BAD_COST/);
  const comparator={surfaceConstant:['KEEP','KEEP'],entropyOnly:[entropyOnlyPolicy(pHigh,cost),entropyOnlyPolicy(pLow,cost)],
   targetAligned:[rHigh.choice,rLow.choice]};
  assert.deepEqual(comparator.targetAligned,['KEEP','EXPLICIT']);
  console.log(JSON.stringify({test:'PASS',stage:'G9-P59',version:'v0.6',cases:3,
   entropyEqual:true,targetAwareDistinguishes:true,sourceMeaningInvariant:true,
   comparator,threshold:Math.exp(-cost),authority:'MATHEMATICAL_TOY_NO_HUMAN_OR_MODEL_RESULTS'}));
}
if(require.main===module)test();
module.exports={validateBelief,entropy,targetInformation,targetAlignedOracle,entropyOnlyPolicy,interveneBelief,intendedMessageInvariant,test};
