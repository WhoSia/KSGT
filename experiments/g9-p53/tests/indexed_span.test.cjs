"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {assertPreseal,segment,parse,cargo,evaluate}=require("../indexed_span.cjs");
test("Frozen P53 indexed precommit",()=>{
 assert.doesNotThrow(assertPreseal);
});
test("Lossless token spans preserve Korean, emoji, punctuation and whitespace",()=>{
 const src="그는  어제 학교에 갓다. 😀\n";
 const s=segment(src);
 assert.deepEqual(s.map(x=>x.text),["그는","어제","학교에","갓다",".","😀"]);
 assert.deepEqual(s.map(x=>x.id),[1,2,3,4,5,6]);
 assert.equal(s[3].start,src.indexOf("갓다"));
 assert.equal(src.slice(s[3].start,s[3].end),"갓다");
});
test("Valid correction replaces exact numbered word without changing gaps",()=>{
 const src="그는  어제 학교에 갓다.";
 const got=parse(src,JSON.stringify({edits:[{id:4,replacement:"갔다"}]}));
 assert.equal(got.status,"VALID_INDEXED_EDIT_SEMANTICS_UNKNOWN");
 assert.equal(got.text,"그는  어제 학교에 갔다.");
 assert.equal(got.operations,1);
});
test("Multiple numbered replacements applied from right to left",()=>{
 const src="나는 오늘 학교에 갓다.";
 const x=parse(src,JSON.stringify({edits:[{id:1,replacement:"저는"},{id:4,replacement:"갔다"}]}));
 assert.equal(x.text,"저는 오늘 학교에 갔다.");
});
test("Invalid indices and duplicates are never silently fixed",()=>{
 const src="학교에 갔습니다.";
 assert.equal(parse(src,'{"edits":[{"id":-1,"replacement":"다"}]}').status,"INDEX_OUT_OF_RANGE");
 assert.equal(parse(src,'{"edits":[{"id":999,"replacement":"다"}]}').status,"INDEX_OUT_OF_RANGE");
 assert.equal(parse(src,'{"edits":[{"id":1,"replacement":"학교"},{"id":1,"replacement":"교실"}]}').status,"DUPLICATE_INDEX");
});
test("Bad JSON, extra keys, invalid replacement are typed",()=>{
 const src="학교에 갔습니다.";
 assert.equal(parse(src,'some prose, not JSON').status,"BAD_JSON");
 assert.equal(parse(src,'{"edits":[],"explanation":"x"}').status,"BAD_SCHEMA");
 assert.equal(parse(src,'{"edits":[{"id":"1","replacement":"x"}]}').status,"BAD_SCHEMA");
 assert.equal(parse(src,'{"edits":[{"id":1,"replacement":""}]}').status,"INVALID_REPLACEMENT");
});
test("Identity and whole-source substitution distinguished",()=>{
 assert.equal(parse("가",'{"edits":[]}').status,"IDENTITY");
 assert.equal(parse("가",'{"edits":[{"id":1,"replacement":"나"}]}').status,"WHOLE_SOURCE_REPLACEMENT");
 assert.equal(parse("그는 어제 학교에 갔다.",'{"edits":[{"id":1,"replacement":"그는"}]}').status,"IDENTITY");
});
test("Protected cargo is one-sided diagnostic, not meaning guarantee",()=>{
 const src="회의는 9시에 시작합니다.";
 assert.equal(cargo(src,"회의는 10시에 시작합니다.",[["NUMBER","9"]]),1);
 assert.equal(cargo(src,src,[["NUMBER","9"]]),0);
});
test("Historical source packet cannot become a fresh PIA silently",async()=>{
 await assert.rejects(()=>evaluate(Buffer.from("{}\n"),"http://127.0.0.1:1"),/REGRESSION_PACKET_HASH_MISMATCH/);
});
