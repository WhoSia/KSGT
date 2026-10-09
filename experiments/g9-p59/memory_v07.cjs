"use strict";
const assert=require("node:assert/strict");
const N=8,D=[0,1,2,4,8,16,32],P=[0,2,5];
function bound(n,m){if(n<2||m<0||!Number.isInteger(n)||!Number.isInteger(m))throw Error("CAPACITY");return Math.min(n,2**m)/n}
function history(target,before,after,n=N){
 if(target<0||target>=n)throw Error("TARGET");
 const events=[];
 for(let i=0;i<before;i++)events.push({id:(i+1)%n,tag:0});
 events.push({id:target,tag:1});
 for(let i=0;i<after;i++)events.push({id:(i+before+1)%n,tag:0});
 return {target,events,before,after,query:"recover tagged group; target not provided in query"};
}
function read(h,method,window=1){
 if(method==="constant")return 0;
 if(method==="overwrite")return h.events.at(-1).id;
 if(method==="gated"){let z=null;for(const x of h.events)if(x.tag)z=x.id;return z}
 if(method==="window")return h.events.slice(-window).findLast(x=>x.tag)?.id??null;
 throw Error("METHOD");
}
function bits(method,window=1,n=N){
 if(method==="constant")return 0;
 return (Math.ceil(Math.log2(n))+1)*(method==="window"?window:1);
}
function run(n=N){
 const methods=[["constant",1],["overwrite",1],["gated",1],["window",1],["window",4],["window",33]];
 const results=methods.map(([method,w])=>{
  let correct=0,total=0;
  for(let t=0;t<n;t++)for(const p of P)for(const d of D){
   const h=history(t,p,d,n);correct+=Number(read(h,method,w)===t);total++;
  }
  return {policy:method==="window"?"window"+w:method,budgetBits:bits(method,w,n),correct,total};
 });
 return results;
}
function exhaustive(n,k){if(n>12||k>n)throw Error("SCOPE");let best=0;for(let e=0;e<k**n;e++){let v=e,s=new Set();for(let i=0;i<n;i++){s.add(v%k);v=Math.floor(v/k)}best=Math.max(best,s.size/n)}return best}
function exhaustive(n,k){
 if(n>10||n<2||k<1||k>n)throw Error("ENUMERATION_SCOPE");
 let best=0;
 for(let enc=0;enc<k**n;enc++){
  let x=enc,codes=new Set();
  for(let j=0;j<n;j++){codes.add(x%k);x=Math.floor(x/k)}
  best=Math.max(best,codes.size/n);
 }
 return best;
}
function histories(){
 const out=[];
 for(let target=0;target<N;target++)for(const before of P)for(const after of D)
  out.push(history(target,before,after));
 return out;
}
function test(){
 const r=run(),by=Object.fromEntries(r.map(x=>[x.policy,x]));
 assert.equal(by.gated.correct,168);
 assert.equal(by.overwrite.correct,42);
 assert.equal(by.window1.correct,24);
 assert.equal(by.window4.correct,72);
 assert.equal(by.window33.correct,168);
 assert.equal(by.constant.correct,21);
 assert.equal(by.gated.budgetBits,by.overwrite.budgetBits);
 assert.equal(by.gated.budgetBits,by.window1.budgetBits);
 assert.ok(by.window33.budgetBits>by.gated.budgetBits);
 assert.equal(bound(8,2),.5);assert.equal(bound(8,3),1);
 assert.equal(exhaustive(5,2),bound(5,1));
 assert.equal(exhaustive(5,2),.4);
 const decoys=h=>h.events.filter(x=>!x.tag).map(x=>x.id);
 assert.deepEqual(decoys(history(0,2,8)),decoys(history(1,2,8)),"TARGET_LEAK_IN_NOISE");
 assert.deepEqual(run(),r);
 console.log(JSON.stringify({test:"PASS",subsection:"P59/v0.7",histories:168,boundN8M2:bound(8,2),policyFixtures:r,authority:"SYNTHETIC_SYMBOLIC_ONLY_NOT_NEURAL_MODELS"}));
}
if(require.main===module){if(process.argv.includes("--emit-histories"))console.log(JSON.stringify({schema:"ksgt.p59.symbolic-histories.v07",histories:histories(),authority:"SYNTHETIC_ONLY"}));else test()}
module.exports={bound,history,read,bits,run,exhaustive,histories,test};
