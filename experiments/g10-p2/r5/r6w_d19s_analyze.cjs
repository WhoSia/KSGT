'use strict';
const fs=require('node:fs'),path=require('node:path');
const w=require('./r6w_d19s_writer.cjs'),frozen=require('./r6w_d19s_manifest.json');
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function summarize(rows){return {n:rows.length,meanChars:mean(rows.map(x=>x.chars)),meanTokens:mean(rows.map(x=>x.tokens)),meanLatencyMs:mean(rows.map(x=>x.latencyMs)),paragraphsCorrect:rows.filter(x=>x.paragraphs===2).length,targeted:rows.filter(x=>x.targetHit!==null).length,targetHits:rows.filter(x=>x.targetHit===true).length};}
function analyze(root){
 const verification=w.verify(root);
 const rows=frozen.cases.map(c=>{
  const r=JSON.parse(fs.readFileSync(path.join(root,c.id+'.result.json'),'utf8'));
  const chars=w.count(r.text),paragraphs=r.text.trim().split(/\n\s*\n/u).length;
  return {id:c.id,family:c.family,genre:c.genre,richness:c.richness,length:c.length,license:c.license,chars,paragraphs,targetHit:c.target?chars>=c.target[0]&&chars<=c.target[1]:null,tokens:r.usage.total_tokens,latencyMs:r.latencyMs,textSHA:r.textSHA};
 });
 const groups=Object.fromEntries(['SHORT','LONG','FLEX'].map(x=>[x,summarize(rows.filter(r=>r.length===x))]));
 const families=[...new Set(rows.map(r=>r.family))];
 const index=new Map(rows.map(r=>[r.id,r]));
 const deltas=[];
 for(const family of families)for(const richness of ['CORE','RICH'])for(const license of ['STRICT','BOUNDED']){
  const short=index.get([family,richness,'SHORT',license].join('__')),long=index.get([family,richness,'LONG',license].join('__')),flex=index.get([family,richness,'FLEX',license].join('__'));
  deltas.push({family,richness,license,longMinusShort:long.chars-short.chars,flexChars:flex.chars,longMinusShortTokens:long.tokens-short.tokens,shortHit:short.targetHit,longHit:long.targetHit});
 }
 const interactions=families.map(family=>{const get=(richness,license)=>deltas.find(d=>d.family===family&&d.richness===richness&&d.license===license).longMinusShort;return {family,richnessModerationStrict:get('RICH','STRICT')-get('CORE','STRICT'),richnessModerationBounded:get('RICH','BOUNDED')-get('CORE','BOUNDED'),licenseModerationCore:get('CORE','BOUNDED')-get('CORE','STRICT'),licenseModerationRich:get('RICH','BOUNDED')-get('RICH','STRICT')};});
 return {verification,groups,families:Object.fromEntries(families.map(f=>[f,summarize(rows.filter(r=>r.family===f))])),rows,deltas,interactions,scope:'Descriptive achieved-length and cost only. No semantic fidelity, reader quality, significance or independent human score inferred.'};
}
module.exports={summarize,analyze};
if(require.main===module){
 const root=process.argv[2];if(!root)throw Error('ROOT_REQUIRED');
 console.log(JSON.stringify(analyze(root),null,2));
}
