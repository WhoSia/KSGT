"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {verifyPreseal,compileEdits,missingCargo}=require("../contextual_span.cjs");
test("preseal immutable candidate policy",()=>{
 assert.doesNotThrow(verifyPreseal);
});
test("contextual nonidentity span applies exactly once",()=>{
 const s="그는 어제 학교에 갓다.";
 const got=compileEdits(s,JSON.stringify({edits:[{before:"갓다",after:"갔다"}]}));
 assert.equal(got.text,"그는 어제 학교에 갔다.");
 assert.equal(got.status,"SPANS_APPLIED_SEMANTICS_UNKNOWN");
 assert.equal(got.span_count,1);
});
test("right to left disjoint offset application",()=>{
 const s="나는 오늘 학교에 갓다.";
 const got=compileEdits(s,JSON.stringify({edits:[{before:"나는",after:"저는"},{before:"갓다",after:"갔다"}]}));
 assert.equal(got.text,"저는 오늘 학교에 갔다.");
});
test("false spans, duplicates, overlap never silently repaired",()=>{
 const s="가 나 가 다";
 assert.equal(compileEdits(s,JSON.stringify({edits:[{before:"가",after:"나"}]})).status,"SPAN_NOT_UNIQUE");
 assert.equal(compileEdits(s,JSON.stringify({edits:[{before:"라",after:"마"}]})).status,"SPAN_NOT_UNIQUE");
 assert.equal(compileEdits("오늘은 아주 맑다.",JSON.stringify({edits:[{before:"오늘은",after:"오늘"},{before:"오늘은 아주",after:"오늘 정말"}]})).status,"OVERLAPPING_SPANS");
});
test("whole source substitution and commentary rejected",()=>{
 const s="학교에 갑니다.";
 assert.equal(compileEdits(s,JSON.stringify({edits:[{before:s,after:"학교로 가요."}]})).status,"WHOLE_SOURCE_REPLACEMENT");
 assert.equal(compileEdits(s,"수정합니다. "+JSON.stringify({edits:[]})).status,"MALFORMED_JSON");
 assert.equal(compileEdits(s,'<think>thought</think>{"edits":[]}').status,"REASONING_LEAK");
});
test("identity counted separately from task response",()=>{
 const s="날씨가 좋다.";
 assert.equal(compileEdits(s,'{"edits":[]}').status,"TASK_NONRESPONSE");
 assert.equal(compileEdits(s,JSON.stringify({edits:[{before:"날씨",after:"날씨"}]})).status,"INVALID_SPAN");
});
test("protected numeric cargo diagnostics do not certify meaning",()=>{
 const old="10월 8일 오전 9시",newText="10월 8일 오전 10시";
 const cargo=missingCargo(old,newText,[["NUMBER","9"]]);
 assert.equal(cargo.lost,1);
 const same=missingCargo(old,old,[["NUMBER","9"]]);
 assert.equal(same.lost,0);
});
