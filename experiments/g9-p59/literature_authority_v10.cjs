"use strict";
/* KSGT G9-P59 internal §v1.0 — executable literature-authority contract.
   This registry describes VERIFIED PDF custody; it does not download raw datasets. */
const assert=require("node:assert/strict");
const CANONICAL="1D2M4LHcejREhlyp6vTd71xxLLx-6ldUP";
const records=[
 ["WritingBench","1IbUF4RhNkMM8336txCx5-gw-lr9c-j6W","TASK_SPECIFIC_WRITING_JUDGE","AUTHOR_STUDY_HUMAN_ALIGNMENT"],
 ["EditEval","1A2NcyWeUo8BAMqp8FWATIBz-QxSECTN0","TEXT_REVISION","ENGLISH_EDIT_REFERENCES"],
 ["KoSEnd","14tiEgX0NDXHU7CSm0jef5drhB4Js6qCc","KOREAN_ENDING_NATURALNESS","MIXED_HUMAN_PILOT_AND_LLM_REMAINDER"],
 ["KoGEM","1PgpbciMydfSObDbNxZhnqS2ndHC2A-0S","KOREAN_GRAMMAR","GRAMMAR_MULTIPLE_CHOICE"],
 ["SummEval","11AVNzeVzwFRhlRnkMek-nPi2oPwrsDhx","SUMMARY_EVALUATION","EXPERT_AND_CROWD_SUMMARY_ANNOTATIONS"],
 ["ScientificRevision","1q3M8fC7XJp1tAw4YYzp0jtI5AumN0Oqn","SCIENTIFIC_REVISION","AUTHOR_STUDY_PAIRED_EXPERT_PREFERENCE"],
 ["ACES","1HbgkW62Nu2Ypua_kBkunEsnpF8feNMfW","TRANSLATION_ERROR_CHALLENGE","METRIC_DIAGNOSTIC"],
 ["RARR","181Lpp8DFqUaEJIbNzDvzwcQej8n94zgH","EVIDENCE_GROUNDED_REVISION","ATTRIBUTION_EVALUATION"],
 ["GEval","1uYKz-fsd64r8DeTCx7K6WJ1awcZ04aLA","LLM_CRITIC","PAPER_HUMAN_CORRELATION_BIAS_RISK"],
 ["GOLEMcoref","1hHUWG90ImTBhXnX_sTihPaCMraBk-1lb","KOREAN_INCLUSIVE_FICTION_COREFERENCE","HUMAN_COREFERENCE_DESCRIBED_RAW_UNAVAILABLE"],
 ["MTBench101","1YoGbd4djCHXwGANLBN4DimUAGEXT3QGq","DIALOGUE_EVALUATION","MULTITURN_TASKS"],
 ["ChatbotArena","1x_Wslejz-YKKlpMWAT93kbQ21vWk0uE6","PAIRED_DIALOGUE_PREFERENCE","CROWDSOURCED_CHATBOT_VOTES"]
].map(([key,id,phenomenon,annotation])=>({
 key,id,phenomenon,annotation,repositoryFolderId:CANONICAL,pdfVerified:true,
 originalRawDataIngested:false,datasetRightsAudited:false,
 independentlyHumanLabeledWholeKoreanWriting:false
}));
function validate(rows=records){
 assert.equal(rows.length,12);
 assert.equal(new Set(rows.map(r=>r.key)).size,12);
 assert.equal(new Set(rows.map(r=>r.id)).size,12);
 for(const r of rows){
  assert.equal(r.pdfVerified,true);
  assert.equal(r.repositoryFolderId,CANONICAL);
  assert.equal(r.originalRawDataIngested,false,"DATASET_CUSTODY_LAUNDERING");
  assert.equal(r.datasetRightsAudited,false,"RIGHTS_AUTHORITY_LAUNDERING");
  assert.equal(r.independentlyHumanLabeledWholeKoreanWriting,false,"PREFERENCE_GOLD_LAUNDERING");
 }
 const ks=rows.find(r=>r.key==="KoSEnd");
 assert.equal(ks.annotation,"MIXED_HUMAN_PILOT_AND_LLM_REMAINDER");
 assert.ok(rows.find(r=>r.key==="GOLEMcoref").annotation.includes("RAW_UNAVAILABLE"));
 return {papers:rows.length,verifiedPdf:rows.filter(r=>r.pdfVerified).length,
  originalRawDatasets:rows.filter(r=>r.originalRawDataIngested).length,
  wholeKoreanProseHumanGold:rows.filter(r=>r.independentlyHumanLabeledWholeKoreanWriting).length,
  authority:"PDF_VERIFIED_ONLY_NO_RAW_DATA_OR_HUMAN_PROSE_GOLD"};
}
function test(){
 const passed=validate();
 const forged=structuredClone(records);forged[2].independentlyHumanLabeledWholeKoreanWriting=true;
 assert.throws(()=>validate(forged),/PREFERENCE_GOLD_LAUNDERING/);
 const falselyIngested=structuredClone(records);falselyIngested[9].originalRawDataIngested=true;
 assert.throws(()=>validate(falselyIngested),/DATASET_CUSTODY_LAUNDERING/);
 const falselyLicensed=structuredClone(records);falselyLicensed[0].datasetRightsAudited=true;
 assert.throws(()=>validate(falselyLicensed),/RIGHTS_AUTHORITY_LAUNDERING/);
 console.log(JSON.stringify({test:"PASS",section:"P59/v1.0",...passed,negativeControls:3}));
}
if(require.main===module)test();
module.exports={records,validate,test};
