"use strict";
/* KRC v0.4: microgrammar, not a universal Korean parser.
 * Operates on prelicensed Korean constituents and fixed source semantic frames.
 * Construction certificates conserve role-bearing pieces. They are not automatic
 * semantic entailment proofs for natural Korean readers.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const data=require("./fact_frames.json"),constitution=require("./constitution.json");
const morphology=require("./morphology.cjs");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const freeze=()=>{if(constitution.status!=="FROZEN_BEFORE_V04_TESTS"||data.briefs.length!==2)throw Error("FROZEN_CONTRACT_INVALID");};
function fail(code){const e=new Error(code);e.code=code;throw e;}
function permutation(indices,n){
 if(!Array.isArray(indices)||indices.length!==n||indices.some(x=>!Number.isInteger(x)||x<0||x>=n))
  fail("INVALID_CONSTITUENT_ORDER");
 if(new Set(indices).size!==n)fail("REPEATED_OR_DROPPED_CONSTITUENT");
 return true;
}
function frame(briefId,factId){
 const b=data.briefs.find(x=>x.id===briefId);if(!b)fail("UNKNOWN_BRIEF");
 const a=b.atoms.find(x=>x.id===factId);if(!a)fail("UNKNOWN_FACT_ID");
 validate(a);return {brief:b,atom:a};
}
function validate(a){
 if(!/^F[1-5]$/.test(a.id)||![1,2].includes(a.paragraph))fail("INVALID_FACT_TYPE");
 if(!a.semantic||typeof a.semantic.predicate!=="string"||
   !["POS","NEG"].includes(a.semantic.polarity))fail("ILL_TYPED_PREDICATE");
 if(!Array.isArray(a.segments)||a.segments.length<2||
    a.segments.some(s=>typeof s!=="string"||!s.trim()||/\n|\r/u.test(s)))fail("ILL_TYPED_PHRASE");
 if(!Array.isArray(a.orders)||a.orders.length<1)fail("MISSING_LICENSED_LINEARIZATION");
 a.orders.forEach(o=>permutation(o,a.segments.length));
 for(const o of a.orders){
  if(o[o.length-1]!==a.segments.length-1)fail("FINITE_VERB_MUST_BE_LAST");
 }
 for(const obligation of a.case_obligations||[])morphology.verifyInSegments(a,obligation);
 const last=a.segments[a.segments.length-1];
 if(a.semantic.polarity==="NEG"&&!/않|못|없/u.test(last))fail("NEGATION_FORM_NOT_ATTESTED");
 if(a.semantic.polarity==="POS"&&/않|못하지|없었다/u.test(last))fail("POSITIVE_POLARITY_CONTRADICTION");
 if(a.semantic.direction==="HIGHER"&&!/높/u.test(last))fail("HIGHER_COMPARISON_PREDICATE_MISMATCH");
 if(a.semantic.direction==="LOWER"&&!/낮/u.test(last))fail("LOWER_COMPARISON_PREDICATE_MISMATCH");
 return true;
}
function semanticToken(a){return sha(JSON.stringify(a.semantic))}
function surface(briefId,factId,opts={}){
 freeze();
 const {atom}=frame(briefId,factId);
 if(opts.semanticDelta&&Object.keys(opts.semanticDelta).length)fail("UNLICENSED_SEMANTIC_MUTATION");
 if(opts.op==="FLIP_NEGATION"||opts.op==="FLIP_POLARITY")fail("POLARITY_PRESERVATION_VIOLATION");
 if(opts.op==="FLIP_COMPARISON")fail("COMPARISON_DIRECTION_VIOLATION");
 if(opts.op==="INSERT_CAUSE")fail("UNLICENSED_CAUSAL_WARRANT");
 if(opts.op==="DELETE_REFERENT"&&opts.antecedents?.length!==1)fail("UNRECOVERABLE_ELLIPSIS");
 if(opts.op==="DELETE_REFERENT")fail("ELLIPSIS_OPERATION_NOT_PROVEN");
 if(opts.op&&opts.op!=="REORDER")fail("UNKNOWN_CONSTRUCTION_OPERATION");
 const idx=opts.orderIndex??0;
 if(!Number.isInteger(idx)||idx<0||idx>=atom.orders.length)fail("ORDER_NOT_SOURCE_LICENSED");
 const order=atom.orders[idx];
 permutation(order,atom.segments.length);
 const fragments=order.map(i=>atom.segments[i]);
 const sent=fragments.join(" ").replace(/\s+([,，])/gu,"$1")+".";
 return {brief_id:briefId,fact_id:factId,sentence:sent,order_index:idx,
  semantic_record_sha256:semanticToken(atom),
  exact_constituent_set_sha256:sha(JSON.stringify(atom.segments)),
  source_role:atom.role,
  source_paragraph:atom.paragraph,
  proof:{
   type:"FINITE_LICENSED_PERMUTATION",
   subject_to_pragmatic_review:true,
   word_order_permutation:order,
   semantic_object_unchanged:true,
   source_fragments_reused_exactly:true,
   no_new_predicate_lexemes:true,
   source_source_contract:"AUTHOR_ATTESTED_SEGMENTS_NOT_UNIVERSAL_KOREAN_GRAMMAR"
  }};
}
function connective(b,previous,current,mode){
 if(mode==="none")return "";
 if(mode!=="licensed")fail("UNKNOWN_DISCOURSE_MODE");
 const relation=b.edges.find(x=>x.from===previous?.id&&x.to===current.id);
 if(!relation)return "";
 if(relation.causal_warrant)fail("UNPROVEN_CAUSAL_EDGE");
 if(relation.relation==="EPISTEMIC_LIMIT"&&current.role==="LIMITATION"&&relation.connective==="다만")
  return "다만 ";
 fail("UNLICENSED_DISCOURSE_CONNECTIVE");
}
function realize(briefId,variant="canonical",custom={}){
 freeze();
 if(!["canonical","reordered"].includes(variant))fail("UNKNOWN_VARIANT");
 const b=data.briefs.find(x=>x.id===briefId);if(!b)fail("UNKNOWN_BRIEF");
 if(b.atoms.length!==5||new Set(b.atoms.map(a=>a.id)).size!==5)fail("DUPLICATE_FACTS");
 if(b.atoms.some((a,i)=>a.id!=="F"+(i+1)))fail("NONCANONICAL_FACT_ORDER");
 const paragraphs=[[],[]],trace=[],changed=[];
 for(let i=0;i<b.atoms.length;i++){
  const atom=b.atoms[i];
  const ix=variant==="reordered"&&atom.orders.length>1?1:0;
  const result=surface(briefId,atom.id,{orderIndex:ix,...(custom[atom.id]||{})});
  const previous=b.atoms[i-1];
  const prefix=connective(b,previous,atom,variant==="reordered"?"licensed":"none");
  paragraphs[atom.paragraph-1].push(prefix+result.sentence);
  trace.push({id:atom.id,role:atom.role,paragraph:atom.paragraph,
    semantic_sha256:result.semantic_record_sha256,span_sha256:sha(prefix+result.sentence),
    original_constituents_sha256:result.exact_constituent_set_sha256,
    reordered:ix!==0,prefix:prefix.trim(),construction:result.proof.type});
  if(ix!==0)changed.push(atom.id);
 }
 if(paragraphs.some(a=>!a.length))fail("EMPTY_PARAGRAPH");
 const text=paragraphs.map(p=>p.join(" ")).join("\n\n");
 if(/(?:^|\n)\s*(?:제목|목록|인사말|인용부호)\s*[:：]/um.test(text))fail("META_RESPONSE_CANDIDATE");
 return {brief_id:briefId,variant,text,paragraphs:2,atomic_fact_coverage:trace.length,
  changed_surface_order_fact_ids:changed,source_trace:trace,
  exact_role_fragment_custody:true,
  meaning_semantic_record_custody:"STRUCTURALLY_IDENTICAL",
  korean_idiomaticity:"NOT_INDEPENDENTLY_ADJUDICATED",
  limitations:"The compiler only preserves declared roles, segments and ordering. It cannot certify pragmatic equivalence or naturalness."};
}
function court(){
 const documents=data.briefs.flatMap(b=>["canonical","reordered"].map(v=>realize(b.id,v)));
 return {schema:"ksgt.g9.p53.krc.v04.microgrammar-court.v1",
  documents,source_briefs:data.briefs.map(b=>b.id),
  n_outputs:documents.length,
  nonidentical_pairs:data.briefs.map(b=>{
   const a=documents.find(x=>x.brief_id===b.id&&x.variant==="canonical");
   const v=documents.find(x=>x.brief_id===b.id&&x.variant==="reordered");
   return {brief_id:b.id,different:a.text!==v.text,reordered_facts:v.changed_surface_order_fact_ids,
     equal_semantic_frame_hashes:a.source_trace.every((x,i)=>x.semantic_sha256===v.source_trace[i].semantic_sha256)};
  }),
  model_called:false,
  human_reader_quality:"NOT_MEASURED",
  comparison_with_general_LLM:"NOT_ATTEMPTED",
  causal_warrant_claim:"NONE",
  authoritative_result:"FINITE_CONTROLLED_KOREAN_CONSTRUCTION_PROTOTYPE_ONLY"};
}
if(require.main===module){
 const result=court(),out=process.argv[2];
 if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({passages:result.n_outputs,prose_variants:result.nonidentical_pairs,
  semantic:"TOKEN_AND_FRAME_STRUCTURAL_CUSTODY_ONLY",humans:"NONE"}));
}
module.exports={fail,permutation,validate,frame,semanticToken,surface,connective,realize,court};
