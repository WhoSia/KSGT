"use strict";
/** Safe explicit provider routing for G10-P1. No credentials in source or logs.
 * Defaults to OpenAI only when explicitly selected; no accidental key fallback.
 */
const GROQ_URL="https://api.groq.com/openai/v1";
const OPENAI_URL="https://api.openai.com/v1";
function resolveProvider(name,env=process.env) {
  if(!["groq","openai"].includes(name))throw Error("EXPLICIT_PROVIDER_GROQ_OR_OPENAI_REQUIRED");
  const keyName=name==="groq"?"GROQ_API_KEY":"OPENAI_API_KEY";
  const key=env[keyName];
  if(typeof key!=="string"||!key.trim())throw Error(keyName+"_REQUIRED");
  return {name,baseUrl:name==="groq"?GROQ_URL:OPENAI_URL,key};
}
function requestBody(model,messages,temperature,maxTokens){
 if(typeof model!=="string"||!model.trim())throw Error("MODEL_ID_REQUIRED");
 if(!Array.isArray(messages)||!messages.length)throw Error("MESSAGES_REQUIRED");
 if(!Number.isInteger(maxTokens)||maxTokens<1)throw Error("INVALID_MAX_TOKENS");
 if(!Number.isFinite(temperature)||temperature<0||temperature>2)throw Error("INVALID_TEMPERATURE");
 return {model,messages,temperature,max_tokens:maxTokens};
}
async function chat({provider,model,messages,temperature,maxTokens},env=process.env,fetchFn=fetch){
 const {baseUrl,key}=resolveProvider(provider,env);
 const payload=requestBody(model,messages,temperature,maxTokens);
 // Groq GPT-OSS requires a bounded reasoning budget to reserve room for the actual Korean prose.
 if(provider==="groq" && /^openai\/gpt-oss-(20b|120b)$/.test(model)){
   payload.reasoning_effort="low";
   payload.include_reasoning=false;
 }
 const started=performance.now();
 const response=await fetchFn(baseUrl+"/chat/completions",{
  method:"POST",
  headers:{"content-type":"application/json",authorization:"Bearer "+key},
  body:JSON.stringify(payload)
 });
 if(!response.ok){
  // Never print response text: providers may echo private prompt/key metadata.
  const error=Error("PROVIDER_HTTP_"+response.status);
  error.status=response.status;
  const wait=response.headers?.get?.("retry-after");
  if(wait!==null&&wait!==undefined)error.retryAfterSeconds=Number(wait)||null;
  throw error;
 }
 const data=await response.json();
 const output=data?.choices?.[0]?.message?.content;
 if(typeof output!=="string"||!output.trim())throw Error("NO_NONEMPTY_TEXT_COMPLETION");
 return {
  text:output,
  usage:data.usage||null,
  finishReason:data.choices[0]?.finish_reason||null,
  provider,
  responseModel:data.model||model,
  latencyMs:Math.round(performance.now()-started)
 };
}
module.exports={GROQ_URL,OPENAI_URL,resolveProvider,requestBody,chat};
