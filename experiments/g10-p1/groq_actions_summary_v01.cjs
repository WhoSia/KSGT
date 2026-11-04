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
function verifyComplete(report){
 if(report?.schema!=="ksgt.g10.p1.paired-generation.v02"||!Array.isArray(report.rows)||report.rows.length!==5)throw Error("INVALID_FIVE_ARM_REPORT");
 const unique=new Set(report.rows.map(r=>r.arm));
 if(unique.size!==5)throw Error("DUPLICATE_OR_MISSING_ARMS");
 const failures=report.rows.filter(r=>r.outcome!=="GENERATED"||typeof r.text!=="string"||!r.text.trim());
 if(failures.length)throw Error("GROQ_GENERATION_INCOMPLETE_"+failures.length+"_OF_5");
 return true;
}
function main(){
 if(process.argv.length<3||process.argv.length>4)throw Error("USAGE_node_summary_report.json_[--verify]");
 const report=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),"utf8"));
 if(process.argv[3]==="--verify"){verifyComplete(report);process.stdout.write("ALL_FIVE_GENERATIONS_VERIFIED\\n");}
 else if(!process.argv[3])process.stdout.write(summarize(report));
 else throw Error("UNSUPPORTED_MODE");
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={summarize,verifyComplete};
