'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {works,plan,messages,run,verify,MODEL}=require('./r6i_direct_rival.cjs');
const {facts,realize}=require('./r6i_epistemic_realizer.cjs');
test('all nine source states and facts shared with realizer',()=>{assert.equal(plan().length,9);for(const w of works){assert.deepEqual(w.facts,facts(w.state));assert.ok(realize(w.state).chosen.exact);for(const f of w.facts)assert.ok(messages(w,'DIRECT_RICH')[1].content.includes(f))}});
test('mock all nine, cold receipt check and blank-response stop',async()=>{const p=fs.mkdtempSync(path.join(os.tmpdir(),'r6i-'));try{const fake=async()=>({text:'모의 원고',responseModel:MODEL,finishReason:'stop',usage:{total_tokens:10},latencyMs:1});const root=path.join(p,'ok');assert.equal((await run(root,fake)).complete,9);assert.equal(verify(root).complete,9);let n=0;await assert.rejects(run(path.join(p,'fail'),async()=>{n++;return {...await fake(),text:''}}),/INCOMPLETE/);assert.equal(n,1)}finally{fs.rmSync(p,{recursive:true,force:true})}});
