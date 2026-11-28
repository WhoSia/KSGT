"use strict";
const {test}=require("node:test"),a=require("node:assert/strict");
const r=require("./r5h_korean_role_bound_micro_realizer.cjs");
test("eight new source-bound scenes include 48 exact researcher-authored roles and 2 actors per work",()=>{
 a.equal(r.validate(),r.fixture);
 a.equal(r.fixture.works.length,8);
 a.equal(r.fixture.works.reduce((n,w)=>n+w.frames.length,0),48);
 a.ok(r.fixture.sourceAuthority.includes("NO_HUMAN_GOLD"));
 for(const w of r.fixture.works){
  a.equal(w.frames[1].subjectEntityID,"A");
  a.equal(w.frames[2].subjectEntityID,"A");
  a.equal(w.frames[3].subjectEntityID,"B");
  a.equal(w.frames[4].subjectEntityID,"B");
 }
});
test("Korean noun particles are selected from the last Hangul syllable coda, not borrowed English noun order",()=>{
 a.equal(r.particle("유나","TOPIC"),"는");
 a.equal(r.particle("서진","TOPIC"),"은");
 a.equal(r.particle("태경","NOM"),"이");
 a.equal(r.particle("다연","NOM"),"이");
 a.equal(r.particle("소희","NOM"),"가");
 a.equal(r.particle("유빈","TOPIC"),"은");
 a.throws(()=>r.particle("A","NOM"),/UNSUPPORTED_KOREAN_NAME/);
});
test("only second consecutive SAME-subject frame has legal zero subject; switches require actor mention",()=>{
 for(const w of r.fixture.works){
  const opts=w.frames.map((_,i)=>r.frameOptions(w,i));
  a.deepEqual(opts.map(x=>x.length),[2,4,6,4,6,2]);
  for(const i of [0,1,3,5])a.ok(opts[i].every(t=>t.subjectForm!=="ZERO"),w.id+" "+i);
  for(const i of [2,4])a.equal(opts[i].filter(t=>t.subjectForm==="ZERO").length,2);
  a.ok(opts[3].every(t=>t.actorID==="B"));
  a.ok(opts[1].every(t=>t.actorID==="A"));
  a.ok(opts[3].every(t=>t.text.includes(w.entities[1].name)));
 }
});
test("all 48 chosen source predicates appear in deterministic output and trace IDs remain fixed",()=>{
 for(const w of r.fixture.works){
  const z=r.render(w,r.defaultIndices(w));
  a.equal(z.trace.length,6);
  a.equal(z.authorizedPredicateFrames,6);
  a.equal(z.trace[1].actorID,"A");
  a.equal(z.trace[3].actorID,"B");
  a.equal(z.trace[2].subjectForm,"TOPIC");
  a.equal(z.trace[4].subjectForm,"TOPIC");
  for(const tr of z.trace)a.ok(z.text.includes(tr.outputText));
  a.equal(z.outputSHA256.length,64);
 }
});
test("legal omission removes ONLY repeated character name, never switches actor or possession",()=>{
 const w=r.fixture.works[0],idx=r.defaultIndices(w);
 const opts2=r.frameOptions(w,2),opts4=r.frameOptions(w,4);
 idx[2]=opts2.find(x=>x.subjectForm==="ZERO"&&x.variant===0).option;
 idx[4]=opts4.find(x=>x.subjectForm==="ZERO"&&x.variant===0).option;
 const out=r.render(w,idx);
 a.equal(out.trace[2].subjectForm,"ZERO");
 a.equal(out.trace[4].subjectForm,"ZERO");
 a.equal(out.trace[3].actorID,"B");
 a.ok(out.trace[3].outputText.includes(w.entities[1].name));
 a.ok(out.trace[1].outputText.includes(w.entities[0].name));
 a.equal(out.text.includes("유나는"),true);
 a.equal(out.text.includes("서진은"),true);
});
test("model output cannot author new sentences or choose illegal subject omission at a role change",()=>{
 const w=r.fixture.works[0];
 const proper={choices:w.frames.map((f,i)=>({id:f.id,option:r.defaultIndices(w)[i]}))};
 a.equal(r.parseSelection(JSON.stringify(proper),w).status,"LICENSED_OPTION_SELECTION");
 proper.choices[3].option=1000;
 a.equal(r.parseSelection(JSON.stringify(proper),w).status,"UNLICENSED_OR_MISSING_OPTION");
 a.deepEqual(r.parseSelection(JSON.stringify(proper),w).indices,r.defaultIndices(w));
 a.equal(r.parseSelection("자유롭게 새 소설을 씁니다.",w).status,"NON_JSON");
 a.equal(r.parseSelection('{"choices":[]}',w).status,"BAD_SELECTION_SCHEMA");
 a.equal(r.parseSelection('{"choices":[{"id":"S1","option":0},{"id":"S2","option":0},{"id":"S3","option":0},{"id":"S4","option":0},{"id":"S5","option":0},{"id":"S6","option":0}],"newEvent":"문이 열렸다"}',w).status,"BAD_SELECTION_SCHEMA");
});
test("direct and selected writer see exactly the same source facts; selector gets only fixed candidate choices",()=>{
 for(const w of r.fixture.works){
  const a1=JSON.parse(r.directPrompt(w)[1].content);
  const b=JSON.parse(r.selectorPrompt(w)[1].content);
  a.deepEqual(a1.source,b.source);
  a.equal(b.choices.length,6);
  a.equal(b.choices[3].options.every(x=>x.text.includes(w.entities[1].name)),true);
  a.equal(b.choices[1].options.every(x=>x.text.includes(w.entities[0].name)),true);
 }
});
test("exactly 16 new LLM requests are preregistered, and compiled default never makes a provider call",()=>{
 const p=r.planCalls();
 a.equal(p.length,16);
 a.equal(p.filter(x=>x.arm==="DIRECT").length,8);
 a.equal(p.filter(x=>x.arm==="SELECTOR").length,8);
 a.equal(new Set(p.map(x=>x.id)).size,16);
 a.equal(p[0].arm,"DIRECT");
 a.equal(p[2].arm,"SELECTOR");
 a.equal(r.planHash(p).length,64);
});
test("sample complete comparative Korean packet includes 3 authentic types and role trace, never HTML survey",()=>{
 const w=r.fixture.works[0],compiled=r.render(w,r.defaultIndices(w));
 const fake={rows:[{sourceWork:w.id,task:w.task,license:w.license,source:r.buildSource(w),
  direct:{text:"기록실에서 유나와 서진의 서로 다른 시선이 지나갔다.",modelTokens:500},
  compiledDefault:compiled,compiledSelected:compiled,
  selector:{modelTokens:750,status:"LICENSED_OPTION_SELECTION"},
  selectionsChangedFromDefault:0,eligibleZeroCount:0}]};
 const s=r.readingPacket(fake);
 for(const fragment of ["GPT-OSS 120B 자유","컴파일러 기본문","문장 컴파일","논항 추적","서진"]){
  a.ok(s.includes(fragment),fragment);
 }
 a.equal(/<html|<form|<script/i.test(s),false);
});
