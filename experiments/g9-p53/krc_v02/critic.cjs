"use strict";
/* KRC v0.2 Evidence Critic (V): isolated from generation, no model call and no reward scalar.
 * It produces typed, local, inspectable defect witnesses; cannot prove Korean meaning.
 */
const source=require("./new_briefs.json");
const C=require("./constitution.json");
const facts=new Map(source.briefs.flatMap(b=>b.facts.map(f=>[b.id+"|"+f.id,{brief:b,...f}])));
const META=/^\s*(?:#{1,6}\s|(?:제목|목록|설명|본문|인사말|첫\s*번째\s*문단|다음은)\s*[:：]|(?:\d+[.)]\s))/u;
const METASTR=/\bF[1-5]\b|<\/?think>|<\/?source>|(?:JSON|원문에\s*따라|요청하신\s*글|위\s*사실)/iu;
const CERTAINTY=/(?:반드시\s*.*때문|(?:원인이|원인은)\s*(?:확실|명백)|증명(?:되었|했다)|완전히\s*입증|오직\s*.*때문|천\s*때문에\s*.*낮)/u;
const EMOTION=/(?:아쉬운\s*마음|감동|행복했|서운했|설레었|기뻐했|슬퍼했|위로받았|구매한\s*책)/u;
const digits=s=>(s.match(/\d+(?:\.\d+)?/gu)||[]);
function inspect(briefId,factId,raw){
 const ctx=facts.get(briefId+"|"+factId);if(!ctx)throw Error("UNLICENSED_FACT_ID");
 const witnesses=[],advisories=[];
 let obj=null;
 if(typeof raw!=="string"||!raw.trim()) witnesses.push({code:"EMPTY_MODEL_REPLY",source_fact_id:factId});
 else {try{obj=JSON.parse(raw)}catch{witnesses.push({code:"INVALID_JSON",source_fact_id:factId});}}
 if(obj!==null){
  if(!obj||Array.isArray(obj)||typeof obj!=="object"||
     Object.keys(obj).sort().join(",")!=="fact_id,sentence"||
     typeof obj.fact_id!=="string"||typeof obj.sentence!=="string")
       witnesses.push({code:"INVALID_RESPONSE_SCHEMA",source_fact_id:factId});
  else if(obj.fact_id!==factId)witnesses.push({code:"FACT_ID_MISMATCH",source_fact_id:factId,actual_id:obj.fact_id.slice(0,12)});
  if(typeof obj.sentence==="string"){
    const s=obj.sentence.trim();
    if(!s||s.length>220||/[\n\r]/u.test(s))witnesses.push({code:"INVALID_CLAUSE_EXTENT",source_fact_id:factId});
    if(META.test(s)||METASTR.test(s))witnesses.push({code:"META_OUTPUT_LEAK",source_fact_id:factId});
    const legal=new Set(digits(ctx.text));
    const invented=digits(s).filter(n=>!legal.has(n));
    if(invented.length)witnesses.push({code:"NOVEL_NUMERIC_LITERAL",source_fact_id:factId,count:invented.length});
    const observed=ctx.anchors.filter(x=>s.includes(x));
    if(observed.length===0)witnesses.push({code:"NO_LICENSED_LEXICAL_ANCHOR",source_fact_id:factId});
    else if(observed.length<ctx.anchors.length)advisories.push({code:"ONLY_PARTIAL_ANCHOR_EVIDENCE",source_fact_id:factId,matched:observed.length,possible:ctx.anchors.length});
    if(briefId==="EX07"&&CERTAINTY.test(s))witnesses.push({code:"OVERCLAIMED_CAUSAL_CERTAINTY",source_fact_id:factId});
    if(briefId==="EX08"&&EMOTION.test(s))witnesses.push({code:"UNSUPPORTED_AFFECT_OR_PURCHASE_CUE",source_fact_id:factId});
    // A lexical signal is never a semantic entailment test.
    if(witnesses.length===0)advisories.push({code:"SEMANTIC_ENTAILMENT_UNVERIFIED",source_fact_id:factId});
  }
 }
 return {status:witnesses.length?"REJECT_WITH_WITNESSES":"MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN",
  fact_id:factId,raw_candidate:raw,witnesses,advisories,
  candidate:typeof obj?.sentence==="string"?obj.sentence.trim():null};
}
function sourceFallback(briefId,factId){
 const f=facts.get(briefId+"|"+factId);if(!f)throw Error("SOURCE_FACT_NOT_FOUND");
 return {clause:f.text,status:"SOURCE_LITERAL_FALLBACK",fact_id:factId,
  source_verbatim:true,semantic_claim:"LITERAL_SOURCE_CUSTODY_ONLY",
  witnesses:[{code:"MODEL_LOCAL_REALIZATION_NOT_ADMITTED",fact_id:factId}]};
}
function assemble(briefId,validatedClauses){
 const brief=source.briefs.find(b=>b.id===briefId);if(!brief)throw Error("BRIEF_NOT_FOUND");
 if(validatedClauses.length!==brief.facts.length)throw Error("WRONG_CLAUSE_CARDINALITY");
 const seen=new Set(),paras=[[],[]];
 for(const c of validatedClauses){
  const f=brief.facts.find(f=>f.id===c.fact_id);
  if(!f||seen.has(c.fact_id)||typeof c.clause!=="string"||!c.clause.trim())throw Error("BAD_CLAUSE_OR_DUPLICATE_FACT");
  seen.add(c.fact_id);
  paras[f.paragraph-1].push(c.clause.trim());
 }
 if(seen.size!==brief.facts.length||paras.some(p=>!p.length))throw Error("FACT_COVERAGE_FAILURE");
 return {brief:briefId,paragraphs:2,text:paras.map(p=>p.join(" ")).join("\n\n"),
  source_fact_coverage:seen.size,
  source_literal_fallbacks:validatedClauses.filter(c=>c.status==="SOURCE_LITERAL_FALLBACK").length,
  model_generated_clauses:validatedClauses.filter(c=>c.status==="MODEL_ACCEPTED_MECHANICALLY").length,
  formal_composition:"TWO_PARAGRAPHS_BY_CONSTRUCTION",
  global_semantic_fidelity:"NOT_ADJUDICATED",naturalness:"NOT_MEASURED"};
}
if(require.main===module){
 const p=inspect("EX07","F4",JSON.stringify({fact_id:"F4",sentence:"20분 뒤 물 온도가 5도 낮았다."}));
 console.log(JSON.stringify({status:p.status,witness_codes:p.witnesses.map(x=>x.code)}));
}
module.exports={inspect,sourceFallback,assemble};
