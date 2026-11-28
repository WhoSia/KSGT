'use strict';
// Finite strict-event-order abstraction. Simultaneous and interval events are out of scope.
function closure(events,edges){
 const idx=new Map(events.map((x,i)=>[x,i]));if(!events.length||events.length>8||idx.size!==events.length)throw Error('BAD_EVENTS');
 const n=events.length,r=Array(n).fill(0);for(const edge of edges){if(!Array.isArray(edge)||edge.length!==2||!idx.has(edge[0])||!idx.has(edge[1]))throw Error('BAD_EDGE');r[idx.get(edge[0])]|=1<<idx.get(edge[1]);}
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)if(r[i]&(1<<k))r[i]|=r[k];
 if(r.some((x,i)=>x&(1<<i)))return null;
 return events.flatMap((a,i)=>events.filter((_,j)=>r[i]&(1<<j)).map(b=>[a,b]));
}
function worlds(events,edges){const c=closure(events,edges);if(!c)return [];const need=events.map(x=>c.filter(e=>e[1]===x).reduce((m,e)=>m|1<<events.indexOf(e[0]),0));const out=[];
 function rec(mask,path){if(path.length===events.length){out.push(path.join('|'));return;}for(let i=0;i<events.length;i++)if(!(mask&(1<<i))&&(mask&need[i])===need[i])rec(mask|1<<i,[...path,events[i]]);}
 rec(0,[]);return out;}
const key=e=>JSON.stringify(e);
function assess(source,c,{policy='sequence'}={}){
 if(!['sequence','all','none'].includes(policy))throw Error('BAD_POLICY');
 if(!Array.isArray(c.groups)||!c.groups.length||c.groups.some(g=>!Array.isArray(g.events)||!g.events.length||!['sequence','topic','reset'].includes(g.mode)))throw Error('BAD_GROUPS');
 const flat=c.groups.flatMap(g=>g.events);if(flat.length!==source.events.length||new Set(flat).size!==flat.length||flat.some(x=>!source.events.includes(x)))throw Error('BAD_COVERAGE');
 const sc=closure(source.events,source.before);if(!sc)throw Error('CYCLIC_SOURCE');const src=new Set(sc.map(key));const hard=closure(source.events,c.hard??[]);if(!hard)return {admissible:false,reason:'CYCLIC_CANDIDATE'};
 const hardSet=new Set(hard.map(key));const extra=hard.filter(e=>!src.has(key(e))), omitted=sc.filter(e=>!hardSet.has(key(e)));
 // Hypothetical reader policy: sequential groups advance a narrative clock; topic lists do not.
 // This is not a learned or empirically validated model of Korean readers.
 const soft=[];let previous=null;for(const g of c.groups){if(g.mode==='reset'){previous=null;continue;}
 const advances=policy==='all'||(policy==='sequence'&&g.mode==='sequence');
 if(advances){if(previous)for(const a of previous.events)for(const b of g.events)soft.push([a,b]);for(let i=0;i<g.events.length-1;i++)soft.push([g.events[i],g.events[i+1]]);}
 previous=advances?g:null;}
 const sourceWorlds=worlds(source.events,source.before), sourceSet=new Set(sourceWorlds), candidates=worlds(source.events,[...(c.hard??[]),...soft]);
 const compatible=candidates.filter(w=>sourceSet.has(w));const lost=sourceWorlds.length-compatible.length;
 return {admissible:!extra.length&&!omitted.length,extra,omitted,soft,sourceWorlds:sourceWorlds.length,compatibleWorlds:compatible.length,lostWorlds:lost,risk:lost/sourceWorlds.length,chars:Array.from(c.text).length};
}
function rank(source,weight=40,policy='sequence'){if(!Number.isFinite(weight)||weight<0)throw Error('BAD_WEIGHT');const rows=source.candidates.map(c=>({...c,...assess(source,c,{policy})}));const valid=rows.filter(c=>c.admissible);const min=w=>valid.slice().sort((a,b)=>(a.chars+w*a.risk)-(b.chars+w*b.risk)||a.id.localeCompare(b.id))[0]??null;return {id:source.id,baseline:min(0),selected:min(weight),rows};}
module.exports={closure,worlds,assess,rank};
