"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const s=require("../../CURRENT_STAGE.json");

test("P2 is official but unproven, with canonical exact full name",()=>{
  assert.equal(s.current_stage,"G10-P2");
  assert.equal(s.status,"OPEN_R3_FINITE_CONTRACT_NO_INDEPENDENT_HUMAN_QUALITY_GAIN");
  assert.equal(s.official_name,"KSGT Generation X G10-P2 — Reader-State-Coupled Korean Writing Architecture: Source-Grounded Discourse Dynamics, Adaptive Realization & Human-Validated Quality–Cost Trade-offs");
  assert.equal(s.canonical_notion_id,"41fef561-cf92-8105-a17b-c0c33a9701bc");
});
test("P1 authority and terminal metadata are preserved, never upgraded",()=>{
  assert.equal(s.historical_g10_p1_terminal_state.status,
    "CLOSED_BOUNDED_PILOT_WITHOUT_SUPERIORITY");
  assert.equal(s.historical_g10_p1_terminal_state.original_stage_label,"G10-P1");
  assert.equal(s.historical_g10_p1_authority.actual_new_g10_model_generations,295);
  assert.equal(s.historical_g10_p1_authority.independent_korean_reader_preference,0);
  assert.equal(s.historical_g10_p1_authority.validated_prose_quality_gain,
    "NONE_PROVEN_GLOBAL_OR_LOCAL");
});
test("P2 real model calls advance without inventing independent reader quality",()=>{
  assert.equal(s.current_authority.new_g10_p2_r2_extractor_calls,80);
  assert.equal(s.current_authority.new_g10_p2_r2b_extractor_calls,48);
  assert.equal(s.current_authority.real_provider_model_calls,128);
  assert.equal(s.current_authority.real_independent_korean_reader_ratings,0);
  assert.equal(s.current_authority.source_fidelity_independent_gold,0);
  assert.equal(s.current_authority.trained_new_models,0);
  assert.equal(s.current_authority.complete_korean_prose_quality_advantage,"UNOBSERVED");
  assert.equal(s.latest_experiment.identifier,"G10-P2 R3");
  assert.equal(s.current_authority.real_provider_model_calls,128);
  assert.equal(s.latest_experiment.priorRealExtractionCalls,128);
  assert.equal(s.latest_experiment.newProviderCalls,0);
  assert.equal(s.current_authority.r2b_prior_full_prose_texts,24);
  assert.equal(s.latest_experiment.investigatorStructuredCases,12);
  assert.equal(s.latest_experiment.independentReaderRatings,0);
  assert.equal(s.current_authority.r2b_author_uncertain,2);
});
test("R3 self-authored finite gate never becomes independent semantic proof",()=>{
  assert.equal(s.current_authority.r3_new_provider_calls,0);
  assert.equal(s.current_authority.r3_four_original_source_work_units,4);
  assert.equal(s.current_authority.r3_investigator_structured_cases,12);
  assert.equal(s.current_authority.r3_real_korean_writing_quality_gain,"UNOBSERVED");
  assert.equal(s.latest_experiment.verifiedWriterQualityGain,"NONE_PROVEN");
  assert.deepEqual(s.latest_experiment.expectedLabels,{ALLOW:4,REJECT:7,MENTION_ONLY:1});
});
