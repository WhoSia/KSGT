"use strict";
const fs = require("node:fs");
const path = require("node:path");
const stageFile = path.resolve(__dirname,"..","..","CURRENT_STAGE.json");

function evaluate(stage) {
  if (stage.current_stage !== "G10-P1") throw Error("CURRENT_STAGE_CHANGED_WITHOUT_P1_EXIT_RECORD");
  const a = stage.current_authority ?? {};
  const p = stage.proposed_next_stage ?? {};
  const r = stage.current_stage_review ?? {};
  const checks = {
    validResearchStage: stage.current_stage === "G10-P1" && /OPEN/.test(stage.status),
    humanQuality: Number(a.independent_korean_reader_preference) > 0 &&
      Number(r.independentReaderResponses) > 0,
    independentSourceAuditor: Number(r.independentSourceAuditorResponses) > 0,
    sourceWorkDisjointConfirmatory: r.sourceWorkDisjointConfirmatory === true,
    matchedInformationAndCompute: r.matchedInformationAndCompute === true,
    validatedWritingQualityGain: a.validated_prose_quality_gain !== "NONE_PROVEN_GLOBAL_OR_LOCAL" &&
      r.proseQualityValidated === true,
    p2ProposalNotActive: p.identifier === "G10-P2" && p.status === "PROPOSAL_ONLY_NO_PROMOTION",
    archiveBounded: r.uniqueSourceWorks === 12 && r.preparedReaderForms === 4 &&
      stage.latest_complete_prose_study?.actualGeneratedFullTexts === 36,
  };
  const claimableQualityGain = checks.humanQuality &&
    checks.independentSourceAuditor && checks.sourceWorkDisjointConfirmatory &&
    checks.matchedInformationAndCompute && checks.validatedWritingQualityGain;
  const canCloseP1AsSuccessfulWritingStudy = claimableQualityGain;
  return { stage: stage.current_stage, substage: stage.current_substage,
    evidence: checks, claimableQualityGain,
    canCloseP1AsSuccessfulWritingStudy,
    proposedP2: p.name ?? null,
    decision: claimableQualityGain ? "ASSESS_FORMAL_PROMOTION_SEPARATELY" :
      "P1_OPEN_NO_FULL_PROSE_SUPERIORITY_P2_PROPOSAL_ONLY" };
}
if(require.main===module){
  console.log(JSON.stringify(evaluate(JSON.parse(fs.readFileSync(stageFile,"utf8"))),null,2));
}
module.exports={evaluate};
