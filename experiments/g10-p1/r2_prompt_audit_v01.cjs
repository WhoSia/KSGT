"use strict";
/** R2 reproducible prompt audit, no provider calls and no human rating inference. */
const fs=require("node:fs");
const {compare}=require("./matched_information_v01.cjs");
function audit(cohort) {
 if(cohort?.schema!=="ksgt.g10.p1.r2.development-fixtures.v01"||
  cohort.evidence!=="AUTHOR_SYNTHETIC_EXPOSED_DEVELOPMENT_NOT_HOLDOUT"||
  !Array.isArray(cohort.tasks)||cohort.tasks.length===0)throw Error("INVALID_EXPOSED_COHORT");
 const works=new Set(),rows=[];
 for(const task of cohort.tasks){
  if(works.has(task.sourceWork))throw Error("DUPLICATE_SOURCE_WORK");
  works.add(task.sourceWork);
  const result=compare(task);
  for(const a of result.arms)rows.push({sourceWork:task.sourceWork,genre:task.genre,
   arm:a.arm,sourceHash:a.sourceHash,sourceChars:a.sourceChars,promptChars:a.promptChars,
   extraPromptChars:a.promptChars-a.sourceChars});
 }
 return {schema:"ksgt.g10.p1.r2.prompt-audit.v01",sourceWorks:works.size,
  assignedPolicyCells:rows.length,modelGenerations:0,humanRatings:0,
  matchedSourceInformation:true,matchedTokenBudget:false,rows,
  evidence:"EXPOSED_SYNTHETIC_PROMPT_ONLY_NO_QUALITY_OR_COST_CLAIM"};
}
if(require.main===module){
 const file=process.argv[2]||"experiments/g10-p1/fixtures/r2_matched_information_dev_v01.json";
 const report=audit(JSON.parse(fs.readFileSync(file,"utf8")));
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
}
module.exports={audit};
