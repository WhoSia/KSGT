"use strict";
/** Explicitly authorized R5 provider execution. Never logs generated prose or secret. */
const fs=require("node:fs");
const path=require("node:path");
const {preflight,run,validateConfig}=require("./r5_head_to_head_v01.cjs");
const {chat}=require("./provider_client_v01.cjs");
const ROOT=path.resolve(__dirname,"fixtures");
const COHORT=path.join(ROOT,"r2_matched_information_dev_v01.json");
const REQUEST=path.join(ROOT,"r5_request_20261105.json");
async function main(argv=process.argv.slice(2),env=process.env){
 const live=argv.length===2&&argv[0]==="--execute";
 const dry=argv.length===1&&argv[0]==="--dry-run";
 if(!dry&&!live)throw Error("USAGE_DRY_RUN_OR_EXPLICIT_EXECUTE_OUTPUT_JSON");
 const cohort=JSON.parse(fs.readFileSync(COHORT,"utf8"));
 const config=validateConfig(JSON.parse(fs.readFileSync(REQUEST,"utf8")));
 if(dry){const audit=preflight(cohort);process.stdout.write(JSON.stringify(audit,null,2)+"\n");return audit;}
 if(typeof env.GROQ_API_KEY!=="string"||!env.GROQ_API_KEY.trim())throw Error("GROQ_API_KEY_NOT_CONFIGURED");
 const outfile=path.resolve(argv[1]);
 if(!outfile.endsWith(".json")||fs.existsSync(outfile))throw Error("REFUSE_OVERWRITE_OR_INVALID_OUTPUT");
 const result=await run(cohort,config,{dryRun:false,invoke:args=>chat(args,env)});
 fs.writeFileSync(outfile,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({status:result.status,assigned:result.assigned,generated:result.generated,failed:result.failed,outputPath:path.basename(outfile)})+"\n");
 if(result.failed)process.exitCode=1;
 return result;
}
if(require.main===module)main().catch(e=>{console.error(String(e.message||e).replace(/[^A-Z0-9_]/gi,"_"));process.exitCode=1});
module.exports={main};
