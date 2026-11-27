'use strict';
const fs=require('node:fs'),path=require('node:path');
const {works}=require('./r6v_works.cjs'),{verify,sha}=require('./r6v_writer.cjs'),{diagnose}=require('./r6v_cadence.cjs');
const median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
function analyze(root){verify(root);const read=n=>JSON.parse(fs.readFileSync(path.join(root,n)));const rows=works.map(w=>{let arms={};for(const k of ['direct','revise','cadence']){const r=read(w.id+'_'+k+'.result.json'),a=read(w.id+'_'+k+'.attempt.json');arms[k]={text:r.text,usage:r.usage,latency:r.latencyMs,paragraphs:r.text.trim().split(/\n\s*\n/u).length,chars:[...r.text].length,diagnostic:a.diagnostic,observed:diagnose(r.text,w),refrains:w.refrains.map(s=>({s,matched:r.text.trim().split(/\n\s*\n/u).filter(p=>p.endsWith(s)).length}))}}return {id:w.id,requiredParagraphs:w.paragraphs,arms}});
 const totals={};for(const k of ['direct','revise','cadence']){let sum=0,inp=0,out=0,lat=[],format=0;for(const row of rows){const a=row.arms[k];const chain=k==='direct'?[a]:[row.arms.direct,a];for(const x of chain){sum+=x.usage.total_tokens;inp+=x.usage.prompt_tokens;out+=x.usage.completion_tokens;}lat.push(chain.reduce((n,x)=>n+x.latency,0));if(a.paragraphs===row.requiredParagraphs)format++;}totals[k]={input:inp,completion:out,total:sum,medianPipelineMs:median(lat),paragraphMatched:format};}
 return {rows,totals,actualTokens:rows.reduce((n,r)=>n+Object.values(r.arms).reduce((m,a)=>m+a.usage.total_tokens,0),0),cueWorks:rows.filter(r=>r.arms.cadence.diagnostic?.hints.length).length,independentReaders:0};}
module.exports={analyze,median};
if(require.main===module)console.log(JSON.stringify(analyze(process.argv[2]),null,2));
