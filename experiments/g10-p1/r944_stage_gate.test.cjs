"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {evaluate}=require("./r944_stage_gate.cjs");
const stage=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","..","CURRENT_STAGE.json"),"utf8"));
const cohort=require("./fixtures/r934_reader_cohort_v01.json");

test("P1 remains open and P2 is a proposal, never silently promoted",()=>{
  const d=evaluate(stage);
  assert.equal(d.stage,"G10-P1");
  assert.equal(d.evidence.p2ProposalNotActive,true);
  assert.equal(d.claimableQualityGain,false);
  assert.equal(d.canCloseP1AsSuccessfulWritingStudy,false);
  assert.equal(stage.proposed_next_stage.identifier,"G10-P2");
  assert.equal(stage.current_authority.independent_korean_reader_preference,0);
  assert.equal(stage.current_stage_review.independentReaderResponses,0);
  assert.equal(stage.current_stage_review.independentSourceAuditorResponses,0);
  assert.equal(stage.current_authority.validated_prose_quality_gain,"NONE_PROVEN_GLOBAL_OR_LOCAL");
});

test("R9.23 history and later experiment units are not conflated",()=>{
  assert.equal(stage.historical_r9_23_latest_experiment_snapshot.identifier,"G10-P1 R9.23");
  assert.equal(stage.latest_experiment.identifier,"G10-P1 R9.42b");
  assert.equal(stage.latest_experiment.studyType,"MODEL_REFERENCE_CHOICE_DIAGNOSTIC_NOT_FULL_PROSE");
  assert.equal(stage.latest_experiment.actualModelCompletions,40);
  assert.equal(stage.latest_complete_prose_study.identifier,"G10-P1 R9.34");
  assert.equal(stage.latest_complete_prose_study.sourceWorkCount,12);
  assert.equal(stage.latest_complete_prose_study.actualGeneratedFullTexts,36);
  assert.equal(stage.current_stage_review.preparedReaderForms,4);
  assert.equal(stage.current_stage_review.uniqueSourceWorks,12);
  assert.equal(cohort.length,12);
  assert.equal(new Set(cohort.map(w=>w.id)).size,12);
});

test("quality claim requires independent humans, source audit, heldout and matched resources",()=>{
  const s=structuredClone(stage);
  s.current_authority.independent_korean_reader_preference=12;
  s.current_stage_review.independentReaderResponses=12;
  assert.equal(evaluate(s).claimableQualityGain,false);
  s.current_stage_review.independentSourceAuditorResponses=12;
  s.current_stage_review.sourceWorkDisjointConfirmatory=true;
  s.current_stage_review.matchedInformationAndCompute=true;
  assert.equal(evaluate(s).claimableQualityGain,false);
  s.current_stage_review.proseQualityValidated=true;
  s.current_authority.validated_prose_quality_gain="TEST_RESULT_NOT_SCIENTIFICALLY_ACCEPTED";
  assert.equal(evaluate(s).claimableQualityGain,true);
  s.current_stage="G10-P2";
  assert.throws(()=>evaluate(s),/CURRENT_STAGE_CHANGED/);
});

test("review report, stages, scripts and current question remain in repository",()=>{
  const root=path.resolve(__dirname);
  const required=[
    "RESEARCH_PROGRAM.md",
    "r944_two_phase_reader_packet.py",
    "paper/R9_44_G10_P1_RETROSPECTIVE_P2_NAMING_20261121.md",
    "paper/R9_34_READER_PILOT_RESULTS_20261121.md",
    "../discourse-state/ACTOR_EVIDENCE_RESULTS.md",
  ];
  for(const item of required)assert.ok(fs.statSync(path.join(root,item)).size>0,item);
  assert.ok(stage.current_question.includes("Korean documents"));
});
