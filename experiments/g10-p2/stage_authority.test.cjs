"use strict";
const {test}=require("node:test"),a=require("node:assert/strict"),s=require("../../CURRENT_STAGE.json");

test("approved G10-P2 title and R5 prospective, R4b human gate remain open",()=>{
 a.equal(s.current_stage,"G10-P2");
 a.equal(s.status,"OPEN_R6Z_DEVELOPMENT_COMPLETE_QUALITY_HOLD");
 a.equal(s.official_name,"KSGT Generation X G10-P2 — Reader-State-Coupled Korean Writing Architecture: Source-Grounded Discourse Dynamics, Adaptive Realization & Human-Validated Quality–Cost Trade-offs");
 a.equal(s.canonical_notion_id,"41fef561-cf92-8105-a17b-c0c33a9701bc");
});
test("P1 authority and R4a historical stage explicitly preserved",()=>{
 a.equal(s.historical_g10_p1_authority.actual_new_g10_model_generations,295);
 a.equal(s.historical_g10_p1_authority.independent_korean_reader_preference,0);
 a.equal(s.historical_g10_p1_authority.validated_prose_quality_gain,"NONE_PROVEN_GLOBAL_OR_LOCAL");
 a.equal(s.historical_g10_p2_r4a_latest_experiment.identifier,"G10-P2 R4a");
 a.equal(s.historical_g10_p2_r4a_latest_experiment.totalProviderCalls,60);
 a.equal(s.historical_g10_p2_r4a_latest_experiment.tokensTotal,49978);
});
test("P2 cumulative model calls count R2/R2b/R4a/R4b/R5a/R5b once, never read-only recovery",()=>{
 const c=s.current_authority;
 a.equal(c.new_g10_p2_r2_extractor_calls,80);
 a.equal(c.new_g10_p2_r2b_extractor_calls,48);
 a.equal(c.r3_new_provider_calls,0);
 a.equal(c.r4a_provider_calls,60);
 a.equal(c.r4b_real_provider_calls,20);
 a.equal(c.r5a_real_provider_calls,40);
 a.equal(c.r5a_real_independent_reader_ratings,0);
 a.equal(c.r5a_independent_source_audits,0);
 const legacy=80+48+0+60+20+40+(c.r5b_new_writer_provider_calls||0)+(c.r5c_real_provider_calls||0)+(c.r5d_real_provider_calls||0)+(c.r5f_real_provider_calls||0)+(c.r5g_real_provider_calls||0)+(c.r5h_real_provider_calls||0)+(c.r5i_new_provider_calls||0);
 a.equal(legacy,340);
 const r=c.r6_call_reconciliation;
 a.equal(r.base_r5i,legacy);
 a.equal(r.runs.length,16);
 a.equal(new Set(r.runs.map(x=>x.run)).size,16);
 a.equal(r.runs.find(x=>x.run===46000261677).id,"R6o");
 a.ok(r.runs.every(x=>Number.isSafeInteger(x.calls)&&x.calls>0));
 a.equal(r.incremental_calls,r.runs.reduce((n,x)=>n+x.calls,0));
 a.equal(r.incremental_calls,208);
 a.equal(c.real_provider_model_calls,legacy+r.incremental_calls);
 a.equal(s.latest_experiment.newModelCalls,20);
 a.equal(s.latest_experiment.posthocReplayNewModelCalls,0);
 a.equal(s.latest_experiment.stageCumulativeModelCalls,208);
 a.equal(c.trained_new_models,0);
});
test("strict fixed before-quote result and separate posthoc adapter result both recorded",()=>{
 const c=s.current_authority;
 a.equal(c.r4b_strict_exact_quote_patch_applied,3);
 a.equal(c.r4b_posthoc_whitespace_aligned_patch_applied,6);
 a.equal(c.r4b_posthoc_edge_space_rescues,3);
 a.equal(c.r4b_rewrite_target_quote_removed,6);
 a.equal(s.latest_experiment.strictSpanRemoved,3);
 a.equal(s.latest_experiment.posthocEdgeAlignedSpanRemoved,6);
 a.equal(s.latest_experiment.notIndependentHeldout,true);
});
test("distinct reader and auditor forms prepared but zero independent human responses",()=>{
 const c=s.current_authority;
 a.equal(c.r4b_reader_form_count,4);
 a.equal(c.r4b_auditor_form_count,4);
 a.equal(c.r4b_human_forms_unique_source_works,4);
 a.equal(c.real_independent_korean_reader_ratings,0);
 a.equal(c.source_fidelity_independent_gold,0);
 a.equal(s.latest_experiment.independentReaderRatings,0);
 a.equal(s.latest_experiment.independentSourceAuditRatings,0);
 a.equal(s.latest_experiment.semanticallyVerifiedWholeTextGain,"NONE_PROVEN");
 a.equal(c.complete_korean_prose_quality_advantage,"UNOBSERVED");
});
test("R5 prospective design is not mislabelled as a completed model experiment",()=>{
 a.equal(s.current_authority.r5_prospective_protocol_present,true);
 a.equal(s.latest_experiment.identifier,"G10-P2 R4b.1");
 a.match(s.next_scientific_action,/HUMAN_REQUIRED/);
});

test("P3 proposal and inherited holds do not change stage authority",()=>{
 a.equal(s.current_stage,"G10-P2");
 a.equal(s.proposed_next_stage.identifier,"G10-P3");
 a.equal(s.proposed_next_stage.status,"PROPOSAL_ONLY_NO_PROMOTION");
 a.equal(s.historical_g10_p1_p2_proposal.identifier,"G10-P2");
 a.equal(s.historical_g10_p2_r5i_stage_snapshot.provider_calls,340);
 a.equal(s.current_authority.rights_scope_status,"HOLD");
 a.equal(s.historical_r6xy_development.r6y_calls,0);
 a.equal(s.latest_r6_development.r6z_calls,4);
 a.equal(s.latest_r6_development.r6z_run,46028384605);
 a.equal(s.latest_r6_development.quality_advantage,"UNESTABLISHED");
});
