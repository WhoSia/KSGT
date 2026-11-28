// Development-only exact planner over manually authored, fact-equivalent variants.
// Variant labels are assertions by the annotator, not verified semantic entailment.
export type Variant={id:string,text:string,requiresPrev?:string[],requiresPrevUnit?:string[],focus?:string,cost:number,needsEvidence?:string[]};
export type Unit={id:string,requires:string[],provides:string[],variants:Variant[]};
export type Task={units:Unit[],known:string[],availableEvidence:string[],requestedEvidence:string[],preferences:{before:string,after:string,weight:number}[]};
export type Plan={order:string[],variants:string[],text:string,cost:number,missingEvidence:string[]};
export function solve(t:Task, mode:'exact'|'greedy'|'fixed'|'order_only'='exact'):Plan|null {
 const n=t.units.length, u=t.units, index=new Map(u.map((x,i)=>[x.id,i]));
 if(n>12||n===0||index.size!==n||u.some(x=>!x.variants.length||new Set(x.variants.map(v=>v.id)).size!==x.variants.length))throw Error('INVALID_UNITS');
 const ev=new Set(t.availableEvidence); const full=(1<<n)-1;
 for(const p of t.preferences)if(!index.has(p.before)||!index.has(p.after)||p.before===p.after||!Number.isSafeInteger(p.weight)||p.weight<0||p.weight>1e6)throw Error('BAD_PREFERENCE');
 const vv=u.flatMap((x,i)=>x.variants.map((v,j)=>({i,j,v}))); if(vv.length>96||vv.some(({v})=>!Number.isSafeInteger(v.cost)||v.cost<0||v.cost>1e6))throw Error('BAD_VARIANT');
 // All variants of a unit must provide the same facts/referents. Adjacent focus is variant-specific.
 type State={mask:number,last:number,cost:number,path:number[]};
 const start:State={mask:0,last:-1,cost:0,path:[]};
 const buckets=Array.from({length:full+1},()=>new Map<number,State>());buckets[0].set(-1,start);
 function next(s:State):State[]{const known=new Set(t.known);for(let i=0;i<n;i++)if(s.mask&(1<<i))for(const a of u[i].provides)known.add(a);
 const prev=s.last<0?undefined:vv[s.last];const prevFocus=prev?.v.focus;
 return vv.flatMap(({i,j,v},k)=>{if(s.mask&(1<<i)||!u[i].requires.every(x=>known.has(x))||!(v.needsEvidence??[]).every(x=>ev.has(x)))return [];
 if(v.requiresPrev&&!v.requiresPrev.includes(prevFocus??''))return [];
 if(v.requiresPrevUnit&&!v.requiresPrevUnit.includes(prev?u[prev.i].id:''))return [];
 if(mode==='order_only'&&j!==0)return [];
 if(mode==='fixed'&&(i!==s.path.length||j!==0))return [];
 const penalty=t.preferences.filter(p=>p.after===u[i].id&&!(s.mask&(1<<index.get(p.before)!))).reduce((a,p)=>a+p.weight,0);
 return [{mask:s.mask|(1<<i),last:k,cost:s.cost+penalty+v.cost,path:[...s.path,k]}];});}
 let best:State|undefined;
 if(mode==='greedy'||mode==='fixed'){let s=start;while(s.mask!==full){const q=next(s).sort((a,b)=>a.cost-b.cost||a.last-b.last)[0];if(!q)return null;s=q;}best=s;}
 else {for(let m=0;m<full;m++)for(const s of buckets[m].values())for(const q of next(s)){const old=buckets[q.mask].get(q.last);if(!old||q.cost<old.cost)buckets[q.mask].set(q.last,q);}best=[...buckets[full].values()].sort((a,b)=>a.cost-b.cost||a.last-b.last)[0];}
 if(!best)return null;
 const path=best.path.map(k=>vv[k]);return {order:path.map(x=>u[x.i].id),variants:path.map(x=>x.v.id),text:path.map(x=>x.v.text).join(' '),cost:best.cost,missingEvidence:[...new Set(t.requestedEvidence)].filter(x=>!ev.has(x))};
}
