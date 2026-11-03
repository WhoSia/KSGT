"use strict";
/** v0.3 source surface diagnostic: suspicious NUMBER mentions only.
 * NEVER claim this is semantic factuality or a NLI model.
 */
const {validate}=require("./discourse_plan_v02.cjs");
const RX=/(?<![\p{L}\p{N}])\d+(?:[.,]\d+)*(?:\s*(?:년|월|일|시|분|초|개|명|원|%|℃|°C|kg|g|cm|mm|mL|L|배))?/gu;
function surfaceNumbers(text){
 if(typeof text!=="string")throw Error("TEXT_REQUIRED");
 const found=[];for(const m of text.matchAll(RX))found.push(m[0].replace(/\s+/g,"").normalize("NFKC"));
 return [...new Set(found)];
}
function audit(task,text){
 validate(task);
 const source=[...task.facts,...task.uncertainties].join("\n");
 const allowed=surfaceNumbers(source);
 const produced=surfaceNumbers(text);
 const extraneous=produced.filter(n=>!allowed.includes(n));
 const missing=allowed.filter(n=>!produced.includes(n));
 return {schema:"ksgt.g10.p1.numeric-surface-audit.v01",sourceId:task.id,
  sourceNumericStrings:allowed,outputNumericStrings:produced,
  unlicensedSurfaceCandidates:extraneous,unmentionedSourceNumericStrings:missing,
  epistemicStatus:"DIAGNOSTIC_ONLY_NOT_SEMANTIC_JUDGMENT",
  caution:"Reformatting, expressions in Korean words, ranges and legitimate derived facts can fool exact matching. Review with source context."
 };
}
module.exports={surfaceNumbers,audit};
