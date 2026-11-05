'use strict';const test=require('node:test'),a=require('node:assert/strict'),{norm,fingerprint,audit}=require('./r9_ud_hash_bridge_v02.cjs');
const row=(id,text,split='dev')=>({id,split,fnv64:fingerprint(text),normLength:[...norm(text)].length});
test('NFC and whitespace only',()=>{a.equal(fingerprint('가 나.'),fingerprint('가나.'));a.notEqual(fingerprint('갑니다'),fingerprint('옵니다'))});
test('unique two docs remain candidate not proven',()=>{let v=audit(['첫 문장.','둘째 문장.'],[row('KL-fb-1-1','첫 문장.'),row('KL-fb-1-2','둘째 문장.')]);a.equal(v.counts.unique,2);a.equal(v.groupCandidates,1);a.equal(v.sourceWorkVerified,false);a.equal(v.withinGroupPairs,1)});
test('duplicate original surface is ambiguous',()=>{let v=audit(['같은 문장.','같은 문장.'],[row('KL-fi-1-1','같은 문장.')]);a.equal(v.counts.ambiguous,1);a.equal(v.counts.unique,0)});
test('no fuzzy matching',()=>{let v=audit(['다릅니다.'],[row('KL-hb-1-1','다릅니다!')]);a.equal(v.counts.missing,1)});
test('reject duplicate ID and invented groups',()=>{a.throws(()=>audit(['문장.'],[row('KL-hb-1-1','문장.'),row('KL-hb-1-1','문장.')]),/DUPLICATE/);a.throws(()=>audit(['문장.'],[row('KH-A1','문장.')]),/INVALID_UD/)});
test('detect crossing group intervals',()=>{const src=['가.','나.','다.'];const rows=[row('KL-fi-1-1','가.'),row('KL-fi-2-1','나.'),row('KL-fi-1-2','다.')];a.equal(audit(src,rows).interleavings,1)});
test('detect reversed local sentence numbering',()=>{const src=['가.','나.'];a.equal(audit(src,[row('KL-fi-1-2','가.'),row('KL-fi-1-1','나.')]).sequenceInversions,1)});
