"use strict";
/** G10-P1 local inspection CLI. Never writes full model prose to the diagnostic.
 * The input generation report contains private source/output passages: keep private.
 */
const fs=require("node:fs");
const path=require("node:path");
const {inspect}=require("./output_inspection_v01.cjs");
const {audit:costAudit}=require("./cost_audit_v01.cjs");
function summarize(cohort,report,rates){
 const diagnostic=inspect(cohort,report);
 const costs=rates?costAudit(report,rates):null;
 return {schema:"ksgt.g10.p1.local-run-audit.v03",
  sourceTaskCount:cohort.tasks.length,
  diagnostic,costs,
  status:"UNRATED_SOURCE_DIAGNOSTIC_NOT_A_QUALITY_RESULT",
  nextRequired:"Independent actual Korean reader ratings and expert source fidelity review",
  rawOutputCustody:"NOT_EMBEDDED_IN_THIS_DIAGNOSTIC"};
}
function main(argv){
 const input={};
 for(let i=0;i<argv.length;i+=2){
  if(i+1>=argv.length||!["--cohort","--generation","--output","--rates"].includes(argv[i]))throw Error("UNKNOWN_OR_MISSING_ARG");
  input[argv[i].slice(2)]=argv[i+1];
 }
 if(!input.cohort||!input.generation||!input.output)throw Error("COHORT_GENERATION_OUTPUT_REQUIRED");
 const read=(name)=>JSON.parse(fs.readFileSync(path.resolve(input[name]),"utf8"));
 const x=summarize(read("cohort"),read("generation"),input.rates?read("rates"):null);
 fs.writeFileSync(path.resolve(input.output),JSON.stringify(x,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({output:path.resolve(input.output),status:x.status,sourceTasks:x.sourceTaskCount})+"\n");
}
if(require.main===module){try{main(process.argv.slice(2))}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={summarize};
