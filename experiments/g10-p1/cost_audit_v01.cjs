"use strict";
/** Cost comparison with user-supplied provider rates; never default price or quality.
 * Failure attempts are retained; missing usage is unknown, not zero.
 */
const ARMS=require("./paired_runner_v02.cjs").ARMS;
function audit(report,rates){
 if(report?.schema!=="ksgt.g10.p1.paired-generation.v02"||report.status!=="MODEL_REQUESTS_ATTEMPTED")throw Error("LIVE_REPORT_REQUIRED");
 if(!Array.isArray(report.rows)||!report.rows.length)throw Error("ROWS_REQUIRED");
 if(!rates||typeof rates!=="object"||!Number.isFinite(rates.promptUsdPerMillion)||
 !Number.isFinite(rates.completionUsdPerMillion)||rates.promptUsdPerMillion<0||rates.completionUsdPerMillion<0)
  throw Error("EXPLICIT_NONNEGATIVE_PRICES_REQUIRED");
 const arms=ARMS.map(arm=>{
  const rows=report.rows.filter(x=>x.arm===arm),works=new Set(rows.map(x=>x.sourceWork));
  let measuredUsd=0,known=0,unknown=0,promptTokens=0,completionTokens=0,latencyMs=0;
  for(const row of rows){
   const u=row.usage;
   if(row.outcome!=="GENERATED"||!u||!Number.isFinite(u.prompt_tokens)||!Number.isFinite(u.completion_tokens)){
    unknown++;continue;
   }
   if(u.prompt_tokens<0||u.completion_tokens<0)throw Error("NEGATIVE_TOKENS");
   known++;promptTokens+=u.prompt_tokens;completionTokens+=u.completion_tokens;
   if(Number.isFinite(row.latencyMs)&&row.latencyMs>=0)latencyMs+=row.latencyMs;
   measuredUsd+=(u.prompt_tokens*rates.promptUsdPerMillion+u.completion_tokens*rates.completionUsdPerMillion)/1e6;
  }
  return {arm,assignedRows:rows.length,distinctSourceWorks:works.size,knownUsageRows:known,
    unknownOrFailedUsageRows:unknown,measuredUsd:+measuredUsd.toFixed(9),
    promptTokens,completionTokens,knownLatencyMs:latencyMs,
    completeCosts:unknown===0&&rows.length>0};
 });
 return {schema:"ksgt.g10.p1.cost-report.v01",status:"MEASURED_COST_WHERE_USAGE_AVAILABLE",
  model:report.model,sourceRows:report.rows.length,rateAuthority:"USER_SUPPLIED",
  rates,arms,
  caveat:"USD API estimates do not account for annotator labor, local compute, free-tier discounts, retries hidden by the provider or model quality; missing usage never imputed zero."};
}
module.exports={audit};
