'use strict';
const len=s=>Array.from(s).length;
const sentences=s=>(s.match(/[.!?](?=\s|$)/g)||[]).length;
function compile(w){
 const us=w.units,n=us.length,ix=new Map(us.map((u,i)=>[u.id,i]));if(!n||n>16||ix.size!==n)throw Error('BAD_UNITS');
 const bit=id=>{if(!ix.has(id))throw Error('UNKNOWN_UNIT:'+id);return 1<<ix.get(id)};
 const mentions=u=>(u.mentions??[]).map(m=>m.kind+':'+m.id);
 const out=[];
 for(const u of us)for(const v of u.variants)if(!v.extra)out.push({...v,ids:[u.id],endFocus:v.focus,endAnchor:u.id,mentions:mentions(u)});
 for(const c of w.spans??[])if(!c.extra)out.push(c);
 const cs=out.map((c,i)=>{const units=c.ids.map(id=>us[ix.get(id)]);if(!units.length||units.some(u=>!u)||new Set(c.ids).size!==c.ids.length||units.some(u=>u.p!==units[0].p)||!Array.isArray(c.endFocus)||!Array.isArray(c.mentions)||typeof c.text!=='string'||!c.text.trim())throw Error('BAD_SPAN');
  const expected=new Set(units.flatMap(mentions));if(expected.size!==new Set(c.mentions).size||c.mentions.some(m=>!expected.has(m)))throw Error('SPAN_MENTION_MISMATCH');
  let internal=0,need=0;for(const u of units){for(const id of u.after)if(!(internal&bit(id)))need|=bit(id);internal|=bit(u.id)}
  // A dependency on a later unit inside a span makes the span impossible, not an external requirement.
  for(const id of c.requires??[])need|=bit(id);
  return {...c,i,p:units[0].p,mask:internal,need};});
 return {us,cs,full:(1<<n)-1};
}
function allowed(g,mask,last,c){if(c.mask&mask||(c.need&mask)!==c.need)return false;const p=Math.min(...g.us.filter((_,i)=>!(mask&(1<<i))).map(u=>u.p));if(c.p!==p)return false;
 const prev=last?.p===p?last:null;
 if(c.ref&&!(prev?.endFocus.length===1&&prev.endFocus[0]===c.ref))return false;
 if(c.prev&&prev?.endAnchor!==c.prev)return false;
 if(c.unique){const seen=new Set(g.us.flatMap((u,i)=>mask&(1<<i)?(u.mentions??[]).filter(m=>m.kind===c.unique.kind).map(m=>m.id):[]));if(seen.size!==1||!seen.has(c.unique.id))return false;}
 return true;
}
function solve(w,{weight=12,fixedOrder=null,exhaustive=false}={}){
 if(!Number.isFinite(weight)||weight<0)throw Error('BAD_WEIGHT');const g=compile(w),memo=new Map();let visited=0;
 if(fixedOrder&&(fixedOrder.length!==g.us.length||new Set(fixedOrder).size!==g.us.length||fixedOrder.some(id=>!g.us.some(u=>u.id===id))))throw Error('BAD_ORDER');
 function rec(mask,last){if(mask===g.full)return {cost:0,chunks:[]};const key=mask+'|'+(last?.i??-1);if(!exhaustive&&memo.has(key))return memo.get(key);visited++;let best=null;
 const pos=fixedOrder?g.us.filter((_,i)=>mask&(1<<i)).length:0;
 for(const c of g.cs){if(fixedOrder&&!c.ids.every((id,j)=>id===fixedOrder[pos+j]))continue;if(!allowed(g,mask,last,c))continue;const r=rec(mask|c.mask,c);if(!r)continue;const cost=len(c.text)+weight*sentences(c.text)+r.cost;if(!best||cost<best.cost)best={cost,chunks:[c,...r.chunks]};}
 if(!exhaustive)memo.set(key,best);return best;}
 const r=rec(0,null);if(!r)return null;let p=-1,text='';for(const c of r.chunks){text+=(p<0?'':p===c.p?' ':'\n\n')+c.text;p=c.p;}return {...r,text,visited,order:r.chunks.flatMap(c=>c.ids),sentences:sentences(text),length:len(text)};
}
module.exports={compile,allowed,solve,len,sentences};
