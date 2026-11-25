// Source-conditioned ordering only. No automatic semantic graph extraction or invented facts.
export type Unit = {id:string; text:string; provides:string[]; requires:string[]};
export type Preference = {before:string; after:string; weight:number};
export type Task = {units:Unit[]; known:string[]; preferences:Preference[]; requiredEvidence:string[]; evidenceAvailable:string[]};
export type Plan = {order:string[]; penalty:number; text:string; missingEvidence:string[]; status:'REVIEW'|'REQUEST_EVIDENCE'};
export function solve(task:Task, greedy=false):Plan|null {
 const {units:u,preferences:p}=task,n=u.length;
 if(n>16||new Set(u.map(x=>x.id)).size!==n)throw Error('INVALID_UNITS');
 const idx=new Map(u.map((x,i)=>[x.id,i]));
 for(const x of p)if(!idx.has(x.before)||!idx.has(x.after)||x.before===x.after||!Number.isSafeInteger(x.weight)||x.weight<0||x.weight>1e6)throw Error('INVALID_PREFERENCE');
 const full=(1<<n)-1;
 function known(mask:number){const s=new Set(task.known);for(let i=0;i<n;i++)if(mask&(1<<i))for(const t of u[i].provides)s.add(t);return s;}
 function choices(mask:number){const k=known(mask);return u.flatMap((x,i)=>mask&(1<<i)||!x.requires.every(t=>k.has(t))?[]:[{i,c:p.filter(y=>y.after===x.id&&!(mask&(1<<idx.get(y.before)!))).reduce((s,y)=>s+y.weight,0)}]);}
 const cost=Array<number>(full+1).fill(Infinity),prev=Array<number>(full+1).fill(-1),pick=Array<number>(full+1).fill(-1);cost[0]=0;
 if(greedy){let mask=0;while(mask!==full){const c=choices(mask).sort((a,b)=>a.c-b.c||a.i-b.i)[0];if(!c)return null;const m=mask|(1<<c.i);cost[m]=cost[mask]+c.c;prev[m]=mask;pick[m]=c.i;mask=m;}}
 else for(let mask=0;mask<full;mask++){if(!Number.isFinite(cost[mask]))continue;for(const c of choices(mask)){const m=mask|(1<<c.i);if(cost[mask]+c.c<cost[m]){cost[m]=cost[mask]+c.c;prev[m]=mask;pick[m]=c.i;}}}
 if(!Number.isFinite(cost[full]))return null;
 const order:number[]=[];for(let m=full;m;m=prev[m])order.push(pick[m]);order.reverse();
 // Audience knowledge and asserted text never grant empirical evidence.
 const available=new Set(task.evidenceAvailable),missingEvidence=[...new Set(task.requiredEvidence)].filter(x=>!available.has(x));
 return {order:order.map(i=>u[i].id),penalty:cost[full],text:order.map(i=>u[i].text).join(' '),missingEvidence,status:missingEvidence.length?'REQUEST_EVIDENCE':'REVIEW'};
}
