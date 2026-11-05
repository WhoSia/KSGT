"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {audit,parseCsv,COLUMNS}=require("./r9_kolla_packet_audit_v01.cjs");
const fake=(x="R2ay-001")=>[x,"0","1","a".repeat(64),"R2_LOCAL_MULTI","0","아침에 갔어요.","아침에 갔어요.","오늘 아침에 갔어요."];
function csv(...rows){return "\uFEFF"+COLUMNS.join(",")+"\n"+rows.map(r=>r.map(x=>/[",\r\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x).join(",")).join("\n")+"\n";}
test("audit separates human observed reference from candidate",()=>{const a=audit(csv(fake()));assert.equal(a.rows,1);assert.equal(a.visibleHumanCorrectionIdenticalToSource,1);assert.equal(a.candidateIdenticalToVisibleReference,0);assert.equal(a.claims.semanticGold,false);assert.equal(a.claims.nativeReaderPreference,false);assert.equal(a.sourceWorkIndependentN,"UNKNOWN_NOT_72")});
test("CSV parser safely supports quoted comma and doubled quotes",()=>{const a=fake();a[6]='안녕, "한국어"';const p=parseCsv(csv(a));assert.equal(p[1][6],a[6]);assert.equal(audit(csv(a)).rows,1)});
test("duplicate reference challenge cannot be double counted",()=>{const a=fake(),b=fake();b[3]="b".repeat(64);assert.throws(()=>audit(csv(a,b)),/CHALLENGE_DUPLICATE/)});
test("identical row sha across independent IDs blocked",()=>{const a=fake(),b=fake("R2ay-002");assert.throws(()=>audit(csv(a,b)),/SOURCE_ROW_HASH_DUPLICATE/)});
test("garbled row rejected",()=>{assert.throws(()=>audit(csv(["oops"])),/CSV_FIELD_COUNT/)});
test("schema mismatch rejected",()=>{assert.throws(()=>audit("x,y,z\n1,2,3\n"),/CSV_HEADER_SCHEMA_MISMATCH/)});
test("unclosed quotes fail closed",()=>{assert.throws(()=>parseCsv('a,"b'),/UNTERMINATED_QUOTE/)});
test("invalid row hash rejected",()=>{const a=fake();a[3]="nohash";assert.throws(()=>audit(csv(a)),/SOURCE_SHA_FORMAT/)});
test("both KoLLA packet correction fields are HUMAN references",()=>{const x=audit(csv(fake()));assert.equal(x.candidateRole,"EXISTING_HUMAN_HIDDEN_ANNOTATOR_REFERENCE_NOT_MODEL_OUTPUT");assert.equal(x.visibleReferenceRole,"EXISTING_HUMAN_OPPOSITE_ANNOTATOR_REFERENCE")});
test("synthetic test is not native preference measurement",()=>{const a=audit(csv(fake()));assert.equal(a.claims.modelComparisonWin,false)});
