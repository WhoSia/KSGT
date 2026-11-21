"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const s=require("../../CURRENT_STAGE.json");

test("official P2 has its approved exact name but no human quality gain",()=>{
  assert.equal(s.current_stage,"G10-P2");
  assert.equal(s.status,"OPEN_R4A_FULL_PROSE_PILOT_NO_INDEPENDENT_HUMAN_QUALITY_GAIN");
  assert.equal(s.official_name,"KSGT Generation X G10-P2 — Reader-State-Coupled Korean Writing Architecture: Source-Grounded Discourse Dynamics, Adaptive Realization & Human-Validated Quality–Cost Trade-offs");
  assert.equal(s.canonical_notion_id,"41fef561-cf92-8105-a17b-c0c33a9701bc");
});
test("P1 original 295 count is preserved historically and never counted as new R4a output",()=>{
  assert.equal(s.historical_g10_p1_terminal_state.status,"CLOSED_BOUNDED_PILOT_WITHOUT_SUPERIORITY");
  assert.equal(s.historical_g10_p1_authority.actual_new_g10_model_generations,295);
  assert.equal(s.historical_g10_p1_authority.independent_korean_reader_preference,0);
  assert.equal(s.historical_g10_p1_authority.validated_prose_quality_gain,"NONE_PROVEN_GLOBAL_OR_LOCAL");
});
test("P2 actual provider call tally counts real R2, R2b and R4a without adding rule-only tests",()=>{
  assert.equal(s.current_authority.new_g10_p2_r2_extractor_calls,80);
  assert.equal(s.current_authority.new_g10_p2_r2b_extractor_calls,48);
  assert.equal(s.current_authority.r3_new_provider_calls,0);
  assert.equal(s.current_authority.r4a_provider_calls,60);
  assert.equal(s.current_authority.real_provider_model_calls,80+48+60);
  assert.equal(s.latest_experiment.stageCumulativeProviderCalls,188);
  assert.equal(s.current_authority.trained_new_models,0);
});
test("R3 finite contract remains a fixture result and not an independent reader finding",()=>{
  assert.equal(s.current_authority.r3_investigator_structured_cases,12);
  assert.equal(s.current_authority.r3_real_korean_writing_quality_gain,"UNOBSERVED");
  assert.deepEqual(s.current_authority.r3_author_declared_outcomes,{ALLOW:4,REJECT:7,MENTION_ONLY:1});
});
test("R4a actually concerns 24 completed full texts from 12 new source works and 60 calls",()=>{
  assert.equal(s.latest_experiment.identifier,"G10-P2 R4a");
  assert.equal(s.latest_experiment.sourceWorks,12);
  assert.equal(s.latest_experiment.completeTextCandidates,24);
  assert.equal(s.latest_experiment.writerProviderCalls+s.latest_experiment.auditProviderCalls+
    s.latest_experiment.plainStateChooserCalls,60);
  assert.equal(s.latest_experiment.controllerRichSelections,1);
  assert.equal(s.latest_experiment.plainStateRichSelections,3);
  assert.equal(s.latest_experiment.selectorAgreements,10);
  assert.equal(s.latest_experiment.tokensTotal,49978);
});
test("reader and source-auditor forms are prepared but no votes, semantic gold or cost-matched gain exist",()=>{
  assert.equal(s.current_authority.r4a_reader_forms_prepared,4);
  assert.equal(s.current_authority.r4a_auditor_forms_prepared,4);
  assert.equal(s.current_authority.real_independent_korean_reader_ratings,0);
  assert.equal(s.current_authority.source_fidelity_independent_gold,0);
  assert.equal(s.latest_experiment.independentReaderRatings,0);
  assert.equal(s.latest_experiment.independentSourceAuditorRatings,0);
  assert.equal(s.latest_experiment.verifiedWritingQualityGain,"NONE_PROVEN");
  assert.equal(s.latest_experiment.strongCostMatchedIterativeControl,"NOT_RUN");
});
