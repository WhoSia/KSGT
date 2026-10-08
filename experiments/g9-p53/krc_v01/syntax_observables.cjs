"use strict";
const fs=require("node:fs");
const p=require("./syntax_observables_preseal.json");
const source=require("../natural_writing_pilot_briefs.json");
const lex=["기능한다","역할을 수행한다","이러한","결국","따라서","특히","또한","그러나","그렇지만","다만"];
const initials=/^\s*(?:그러나|그렇지만|따라서|이러한|결국|특히|또한|다만)/u;
function observe(d){
 if(typeof d.text!=="string")return {id:d.id,brief:d.brief,arm:d.arm,status:"NO_TEXT"};
 const sentences=d.text.trim().replace(/\n+/gu," ").split(/(?<=[.!?。！？])\s+/u).filter(Boolean);
 const paragraphs=d.text.trim().split(/\n\s*\n/u).filter(Boolean);
 const lens=sentences.map(s=>s.length);
 const avg=lens.reduce((a,b)=>a+b,0)/Math.max(1,lens.length);
 const variance=lens.reduce((a,b)=>a+(b-avg)**2,0)/Math.max(1,lens.length);
 const starts=sentences.map(s=>s.trim().split(/\s+/u).slice(0,3).join(" "));
 const repeated_adjacent=starts.slice(1).filter((s,i)=>s&&s===starts[i]).length;
 const endings={da:0,yo:0,seumnida:0,other:0};
 for(const s of sentences){
  const z=s.replace(/[.!?。！？'""\s]+$/gu,"");
  if(/습니다$/u.test(z))endings.seumnida++;
  else if(/요$/u.test(z))endings.yo++;
  else if(/다$/u.test(z))endings.da++;
  else endings.other++;
 }
 const words=(d.text.match(/[\p{L}\p{M}\p{N}]+/gu)||[]);
 const matched=Object.fromEntries(lex.map(k=>[k,(d.text.split(k).length-1)]));
 const antithesis=(d.text.match(/(?:단순히.{0,25}아니라|.{1,10}[이가] 아니라.{1,18})/gu)||[]);
 return {id:d.id,brief:d.brief,arm:d.arm,status:"MECHANICAL_OBSERVABLE",
  char_count:d.text.length,paragraphs:paragraphs.length,sentences:sentences.length,
  mean_sentence_length:Number(avg.toFixed(2)),sentence_length_variance:Number(variance.toFixed(2)),
  sentence_count_by_paragraph:paragraphs.map(z=>z.split(/(?<=[.!?。！？])\s+/u).filter(Boolean).length),
  ending_profile:endings,discourse_marker_observations:matched,
  connective_sentence_openings:sentences.filter(s=>initials.test(s)).length,
  surface_antithesis_candidate_count:antithesis.length,
  first_three_token_repeat_adjacent:repeated_adjacent,
  surface_type_token_ratio:words.length?Number((new Set(words).size/words.length).toFixed(3)):null,
  interpretation:"DESCRIPTIVE_FEATURE_ONLY_NO_NATURALNESS_JUDGMENT"};
}
function run(raw){
 if(raw.schema!=="ksgt.krc.v0.1.controlled-generation.v1"||raw.documents.length!==18)throw Error("SOURCE_COURT_MISMATCH");
 if(p.status!=="DEFINED_BEFORE_CONTROLLED_MODEL_OUTPUT_READBACK")throw Error("PRESEAL_MISSING");
 const items=raw.documents.map(observe);
 return {schema:"ksgt.krc.v0.1.syntax-observations.v1",units:"PASSAGE",
  documents:items,by_genre:Object.fromEntries(["science_explainer","scene_essay"].map(g=>[g,items.filter(x=>
    source.briefs.find(b=>b.id===x.brief).genre===g).length])),
  lexical_frequency_is_quality:"FALSE",
  meaningfulness:"UNADJUDICATED",
  human_naturalness:"NOT_OBSERVED",
  authority:"DESCRIPTIVE_HISTORICAL_KSGT_SYNTAX_ONLY"};
}
if(require.main===module){
 const [inp,out]=process.argv.slice(2);
 if(!inp||!out)throw Error("USAGE node syntax_observables.cjs input.json output.json");
 const r=run(JSON.parse(fs.readFileSync(inp)));
 fs.writeFileSync(out,JSON.stringify(r,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({count:r.documents.length,genres:r.by_genre,linguistic_truth:r.meaningfulness}));
}
module.exports={run,observe};
