"use strict";
// The Python export contract is also checked by the native G10 JS test suite.
// This avoids accidental publication of private model/arm mapping.
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"multiseed_reader_packets_v01.py"),"utf8");
test("reader booklet generator uses cryptographically opaque pair IDs",()=>{
 assert.ok(source.includes("secrets.token_hex"));
 assert.ok(source.includes("SystemRandom"));
});
test("public booklet text excludes model and arm metadata by schema",()=>{
 const line=source.match(/booklets\[i\]\["pairs"\]\.append\(dict\(([^\n]+)\)\)/);
 assert.ok(line);
 assert.ok(!line[1].includes("model="));
 assert.ok(!line[1].includes("A_arm="));
});
test("private mapping exists outside public packet directory",()=>{
 assert.ok(source.includes("folder.parent"));
 assert.ok(source.includes("_PRIVATE_MAPPING.json"));
});
