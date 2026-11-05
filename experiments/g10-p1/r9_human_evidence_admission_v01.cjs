"use strict";
const crypto = require("node:crypto");
const VALID_LANES = new Set(["HUMAN_ORIGINAL_KOREAN","HUMAN_REWRITE","HUMAN_POSTEDIT","HUMAN_TASK_RATING","SYNTHETIC_DEVELOPMENT"]);
const VALID_GATES = new Set(["ADMIT_TASK_LOCAL","HOLD_SOURCE","HOLD_PROVENANCE","HOLD_RIGHTS","HOLD_SPLIT","REJECT_LEAKAGE"]);
const sha256 = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");
function requiredText(v, label) { if (typeof v !== "string" || !v.trim()) throw Error(label + "_MISSING"); return v; }
function classify(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw Error("ROW_NOT_OBJECT");
  const sourceName = requiredText(row.sourceName, "SOURCE_NAME");
  const lane = requiredText(row.lane, "LANE");
  if (!VALID_LANES.has(lane)) throw Error("UNKNOWN_LANE");
  const canonicalRootId = requiredText(row.canonicalRootId, "ROOT_ID");
  const sourceWorkId = requiredText(row.sourceWorkId, "SOURCE_WORK_ID");
  const sourceEditionId = requiredText(row.sourceEditionId, "SOURCE_EDITION_ID");
  const groupId = requiredText(row.groupId, "GROUP_ID");
  const split = requiredText(row.split, "SPLIT");
  if (!["train","dev","test"].includes(split)) throw Error("INVALID_SPLIT");
  const license = row.license && typeof row.license === "object" ? row.license : {};
  const provenance = row.provenance && typeof row.provenance === "object" ? row.provenance : {};
  const receipt = row.receipt && typeof row.receipt === "object" ? row.receipt : {};
  const claims = row.claims || {};
  if (!["VERIFIED","UNKNOWN","RESTRICTED"].includes(license.status)) throw Error("LICENSE_STATUS_REQUIRED");
  if (!["RAW_BYTES_VERIFIED","METADATA_ONLY","PUBLISHED_RECEIPT_ONLY"].includes(receipt.status)) throw Error("RECEIPT_STATUS_REQUIRED");
  const issues = [];
  if (license.status !== "VERIFIED") issues.push("RIGHTS");
  if (receipt.status !== "RAW_BYTES_VERIFIED") issues.push("RAW_SOURCE");
  if (!/^[a-f0-9]{64}$/.test(receipt.sha256 || "")) issues.push("RAW_SHA256");
  if (provenance.humanOriginVerified !== true && lane !== "SYNTHETIC_DEVELOPMENT") issues.push("HUMAN_PROVENANCE");
  if (provenance.sourceWorkGroupVerified !== true) issues.push("SOURCE_WORK_GROUP_UNVERIFIED");
  if (provenance.aiAssisted === true || provenance.aiAssisted === "UNKNOWN") issues.push("AI_ORIGIN_UNCERTAINTY");
  if (claims.freshNativePreference === true) issues.push("UNAUTHORIZED_PREFERENCE_CLAIM");
  if (claims.humanSemanticGold === true && provenance.independentSemanticAdjudication !== true) issues.push("UNAUTHORIZED_SEMANTIC_GOLD");
  const authority = {
    observedHumanAction: ["HUMAN_REWRITE","HUMAN_POSTEDIT"].includes(lane) && provenance.humanOriginVerified === true,
    originalKoreanUsage: lane === "HUMAN_ORIGINAL_KOREAN" && provenance.originalLanguageKoreanVerified === true,
    nativeL1Verified: provenance.nativeL1Verified === true,
    taskRating: lane === "HUMAN_TASK_RATING" && provenance.humanOriginVerified === true,
    semanticGold: provenance.independentSemanticAdjudication === true && claims.humanSemanticGold === true,
    newOutputPreference: false
  };
  return {sourceName,sourceWorkId,sourceEditionId,groupId,canonicalRootId,split,lane,issues,authority,admitted:issues.length === 0};
}
function audit(rows, opts = {}) {
  if (!Array.isArray(rows)) throw Error("ROWS_NOT_ARRAY");
  if (opts.recruitmentAuthorized === true) throw Error("NO_FRESH_HUMAN_RECRUITMENT");
  const out = [], globalGroups = new Map(), sourceToGroup = new Map();
  for (const row of rows) {
    const result = classify(row);
    const identity = result.canonicalRootId + "\u0000" + result.groupId;
    const splitSeen = globalGroups.get(identity);
    if (splitSeen && splitSeen !== result.split) throw Error("SPLIT_LEAK_GROUP:" + result.groupId);
    globalGroups.set(identity,result.split);
    const work = result.canonicalRootId + "\u0000" + result.sourceWorkId;
    const previous = sourceToGroup.get(work);
    if (previous && previous !== result.groupId) throw Error("WORK_CROSSES_GROUPS:" + result.sourceWorkId);
    sourceToGroup.set(work,result.groupId);
    out.push(result);
  }
  return {policy:"NO_FRESH_RECRUITMENT_DATA_FIRST",total:out.length,admitted:out.filter(x=>x.admitted).length,
    held:out.filter(x=>!x.admitted).length,uniqueWorks:sourceToGroup.size,
    uniqueGroups:globalGroups.size,results:out,
    evidenceHash:sha256(JSON.stringify(out)),modelOutputs:0,newHumanRatings:0};
}
if(require.main === module) {
  const fs = require("node:fs");
  const file = process.argv[2];
  if (!file) {console.error("usage: node r9_human_evidence_admission_v01.cjs <manifest.json>");process.exitCode=2;}
  else {try { const result = audit(JSON.parse(fs.readFileSync(file,"utf8")));process.stdout.write(JSON.stringify(result,null,2)+"\n");if(result.held)process.exitCode=3;} catch(e){console.error("R9_FAIL_CLOSED:"+e.message);process.exitCode=1;}}
}
module.exports = {audit,classify,sha256,VALID_GATES};
