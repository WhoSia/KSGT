"use strict";
/* P59 internal §v0.9: interval comparison and synthetic position-bias canaries. */
const assert=require("node:assert/strict");
function validateIntervals(record,axes){
 if(!record||typeof record!=="object")throw Error("BAD_RECORD");
 for(const axis of axes){
  const x=record[axis];
  if(!x)return false;
  if(!Array.isArray(x)||x.length!==2||!x.every(Number.isFinite)||x[0]>x[1])throw Error("BAD_INTERVAL");
 }
 return true;
}
function partialOrder(a,b,axes){
 if(!Array.isArray(axes)||!axes.length||new Set(axes).size!==axes.length)throw Error("BAD_AXES");
 if(!validateIntervals(a,axes)||!validateIntervals(b,axes))
  return {disposition:"HOLD_MISSING_EVIDENCE",humanPreference:"NOT_IDENTIFIED"};
 const guaranteedBetter=axes.filter(j=>a[j][0]>b[j][1]);
 const guaranteedWorse=axes.filter(j=>a[j][1]<b[j][0]);
 const robust=axes.every(j=>a[j][0]>=b[j][1])&&guaranteedBetter.length>0;
 return {disposition:robust?"ROBUST_DOMINANCE_ON_MEASURED_AXES":
   guaranteedWorse.length>0&&guaranteedBetter.length>0?"DEMONSTRATED_TRADEOFF":"INCOMPARABLE_OR_WEAK",
   guaranteedBetter,guaranteedWorse,humanPreference:"NOT_IDENTIFIED",
   scope:"MATHEMATICAL_INTERVAL_EXAMPLE_UNLESS_EXTERNAL_EVIDENCE_VALIDATED"};
}
function judgeOrderAudit(forward,reverse,a,b){
 const winner=(response,left,right)=>{
  if(response==="LEFT")return left;
  if(response==="RIGHT")return right;
  if(response==="TIE")return "TIE";
  throw Error("BAD_JUDGE_RESPONSE");
 };
 const p=winner(forward,a,b),q=winner(reverse,b,a);
 return {orderConsistent:p===q,forwardWinner:p,reversedWinner:q,
   risk:p===q?"NOT_EXCLUDED":"ORDER_INSTABILITY_FLAG",
   humanPreference:"NOT_IDENTIFIED",note:"LLM judge stability is not human calibration"};
}
function test(){
 const axes=["fidelity","readability"];
 const a={fidelity:[4,5],readability:[4,5]},b={fidelity:[2,3],readability:[2,3]};
 assert.equal(partialOrder(a,b,axes).disposition,"ROBUST_DOMINANCE_ON_MEASURED_AXES");
 const opposing={fidelity:[1,2],readability:[5,6]};
 assert.equal(partialOrder(opposing,b,axes).disposition,"DEMONSTRATED_TRADEOFF");
 assert.equal(partialOrder({fidelity:[4,5]},b,axes).disposition,"HOLD_MISSING_EVIDENCE");
 assert.equal(partialOrder({fidelity:[2.5,4],readability:[2.5,4]},b,axes).disposition,"INCOMPARABLE_OR_WEAK");
 assert.throws(()=>partialOrder({fidelity:[5,4],readability:[3,4]},b,axes),/BAD_INTERVAL/);
 assert.equal(judgeOrderAudit("LEFT","RIGHT","A","B").orderConsistent,true);
 assert.equal(judgeOrderAudit("LEFT","LEFT","A","B").risk,"ORDER_INSTABILITY_FLAG");
 assert.equal(judgeOrderAudit("LEFT","RIGHT","A","B").humanPreference,"NOT_IDENTIFIED");
 console.log(JSON.stringify({test:"PASS",subsection:"P59/v0.9",intervalCases:5,judgeOrderCanaries:2,
   uncalibratedJudgesAreNotHumans:true,noScalarQualityScore:true}));
}
if(require.main===module)test();
module.exports={partialOrder,judgeOrderAudit,test};
