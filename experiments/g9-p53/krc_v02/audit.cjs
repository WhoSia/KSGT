"use strict";
/* Frozen P53 KRC v0.2 post-run witness audit; descriptive status only. */
const fs=require("node:fs"),crypto=require("node:crypto");
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
function audit(x){
 if(x.schema!=="ksgt.g9.p53.krc-v02.bounded-game-result.v1"||
   x.slot_ledger?.length!==10||x.documents?.length!==2||
   x.attempts>20||x.human_semantic_adjudication!=="NOT_PERFORMED")
   throw Error("NOT_A_BOUNDED_V02_RESULT");
 const dist={},outcomes={},stages={};
 for(const row of x.slot_ledger){
  if(!["MODEL_ACCEPTED_MECHANICALLY","SOURCE_LITERAL_FALLBACK"].includes(row.status))throw Error("UNKNOWN_OUTCOME");
  if(row.attempts.length<1||row.attempts.length>2)throw Error("ATTEMPT_BUDGET");
  for(const attempt of row.attempts){
   stages[attempt.status]=(stages[attempt.status]||0)+1;
   for(const w of attempt.witnesses||[])dist[w.code]=(dist[w.code]||0)+1;
  }
  outcomes[row.status]=(outcomes[row.status]||0)+1;
 }
 if(outcomes.SOURCE_LITERAL_FALLBACK!==x.source_literal_fallbacks&&x.source_literal_fallbacks!==0)throw Error("FALLBACK_DRIFT");
 if((outcomes.MODEL_ACCEPTED_MECHANICALLY||0)!==x.model_admitted_slots)throw Error("ACCEPTED_DRIFT");
 const reports=x.documents.map(d=>({brief:d.brief,paragraphs:d.paragraphs,
   chars:d.text.length,source_fact_coverage:d.source_fact_coverage,
   literal_fallbacks:d.source_literal_fallbacks,model_clauses:d.model_generated_clauses,
   hash:sha(d.text),semantic:"NOT_ADJUDICATED"}));
 return {schema:"ksgt.g9.p53.krc-v02.independent-outcome-audit.v1",
   source_result_sha256:sha(JSON.stringify(x)),
   n_briefs:x.emitted_docs,source_slots:x.expected_slots,
   total_model_requests:x.attempts,repaired_slots:x.revised_slots,
   model_accepted:x.model_admitted_slots,source_literal_fallback:x.source_literal_fallbacks,
   typed_witness_counts:dist,attempt_status_counts:stages,
   mechanical_paragraphs_2:reports.filter(d=>d.paragraphs===2).length,
   documents:reports,results_are_natural_korean:"NOT_PROVEN",
   judge_consensus:"NOT_ATTEMPTED",meaning_fidelity:"NOT_HUMAN_ADJUDICATED",
   relative_to_monolithic_v01:"DIFFERENT_NEW_BRIEFS_CANNOT_COMPARE_SEMANTIC_NATURALNESS_CAUSALLY",
   scientific_conclusion:"Executable witness-local repair/fallback and deterministic composition, not GAN training or a natural-language guarantee"};
}
if(require.main===module){
 const [input,output]=process.argv.slice(2);
 if(!input||!output)throw Error("USAGE node audit.cjs generated.json audit.json");
 const a=audit(JSON.parse(fs.readFileSync(input)));
 fs.writeFileSync(output,JSON.stringify(a,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({slots:a.source_slots,attempts:a.total_model_requests,
  accepted:a.model_accepted,literal:a.source_literal_fallback,typed_witness_counts:a.typed_witness_counts,
  paragraphs:a.mechanical_paragraphs_2,semantic:a.meaning_fidelity}));
}
module.exports={audit};
