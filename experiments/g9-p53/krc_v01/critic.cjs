"use strict";
/* KRC independent descriptive evidence critic v0.1.
 * NEVER makes semantic validity, naturalness, or comparative quality judgments.
 * Does not import planner/generator, only frozen briefs and outcome JSON. */
const fs=require("node:fs"),crypto=require("node:crypto");
const briefs=require("../natural_writing_pilot_briefs.json");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const facts=new Map(briefs.briefs.map(x=>[x.id,x]));
function splitSentences(text){
 return text.split(/(?<=[.!?。！？])\s+/u).map(s=>s.trim()).filter(Boolean);
}
function describe(doc){
 const b=facts.get(doc.brief);if(!b)throw Error("UNKNOWN_SOURCE_BRIEF");
 if(typeof doc.text!=="string"){
  return {id:doc.id,brief:doc.brief,arm:doc.arm,status:doc.status,
    text_hash:null,mechanical_status:"NO_TEXT",semantic:"NOT_ADJUDICATED",reader:"NOT_OBSERVED",cues:[]};
 }
 const paragraphs=doc.text.split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
 const sent=splitSentences(doc.text);
 const lens=sent.map(x=>x.length),mean=lens.reduce((a,b)=>a+b,0)/Math.max(1,lens.length);
 const variance=lens.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,lens.length);
 const cues=[];
 if(paragraphs.length!==2)cues.push("PARAGRAPH_COUNT_DEVIATION");
 if(doc.text.length<b.target_chars[0]||doc.text.length>b.target_chars[1])cues.push("LENGTH_ENVELOPE_DEVIATION");
 if(/<think>|<\/think>/u.test(doc.text))cues.push("RAW_THINKING_TAG_LEAK");
 if(/^(?:제목:|내용:|다음은|물론입니다)/u.test(doc.text.trim()))cues.push("META_RESPONSE_OPENING");
 // Flags only: underdescribed causes / other human motives are NOT automatic hard failures.
 if(b.genre==="science_explainer"&&/증명되었|원인이 확실|실험으로 입증|오직 햇빛|반드시 때문/u.test(doc.text))
   cues.push("POSSIBLE_UNLICENSED_CAUSAL_CERTAINTY_REVIEW");
 if(b.genre==="scene_essay"&&/기뻐했|슬퍼했|화가 났|아련한|마음이 놓|설레었|위로받|불안했/u.test(doc.text))
   cues.push("POSSIBLE_UNOBSERVED_AFFECT_REVIEW");
 const knownNumerals=new Set((b.facts.join(" ").match(/\d+(?:\.\d+)?/gu)||[]));
 const outputNumerals=new Set((doc.text.match(/\d+(?:\.\d+)?/gu)||[]));
 const novelNumerals=[...outputNumerals].filter(x=>!knownNumerals.has(x));
 if(novelNumerals.length)cues.push("NEW_NUMERICAL_LITERAL_REVIEW");
 const connectives=(doc.text.match(/따라서|그러나|그렇지만|이러한|결국|특히|다만|또한/gu)||[]);
 const artificialContrast=(doc.text.match(/단순히.{0,20}(?:아니라|넘어서)|(?:이|가)\s*아니라/gu)||[]);
 return {id:doc.id,brief:doc.brief,arm:doc.arm,text_hash:sha(doc.text),
  mechanical_status:"DESCRIPTIVE_ONLY",chars:doc.text.length,paragraphs:paragraphs.length,
  sentences:sent.length,mean_sentence_chars:Number(mean.toFixed(2)),
  sentence_length_variance:Number(variance.toFixed(2)),
  connective_markers:connectives.length,surface_antithesis_markers:artificialContrast.length,
  cues,semantic:"NOT_ADJUDICATED",reader:"NOT_OBSERVED",
  evidence_limit:"Regex/numerical flags only: absence of cues is not evidence of factual or pragmatic validity."};
}
function run(raw){
 if(raw.schema!=="ksgt.krc.v0.1.controlled-generation.v1")throw Error("BAD_GENERATION_SCHEMA");
 const ds=raw.documents;
 if(!Array.isArray(ds)||ds.length!==18)throw Error("INCOMPLETE_18_ARM_MATRIX");
 const seen=new Set();
 const model=raw.model.sha256;
 for(const d of ds){
  const k=d.brief+"|"+d.arm;
  if(seen.has(k)||!facts.has(d.brief)||!["B_GENERIC","A_SURFACE_ABLATION","K_TYPED_PLAN"].includes(d.arm))throw Error("INVALID_OR_DUPLICATE_ARM");
  seen.add(k);
  if(d.model_file_sha256!==model)throw Error("CHECKPOINT_DRIFT");
 }
 for(const id of facts.keys()){
  const group=ds.filter(x=>x.brief===id);
  if(group.length!==3||new Set(group.map(x=>x.model_seed)).size!==1)throw Error("INCONSISTENT_BRIEF_SEED");
  if(new Set(group.map(x=>x.prompt_sha256)).size!==3)throw Error("CONDITIONS_NOT_DISTINCT");
 }
 const observations=ds.map(describe);
 const byArm={};
 for(const arm of ["B_GENERIC","A_SURFACE_ABLATION","K_TYPED_PLAN"]){
  const items=observations.filter(x=>x.arm===arm);
  byArm[arm]={n:items.length,complete:items.filter(x=>x.mechanical_status==="DESCRIPTIVE_ONLY").length,
   two_paragraphs:items.filter(x=>x.paragraphs===2).length,
   length_envelope:items.filter(x=>x.chars>=facts.get(x.brief).target_chars[0]&&x.chars<=facts.get(x.brief).target_chars[1]).length,
   heuristically_flagged:items.filter(x=>x.cues.length>0).length};
 }
 return {schema:"ksgt.krc.v0.1.independent-mechanical-audit.v1",
  generation_source_hash:sha(JSON.stringify(raw)),
  process:"INDEPENDENT_OF_GENERATOR_AND_PLAN_IMPLEMENTATIONS",source_facts_hash:sha(JSON.stringify(briefs)),
  observations,summary_by_arm:byArm,
  heuristic_flags_not_proven_violations:true,
  fact_semantic_validity:"NOT_ADJUDICATED",
  natural_korean_readers:"NOT_COLLECTED",K_beats_B:"NOT_DETERMINED",
  aesthetic_reward_model:"NONE",caution:"Do not rank arms using surface counts or number of heuristic warnings."};
}
if(require.main===module){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error("USAGE node critic.cjs input.json output.json");
 const result=run(JSON.parse(fs.readFileSync(input)));
 fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({n:result.observations.length,by_arm:result.summary_by_arm,
  semantics:result.fact_semantic_validity,readers:result.natural_korean_readers}));
}
module.exports={run,describe};
