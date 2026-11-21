"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const s=require("../../CURRENT_STAGE.json");

test("P2 is official but unproven, with canonical exact full name",()=>{
  assert.equal(s.current_stage,"G10-P2");
  assert.equal(s.status,"OPEN_R1_SYNTHETIC_ENGINEERING_NO_INDEPENDENT_HUMAN_QUALITY_GAIN");
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
test("P2 independent reader and provider counters start at zero",()=>{
  assert.equal(s.current_authority.real_provider_model_calls,0);
  assert.equal(s.current_authority.real_independent_korean_reader_ratings,0);
  assert.equal(s.current_authority.source_fidelity_independent_gold,0);
  assert.equal(s.current_authority.trained_new_models,0);
  assert.equal(s.current_authority.complete_korean_prose_quality_advantage,"UNOBSERVED");
  assert.equal(s.latest_experiment.identifier,"G10-P2 R1");
  assert.equal(s.latest_experiment.sourceWorks,4);
  assert.equal(s.latest_experiment.newProviderCalls,0);
});
