"use strict";
/* Print public-safe experiment metadata. Never print prompts, model completions, keys.
 * Intended for GitHub Actions run summary (logs may be accessible to readers).
 */
const fs=require("node:fs");
const path=require("node:path");
function summarize(report){
 if(report?.schema!=="ksgt.g10.p1.paired-generation.v02"||!Array.isArray(report.rows))throw Error("INVALID_REPORT");
 const lines=["# KSGT G10-P1 — Groq generation smoke","",
  "- Model: `"+String(report.model||"unknown").replace(/[`\r\n]/g,"")+" `",
  "- Provider: `"+String(report.provider||"unknown").replace(/[`\r\n]/g,"")+" `",
  "- Total assigned conditions: "+report.rows.length,
  "- Generated: "+report.rows.filter(r=>r.outcome==="GENERATED").length,
  "- Failed: "+report.rows.filter(r=>r.outcome==="FAILED").length,
  "","| Arm | Outcome | Prompt tokens | Completion tokens | Latency (ms) |",
  "| --- | --- | ---: | ---: | ---: |"];
 for(const row of report.rows){
  const u=row.usage||{};
  const safeArm=String(row.arm||"UNKNOWN").replace(/[^A-Z0-9_]/g,"");
  lines.push("| "+safeArm+" | "+(row.outcome==="GENERATED"?"GENERATED":"FAILED")+
  " | "+(Number.isFinite(u.prompt_tokens)?u.prompt_tokens:"—")+
  " | "+(Number.isFinite(u.completion_tokens)?u.completion_tokens:"—")+
  " | "+(Number.isFinite(row.latencyMs)?row.latencyMs:"—")+" |");
 }
 lines.push("","Raw prompts and Korean completions are intentionally excluded from logs and this summary.",
  "This smoke is a development test; independent Korean reader quality has **not** been measured.");
 return lines.join("\n")+"\n";
}
function main(){
 if(process.argv.length!==3)throw Error("USAGE_node_summary_report.json");
 const report=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),"utf8"));
 process.stdout.write(summarize(report));
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={summarize};
