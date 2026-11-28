'use strict';
const fs=require('node:fs'),path=require('node:path'),{plan,verify}=require('./r6t_writer.cjs');
function paragraphs(s){return s.trim().split(/\r?\n[\t ]*\r?\n(?:[\t ]*\r?\n)*/).filter(Boolean).length;}
function median(a){const s=[...a].sort((a,b)=>a-b),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2;}
function summarize(rows){return Object.fromEntries(['direct','coupled'].map(arm=>{const r=rows.filter(x=>x.arm===arm);return [arm,{calls:r.length,input:r.reduce((n,x)=>n+x.usage.prompt_tokens,0),completion:r.reduce((n,x)=>n+x.usage.completion_tokens,0),tokens:r.reduce((n,x)=>n+x.usage.total_tokens,0),medianRequestMs:median(r.map(x=>x.latencyMs)),paragraphCountMatch:r.filter(x=>x.paragraphs===x.expectedParagraphs).length}];}));}
function analyze(root){const receipt=verify(root);const rows=plan().map(c=>{const r=JSON.parse(fs.readFileSync(path.join(root,c.id+'.result.json')));return {id:c.id,work:c.source.id,arm:c.arm,sourceSHA:c.sourceSHA,promptSHA:c.promptSHA,textSHA:r.textSHA,text:r.text,paragraphs:paragraphs(r.text),expectedParagraphs:c.source.paragraphs.length,usage:r.usage,latencyMs:r.latencyMs};});return {authority:'MECHANICAL_FORMAT_AND_COST_ONLY',receipt,arms:summarize(rows),rows};}
module.exports={analyze,paragraphs,median,summarize};if(require.main===module)console.log(JSON.stringify(analyze(process.argv[2]),null,2));
