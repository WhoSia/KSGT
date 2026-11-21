"use strict";
/* KSGT R5h / Korean source-role-bound micro-realizer.
 * Source frames/predicate variants are author-written: no automatic semantic parser.
 * A 120B selector may choose ONLY an index into source-preserving output clauses.
 * Actual Korean prose is emitted by this compiler, not copied from model free text.
 * Novelty and universal writing-quality NOT claimed (Roh & Lee 2003 prior art).
 */
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const {chat,resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const fixture=require("./fixtures/r5h_eight_native_korean_actor_bound_scenes_v01.json");
const MODEL="openai/gpt-oss-120b",MAX=1450;
const SETTINGS=Object.freeze({provider:"groq",model:MODEL,temperature:0,maxTokens:MAX});
const sha=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const ok=(cond,msg)=>{if(!cond)throw Error(msg)};
function lastHangulChar(s){
 const match=[...s].filter(ch=>ch.charCodeAt(0)>=0xAC00&&ch.charCodeAt(0)<=0xD7A3);
 ok(match.length&&match.at(-1)===s.at(-1),"UNSUPPORTED_KOREAN_NAME_"+s);
 return match.at(-1);
}
function particle(name,form){
 ok(["TOPIC","NOM"].includes(form),"WRONG_KOREAN_PARTICLE_TYPE");
 const last=lastHangulChar(name);
 const hasCoda=(last.charCodeAt(0)-0xAC00)%28!==0;
 return form==="TOPIC"?(hasCoda?"은":"는"):(hasCoda?"이":"가");
}
function validate(root=fixture){
 ok(root.schema==="ksgt.g10p2.r5h.eight-novel-source-bound-korean-scenes.v1"&&
 root.sourceAuthority==="RESEARCHER_WRITTEN_ROLE_FRAMES_AND_PREDICATE_ALTERNATIVES_NO_HUMAN_GOLD"&&
 root.model===MODEL&&root.sampledBeforeModelCalls===true,"R5H_SOURCE_AUTHORITY");
 ok(root.works.length===8,"R5H_SOURCE_COUNT");
 const all=new Set();
 for(const w of root.works){
  ok(/^R5H_[A-Z_]+$/.test(w.id)&&!all.has(w.id)&&w.genre==="scene","R5H_SOURCE_DUPLICATE");
  all.add(w.id);
  ok(Array.isArray(w.entities)&&w.entities.length===2&&w.entities[0].id==="A"&&w.entities[1].id==="B"&&
    w.entities[0].name!==w.entities[1].name&&
    w.entities.every(e=>e.name.length>=2&&e.name.length<=5&&lastHangulChar(e.name)),
    "R5H_CHARACTER_IDS");
  ok(typeof w.task==="string"&&w.task.length>=30&&
     typeof w.license==="string"&&w.license.length>=30&&
     Array.isArray(w.frames)&&w.frames.length===6,"R5H_SCENE_SCHEMA");
  const expected=[null,"A","A","B","B",null];
  w.frames.forEach((f,i)=>{
   ok(f.id==="S"+(i+1)&&f.subjectEntityID===expected[i]&&
    f.encodedBy==="RESEARCHER_AUTHORED_VALIDATED_NOT_MODEL_PARSED"&&
    typeof f.sourceFact==="string"&&f.sourceFact.length>=15&&
    Array.isArray(f.predicateChoices)&&f.predicateChoices.length===2&&
    f.predicateChoices.every(v=>typeof v==="string"&&v.length>=12&&v.endsWith("."))&&
    f.predicateChoices[0]!==f.predicateChoices[1],"R5H_BAD_FRAME_"+w.id+"_"+i);
   if(i===0||i===5)ok(f.kind!=="character_event","R5H_BACKGROUND_ROLE");
   else ok(f.kind==="character_event","R5H_EVENT_ROLE");
  });
 }
 return root;
}
function frameOptions(w,index){
 const f=w.frames[index],name=w.entities.find(e=>e.id===f.subjectEntityID)?.name;
 const choices=[];
 if(!name){
  f.predicateChoices.forEach((surface,variant)=>choices.push({
   id:f.id,option:choices.length,variant,subjectForm:"NONE",actorID:null,rawPredicate:surface,text:surface}));
 }else{
  for(let variant=0;variant<2;variant++){
   const formList=["TOPIC","NOM"];
   // Author-predeclared conditional referential licensing; no ZERO over subject switch.
   if(index>0&&w.frames[index-1].subjectEntityID===f.subjectEntityID)formList.push("ZERO");
   for(const subjectForm of formList){
    const prefix=subjectForm==="ZERO"?"":name+particle(name,subjectForm)+" ";
    choices.push({id:f.id,option:choices.length,variant,
     subjectForm,actorID:f.subjectEntityID,rawPredicate:f.predicateChoices[variant],
     text:prefix+f.predicateChoices[variant]});
   }
  }
 }
 ok(choices.every(x=>x.option>=0&&typeof x.text==="string"),"R5H_OPTION");
 return choices;
}
function defaultIndices(w){return w.frames.map((f,i)=>frameOptions(w,i)[0].option)}
function buildSource(w){
 return {genre:w.genre,place:w.place,writingGoal:w.task,sourceConstraints:w.license,
   namedCharacters:w.entities,sourceFactsInSceneOrder:w.frames.map(f=>({
     id:f.id,subjectEntityID:f.subjectEntityID,sourceFact:f.sourceFact}))};
}
function render(w,indices){
 ok(Array.isArray(indices)&&indices.length===6,"R5H_SIX_CHOICES_REQUIRED");
 const trace=[],sentences=[];
 for(let i=0;i<w.frames.length;i++){
  const frame=w.frames[i],candidates=frameOptions(w,i),id=indices[i];
  ok(Number.isInteger(id)&&id>=0&&id<candidates.length,"R5H_NONEXISTENT_SURFACE_OPTION_"+frame.id);
  const t=candidates[id];
  ok(t.actorID===frame.subjectEntityID,"R5H_ACTOR_BINDING_VIOLATION");
  ok(t.subjectForm!=="ZERO"||w.frames[i-1]?.subjectEntityID===t.actorID,
   "R5H_ILLEGAL_ZERO_ANAPHORA");
  trace.push({frameID:frame.id,sourceSHA256:sha(frame.sourceFact),
    actorID:t.actorID,subjectForm:t.subjectForm,predicateVariant:t.variant,
    outputText:t.text,outputSHA256:sha(t.text)});
  sentences.push(t.text);
 }
 return {text:sentences.join(" "),trace,sourceWork:w.id,
  authorizedPredicateFrames:trace.length,semanticRoleAuthority:"RESEARCHER_WRITTEN_TRUSTED_TEMPLATES_ONLY",
  outputSHA256:sha(sentences.join(" "))};
}
function selectorPrompt(w){
 const payload={task:"다음 고정된 한국어 장면을 가장 자연스럽게 읽히는 여섯 문장으로 실현한다. 출력은 문장이 아니라 각 문장에 사용할 안전한 후보 번호만 반환한다.",
   source:buildSource(w),
   choices:w.frames.map((f,i)=>({id:f.id,options:frameOptions(w,i).map(c=>({
     option:c.option,subjectForm:c.subjectForm,variant:c.variant,text:c.text
   }))})),
   constraints:["내용·등장인물·인물별 행동·소유자·부정 조건·시간 범위를 바꾸지 않는다.",
     "반복된 인물의 주어는 직전 문장에서도 같은 인물을 주어로 썼을 때에만 생략하는 선택지가 제공된다.",
     "매 문장에 반드시 단 하나의 후보 번호를 고른다. 제안되지 않은 문장을 새로 쓰지 않는다.",
     "자연스러운 한국어 문장 연결과 리듬, 지나친 은/는 반복 회피를 기준으로 전체 여섯 문장을 함께 살핀다.",
     "JSON 객체 하나만 반환: {\"choices\":[{\"id\":\"S1\",\"option\":0}, ... ,{\"id\":\"S6\",\"option\":0}]}."],
   sourceAuthorityWarning:"사전에 사람이 작성한 안전 후보 목록이지, 모델이 원문 사실을 재추출하거나 자유 생성하는 영역은 아니다."
 };
 return [{role:"system",content:"한국어 산문 편집자로서 제시된 완전한 문장 후보만 선택한다. 등장인물과 사건을 바꾸는 새로운 문장은 쓸 수 없다."},
  {role:"user",content:JSON.stringify(payload)}];
}
function directPrompt(w){
 const payload={task:w.task,source:buildSource(w),
   instruction:"같은 원천으로 자연스럽고 아름다운 한국어 소설 장면을 완결한다. 말투는 절제하고, 사건을 새로 만들거나 등장인물의 행동·소유물을 바꾸지 않는다. 장면의 뜻을 해설하지 않으며, 문단만 출력한다. 여섯 원천 사실의 인물/대상 관계와 모든 제약을 지키되 문장을 자연스럽게 연결한다."};
 return [{role:"system",content:"원천 사실을 보존하며 자연스럽고 세련된 한국어 문학 산문을 쓰는 작가다."},
  {role:"user",content:JSON.stringify(payload)}];
}
function planCalls(){
 validate();
 const cells=[];
 for(const [i,w] of fixture.works.entries()){
  const arms=i%2===0?["DIRECT","SELECTOR"]:["SELECTOR","DIRECT"];
  for(const arm of arms){
   const prompt=arm==="DIRECT"?directPrompt(w):selectorPrompt(w);
   cells.push({id:w.id+"_"+arm,sourceWork:w.id,arm,model:MODEL,
    sourceSHA256:sha(buildSource(w)),candidateSHA256:sha(w.frames.map((_,j)=>frameOptions(w,j))),
    messages:prompt,promptSHA256:sha(prompt)});
  }
 }
 ok(cells.length===16&&new Set(cells.map(c=>c.id)).size===16,"R5H_CALL_COUNT");
 return cells;
}
function planHash(cells){return sha({schema:"ksgt.g10p2.r5h.16-live-120b-role-bound-native-surface.v1",
 settings:SETTINGS,cells})}
function parseSelection(text,w){
 let obj;try{obj=JSON.parse(text.trim())}catch{return {status:"NON_JSON",indices:defaultIndices(w)}}
 if(!obj||Array.isArray(obj)||Object.keys(obj).join("|")!=="choices"||
    !Array.isArray(obj.choices)||obj.choices.length!==6)
  return {status:"BAD_SELECTION_SCHEMA",indices:defaultIndices(w)};
 const indices=[];
 for(let i=0;i<6;i++){
  const x=obj.choices[i];
  if(!x||typeof x!=="object"||Array.isArray(x)||Object.keys(x).sort().join("|")!=="id|option"||
    x.id!=="S"+(i+1)||!Number.isInteger(x.option)||!frameOptions(w,i).some(c=>c.option===x.option))
   return {status:"UNLICENSED_OR_MISSING_OPTION",indices:defaultIndices(w)};
  indices.push(x.option);
 }
 return {status:"LICENSED_OPTION_SELECTION",indices};
}
function save(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n",{flag:"wx",mode:0o600})}
function readReceipts(root,cells){
 const dir=path.join(root,"responses"),summary=JSON.parse(fs.readFileSync(path.join(dir,"summary.json"),"utf8"));
 ok(summary.planHash===planHash(cells)&&summary.rows.length===16,"R5H_PLAN_SUMMARY_MISMATCH");
 for(const ext of [".attempt.json",".result.json"]){
  const received=fs.readdirSync(dir).filter(f=>f.endsWith(ext));
  ok(received.length===16&&received.every(f=>cells.some(c=>f===c.id+ext)),
  "R5H_MISSING_OR_UNLICENSED_RAW_RECEIPTS_"+ext);
 }
 return new Map(cells.map(cell=>{
  const a=JSON.parse(fs.readFileSync(path.join(dir,cell.id+".attempt.json"),"utf8"));
  const r=JSON.parse(fs.readFileSync(path.join(dir,cell.id+".result.json"),"utf8"));
  ok(a.id===cell.id&&a.planHash===planHash(cells)&&a.promptSHA256===cell.promptSHA256&&
   a.sourceSHA256===cell.sourceSHA256&&a.candidateSHA256===cell.candidateSHA256&&
   r.id===cell.id&&r.promptSHA256===cell.promptSHA256&&
   r.sourceSHA256===cell.sourceSHA256&&r.candidateSHA256===cell.candidateSHA256&&
   r.modelRequested===MODEL&&r.responseModel===MODEL&&r.status==="GENERATED"&&
   r.finishReason==="stop"&&sha(r.text)===r.textSHA256&&
   Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0,
   "R5H_PROVENANCE_OR_RESPONSE_FAILURE_"+cell.id);
  return [cell.id,r];
 }));
}
function score(root){
 const cells=planCalls(),receipts=readReceipts(root,cells);
 const rows=fixture.works.map(w=>{
  const direct=receipts.get(w.id+"_DIRECT"),selected=receipts.get(w.id+"_SELECTOR");
  const parsed=parseSelection(selected.text,w);
  const compiled=render(w,parsed.indices),base=render(w,defaultIndices(w));
  return {sourceWork:w.id,sourceAuthority:fixture.sourceAuthority,task:w.task,license:w.license,
   source:buildSource(w),direct:{text:direct.text,outputSHA256:sha(direct.text),
    modelTokens:direct.usage.total_tokens},
   selector:{rawModelText:selected.text,responseSHA256:sha(selected.text),
    modelTokens:selected.usage.total_tokens,status:parsed.status,
    selectedIndices:parsed.indices},
   compiledSelected:compiled,compiledDefault:base,
   selectionsChangedFromDefault:parsed.indices.filter((v,i)=>v!==defaultIndices(w)[i]).length,
   eligibleZeroCount:compiled.trace.filter(t=>t.subjectForm==="ZERO").length,
   deterministicSourceFramesEmitted:compiled.trace.length,
   compiledAndDefaultIdentical:compiled.text===base.text};
 });
 const byArm={
  DIRECT120B:{newProviderCalls:8,completeProseTexts:8,
   modelTokens:rows.reduce((n,w)=>n+w.direct.modelTokens,0)},
  ROLE_COMPILED120B:{newProviderCalls:8,completeProseTexts:8,
   modelTokens:rows.reduce((n,w)=>n+w.selector.modelTokens,0),
   validFiniteSelections:rows.filter(w=>w.selector.status==="LICENSED_OPTION_SELECTION").length,
   selectedZeroAnaphors:rows.reduce((n,w)=>n+w.eligibleZeroCount,0),
   modelChoicesDifferentFromDefault:rows.reduce((n,w)=>n+w.selectionsChangedFromDefault,0)},
  COMPILED_DEFAULT:{newProviderCalls:0,completeProseTexts:8,modelTokens:0}
 };
 return {schema:"ksgt.g10p2.r5h.actual-korean-argument-binding-micro-realizer.v1",
  newProviderCalls:16,originalSourceScenes:8,frameCount:48,completeKoreanProseTexts:24,
  deterministicCompilerModelCalls:0,sourceScope:"NEW_AUTHOR_SYNTHETIC_SCENE_EVIDENCE",
  semanticGuarantee:"COMPILER_ROLES_ONLY_ASSUMING_RESEARCHER_WRITTEN_PREDICATES_ARE_VALID",
  independentNativeKoreanReaderVotes:0,independentSourceSemanticGold:0,
  trainingNewNeuralModel:false,qualitySuperiority:"UNPROVEN",byArm,rows};
}
function readingPacket(s){
 const p=["# R5h — 논항 결속형 한국어 산문 실제 생성 (8개 × 3경로)",
 "모든 조건은 연구자가 새로 작성한 허구 장면의 정확히 여섯 사실을 공유한다. DIRECT는 강한 자유 120B 모델 본문, COMPILED_DEFAULT는 0모델호출 정적 문장, ROLE_COMPILED는 실제 120B가 유한한 한국어 문장 후보를 선택해 Node 코드가 조립한 결과다.",
 "소설의 미감과 문장 호흡은 독립적으로 검증되지 않았으며 고정 템플릿은 어색할 수 있다. 각 문단의 논항 추적 결과는 모델의 의미 판정이 아니라 코드가 출력했다."];
 s.rows.forEach((r,i)=>{
  p.push("\n---\n\n## "+(i+1)+". "+r.sourceWork);
  p.push("**요청:** "+r.task+"\n\n**장면 제한:** "+r.license+"\n\n**원천 6개**\n"+
    r.source.sourceFactsInSceneOrder.map(f=>f.id+" ["+(f.subjectEntityID||"환경/마무리")+"] "+f.sourceFact).join("\n"));
  p.push("### A. GPT-OSS 120B 자유 한국어 산문 ("+r.direct.modelTokens+" 모델 토큰)\n\n"+r.direct.text);
  p.push("### B. 논항이 고정된 컴파일러 기본문 (0 모델 토큰)\n\n"+r.compiledDefault.text);
  p.push("### C. 120B 후보 선택 + 한국어 문장 컴파일 ("+r.selector.modelTokens+" 모델 토큰)\n\n"+
    r.compiledSelected.text+"\n\n선택 형식: "+r.selector.status+"; 모델이 기본문과 다르게 고른 문장 "+r.selectionsChangedFromDefault+
    "/6; 컴파일한 합법 생략 주어 "+r.eligibleZeroCount+"/6");
  p.push("**실제 문장/논항 추적:**\n"+r.compiledSelected.trace.map(t=>
   t.frameID+" / 행위자 "+(t.actorID||"없음")+" / "+t.subjectForm+" / "+t.outputText).join("\n"));
 });
 p.push("\n독립 한국어 문장 품질 판정 0건. 원본은 실제 120B 모델 16회+0회 고정 컴파일러 8편으로, 24회 모델 호출을 뜻하지 않는다.");
 return p.join("\n\n")+"\n";
}
async function run(root,{invoke=chat}={}){
 ok(!fs.existsSync(root),"R5H_REFUSE_EXISTING_DIR");
 const cells=planCalls();
 fs.mkdirSync(root,{recursive:false,mode:0o700});
 save(path.join(root,"frozen-source-and-selector-options.json"),
  {schema:fixture.schema,sourceAuthority:fixture.sourceAuthority,sourceSHA256:sha(fixture),
   planHash:planHash(cells),works:fixture.works.map(w=>({
    id:w.id,source:buildSource(w),allowedOptions:w.frames.map((_,i)=>frameOptions(w,i))
   })),calls:cells.map(({messages,...x})=>x)});
 const dir=path.join(root,"responses");fs.mkdirSync(dir,{mode:0o700});const summaries=[];
 for(const c of cells){
  save(path.join(dir,c.id+".attempt.json"),
   {id:c.id,planHash:planHash(cells),sourceSHA256:c.sourceSHA256,candidateSHA256:c.candidateSHA256,promptSHA256:c.promptSHA256});
  let result;
  try{
   const r=await invoke({provider:"groq",model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});
   result={id:c.id,arm:c.arm,sourceWork:c.sourceWork,sourceSHA256:c.sourceSHA256,candidateSHA256:c.candidateSHA256,
    promptSHA256:c.promptSHA256,modelRequested:MODEL,responseModel:r.responseModel,
    text:r.text,textSHA256:sha(r.text),usage:r.usage,finishReason:r.finishReason,
    latencyMs:r.latencyMs,status:r.finishReason==="stop"?"GENERATED":"INCOMPLETE"};
  }catch(e){
   result={id:c.id,arm:c.arm,sourceWork:c.sourceWork,sourceSHA256:c.sourceSHA256,
    candidateSHA256:c.candidateSHA256,promptSHA256:c.promptSHA256,modelRequested:MODEL,
    status:"PROVIDER_ERROR",errorCode:e.status||e.code||e.message||"UNKNOWN"};
  }
  save(path.join(dir,c.id+".result.json"),result);
  summaries.push({id:c.id,status:result.status,tokens:result.usage?.total_tokens||0});
 }
 save(path.join(dir,"summary.json"),{planHash:planHash(cells),rows:summaries});
 ok(summaries.every(s=>s.status==="GENERATED"),"R5H_PARTIAL_PROVIDER_RESULTS_RAW_RETAINED");
 const s=score(root);save(path.join(root,"final-score.json"),s);
 fs.writeFileSync(path.join(root,"plain-Korean-full-24-scenes-and-role-traces.md"),readingPacket(s),{flag:"wx",mode:0o600});
 return s;
}
async function main(args){
 if(args[0]==="--preflight"&&args.length===1){
  const p=planCalls();console.log(JSON.stringify({sourceWorks:fixture.works.length,
   calls:p.length,frames:fixture.works.reduce((n,w)=>n+w.frames.length,0),
   outputTexts:24,planHash:planHash(p),
   works:fixture.works.map(w=>({id:w.id,candidates:w.frames.map((_,i)=>frameOptions(w,i).length),
    defaultProse:render(w,defaultIndices(w)).text})),
   cells:p.map(({messages,...other})=>other)}));return;
 }
 if(args[0]==="--execute"&&args.length===2){
  resolveProvider("groq");const s=await run(args[1]);const {rows,...out}=s;
  console.log("R5h-native-Korean-role-compiler",JSON.stringify(out));return;
 }
 if(args[0]==="--score"&&args.length===2){
  const s=score(args[1]),{rows,...out}=s;console.log(JSON.stringify(out,null,2));return;
 }
 throw Error("Usage: --preflight | --execute NEW_DIR | --score EXISTING_DIR");
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error("R5H_FAILED_RAW_RETAINED",e.message);process.exitCode=1});
module.exports={fixture,SETTINGS,lastHangulChar,particle,validate,frameOptions,defaultIndices,
 buildSource,render,selectorPrompt,directPrompt,planCalls,planHash,parseSelection,
 readReceipts,score,readingPacket,run};
