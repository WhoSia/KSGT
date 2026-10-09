"use strict";
/** P59 internal §v0.8: exact deterministic finite-state delayed-query rate-distortion. */
const assert=require("node:assert/strict");
function optimalAccuracy(n,k){
 if(!Number.isSafeInteger(n)||n<2||!Number.isSafeInteger(k)||k<1||k>n*n)throw Error("BAD_DOMAIN");
 const reward=k<=n ? k*(2*n-k)+k : n*n+k;
 return reward/(2*n*n);
}
function codeReward(n,codebook){
 let score=0;
 for(let a=0;a<n;a++)for(let b=0;b<n;b++){
  let best=0;
  for(const [x,y] of codebook){const reward=Number(a===x)+Number(b===y);best=Math.max(best,reward);}
  score+=best;
 }
 return score;
}
function bestByEnumeration(n,k){
 if(n>4||k>3)throw Error("ENUM_SCOPE");
 const pool=Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]);
 let best=-1, selected=[];
 function visit(start){
  if(selected.length===k){best=Math.max(best,codeReward(n,selected));return;}
  for(let i=start;i<=pool.length-(k-selected.length);i++){
   selected.push(pool[i]);visit(i+1);selected.pop();
  }
 }
 visit(0);
 return best/(2*n*n);
}
function baselineFixture(n){
 // Query unknown until after encoding; compare three bit-budget policies.
 const K=n,first=[],last=[],both=[];
 for(let a=0;a<n;a++)for(let b=0;b<n;b++){
  for(const query of [0,1]){
   const truth=query===0?a:b;
   first.push(Number((query===0?a:0)===truth));
   last.push(Number((query===1?b:0)===truth));
   both.push(1);
  }
 }
 return {first:first.reduce((a,b)=>a+b,0),last:last.reduce((a,b)=>a+b,0),both:both.length,total:both.length,K};
}
function test(){
 assert.equal(optimalAccuracy(8,1),1/8);
 assert.equal(optimalAccuracy(8,8),72/128);
 assert.equal(optimalAccuracy(8,64),1);
 assert.equal(optimalAccuracy(8,16),80/128);
 for(const n of [2,3,4])for(let k=1;k<=3;k++){
  if(k>n*n)continue;
  const exhaustive=bestByEnumeration(n,k);
  assert.equal(exhaustive,optimalAccuracy(n,k),`n=${n} k=${k}`);
 }
 const b=baselineFixture(8);
 assert.deepEqual(b,{first:72,last:72,both:128,total:128,K:8});
 assert.throws(()=>optimalAccuracy(8,0),/BAD_DOMAIN/);
 assert.throws(()=>optimalAccuracy(8,65),/BAD_DOMAIN/);
 assert.throws(()=>bestByEnumeration(8,1),/ENUM_SCOPE/);
 console.log(JSON.stringify({test:"PASS",section:"P59/v0.8",n:8,accuracyByStates:[1,2,4,8,16,32,64].map(k=>({states:k,bits:Math.log2(k),accuracy:optimalAccuracy(8,k)})),exhaustiveConfirmed:[2,3,4],baseline:b,authority:"FINITE_UNIFORM_TOY_NOT_TRAINED_TRANSFORMER_OR_SSM"}));
}
if(require.main===module)test();
module.exports={optimalAccuracy,codeReward,bestByEnumeration,baselineFixture,test};
