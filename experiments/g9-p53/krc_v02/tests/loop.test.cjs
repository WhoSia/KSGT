"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const C=require("../constitution.json"),src=require("../new_briefs.json");
const V=require("../critic.cjs"),G=require("../generator.cjs");
test("prospective game is two-stage and weight-fixed",()=>{
 assert.equal(G.checkFreeze(),true);
 assert.equal(C.runtime.max_attempts,2);
 assert.equal(C.runtime.max_source_slots,10);
 assert.equal(C.evaluations.reader.includes("HOLD"),true);
});
test("critic independently produces numeric, anchor, meta and faithfulness witnesses",()=>{
 const x=V.inspect("EX07","F4",JSON.stringify({fact_id:"F4",sentence:"20분 뒤 온도가 5도 낮았다."}));
 assert.equal(x.status,"REJECT_WITH_WITNESSES");
 assert(x.witnesses.some(w=>w.code==="NOVEL_NUMERIC_LITERAL"));
 const y=V.inspect("EX08","F4",JSON.stringify({fact_id:"F4",sentence:"제목: 점원이 불을 껐다."}));
 assert(y.witnesses.some(w=>w.code==="META_OUTPUT_LEAK"));
 const z=V.inspect("EX08","F4",JSON.stringify({fact_id:"F4",sentence:"점원이 조명을 껐다."}));
 assert.equal(z.status,"MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN");
 assert(z.advisories.some(w=>w.code==="SEMANTIC_ENTAILMENT_UNVERIFIED"));
});
test("source exact fallback is typed and cannot be passed as model accomplishment",()=>{
 const f=V.sourceFallback("EX08","F4");
 assert.equal(f.status,"SOURCE_LITERAL_FALLBACK");
 assert.equal(f.source_verbatim,true);
 assert.equal(f.clause,src.briefs[1].facts[3].text);
 const result=V.assemble("EX08",src.briefs[1].facts.map(f=>V.sourceFallback("EX08",f.id)));
 assert.equal(result.paragraphs,2);
 assert.equal(result.source_literal_fallbacks,5);
 assert.equal(result.global_semantic_fidelity,"NOT_ADJUDICATED");
});
test("missing, duplicate or extra clauses fail before document assembly",()=>{
 const list=src.briefs[0].facts.map(f=>V.sourceFallback("EX07",f.id));
 assert.throws(()=>V.assemble("EX07",list.slice(0,4)),/WRONG_CLAUSE/);
 const bad=[...list];bad[4]={...bad[4],fact_id:"F1"};
 assert.throws(()=>V.assemble("EX07",bad),/DUPLICATE/);
});
test("one witnessed repair and one fallback preserve two source-grounded paragraphs",async()=>{
 const observed=new Map();
 const mock=async(_url,opts)=>{
  const q=JSON.parse(opts.body),content=q.messages[1].content;
  const id=content.match(/이번 출력에서 실현할 사실 번호: (F\d)/)?.[1];
  const brief=content.includes("저녁 여섯 시 무렵 서점")?"EX08":"EX07";
  assert(id&&brief);
  const key=brief+"|"+id;
  const n=observed.get(key)||0;observed.set(key,n+1);
  const atom=src.briefs.find(b=>b.id===brief).facts.find(f=>f.id===id);
  let raw;
  if(brief==="EX08"&&id==="F4"){raw="비정상 JSON";} // exactly two failures, source fallback
  else if(brief==="EX07"&&id==="F4"&&n===0){
   raw=JSON.stringify({fact_id:id,sentence:"20분 뒤 물 온도가 5도 낮았다."});
  }else{
   raw=JSON.stringify({fact_id:id,sentence:atom.text});
  }
  return {ok:true,json:async()=>({choices:[{message:{content:raw},finish_reason:"stop"}],usage:{completion_tokens:26}})};
 };
 const out=await G.run("http://mock",mock);
 assert.equal(out.emitted_docs,2);
 assert.equal(out.expected_slots,10);
 assert.equal(out.attempts,12); // F4 EX07 first failure and EX08 F4 always invalid
 assert.equal(out.revised_slots,2);
 assert.equal(out.source_literal_fallbacks,1);
 assert.equal(out.model_admitted_slots,9);
 assert(out.documents.every(x=>x.paragraphs===2&&x.source_fact_coverage===5));
 assert.equal(out.human_semantic_adjudication,"NOT_PERFORMED");
 assert.equal(out.GAN_training,"NOT_PERFORMED_NO_WEIGHTS_UPDATED");
 const repaired=out.slot_ledger.find(x=>x.brief_id==="EX07"&&x.source_fact_id==="F4");
 assert.equal(repaired.attempts[0].witnesses[0].code,"NOVEL_NUMERIC_LITERAL");
 assert.equal(repaired.attempts[1].status,"MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN");
 const fallback=out.slot_ledger.find(x=>x.brief_id==="EX08"&&x.source_fact_id==="F4");
 assert.equal(fallback.status,"SOURCE_LITERAL_FALLBACK");
});
