'use strict';
const test=require('node:test'),a=require('node:assert/strict'),p=require('./r7c_implicit_prompt.cjs'),w=require('./r7c_implicit_reader.cjs'),{families}=require('./r7b_scope_cases.cjs');
test('16 paired conditions, 4 exposed and 4 fresh',()=>{const x=w.plan();a.equal(x.length,16);a.equal(new Set(x.map(c=>c.id)).size,16);a.equal(x.filter(c=>c.cohort==='EXPOSED_OMISSION').length,8);a.equal(x.filter(c=>c.cohort==='FRESH_DEV').length,8);for(let i=0;i<8;i++)a.equal(x[i*2].sourceSHA,x[i*2+1].sourceSHA);});
test('exposed texts omit only explicit status clause',()=>{for(const f of families){const x=p.stimuli().find(c=>c.id===f.id);a.equal(x.text,f.context);a.equal(x.target,f.target);a.deepEqual(x.parts,f.parts);}});
test('all unknown labels and no answer field in user prompt',()=>{for(const c of w.plan()){a.equal(c.gold,'UNSETTLED');a.ok(!c.messages[1].content.includes('UNSETTLED'));}});
