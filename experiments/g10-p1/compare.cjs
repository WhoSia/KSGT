"use strict";
/**
 * KSGT G10-P1: matched full-paragraph Korean prose generation instrument.
 * This is a REAL prompt/API runner, not an evaluated quality-improvement result.
 * Node >= 18, no dependencies. Never automatically upload source passages.
 */
const fs = require("node:fs");
const path = require("node:path");
const {performance} = require("node:perf_hooks");
const MODES = Object.freeze(["DIRECT","RICH_PROMPT","DISCOURSE_GUIDED"]);
function validateTask(task) {
  if (!task || typeof task !== "object" || Array.isArray(task)) throw Error("TASK_OBJECT_REQUIRED");
  for (const k of ["id","genre","audience","purpose"]) {
    if (typeof task[k] !== "string" || !task[k].trim()) throw Error("INVALID_"+k.toUpperCase());
  }
  if (!Array.isArray(task.facts) || !task.facts.length || task.facts.some(x=>typeof x!=="string"||!x.trim()))
    throw Error("NONEMPTY_FACT_STRINGS_REQUIRED");
  if (!Array.isArray(task.uncertainties) || task.uncertainties.some(x=>typeof x!=="string")) throw Error("UNCERTAINTIES_ARRAY_REQUIRED");
  if (task.facts.length>50 || task.uncertainties.length>50) throw Error("SOURCE_ITEMS_LIMIT");
  return task;
}
function buildPlan(task) {
  validateTask(task);
  const ids=task.facts.map((_,i)=>"F"+(i+1));
  const n=ids.length;
  const a=Math.max(1,Math.ceil(n/3)), b=Math.max(a,Math.ceil(2*n/3));
  const groups=[ids.slice(0,a),ids.slice(a,b),ids.slice(b)].filter(x=>x.length>0);
  const labels=task.genre.includes("서사") || task.genre.includes("scene")
    ? ["장면의 감각적 단서","관찰·사건의 전개","장면의 마무리와 이동"]
    : ["맥락 및 문제 제시","관측·근거의 구체화","추론의 범위와 한계"];
  return {
    schema:"ksgt.g10.p1.plan.v01",sourceId:task.id,genre:task.genre,
    audience:task.audience,purpose:task.purpose,
    moves:groups.map((facts,i)=>({role:labels[i],factIds:facts,rule:"해당 원천 사실에 충실하고 새로운 사건이나 숫자를 추가하지 않는다"})),
    unresolved:task.uncertainties.map((claim,i)=>({id:"U"+(i+1),claim,rule:"추측을 확정적 사실로 만들지 않는다"})),
    koreanRealization:{
      topic:"주제 표지는 문맥상 대비 또는 연속성에 따라 선택; 남용 금지",
      reference:"지시 대상이 분명할 때만 자연스럽게 생략하고 불확실한 대명사는 임의 확정하지 않는다",
      endings:"독자와 장르에 맞는 일관된 종결·높임 수준을 유지한다",
      discourse:"사실/관측/추론을 구별하고 접속 표현을 기계적으로 반복하지 않는다",
      rhythm:"문장 길이와 정보 밀도를 조절하되 의미를 손상시키지 않는다"
    }
  };
}
function sourceText(task) {
  const fsText=task.facts.map((x,i)=>"F"+(i+1)+": "+x).join("\n");
  const usText=task.uncertainties.map((x,i)=>"U"+(i+1)+": "+x).join("\n")||"(특별히 지정된 불확실성 없음)";
  return "장르: "+task.genre+"\n독자: "+task.audience+"\n글의 목적: "+task.purpose+
  "\n확인된 원천 사실:\n"+fsText+"\n근거 없이 확정하면 안 되는 내용:\n"+usText;
}
function makeMessages(mode,task) {
  validateTask(task);
  if (!MODES.includes(mode)) throw Error("UNSUPPORTED_MODE");
  const basis=sourceText(task);
  const system="당신은 주어진 원천만을 이용해 자연스러운 한국어 산문을 작성하는 도우미입니다. 부정확한 사실을 추가하지 마세요.";
  let instruction;
  if(mode==="DIRECT") {
    instruction="다음 자료를 바탕으로 지정한 독자와 장르에 맞는 자연스러운 한국어 문단을 작성하세요. 문단 본문만 출력하세요.";
  } else if(mode==="RICH_PROMPT") {
    instruction="다음 자료로 읽기 좋은 한국어 문단을 작성하세요. 내용의 순서를 명확히 하고 문장 사이의 논리적 연결을 자연스럽게 구성하세요. 관찰과 추론을 분리하세요. 확인되지 않은 사실을 단정하지 말고 수치·대상·시간을 왜곡하지 마세요. 불필요한 접속어 반복과 어색한 문장 길이를 피하고, 독자에게 적합한 어미와 높임 수준을 유지하세요. 원문 자료 외에 새 사건·감정·증거를 만들어내지 마세요. 문단 본문만 출력하세요.";
  } else {
    const p=buildPlan(task);
    instruction="아래의 명시적 담화 계획을 따라 한국어 산문 문단을 작성하세요. 각 계획 move에 해당하는 원천 사실만 사용하고 원천 사실을 누락하거나 임의 보강하지 마세요. 계획에 있는 언어실현 가이드는 반드시 사실보다 낮은 우선순위입니다. 자연스럽게 이어지는 실제 문단 본문만 출력하세요.\n담화 계획:\n"+JSON.stringify(p,null,2);
  }
  return [{role:"system",content:system},{role:"user",content:instruction+"\n\n"+basis}];
}
function parseArgs(argv) {
  const a={dryRun:false,run:false,input:null,output:null,model:null,maxTokens:450,temperature:0};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==="--dry-run") a.dryRun=true;
    else if(arg==="--run") a.run=true;
    else if(["--input","--output","--model","--max-tokens","--temperature"].includes(arg)){
      if(i+1>=argv.length) throw Error("MISSING_ARGUMENT_"+arg);
      const k={"--input":"input","--output":"output","--model":"model","--max-tokens":"maxTokens","--temperature":"temperature"}[arg];
      a[k]=arg==="--max-tokens"||arg==="--temperature"?Number(argv[++i]):argv[++i];
    } else throw Error("UNKNOWN_ARGUMENT_"+arg);
  }
  if(a.run===a.dryRun) throw Error("CHOOSE_EXACTLY_ONE_OF_--run_OR_--dry-run");
  if(!a.input) throw Error("INPUT_REQUIRED");
  if(a.run && (!a.output||!a.model)) throw Error("RUN_REQUIRES_OUTPUT_AND_MODEL");
  if(!(a.maxTokens>=1&&Number.isInteger(a.maxTokens)))throw Error("MAX_TOKENS_POSITIVE_INTEGER");
  if(!(a.temperature>=0&&a.temperature<=2))throw Error("TEMPERATURE_OUT_OF_RANGE");
  return a;
}
async function modelCall(messages,model,maxTokens,temperature) {
  const key=process.env.OPENAI_API_KEY;
  if(!key) throw Error("OPENAI_API_KEY_REQUIRED_FOR_ACTUAL_GENERATION");
  const base=(process.env.OPENAI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
  if(!/^https:\/\//.test(base)&& !/^http:\/\/localhost(?::\d+)?(?:\/|$)/.test(base))
    throw Error("HTTPS_OR_LOCALHOST_ENDPOINT_REQUIRED");
  const started=performance.now();
  const res=await fetch(base+"/chat/completions",{
    method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+key},
    body:JSON.stringify({model,messages,temperature,max_tokens:maxTokens})
  });
  if(!res.ok)throw Error("MODEL_HTTP_ERROR_"+res.status);
  const data=await res.json();
  const output=data?.choices?.[0]?.message?.content;
  if(typeof output!=="string")throw Error("NO_TEXT_COMPLETION");
  return {text:output,usage:data.usage||null,elapsedMs:+(performance.now()-started).toFixed(2),finishReason:data.choices[0]?.finish_reason||null};
}
async function compare(task,options,request=modelCall) {
  validateTask(task);
  const result={schema:"ksgt.g10.p1.comparison.v01",sourceId:task.id,model:options.model||null,
    maxTokens:options.maxTokens,temperature:options.temperature,modeOutputs:[]};
  for(const mode of MODES) {
    const messages=makeMessages(mode,task);
    const item={mode,model:options.model||null,prompt:messages,planned:mode==="DISCOURSE_GUIDED"?buildPlan(task):null};
    if(options.run) Object.assign(item,await request(messages,options.model,options.maxTokens,options.temperature));
    else item.execution="DRY_RUN_NO_MODEL_OUTPUT";
    result.modeOutputs.push(item);
  }
  return result;
}
async function main() {
  const opts=parseArgs(process.argv.slice(2));
  const task=JSON.parse(fs.readFileSync(path.resolve(opts.input),"utf8"));
  if(opts.run && !process.env.OPENAI_API_KEY)throw Error("OPENAI_API_KEY_REQUIRED_FOR_ACTUAL_GENERATION");
  const result=await compare(task,opts);
  if(opts.run){
    const filename=path.resolve(opts.output);
    fs.writeFileSync(filename,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
    process.stdout.write(JSON.stringify({sourceId:result.sourceId,model:result.model,modes:MODES,output:filename})+"\n");
  } else process.stdout.write(JSON.stringify(result,null,2)+"\n");
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MODES,validateTask,buildPlan,makeMessages,parseArgs,compare};
