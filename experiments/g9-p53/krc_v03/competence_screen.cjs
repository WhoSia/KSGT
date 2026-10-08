"use strict";
/* Surface competence screen only. A clean screen does NOT prove Korean semantic fidelity. */
const fs=require("node:fs"),crypto=require("node:crypto");
const briefs=require("./new_briefs.json");
const SHA=s=>crypto.createHash("sha256").update(s).digest("hex");
const metaLine=/^\s*(?:#{1,6}\s+|\*\*?(?:제목|목록|인사말|인용부호|설명|첫\s*문단)\b|(?:제목|목록|인사말|인용부호|설명|첫\s*문단)\s*[:：]|[0-9]+\s*[.)]\s)/mu;
const dangling=/\b(?:JSON|F[1-5]|no citation|위 요청|두 문단입니다)\b/iu;
function inspect(row){
 const original=briefs.briefs.find(b=>b.id===row.brief);
 if(!original)throw Error("UNKNOWN_BRIEF");
 const t=row.output;
 if(typeof t!=="string")return {brief:row.brief,arm:row.arm,status:"NO_OUTPUT",mechanically_competent:false,semantic:"UNKNOWN"};
 const chunks=t.trim().split(/\n\s*\n/u).filter(Boolean),flags=[];
 if(metaLine.test(t))flags.push("METATEXT_OR_LIST_FRAME");
 if(dangling.test(t))flags.push("INSTRUCTION_TOKENS_IN_CONTENT");
 if(chunks.length!==2)flags.push("TWO_PARAGRAPH_NONCOMPLIANCE");
 if(t.trim().length<60)flags.push("TOO_SHORT_FOR_PROSE_STUDY");
 // Numerical literals may be spelled out; only inspect exact digits. This is a review signal, not fact verdict.
 const numerals=[...new Set(t.match(/\d+(?:\.\d+)?/gu)||[])];
 const sourceNumbers=new Set((original.facts.join(" ").match(/\d+(?:\.\d+)?/gu)||[]));
 const extra=numerals.filter(n=>!sourceNumbers.has(n));if(extra.length)flags.push("UNSOURCED_DIGITS_REVIEW");
 return {brief:row.brief,arm:row.arm,status:row.status,chars:t.length,paragraphs:chunks.length,
  output_sha256:SHA(t),flags,unsourced_exact_numerals:extra,
  mechanically_competent:flags.length===0,
  semantic:"NOT_ADJUDICATED",idiomaticity:"NOT_ADJUDICATED",
  disclaimer:"Mechanical competence necessary but insufficient; no source-entailment or fluent Korean proof."};
}
function court(data){
 if(data.schema!=="ksgt.krc.v03.decoder-gate.outcome"||data.documents.length!==6)throw Error("WRONG_RESULT");
 const results=data.documents.map(inspect),base=results.filter(x=>x.arm==="B_CLEAN");
 if(base.length!==2)throw Error("NO_BASELINE_GATE");
 const mechanically_ok=base.every(x=>x.mechanically_competent);
 return {schema:"ksgt.krc.v03.uncertainty-preserving-mechanical-screen",
  observations:results,clean_baseline_mechanical_gate:mechanically_ok?"PRELIMINARY_FORMAT_PASS":"FAILED_OR_UNDETERMINED",
  unlicensed_semantic_verdict:"NONE",KRC_superiority:"NOT_ESTABLISHED",
  human_reader_court:"RETIRED_UNSUITABLE_PREVIOUS_MATERIAL",
  next:"Manually audit Korean grammar, source propositions and causal direction independently; refuse ranking until sufficient competence."};
}
if(require.main===module){
 const [src,dest]=process.argv.slice(2);if(!src||!dest)throw Error("USAGE audit.cjs output.json screen.json");
 const result=court(JSON.parse(fs.readFileSync(src)));
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({screen:result.clean_baseline_mechanical_gate,
  results:result.observations.map(x=>({brief:x.brief,arm:x.arm,flags:x.flags}))}));
}
module.exports={inspect,court};
