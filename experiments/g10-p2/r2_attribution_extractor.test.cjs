"use strict";
const assert = require("node:assert/strict");
const {test} = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const r = require("./r2_attribution_extractor.cjs");

function withTemp(callback){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ksgt-r2-"));
  try{return callback(dir);}finally{fs.rmSync(dir,{recursive:true,force:true})}
}
test("eight independently authored units contain exactly five status contrasts each",()=>{
  assert.equal(r.validCorpus(),r.cohort);
  assert.equal(r.examples().length,40);
  assert.deepEqual(new Set(r.examples().map(e=>e.genre)),
    new Set(["chat","science","notice","scene"]));
  for(const label of r.GOLD)assert.equal(r.examples().filter(e=>e.gold===label).length,8);
  const malformed=JSON.parse(JSON.stringify(r.cohort));
  malformed.works[0].cases[0].status="QUESTION";
  assert.throws(()=>r.validCorpus(malformed),/INVALID_R2_CASE/);
});
test("balanced two-arm plan has 80 unique fixed prompts without author gold",()=>{
  const p=r.buildPlan();
  assert.equal(p.length,80);
  assert.equal(new Set(p.map(x=>x.id)).size,80);
  assert.equal(p.filter(x=>x.condition==="binary").length,40);
  assert.equal(p.filter(x=>x.condition==="attribution").length,40);
  const ex=r.examples();
  for(let i=0;i<40;i++){
    const [a,b]=p.slice(i*2,i*2+2);
    assert.notEqual(a.condition,b.condition);
    assert.equal(a.sourceWork,b.sourceWork);
    assert.deepEqual(JSON.parse(a.prompt[1].content),JSON.parse(b.prompt[1].content));
    assert.equal(JSON.parse(a.prompt[1].content).실제로_독자가_읽은_문단,ex[i].snippet);
    assert.deepEqual(Object.keys(JSON.parse(a.prompt[1].content)),
      ["검토할_목표_명제","실제로_독자가_읽은_문단"]);
    assert.equal(a.promptSha256.length,64);
    assert.equal(b.promptSha256.length,64);
  }
});
test("requested proposition is never silently inserted into observed text",()=>{
  for(const c of r.buildPlan()){
    const v=JSON.parse(c.prompt[1].content);
    assert.notEqual(v.검토할_목표_명제,v.실제로_독자가_읽은_문단);
    assert.ok(!Object.prototype.hasOwnProperty.call(v,"gold"));
    assert.ok(!Object.prototype.hasOwnProperty.call(v,"status"));
  }
});
test("source quote is a bounded unique substring, not evidence by implication",()=>{
  const t="나래가 문을 열었다고 누군가 말했다. 확인은 하지 못했다.";
  const e="나래가 문을 열었다고 누군가 말했다.";
  assert.deepEqual(r.exactEvidence(t,e),{status:"ANCHORED",span:[0,e.length]});
  assert.equal(r.exactEvidence(t,"문을 잠갔다").status,"NOT_IN_REALIZED_TEXT");
  assert.equal(r.exactEvidence("문 문","문").status,"NONUNIQUE");
  assert.equal(r.exactEvidence(t,"").status,"EMPTY");
  assert.equal(r.exactEvidence(t," 나래가").status,"BAD_FORMAT");
});
test("strict JSON parser refuses undocumented schema, wrapping, wrong witness and no-witness assertion",()=>{
  const snippet="도윤이 종이를 접었다.";
  assert.equal(r.parseStrict('{"status":"ASSERTED","evidence":"도윤이 종이를 접었다."}',"attribution",snippet).valid,true);
  const wrapped="WRAPPER "+JSON.stringify({status:"ASSERTED",evidence:snippet});
  assert.equal(r.parseStrict(wrapped,"attribution",snippet).reason,"NON_JSON");
  assert.equal(r.parseStrict('{"status":"ASSERTED","evidence":"","extra":1}',"attribution",snippet).reason,"BAD_SCHEMA");
  assert.equal(r.parseStrict('{"status":"ASSERTED","evidence":""}',"binary",snippet).reason,"ASSERTED_WITHOUT_WITNESS");
  assert.equal(r.parseStrict('{"status":"ASSERTED","evidence":"없는 문자"}',"attribution",snippet).reason,"UNSUPPORTED_EVIDENCE");
  assert.equal(r.parseStrict('{"status":"ATTRIBUTED","evidence":""}',"attribution",snippet).reason,"MENTION_WITHOUT_WITNESS");
  assert.equal(r.parseStrict('{"status":"QUESTION","evidence":"도윤이 종이를 접었다."}',"binary",snippet).reason,"BAD_SCHEMA");
});
test("exact evidence does not guarantee assertion truth or source semantics",()=>{
  const quote="도윤이 문을 열었다고 주장했다. 그러나 검증되지 않았다.";
  const parsed=r.parseStrict('{"status":"ASSERTED","evidence":"도윤이 문을 열었다고 주장했다."}',"attribution",quote);
  assert.equal(parsed.valid,true);
  assert.equal(parsed.evidenceStatus,"ANCHORED");
});
test("mention and endorsement are not the same reader-state field",()=>{
  assert.deepEqual(r.derivedState("ASSERTED"),{mentioned:true,committed:true,negated:false});
  for(const status of ["DENIED","ATTRIBUTED","QUESTION"]){
    const state=r.derivedState(status);
    assert.equal(state.mentioned,true);
    assert.equal(state.committed,false);
  }
  assert.equal(r.derivedState("ABSENT").mentioned,false);
  assert.equal(r.derivedState("UNKNOWN").committed,null);
});
test("ledger tracks contradictions, reports, absence and uncertainty conservatively",()=>{
  const step=status=>({valid:true,status});
  let state=r.mergeLedger(null,step("ATTRIBUTED"));
  assert.deepEqual([state.mentioned,state.commitment],[true,"UNSET"]);
  state=r.mergeLedger(state,step("ASSERTED"));
  assert.equal(state.commitment,"ASSERTED");
  state=r.mergeLedger(state,step("QUESTION"));
  assert.equal(state.commitment,"ASSERTED");
  state=r.mergeLedger(state,step("DENIED"));
  assert.equal(state.commitment,"CONFLICT");
  state=r.mergeLedger(state,step("ABSENT"));
  assert.equal(state.commitment,"CONFLICT");
  state=r.mergeLedger(state,{valid:false});
  assert.equal(state.unresolved,true);
  assert.equal(state.trail.length,6);
});
test("score verifies every frozen request ID and full 40-case completion",()=>{
  withTemp(root=>{
    const plan=r.buildPlan();
    const planHash=require("../g10-p1/r929_global_writing_v01.cjs").planReceipt(plan).planHash;
    const look=new Map(r.examples().map(ex=>[ex.id,ex]));
    for(const c of plan){
      const caseId=c.id.slice("P2R2_".length,-("_"+c.condition).length);
      const ex=look.get(caseId);
      assert.ok(ex);
      const status=c.condition==="binary"?(ex.gold==="ASSERTED"?"ASSERTED":"NOT_ASSERTED"):ex.gold;
      const evidence=status==="NOT_ASSERTED"||status==="ABSENT"?"":ex.snippet.split(".")[0]+".";
      const text=JSON.stringify({status,evidence});
      fs.writeFileSync(path.join(root,c.id+".attempt.json"),JSON.stringify({id:c.id,promptSha256:c.promptSha256,planHash}));
      const responseSha=require("node:crypto").createHash("sha256").update(text).digest("hex");
      fs.writeFileSync(path.join(root,c.id+".result.json"),JSON.stringify({id:c.id,promptSha256:c.promptSha256,
        outcome:"GENERATED",text,textSha256:responseSha,usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));
    }
    fs.writeFileSync(path.join(root,"summary.json"),JSON.stringify({planHash,rows:plan.map(c=>({id:c.id}))}));
    const scored=r.score(root);
    const a=r.aggregate(scored);
    assert.equal(scored.rows.length,40);
    assert.equal(a.binary.attempts,40);
    assert.equal(a.attribution.correctSubclass,40);
    assert.equal(a.binary.correctAssertion,40);
    assert.equal(a.binary.totalTokens,600);
    const corrupt=path.join(root,plan[0].id+".result.json");
    const data=JSON.parse(fs.readFileSync(corrupt));
    data.promptSha256="wrong";
    fs.writeFileSync(corrupt,JSON.stringify(data));
    assert.throws(()=>r.score(root),/MISMATCHED_REQUEST_RECEIPT/);
  });
});
test("UNKNOWN remains an abstention, not invented certainty",()=>{
  const x=r.parseStrict('{"status":"UNKNOWN","evidence":""}',"attribution","그림을 검토했다.");
  assert.equal(x.valid,true);
  assert.equal(x.status,"UNKNOWN");
  assert.equal(r.derivedState(x.status).mentioned,null);
  assert.equal(r.mergeLedger(null,x).unresolved,true);
});
