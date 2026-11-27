'use strict';
const test=require('node:test'),a=require('node:assert/strict'),{apply}=require('./r6r_patch.cjs');const E=(before,after,reason='수정')=>({before,after,reason});const J=(...edits)=>JSON.stringify({edits});
test('exact nonoverlapping replacements; original gaps retained',()=>{const r=apply('가나다\n\n라마바',J(E('마','모'),E('나','너')));a.equal(r.text,'가너다\n\n라모바');a.equal(r.covered,2)});
test('KEEP and deletion',()=>{a.equal(apply('가나',J()).kind,'KEEP');a.equal(apply('가나',J(E('나',''))).text,'가')});
test('reject absent, repeated, overlapping or no-op anchors',()=>{for(const [d,j] of [['가가',J(E('가','나'))],['가나',J(E('다','라'))],['가나다',J(E('가나','가'),E('나다','다'))],['가',J(E('가','가'))],['가',J(E('가',''))],['가','bad']])a.throws(()=>apply(d,j))});
test('UTF-16 anchor coordinates, codepoint coverage',()=>{const r=apply('😀가나',J(E('😀가','나')));a.equal(r.text,'나나');a.equal(r.covered,2)});
