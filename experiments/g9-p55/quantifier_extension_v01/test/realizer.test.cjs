'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {propose}=require('../realizer.cjs');
const make=(head='하나',form='그중에서',sourceN='두',unit='장')=>({
 prior:[`그림이 있는 엽서 ${sourceN} ${unit}을 놓았다.`],
 target:`${form} ${head}를 골랐다.`,
 writer_policy:'CLARIFY',
 claim:{group_id:'A',quote:`그림이 있는 엽서 ${sourceN} ${unit}`,source_index:-1}
});
for(const form of ['그중','그중에','그중에서','그중에서도','그중에선'])
 test('하나 source-witness candidate '+form,()=>{
  const x=make('하나',form),r=propose(x);
  assert.equal(r.status,'PROPOSAL_ONLY',JSON.stringify(r));
  assert.equal(r.candidates.length,2);
  assert.equal(r.candidates[0].text,x.target);
  assert(r.candidates[1].text.includes(`그림이 있는 엽서 두 장 중${form.slice(2)} 하나를`));
  assert.equal(r.source_witness.selection_count,1);
  assert.equal(r.human_preference,'NOT_COLLECTED');
 });
for(const form of ['그중','그중에','그중에서','그중에서도','그중에선'])
 test('절반 exact even source '+form,()=>{
  const x=make('절반',form,'여섯'),r=propose(x);
  assert.equal(r.status,'PROPOSAL_ONLY',JSON.stringify(r));
  assert(r.candidates[1].text.includes(`엽서 여섯 장 중${form.slice(2)} 절반`));
  assert.equal(r.source_witness.selection_count,3);
 });
test('odd-sized discrete source cannot license exact half',()=>{
 const r=propose(make('절반','그중','세'));
 assert.equal(r.status,'HOLD');assert.equal(r.reason,'ODD_DISCRETE_HALF_NOT_EXACT');assert.equal(r.candidates.length,1);
});
test('even two-person source can name one half only',()=>{
 const r=propose(make('절반','그중에서','두','명'));
 assert.equal(r.source_witness.selection_count,1);
});
test('CONTEXTUAL does not infer writer editing permission',()=>{
 const x=make();x.writer_policy='CONTEXTUAL';const r=propose(x);
 assert.equal(r.status,'HOLD');assert.equal(r.candidates.length,1);
});
test('KEEP supersedes all rewrite candidates',()=>{
 const x=make();x.writer_policy='KEEP';const r=propose(x);
 assert.equal(r.status,'KEEP');assert.equal(r.candidates.length,1);
});
test('absent source quote abstains',()=>{
 const x=make();x.prior=['다른 엽서를 두 장 놓았다.'];const r=propose(x);
 assert.equal(r.status,'HOLD');assert.match(r.reason,/GROUP_QUOTE/);
});
test('duplicate preceding source quote abstains',()=>{
 const x=make();x.prior=[x.prior[0],x.prior[0]];
 assert.equal(propose(x).status,'HOLD');
});
test('percentage is not silently integerized',()=>{
 const x=make();x.target='그중 92%가 참여했다.';const r=propose(x);
 assert.equal(r.status,'HOLD');assert.equal(r.candidates.length,1);
});
test('일부, 하나하나, 절반쯤 stay outside exact finite contract',()=>{
 for(const tail of ['일부를','하나하나를','절반쯤을']){
  const x=make();x.target=`그중 ${tail} 골랐다.`;
  assert.equal(propose(x).status,'HOLD');
 }
});
test('unlicensed counter 컵 does not transfer morphology',()=>{
 const x=make();x.claim.quote='컵 두 컵';x.prior=['컵 두 컵이 있다.'];
 assert.equal(propose(x).status,'HOLD');
});
test('possible continuation in following transcript row abstains',()=>{
 const x=make();x.target='그중 절반은';x.following='다음 날 옮겼다.';
 const r=propose(x);assert.equal(r.status,'HOLD');assert.match(r.reason,/RIGHT_CONTEXT/);
});
test('multiple geujung spans prohibit global rewrite',()=>{
 const x=make();x.target='그중 하나를 고르고 그중 절반도 골랐다.';
 const r=propose(x);assert.equal(r.status,'HOLD');assert.equal(r.candidates.length,1);
});
test('existing typed number+counter baseline remains supported',()=>{
 const x=make();x.target='그중 한 장을 골랐다.';
 const r=propose(x);assert.equal(r.status,'PROPOSAL_ONLY');assert.equal(r.extension,'NONE');
});
test('all proposals are explicitly nonautomatic and unvalidated',()=>{
 const r=propose(make());assert.equal(r.automatic_rewrite,false);
 assert.equal(r.proven_antecedent,false);assert.equal(r.selection,'NONE');
});
