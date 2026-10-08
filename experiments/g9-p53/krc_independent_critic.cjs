"use strict";
/* Independent deterministic critic: observations only, not an LLM-as-judge.
   No single total score and no automatic semantic PASS. */
const fs=require("node:fs");
const crypto=require("node:crypto");
const briefData=require("./natural_writing_pilot_briefs.json");
const corpus=require("./krc_six_demonstration_passages.json");
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
function sentenceUnits(text){
  return text.split(/(?<=[.!?])\s+/u).map(s=>s.trim()).filter(Boolean);
}
function critique(doc,brief){
  const s=sentenceUnits(doc.text);
  const paragraphs=doc.text.split(/\n\s*\n/u).filter(Boolean);
  const lens=s.map(x=>x.length);
  const connective=(doc.text.match(/따라서|그러나|그렇지만|이러한|결국|특히|다만/gu)||[]);
  const stems=s.map(x=>x.slice(0,Math.min(x.length,12))).filter(Boolean);
  const repeatedBeginnings=[...new Set(stems.filter((x,i)=>stems.indexOf(x)!==i))];
  const unlicensedCue=[];
  if(doc.brief==="EX04"){
    if(/느껴졌|기억했다|떠올렸|생각보다|분위기|지켜보았|그 사이를 지켜/gu.test(doc.text))
      unlicensedCue.push("UNSUPPORTED_INTERNAL_EXPERIENCE_OR_INFERRED_AFFECT_REVIEW");
    if(/물방울|빗소리|발자국|환하게|모르는|정체/gu.test(doc.text))
      unlicensedCue.push("UNLICENSED_ADDITIONAL_SCENE_DETAIL_REVIEW");
  }
  if(doc.brief==="EX01"){
    if(/증명했|유일한 원인|확실히 햇빛 때문|반드시 햇빛 때문/gu.test(doc.text))
      unlicensedCue.push("UNJUSTIFIED_CAUSAL_ASSERTION_REVIEW");
  }
  const avg=lens.reduce((a,b)=>a+b,0)/Math.max(1,lens.length);
  const variance=lens.reduce((a,b)=>a+(b-avg)*(b-avg),0)/Math.max(1,lens.length);
  return {id:doc.id,brief:brief.id,arm:doc.arm,
    sha256:hash(doc.text),chars:doc.text.length,paragraphs:paragraphs.length,sentences:s.length,
    mean_sentence_chars:Number(avg.toFixed(2)),sentence_char_variance:Number(variance.toFixed(2)),
    connective_occurrences:connective.length,repeated_12char_sentence_openings:repeatedBeginnings.length,
    advisory_cues:unlicensedCue,
    fact_semantic_status:"NOT_ADJUDICATED",naturalness_status:"NOT_ADJUDICATED",
    authority:"MECHANICAL_DESCRIPTION_ONLY_NOT_HUMAN_JUDGMENT"};
}
const briefs=new Map(briefData.briefs.map(x=>[x.id,x]));
function run(){
  if(corpus.documents.length!==6)throw Error("DOCUMENT_COUNT");
  const recs=corpus.documents.map(d=>{
    const b=briefs.get(d.brief);if(!b)throw Error("UNKNOWN_BRIEF");
    return critique(d,b);
  });
  if(new Set(recs.map(x=>x.id)).size!==6)throw Error("DUPLICATE_DOCUMENT");
  const result={schema:"ksgt.g9.p53.krc-independent-mechanical-critic.v1",
    input_status:"NONBLIND_ASSISTANT_DEMONSTRATIONS_NOT_CONTROLLED_BASELINE",
    provenance:{briefs_sha256:hash(JSON.stringify(briefData)),demonstrations_sha256:hash(JSON.stringify(corpus))},
    records:recs,semantic_judgment:"NOT_PERFORMED",blind_readers:"NONE",
    ksgt_beats_baseline:"UNTESTED",discriminator_classifier:"NONE",
    final:"PROTOCOL_DEMONSTRATION_AND_UNCERTAINTY_WITNESSES_ONLY"};
  return result;
}
if(require.main===module){
 const result=run(),out=process.argv[2];
 if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({documents:result.records.length,
   mechanically_flagged:result.records.filter(r=>r.advisory_cues.length>0).length,
   semantic:result.semantic_judgment,comparison:result.ksgt_beats_baseline}));
}
module.exports={run,critique};
