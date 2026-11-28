"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const r=require("./r5f_korean_human_dialogue_retrieval.cjs");
test("eight distinct tested human dialogue families and fourteen frozen exemplar rows, CC BY-NC attribution",()=>{
 assert.equal(r.CASES.length,8);
 assert.equal(r.DEMOS.length,14);
 assert.equal(new Set(r.CASES.map(c=>c.family)).size,8);
 assert.equal(new Set(r.DEMOS).size,14);
 assert.equal(r.CASES.filter(c=>c.from==="formal"&&c.to==="informal").length,4);
 assert.equal(r.CASES.filter(c=>c.from==="informal"&&c.to==="formal").length,4);
 assert.equal(r.UPSTREAM.gitCommit.length,40);
 assert.equal(r.UPSTREAM.blobSHA1.length,40);
 assert.equal(r.UPSTREAM.license,"CC-BY-NC-4.0");
});
test("pinned source identity must not be replaced by arbitrary synthetic Korean text",()=>{
 const fake=Buffer.from(r.HEADER.join("\t")+"\n안녕하세요\t안녕\n","utf8");
 assert.throws(()=>r.parseUpstream(fake),/UPSTREAM_BLOB_IDENTITY_FAIL/);
});
test("direct and retrieved arms share exactly the five human-written source turns and style target",()=>{
 const item={from:"formal",to:"informal",sourceTurns:["안녕하세요.","어디에 가나요?","도서관에 갑니다.","같이 갈까요?","좋아요."]};
 const base=r.messages(item,null),retrieved=r.messages(item,[{source:"좋은 아침입니다.",target:"좋은 아침이야."}]);
 assert.equal(base[0].content,retrieved[0].content);
 const a=JSON.parse(base[1].content),b=JSON.parse(retrieved[1].content),{otherConversationExamples,...rest}=b;
 assert.deepEqual(rest,a);
 assert.deepEqual(a.originalTurns,item.sourceTurns);
 assert.equal(a.targetRegister,"친한 사이의 자연스러운 반말");
 assert.equal(otherConversationExamples.length,1);
});
test("question-aware retrieval ranks pragmatically similar candidate higher",()=>{
 const item={from:"formal",to:"informal",sourceTurns:["안녕","어때요?","오늘 산책을 가실 건가요?","좋아요","출발해요"]};
 const library=[{index:1,family:10,formal:"저는 밥을 먹었어요.",informal:"나는 밥을 먹었어."},
  {index:2,family:11,formal:"오늘 산책을 가시는 건가요?",informal:"오늘 산책 가는 거야?"},
  {index:3,family:12,formal:"지금 무엇을 하나요?",informal:"지금 뭐 해?"}];
 const hits=r.retrieve(item,library);assert.equal(hits.length,3);assert.equal(hits[0].index,2);
});
test("five-turn JSON generation parses strictly and rejects partial or unsolicited response format",()=>{
 assert.equal(r.readGenerated('{"turns":["안녕","응","그래","알겠어","좋아"]}').status,"FIVE_TURN_JSON");
 assert.equal(r.readGenerated('{"turns":["안녕","응"]}').status,"BAD_FIVE_TURN_SCHEMA");
 assert.equal(r.readGenerated("prefix"+'{"turns":["안녕","응","그래","알겠어","좋아"]}').status,"NON_JSON");
 assert.equal(r.readGenerated('["안녕","응","그래","알겠어","좋아"]').status,"BAD_FIVE_TURN_SCHEMA");
 assert.equal(r.readGenerated('{"turns":["안녕","응","그래","알겠어","좋아"],"score":5}').status,"BAD_FIVE_TURN_SCHEMA");
});
test("reading packet gives whole source, optional imperfect human reference, and both generated Korean dialogues",()=>{
 const fake={rows:[{id:"S",from:"formal",to:"informal",
  originalTurns:["원본 첫 발화","원본 둘","원본 셋","원본 넷","원본 다섯"],
  humanReferenceStyleTurns:["참고 첫 발화","참고 둘","참고 셋","참고 넷","참고 다섯"],
  outputs:{DIRECT:{turns:["직접 생성","직접 2","직접 3","직접 4","직접 5"],status:"FIVE_TURN_JSON",newTotalTokens:120},
   RETRIEVED:{turns:["검색 활용","검색 2","검색 3","검색 4","검색 5"],status:"FIVE_TURN_JSON",newTotalTokens:180}}}]};
 const s=r.makeReadingPacket(fake);
 for(const marker of ["원본 첫 발화","참고 첫 발화","직접 생성","검색 활용","오탈자"]){assert.ok(s.includes(marker),marker)}
 assert.equal(/<html|<form|<script/i.test(s),false);
});
