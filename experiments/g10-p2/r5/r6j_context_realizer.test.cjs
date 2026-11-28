'use strict';
const test=require('node:test'),a=require('node:assert/strict'),m=require('./r6j_context_realizer.cjs');
test('same candidate pool, complete context cross product',()=>{for(const s of m.scenes){a.equal(m.candidates(s).length,19);for(const c of m.contexts){const r=m.rank(s,c);a.ok(r.chosen.exact);a.ok(r.shortest.exact);a.equal(r.candidates,c.figure?18:9);a.ok(r.focusHit);a.ok(r.figureHit)}}});
test('scope violation never selected; literal-only has no figure',()=>{for(const s of m.scenes){const bad=m.candidates(s).find(x=>!x.exact);for(const c of m.contexts){a.equal(m.admissible(bad,c),false);a.ok(!m.rank(s,c).chosen.text.includes(s.bad))}}});
test('changing focus changes the emitted order without changing fact labels',()=>{for(const s of m.scenes){const x=m.rank(s,m.contexts[0]),y=m.rank(s,m.contexts[1]);a.notEqual(x.chosen.text,y.chosen.text);a.deepEqual(x.chosen.order,['actor','image']);a.deepEqual(y.chosen.order,['image','actor'])}});
test('zero weights reduce to shortest; reject invalid context',()=>{for(const s of m.scenes)for(const c of m.contexts){const r=m.rank(s,c,{focusWeight:0,figureWeight:0});a.equal(r.chosen.text,r.shortest.text)}a.throws(()=>m.rank(m.scenes[0],{focus:'unknown',figure:false}),/BAD_CONTEXT/)});

test('fused clause retains actor introduction and final action, no arbitrary ellipsis',()=>{for(const s of m.scenes){const f=m.candidates(s).filter(c=>c.fused);a.equal(f.length,2);for(const c of f){a.ok(c.text.endsWith(s.fused));a.deepEqual(c.order,['image','actor']);a.ok(c.exact)}}});
