"use strict";
/**
 * Prospective R5 unit-of-analysis planner. This is a split manifest utility,
 * not a sampling method, human evaluator, or independent-source proof.
 * All fingerprints and parent IDs are supplied, never inferred from titles.
 */
const {createHash}=require("node:crypto");
const hex64=/^[a-f0-9]{64}$/;
function insist(ok,code){if(!ok)throw Error(code);}
function sha256(x){return createHash("sha256").update(String(x)).digest("hex");}
function planDisjointSplit(rows,options={}){
 insist(Array.isArray(rows),"ROWS_NOT_ARRAY");
 const {salt,exposedParents=[],exposedFingerprints=[],evalFraction=0.35,minimumEvalWorks=24}=options;
 insist(typeof salt==="string"&&salt.length>=8,"SALT_REQUIRED_PRECOMMITTED");
 insist(Number.isFinite(evalFraction)&&evalFraction>0&&evalFraction<1,"BAD_EVAL_FRACTION");
 insist(Number.isInteger(minimumEvalWorks)&&minimumEvalWorks>=1,"BAD_MINIMUM");
 insist(Array.isArray(exposedParents)&&Array.isArray(exposedFingerprints),"BAD_EXPOSURE_SET");
 const exposed=new Set(exposedParents),exposedHashes=new Set(exposedFingerprints);
 insist(exposed.size===exposedParents.length&&exposedHashes.size===exposedFingerprints.length,"DUPLICATED_EXPOSURE");
 insist([...exposedHashes].every(v=>hex64.test(v)),"BAD_EXPOSURE_FINGERPRINT");
 const byId=new Set(),byFingerprint=new Map(),byParent=new Map();
 for(const row of rows){
  insist(row&&typeof row==="object","BAD_ROW");
  for(const field of ["source_id","source_parent_id","genre"]){
   insist(typeof row[field]==="string"&&row[field].trim()===row[field]&&row[field].length>=2,"MISSING_OR_UNTRIMMED_"+field);
  }
  insist(hex64.test(row.source_fingerprint),"MISSING_OR_BAD_FINGERPRINT");
  insist(!byId.has(row.source_id),"DUPLICATE_SOURCE_WORK");
  byId.add(row.source_id);
  const prior=byFingerprint.get(row.source_fingerprint);
  insist(prior===undefined||prior===row.source_parent_id,"FINGERPRINT_PARENT_COLLISION");
  byFingerprint.set(row.source_fingerprint,row.source_parent_id);
  if(!byParent.has(row.source_parent_id))byParent.set(row.source_parent_id,[]);
  byParent.get(row.source_parent_id).push(row);
 }
 const assignment=[];
 for(const [parent,works] of byParent){
  const quarantined=exposed.has(parent)||works.some(w=>exposedHashes.has(w.source_fingerprint));
  const draw=parseInt(sha256(salt+"\0"+parent).slice(0,12),16)/281474976710656;
  const lane=quarantined?"EXPOSED_DEVELOPMENT":draw<evalFraction?"HOLDOUT_RESERVED":"DEVELOPMENT";
  for(const row of works)assignment.push({source_id:row.source_id,source_parent_id:parent,
   source_fingerprint:row.source_fingerprint,genre:row.genre,lane});
 }
 assignment.sort((a,z)=>a.source_id.localeCompare(z.source_id));
 const holdout=assignment.filter(x=>x.lane==="HOLDOUT_RESERVED"),uniqueHoldout=new Set(holdout.map(x=>x.source_parent_id));
 return {schema:"ksgt.r5.source-disjoint-split.v1",assignment,
  sourceWorks:rows.length,uniqueParents:byParent.size,exposedSourceWorks:assignment.filter(x=>x.lane==="EXPOSED_DEVELOPMENT").length,
  heldoutWorks:holdout.length,heldoutParents:uniqueHoldout.size,
  readyForMinimumSize:uniqueHoldout.size>=minimumEvalWorks,
  evidenceAuthority:"RESEARCHER_PROVIDED_IDENTITIES_ONLY_NOT_SEMANTIC_DISJOINTNESS",
  saltCommitmentSha256:sha256(salt),requestedMinimum:minimumEvalWorks};
}
module.exports={planDisjointSplit};
