"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {resolveProvider,requestBody,chat,GROQ_URL}=require("./provider_client_v01.cjs");
test("Groq selection requires its own key and never falls back to OpenAI",()=>{
 assert.throws(()=>resolveProvider("groq",{OPENAI_API_KEY:"openai-only"}),/GROQ_API_KEY_REQUIRED/);
 assert.deepEqual(resolveProvider("groq",{GROQ_API_KEY:"test-secret"}),{name:"groq",baseUrl:GROQ_URL,key:"test-secret"});
 assert.throws(()=>resolveProvider(undefined,{GROQ_API_KEY:"x"}),/EXPLICIT_PROVIDER/);
});
test("body uses supported chat fields, never secret",()=>{
 const body=requestBody("openai/gpt-oss-20b",[{role:"user",content:"한국어 문단"}],0,800);
 assert.equal(body.model,"openai/gpt-oss-20b");assert.equal(body.max_tokens,800);
 assert.deepEqual(Object.keys(body).sort(),["messages","model","temperature","max_tokens"].sort());
});
test("mock request routes only to Groq and does not log credentials",async()=>{
 let called=0;
 const output=await chat({provider:"groq",model:"openai/gpt-oss-20b",
  messages:[{role:"user",content:"한국어로 써라."}],temperature:0,maxTokens:800},
  {GROQ_API_KEY:"SECRET_TEST_KEY"},async(url,opts)=>{
   called++;
   assert.equal(url,GROQ_URL+"/chat/completions");
   assert.equal(opts.headers.authorization,"Bearer SECRET_TEST_KEY");
   assert.ok(!opts.body.includes("SECRET_TEST_KEY"));
   const body=JSON.parse(opts.body);assert.equal(body.reasoning_effort,"low");assert.equal(body.include_reasoning,false);
   return {ok:true,json:async()=>({model:"openai/gpt-oss-20b",
    choices:[{message:{content:"사람이 읽는 한국어."},finish_reason:"stop"}],
    usage:{prompt_tokens:19,completion_tokens:7}})};
 });
 assert.equal(called,1);assert.equal(output.text,"사람이 읽는 한국어.");
 assert.equal(output.usage.prompt_tokens,19);
 assert.equal(output.provider,"groq");
});
test("Qwen Groq non-thinking mode is explicit and model-specific",async()=>{
 await chat({provider:"groq",model:"qwen/qwen3.8-27b",messages:[{role:"user",content:"안내"}],temperature:0.2,maxTokens:1000},
  {GROQ_API_KEY:"TEST"},async(_,opts)=>{
   const body=JSON.parse(opts.body);
   assert.equal(body.reasoning_effort,"none");
   assert.equal(body.include_reasoning,false);
   return {ok:true,json:async()=>({choices:[{message:{content:"안내문입니다."}}]})};
  });
});
test("provider error omits private server response and credential",async()=>{
 await assert.rejects(chat({provider:"groq",model:"x",messages:[{role:"user",content:"P"}],
  temperature:0,maxTokens:12},{GROQ_API_KEY:"SECRET_KEY"},
  async()=>({ok:false,status:429,headers:{get:()=> "3"},text:async()=> "SECRET_KEY"})),
  e=>e.message==="PROVIDER_HTTP_429"&&e.retryAfterSeconds===3&&!e.message.includes("SECRET_KEY"));
});
