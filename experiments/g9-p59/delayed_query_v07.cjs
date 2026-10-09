"use strict";
/** P59 internal v0.7: future query revealed AFTER a 2-entity memory has been encoded. */
const assert=require("node:assert/strict");
const IDS=8;
function encode(a,b,method){
 if(method==="first")return {a};
 if(method==="last")return {b};
 if(method==="pair")return {a,b};
 throw Error("METHOD");
}
function decode(state,q){
 const value=state[q];
 return value===undefined?0:value;
}
function run(){
 const methods=["first","last","pair"];
 return methods.map(method=>{
  let correct=0,total=0;
  for(let a=0;a<IDS;a++)for(let b=0;b<IDS;b++){
   const s=encode(a,b,method); // Query is unavailable at encoding time.
   for(const q of ["a","b"]){correct+=Number(decode(s,q)===(q==="a"?a:b));total++;}
  }
  return {policy:method,bits:method==="pair"?6:3,correct,total};
 });
}
function test(){
 const r=run(),by=Object.fromEntries(r.map(x=>[x.policy,x]));
 assert.deepEqual(r.map(x=>x.correct),[72,72,128]);
 assert.ok(by.pair.bits>by.first.bits);
 assert.equal(by.first.total,128);
 // Exact simultaneous reconstruction of two independent eight-way refs needs >=6 bits.
 assert.equal(IDS*IDS,64);assert.equal(Math.ceil(Math.log2(64)),6);
 assert.deepEqual(run(),r);
 console.log(JSON.stringify({test:"PASS",subsection:"P59/v0.7",task:"QUERY_BLIND_TWO_ENTITY_RECALL",
  histories:64,queries:128,policies:r,
  caveat:"A future query is revealed only after encoding; source roles are authored symbols"}));
}
if(require.main===module)test();
module.exports={encode,decode,run,test};
