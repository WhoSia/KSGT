"use strict";
/** R4b.1 post-hoc adapter, applied to PRIOR raw model text only.
 * This is a deterministic whitespace alignment against frozen author-spanned
 * edit targets, NOT a free-form Korean entailment check or new model call.
 */
const fs=require("node:fs"),path=require("node:path");
const {createHash}=require("node:crypto");
const r=require("./r4b_original_text_local_repair.cjs");
const sha=s=>createHash("sha256").update(s).digest("hex");
function align(original,x,proposal){
 if(x.goldStatus!=="ISSUE")return {status:"REJECT_NOT_A_TARGET",output:original};
 if(!proposal||proposal.action!=="PATCH"||
    Object.keys(proposal).sort().join("|")!=="action|after|before"||
    typeof proposal.before!=="string"||typeof proposal.after!=="string"||
    proposal.after.length>350||/[\r\n]/.test(proposal.after))
  return {status:"REJECT_BAD_PROPOSAL",output:original};
 const span=r.unique(original,x.before);
 if(!span)return {status:"REJECT_NOT_UNIQUE_ORIGINAL",output:original};
 // Permit only *leading/trailing* Unicode whitespace discrepancy.
 // Trimmed content must match exactly; all internal bytes must remain identical.
 if(proposal.before.trim()!==x.before.trim()||!x.before.trim()||
    proposal.after===x.before)
  return {status:"REJECT_CONTENT_CHANGED",output:original};
 const output=original.slice(0,span[0])+proposal.after+original.slice(span[1]);
 return {status:proposal.before===x.before?"EXACT_APPLIED_UNVERIFIED":"EDGE_WHITESPACE_ALIGNED_UNVERIFIED",
  output,span,originalSha256:sha(original),newSha256:sha(output),
  unchangedPrefixSha256:sha(original.slice(0,span[0])),
  unchangedSuffixSha256:sha(original.slice(span[1]))};
}
function replay(originalRoot,firstArchiveRoot){
 const orig=r.originals(originalRoot),score=r.score(originalRoot,firstArchiveRoot);
 const xmap=new Map(orig.map(o=>[o.x.id,o]));
 const rows=score.rows.map(row=>{
  const item=xmap.get(row.id);
  if(row.goldStatus!=="ISSUE")return {id:row.id,expectedFlag:"NO_TARGET",
   baseline:row.patch.status,adapter:"KEEP_NO_TARGET",changed:false};
  const raw=JSON.parse(fs.readFileSync(path.join(firstArchiveRoot,row.id+"_patch.result.json"),"utf8"));
  if(raw.status!=="GENERATED"||raw.outcome!=="INVALID_PATCH")
   throw Error("WRONG_ORIGINAL_WRAPPER_PROVENANCE_"+row.id);
  let proposal;try{proposal=JSON.parse(raw.text)}catch{proposal=null}
  const out=align(item.candidate,item.x,proposal);
  return {id:row.id,expectedFlag:"ISSUE",baseline:row.patch.status,
   adapter:out.status,changed:out.output!==item.candidate,
   removedOriginalTarget:!out.output.includes(item.x.before),
   outputText:out.output,outputSha256:sha(out.output)};
 });
 return {schema:"ksgt.g10p2.r4b1.posthoc-edge-alignment.v1",
  authority:"AFTER_READING_REAL_MODEL_REPLIES_NOT_PREREGISTERED_NOT_HUMAN_GOLD",
  firstRun:44895132995,readOnlyRecoveryRun:44895329911,
  providerCallsAdded:0,originalCalls:20,originalStrictApplied:score.modelPatchApplied,
  posthocApplied:rows.filter(x=>x.adapter==="EXACT_APPLIED_UNVERIFIED"||
    x.adapter==="EDGE_WHITESPACE_ALIGNED_UNVERIFIED").length,
  edgeWhitespaceRescues:rows.filter(x=>x.adapter==="EDGE_WHITESPACE_ALIGNED_UNVERIFIED").length,
  targetExactStringRemoved:rows.filter(x=>x.removedOriginalTarget).length,
  baselineRewritesChanged:score.rewriteAltered,
  humanSemanticRatings:0,rows};
}
if(require.main===module){
 const [original,archived,...extra]=process.argv.slice(2);
 if(!original||!archived||extra.length)throw Error("USAGE R4A_ORIGINAL_DIR R4B_FIRST_ARCHIVE_DIR");
 console.log(JSON.stringify(replay(original,archived),null,2));
}
module.exports={align,replay};
