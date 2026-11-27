'use strict';
// Three sampled locations. The middle sample is not a continuous-time trajectory.
const LOC=['W','D','O'];const words={W:'창가',D:'문가',O:'책상 옆'};
const worlds=LOC.flatMap(start=>LOC.flatMap(mid=>LOC.map(event=>({start,mid,event}))));
const sources=LOC.flatMap(start=>[...LOC,null].map(event=>({start,event,mid:null}))).concat(LOC.map(start=>({start,event:start,mid:start})));
function compatible(w,c){return ['start','mid','event'].every(k=>c[k]==null||c[k]===w[k]);}
function meaning(c){return worlds.map((w,i)=>compatible(w,c)?i:-1).filter(i=>i>=0);}
function assess(source,c){const a=meaning(source),b=meaning(c.claim);return {sourceWorlds:a.length,candidateWorlds:b.length,excluded:a.filter(x=>!b.includes(x)),extra:b.filter(x=>!a.includes(x)),exact:a.length===b.length&&a.every(x=>b.includes(x))};}
function candidates(s){if(!sources.some(x=>JSON.stringify(x)===JSON.stringify(s)))throw Error('INVALID_SOURCE');const loc=words[s.start],end=s.event===null?'':words[s.event]+'에서 ',first='지우는 처음에 '+loc+'에 있었다.',last='나중에 '+end+'책을 펼쳤다.';
 const known=s.mid===null?first+' '+last:first+' 중간에도 '+loc+'에 있었다. '+last;
 const conjunct=s.mid===null?'지우는 처음에는 '+loc+'에 있었고, 나중에 '+end+'책을 펼쳤다.':'지우는 처음과 중간에는 '+loc+'에 있었고, 나중에 '+end+'책을 펼쳤다.';
 return [
 {id:'separate',claim:{...s},text:known},
 {id:'coordinate',claim:{...s},text:conjunct},
 {id:'bare_event',claim:{start:null,mid:null,event:s.event??s.start},text:'지우는 '+words[s.event??s.start]+'에서 책을 펼쳤다.'},
 {id:'assume_endpoint',claim:{start:s.start,mid:null,event:s.start},text:first+' 나중에도 '+loc+'에서 책을 펼쳤다.'},
 // This explicitly asserts all three sampled locations, not necessarily uninterrupted presence.
 {id:'sampled_persistence',claim:{start:s.start,mid:s.start,event:s.start},text:'지우는 처음과 중간에 '+loc+'에 있었고, 나중에 그곳에서 책을 펼쳤다.'},
 ];}
function realize(s){const evaluated=candidates(s).map(c=>({...c,...assess(s,c)}));const byLength=(a,b)=>Array.from(a.text).length-Array.from(b.text).length||a.id.localeCompare(b.id);const sorted=evaluated.slice().sort(byLength),valid=sorted.filter(c=>c.exact);if(!valid.length)throw Error('NO_EXACT_CANDIDATE');return {source:s,naive:sorted[0],chosen:valid[0],candidates:evaluated};}
function receipt(){const rows=sources.map(realize);return {authority:'AUTHORED_FINITE_SAMPLED_LOCATION_SEMANTICS_ONLY',worlds:worlds.length,cases:rows.length,naiveExact:rows.filter(r=>r.naive.exact).length,chosenExact:rows.filter(r=>r.chosen.exact).length,candidates:rows.reduce((n,r)=>n+r.candidates.length,0),exactCandidates:rows.reduce((n,r)=>n+r.candidates.filter(c=>c.exact).length,0),rows};}
module.exports={LOC,worlds,sources,meaning,assess,candidates,realize,receipt};if(require.main===module)console.log(JSON.stringify(receipt(),null,2));
