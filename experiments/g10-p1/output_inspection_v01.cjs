"use strict";
/** Actual output inspection worklist. Every assigned output is retained.
 * This does not emit human-naturalness scores or automated semantic PASS.
 */
const {validateCohort,ARMS}=require("./paired_runner_v02.cjs");
const {audit:surfaceAudit}=require("./source_surface_audit_v01.cjs");
function inspect(cohort,report){
 validateCohort(cohort);
 if(report?.schema!=="ksgt.g10.p1.paired-generation.v02"||
 report.status!=="MODEL_REQUESTS_ATTEMPTED")throw Error("ACTUAL_MODEL_REPORT_REQUIRED");
 if(!Array.isArray(report.rows))throw Error("ROWS_REQUIRED");
 const tasks=new Map(cohort.tasks.map(x=>[x.id,x]));
 const seen=new Set(),rows=[];
 for(const row of report.rows){
  const t=tasks.get(row.taskId);
  if(!t||!ARMS.includes(row.arm)||row.sourceWork!==t.sourceWork)throw Error("SOURCE_OR_ARM_MISMATCH");
  const key=row.taskId+":"+row.arm;
  if(seen.has(key))throw Error("DUPLICATE_TASK_ARM");seen.add(key);
  const generated=row.outcome==="GENERATED"&&typeof row.text==="string"&&row.text.trim();
  const numeric=generated?surfaceAudit(t,row.text):null;
  rows.push({
   taskId:row.taskId,sourceWork:t.sourceWork,arm:row.arm,
   status:generated?"NEEDS_SOURCE_REVIEW":row.outcome||"UNKNOWN",
   suspiciousNumericMentions:numeric?.unlicensedSurfaceCandidates||[],
   missingNumericMentions:numeric?.unmentionedSourceNumericStrings||[],
   numericDiagnosticStatus:generated?"SURFACE_ANOMALY_NOT_SEMANTIC_VERDICT":"NOT_APPLICABLE",
   humanNaturalness:null,humanSourceFidelity:null,
   outputSha256:row.text?require("node:crypto").createHash("sha256").update(row.text).digest("hex"):null
  });
 }
 for(const t of cohort.tasks)for(const arm of ARMS)
  if(!seen.has(t.id+":"+arm))throw Error("UNREPORTED_ASSIGNED_ARM");
 const byWork=new Map();
 for(const row of rows){
  const w=byWork.get(row.sourceWork)||{sourceWork:row.sourceWork,outputRows:0,generatedRows:0,suspiciousNumericRows:0};
  w.outputRows++;w.generatedRows+=(row.status==="NEEDS_SOURCE_REVIEW")?1:0;
  w.suspiciousNumericRows+=(row.suspiciousNumericMentions.length>0)?1:0;
  byWork.set(row.sourceWork,w);
 }
 return {schema:"ksgt.g10.p1.unrated-prose-inspection.v01",
  status:"SOURCE_SURFACE_DIAGNOSTIC_NO_HUMAN_OR_SEMANTIC_GOLD",
  assignedConditions:cohort.tasks.length*ARMS.length,
  returnedConditions:rows.length,distinctSourceWorks:byWork.size,
  rows,bySourceWork:[...byWork.values()],
  caveat:"Numeric surface flags can have false positives and false negatives; no prose quality or semantic-fidelity claims."};
}
module.exports={inspect};
