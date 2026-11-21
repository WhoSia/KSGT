"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createHash}=require("node:crypto");
const r=require("./r4a_full_prose_selection_v01.cjs");
const hash=s=>createHash("sha256").update(typeof s==="string"?s:JSON.stringify(s)).digest("hex");
function inTemp(fn) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r4a-"));
  return Promise.resolve().then(()=>fn(dir)).finally(()=>fs.rmSync(dir,{recursive:true,force:true}));
}
function fakeRunner(){
  const history=[];
  async function exec(plan,dir){
    fs.mkdirSync(dir,{mode:0o700});
    const planHash=r.receiptPlanHash(plan),rows=[];
    for(const cell of plan){
      const w=r.raw.works.find(x=>x.id===cell.sourceWork);
      const phase=dir.split(path.sep).at(-1);
      let text;
      if(phase==="writers"){
        text="이 글의 확인된 내용은 "+w.facts[0]+
          (cell.condition==="rich"?" 추가 위험 문구.":"");
      }else if(phase==="audits"){
        const isRisk=cell.condition==="audit_rich";
        text=JSON.stringify(isRisk?{status:"RISK",risks:[{
          kind:"OTHER",outputQuote:"추가 위험 문구.",sourceFactIndex:1,sourceQuote:w.facts[0]
        }]}:{status:"CLEAR",risks:[]});
      }else if(phase==="chooser"){
        text=JSON.stringify({choice:"rich",reason:"테스트 대조군으로 B를 선택한다."});
      }else throw Error("bad mock phase "+phase);
      const response={id:cell.id,sourceWork:cell.sourceWork,condition:cell.condition,
        promptSha256:cell.promptSha256,outcome:"GENERATED",text,
        textSha256:hash(text),finishReason:"stop",
        usage:{prompt_tokens:11,completion_tokens:7,total_tokens:18},
        responseModel:"FAKE_NOT_PROVIDER",latencyMs:1};
      fs.writeFileSync(path.join(dir,cell.id+".attempt.json"),JSON.stringify({
        id:cell.id,promptSha256:cell.promptSha256,planHash
      }));
      fs.writeFileSync(path.join(dir,cell.id+".result.json"),JSON.stringify(response));
      rows.push(response);history.push(cell.id);
    }
    const summary={settings:{provider:"groq",model:"MOCK"},planHash,rows};
    fs.writeFileSync(path.join(dir,"summary.json"),JSON.stringify(summary));
    return summary;
  }
  return {exec,history};
}
test("R4a has twelve NEW author-authored complete-text tasks, balanced four genres",()=>{
  assert.equal(r.validateFixture(),r.raw);
  assert.equal(r.raw.works.length,12);
  assert.deepEqual(r.raw.works.map(w=>w.genre).reduce((o,g)=>(o[g]=(o[g]||0)+1,o),{}),
    {chat:3,science:3,notice:3,scene:3});
  const known=new Set(require("../g10-p1/fixtures/r934_reader_cohort_v01.json").map(x=>x.id));
  const r2=require("./fixtures/r2_attribution_8works_40cases_v01.json");
  r2.works.forEach(w=>known.add(w.id));
  assert.ok(r.raw.works.every(w=>!known.has(w.id)));
  assert.ok(r.raw.works.filter(w=>w.genre==="scene").every(w=>w.license.length>20));
});
test("writer prompts preserve exactly the same source facts and do not leak reader answer keys",()=>{
  const plan=r.buildWriterPlan();
  assert.equal(plan.length,24);
  assert.equal(new Set(plan.map(x=>x.id)).size,24);
  for(const w of r.raw.works){
    const cells=plan.filter(x=>x.sourceWork===w.id);
    assert.deepEqual(new Set(cells.map(c=>c.condition)),new Set(["direct","rich"]));
    const a=JSON.parse(cells[0].prompt[1].content);
    const b=JSON.parse(cells[1].prompt[1].content);
    assert.deepEqual(a.sourceFacts,w.facts);
    assert.deepEqual(b.sourceFacts,w.facts);
    assert.ok(!cells.some(c=>c.prompt[1].content.includes(w.readerQuestion)||
      c.prompt[1].content.includes(w.answer)));
    assert.equal(cells.filter(c=>c.condition==="rich").length,1);
    assert.equal(cells.every(c=>c.promptSha256===hash(c.prompt)),true);
  }
});
test("candidate ordering counterbalances first-provider response arms",()=>{
  const p=r.buildWriterPlan();
  for(let i=0;i<12;i++)assert.equal(p[i*2].condition,i%2?"rich":"direct");
});
test("literal unique spans check exact candidate/source bytes without inventing entailment",()=>{
  assert.deepEqual(r.uniqueSpan("A B C","B"),[2,3]);
  assert.equal(r.uniqueSpan("B B","B"),null);
  assert.equal(r.uniqueSpan("ABC","A B"),null);
  assert.equal(r.uniqueSpan("ABC"," A"),null);
});
test("strict source+output audit risks reject hallucinated spans and malformed JSON",()=>{
  const w=r.raw.works[0],candidate="검사 대상을 설명한다. 다른 의무를 추가했다.";
  const good={status:"RISK",risks:[{kind:"OBLIGATION_EXPANSION",
    outputQuote:"다른 의무를 추가했다.",sourceFactIndex:1,sourceQuote:w.facts[0]}]};
  const parsed=r.parseAudit(JSON.stringify(good),w,candidate);
  assert.equal(parsed.valid,true);
  assert.deepEqual(parsed.risks[0].outputSpan,
    [candidate.indexOf("다른 의무를 추가했다."),candidate.length]);
  assert.equal(r.parseAudit(JSON.stringify({...good,status:"CLEAR"}),w,candidate).reason,"BAD_AUDIT_SCHEMA");
  assert.equal(r.parseAudit(JSON.stringify({...good,risks:[{...good.risks[0],outputQuote:"없는 말"}]}),w,candidate).reason,
    "UNANCHORED_RISK_EVIDENCE");
  assert.equal(r.parseAudit(JSON.stringify({...good,risks:[{...good.risks[0],sourceFactIndex:999}]}),w,candidate).reason,
    "BAD_AUDIT_RISK");
  assert.equal(r.parseAudit("이것은 JSON이 아니다",w,candidate).reason,"NON_JSON");
  assert.equal(r.parseAudit('{"status":"UNCERTAIN","risks":[]}',w,candidate).valid,true);
});
test("selector abstains on uncertain model evidence instead of upgrading it to source fact",()=>{
  const clean={valid:true,status:"CLEAR",risks:[]};
  const uncertain={valid:true,status:"UNCERTAIN",risks:[]};
  const risk={valid:true,status:"RISK",risks:[{}]};
  assert.deepEqual([r.controller({direct:clean,rich:risk}).choice,
    r.controller({direct:risk,rich:clean}).choice],["direct","rich"]);
  assert.equal(r.controller({direct:clean,rich:clean}).status,"TIE_KEEP_DIRECT");
  assert.equal(r.controller({direct:uncertain,rich:clean}).status,"ABSTAIN_KEEP_DIRECT");
  assert.equal(r.controller({direct:{valid:false},rich:clean}).status,"ABSTAIN_KEEP_DIRECT");
});
test("state-as-text chooser cannot silently rewrite or append a third candidate",()=>{
  assert.deepEqual(r.parseChoice('{"choice":"direct","reason":"원천 제약"}'),
    {valid:true,choice:"direct",reason:"원천 제약"});
  assert.equal(r.parseChoice('{"choice":"draft3","reason":"좋음"}').reason,"BAD_CHOICE_SCHEMA");
  assert.equal(r.parseChoice('{"choice":"rich","reason":"좋음","rewritten":"새로 쓴 문장"}').reason,
    "BAD_CHOICE_SCHEMA");
  assert.equal(r.parseChoice("choice=rich").reason,"NON_JSON");
});
test("new workflow creates the full 24+24+12 calls and records condition identities",async()=>{
  await inTemp(async dir=>{
    const out=path.join(dir,"new-run"),fake=fakeRunner();
    const score=await r.run(out,{exec:fake.exec});
    assert.equal(fake.history.length,60);
    assert.equal(score.providerAttempts,60);
    assert.equal(score.successfulCalls,60);
    assert.equal(score.sourceWorks,12);
    assert.equal(score.validAuditPairs,12);
    assert.equal(score.controllerChoseRich,0);
    assert.equal(score.textChoseRich,12);
    assert.equal(score.selectionsAgree,0);
    assert.equal(score.independentReaderRatings,0);
    assert.equal(score.totalTokens,1080);
    assert.equal(score.byArmTokens.direct,216);
    assert.equal(score.byArmTokens.chooser,216);
    assert.ok(score.rows.every(x=>x.executable.choice==="direct"&&x.stateAsText.choice==="rich"));
    assert.throws(()=>r.score(path.join(dir,"does-not-exist")));
    await assert.rejects(()=>r.run(out,{exec:fake.exec}),/REFUSE_EXISTING_R4A_OUTPUT/);
  });
});
test("altering original provider text after a completed run must fail before scoring",async()=>{
  await inTemp(async dir=>{
    const out=path.join(dir,"run");
    await r.run(out,{exec:fakeRunner().exec});
    const id=r.raw.works[0].id+"_direct";
    const name=path.join(out,"writers",id+".result.json");
    const result=JSON.parse(fs.readFileSync(name,"utf8"));
    result.text+="changed";
    fs.writeFileSync(name,JSON.stringify(result));
    assert.throws(()=>r.score(out),/RESPONSE_BYTES_OR_USAGE_MISMATCH/);
  });
});
test("missing model receipt or changed prompt SHA invalidates both selector branches",async()=>{
  await inTemp(async dir=>{
    const out=path.join(dir,"run");
    await r.run(out,{exec:fakeRunner().exec});
    const first=r.raw.works[0].id+"_audit_direct";
    fs.unlinkSync(path.join(out,"audits",first+".attempt.json"));
    assert.throws(()=>r.score(out),/INCOMPLETE_OR_EXTRA_PHASE_RECEIPTS/);
  });
});
