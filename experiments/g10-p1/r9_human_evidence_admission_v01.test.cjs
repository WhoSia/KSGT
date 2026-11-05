"use strict";
const test=require("node:test"), assert=require("node:assert/strict");
const {audit,classify,sha256}=require("./r9_human_evidence_admission_v01.cjs");
function row(id="x",split="dev") {return {sourceName:"KoLLA",lane:"HUMAN_REWRITE",canonicalRootId:"KoLLA-v2",
sourceWorkId:"essay-01",sourceEditionId:"essay-01-original",groupId:"essay-01",split,
license:{status:"VERIFIED"},receipt:{status:"RAW_BYTES_VERIFIED",sha256:sha256(id)},
provenance:{humanOriginVerified:true,sourceWorkGroupVerified:true,aiAssisted:false,independentSemanticAdjudication:false},
claims:{freshNativePreference:false,humanSemanticGold:false}};}
test("task-local human action is not semantic gold or preference",()=>{const x=classify(row());assert.equal(x.admitted,true);assert.equal(x.authority.observedHumanAction,true);assert.equal(x.authority.semanticGold,false);assert.equal(x.authority.newOutputPreference,false)});
test("missing source bytes HOLD even when published report is real",()=>{const r=row();r.receipt.status="PUBLISHED_RECEIPT_ONLY";assert.equal(classify(r).admitted,false);assert.ok(classify(r).issues.includes("RAW_SOURCE"))});
test("licensing uncertainty blocks admission",()=>{const r=row();r.license.status="UNKNOWN";assert.ok(classify(r).issues.includes("RIGHTS"))});
test("claimed native fluency never inferred from Korean rewrite",()=>{const x=classify(row());assert.equal(x.authority.nativeL1Verified,false);assert.equal(x.authority.originalKoreanUsage,false)});
test("AI-assisted provenance cannot count as fully independent human record",()=>{const r=row();r.provenance.aiAssisted="UNKNOWN";assert.ok(classify(r).issues.includes("AI_ORIGIN_UNCERTAINTY"))});
test("invented semantic gold blocked",()=>{const r=row();r.claims.humanSemanticGold=true;assert.ok(classify(r).issues.includes("UNAUTHORIZED_SEMANTIC_GOLD"))});
test("invented new output native preference blocked",()=>{const r=row();r.claims.freshNativePreference=true;assert.ok(classify(r).issues.includes("UNAUTHORIZED_PREFERENCE_CLAIM"))});
test("source work cannot move into different groups",()=>{const a=row("a");const b=row("b");b.groupId="essay-02";assert.throws(()=>audit([a,b]),/WORK_CROSSES_GROUPS/)});
test("same group cannot leak between dev and test",()=>{assert.throws(()=>audit([row("a","dev"),row("b","test")]),/SPLIT_LEAK_GROUP/)});
test("different works grouped by human provenance remain a single source group",()=>{const a=row("a"),b=row("b");b.sourceWorkId="essay-02";const x=audit([a,b]);assert.equal(x.uniqueWorks,2);assert.equal(x.uniqueGroups,1);assert.equal(x.total,2)});
test("new recruitment cannot be switched on via options",()=>{assert.throws(()=>audit([],{recruitmentAuthorized:true}),/NO_FRESH_HUMAN_RECRUITMENT/)});
test("invalid source license and lane rejected",()=>{const a=row();a.lane="FAKE_NATIVE_PANEL";assert.throws(()=>classify(a),/UNKNOWN_LANE/);const b=row();b.license.status="PERMISSION_ASSUMED";assert.throws(()=>classify(b),/LICENSE_STATUS_REQUIRED/)});
test("missing essay source group blocks even raw and licensed corpus",()=>{const r=row();r.provenance.sourceWorkGroupVerified=false;assert.ok(classify(r).issues.includes("SOURCE_WORK_GROUP_UNVERIFIED"));assert.equal(classify(r).admitted,false)});
test("empty manifest cannot establish evidence",()=>{const a=audit([]);assert.equal(a.total,0);assert.equal(a.admitted,0);assert.equal(a.newHumanRatings,0)});
