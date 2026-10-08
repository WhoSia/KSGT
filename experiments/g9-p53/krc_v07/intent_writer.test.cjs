'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {decide}=require('./intent_writer.cjs');
const text='민지는 빨간 컵 두 개를 씻었다. 파란 컵 두 개도 씻었다. 그중 한 컵을 창가로 옮겼다.';
const groups=[{id:'R',kind:'CUP',size:2,accessible:true,quote:'빨간 컵 두 개'},
              {id:'B',kind:'CUP',size:2,accessible:true,quote:'파란 컵 두 개'}];
const query={anaphor:'그중 한 컵',kind:'CUP',count:1,targetGroupId:'B'};
const directive={authorConfirmed:true,objective:'CLARIFY'};
const input={text,groups,query,directive};
const alter=(p)=>({...input,...p});
test('confirmed target and exact source quote license a bounded edit',()=>{
 const r=decide(input);assert.equal(r.status,'EDIT');
 assert.equal(r.text,'민지는 빨간 컵 두 개를 씻었다. 파란 컵 두 개도 씻었다. 파란 컵 두 개 중 한 컵을 창가로 옮겼다.');
 assert.equal(r.author_confirmation,'DECLARED_NOT_AUTHENTICATED');
});
test('an intentional ambiguous reference is kept, not optimized away',()=>{
 const r=decide(alter({directive:{authorConfirmed:true,objective:'PRESERVE_AMBIGUITY'}}));
 assert.equal(r.status,'KEEP');assert.equal(r.text,text);
});
test('missing or unconfirmed author objective abstains',()=>{
 for(const d of [undefined,{authorConfirmed:false,objective:'CLARIFY'}]){
  const r=decide(alter({directive:d}));assert.equal(r.status,'ABSTAIN');assert.equal(r.text,text);
 }
});
test('one candidate group needs no clarification',()=>{
 const r=decide(alter({groups:[groups[1]]}));assert.equal(r.status,'KEEP');
});
test('wrong or inaccessible antecedent cannot be invented',()=>{
 for(const groupSet of [[groups[0]],groups.map(g=>({...g,accessible:false}))]){
  assert.equal(decide(alter({groups:groupSet})).status,'ABSTAIN');
 }
});
test('source quote must be unique and earlier than the anaphor',()=>{
 for(const t of [text+' 파란 컵 두 개', '그중 한 컵을 옮겼다. 파란 컵 두 개', text.replace('파란 컵 두 개','다른 컵 두 개')]){
  assert.equal(decide(alter({text:t})).status,'ABSTAIN');
 }
});
test('two edit spans are not replaced by single implicit choice',()=>{
 assert.equal(decide(alter({text:text+' 그중 한 컵이 더 있었다.'})).status,'ABSTAIN');
});
test('unsupported cardinality or malformed records do not certify references',()=>{
 for(const q of [{...query,count:2},{...query,count:1.5},{...query,anaphor:'그중 세 컵'}]){
  assert.equal(decide(alter({query:q})).status,'ABSTAIN');
 }
 assert.equal(decide(alter({groups:[{...groups[0],size:-1},groups[1]]})).status,'ABSTAIN');
});
test('source quote is never expanded with invented lexical content',()=>{
 const r=decide(input);assert.equal(r.after,'파란 컵 두 개 중 한 컵');
 assert(!r.after.includes('모든'));assert(!r.after.includes('더 먼저'));
});
