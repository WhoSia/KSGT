import crypto from 'node:crypto';
import {coreDescriptor,contentFactors} from '../g9-p36-r6/factor_r6.mjs';

export const LAW=Object.freeze({
 version:'C3-R8-PFE-v1',
 nullVersion:'C3-R8-FAMILY-ADJACENCY-NULL-v1',
 nullReplicates:127,
 nullSeed:'KSGT-G9-P36-R8-20260925',
 alpha:0.05,
 globalAllPairs:false
});
const FAMILIES=new Map(Object.entries({
 add:'ADD',include:'ADD',provide:'ADD',incorporate:'ADD',introduce:'ADD',append:'ADD',
 revise:'REVISE',update:'REVISE',modify:'REVISE',change:'REVISE',rewrite:'REVISE',edit:'REVISE',correct:'REVISE',
 clarify:'CLARIFY',explain:'CLARIFY',discuss:'CLARIFY',describe:'CLARIFY',elaborate:'CLARIFY',
 analyze:'ANALYZE',analyse:'ANALYZE',evaluate:'ANALYZE',assess:'ANALYZE',examine:'ANALYZE',investigate:'ANALYZE',
 show:'SHOW',demonstrate:'SHOW',indicate:'SHOW',report:'SHOW',present:'SHOW',
 run:'RUN',conduct:'RUN',perform:'RUN',execute:'RUN',
 compare:'COMPARE',contrast:'COMPARE',
 release:'RELEASE',publish:'RELEASE',share:'RELEASE'
}));
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,;:!?()[\]{}*_]+/g,' ').replace(/\s+/g,' ').trim();
const uniq=a=>[...new Set(a)].sort();
const pairKey=(a,b)=>sha([a,b].sort().join('\n'));
const familyOf=p=>FAMILIES.get(String(p||'').toLowerCase())||('EXACT:'+String(p||'').toLowerCase());
const bigrams=b=>new Set(contentFactors(b).filter(x=>x.startsWith('ARG1_BIGRAM|')).map(x=>x.slice(12)));
const content=b=>new Set(contentFactors(b));
function chainExists(edges){const es=[...edges].map(x=>x.split('>'));const next=new Map();for(const [a,b] of es){if(!next.has(a))next.set(a,new Set());next.get(a).add(b);}for(const [,b] of es)if(next.has(b)&&next.get(b).size)return true;return false;}
function complement(A,B){let l=0,r=0;for(const x of A)if(!B.has(x))l++;for(const x of B)if(!A.has(x))r++;return {pass:l>0&&r>0,left_unique:l,right_unique:r};}
export function protectedCore(item,arm='family'){
 const c=coreDescriptor(item.bcog);if(!c)return null;
 const key={...c,predicate:arm==='family'?familyOf(c.predicate):c.predicate,rebuttal_label:item.rebuttal_label,review_perspective:item.perspective};
 return {descriptor:key,hash:sha(JSON.stringify(key)),predicate_family:familyOf(c.predicate),predicate:c.predicate};
}
export function analyze(items,arm='family'){
 const post=new Map(),meta=new Map();
 for(const item of items){const k=protectedCore(item,arm),edges=bigrams(item.bcog),ct=content(item.bcog);if(!k||!edges.size||!ct.size)continue;const m={item,key:k,edges,content:ct,text_hash:sha(norm(item.text))};meta.set(item.id,m);for(const e of edges){const pk=k.hash+'|'+e;if(!post.has(pk))post.set(pk,[]);post.get(pk).push(item.id);}}
 const pairEdges=new Map();let postings=0;
 for(const [k,ids0] of post){const ids=uniq(ids0);postings+=ids.length;const edge=k.slice(k.indexOf('|')+1);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pk=pairKey(ids[i],ids[j]);if(!pairEdges.has(pk))pairEdges.set(pk,{ids:[ids[i],ids[j]],shared:new Set()});pairEdges.get(pk).shared.add(edge);}}
 const witnesses=[];let exploratory=0,chain=0,primary=0;
 for(const [pk,p] of pairEdges){const A=meta.get(p.ids[0]),B=meta.get(p.ids[1]);if(!A||!B||A.key.hash!==B.key.hash||A.text_hash===B.text_hash)continue;const comp=complement(A.content,B.content);if(!comp.pass)continue;const shared=uniq([...p.shared]);exploratory++;const ch=shared.length>=2&&chainExists(new Set(shared));if(ch)chain++;const cross=A.item.paper!==B.item.paper;if(ch&&cross)primary++;witnesses.push({pair_key:pk,left:{id:A.item.id,paper:A.item.paper,text:A.item.text,predicate:A.key.predicate},right:{id:B.item.id,paper:B.item.paper,text:B.item.text,predicate:B.key.predicate},predicate_family:A.key.predicate_family,rebuttal_label:A.item.rebuttal_label,perspective:A.item.perspective,shared_edges:shared,connected_chain:ch,cross_paper:cross,complementarity:comp});}
 const prim=witnesses.filter(x=>x.connected_chain&&x.cross_paper);
 return {stats:{items:meta.size,relation_postings:postings,shared_pair_keys:pairEdges.size,exploratory_pairs:exploratory,chain_pairs:chain,primary_cross_paper_pairs:primary,distinct_primary_papers:new Set(prim.flatMap(x=>[x.left.paper,x.right.paper])).size,distinct_primary_families:new Set(prim.map(x=>x.predicate_family)).size,global_all_pairs:false},witnesses:witnesses.sort((a,b)=>b.shared_edges.length-a.shared_edges.length||a.pair_key.localeCompare(b.pair_key)),meta};
}
function hashOrder(seed,x){return sha(seed+'|'+x);}
function pseudoMeta(items,rep){
 const buckets=new Map();
 for(const item of items){const k=protectedCore(item,'family'),edges=[...bigrams(item.bcog)],ct=content(item.bcog);if(!k||!edges.length||!ct.size)continue;if(!buckets.has(k.hash))buckets.set(k.hash,[]);buckets.get(k.hash).push({item,key:k,edges,content:ct,text_hash:sha(norm(item.text))});}
 const out=new Map();
 for(const [core,xs] of buckets){const occ=[];for(const x of xs)for(let i=0;i<x.edges.length;i++){const [l,r]=x.edges[i].split('>');occ.push({id:x.item.id,l,r,slot:i});}const slots=[...occ].sort((a,b)=>hashOrder(LAW.nullSeed+'|slot|'+rep+'|'+core,a.id+'|'+a.slot+'|'+a.l).localeCompare(hashOrder(LAW.nullSeed+'|slot|'+rep+'|'+core,b.id+'|'+b.slot+'|'+b.l)));const rights=occ.map((o,i)=>({r:o.r,i})).sort((a,b)=>hashOrder(LAW.nullSeed+'|right|'+rep+'|'+core,a.r+'|'+a.i).localeCompare(hashOrder(LAW.nullSeed+'|right|'+rep+'|'+core,b.r+'|'+b.i)));const by=new Map();for(let i=0;i<slots.length;i++){const o=slots[i],e=o.l+'>'+rights[i].r;if(!by.has(o.id))by.set(o.id,new Set());by.get(o.id).add(e);}for(const x of xs)out.set(x.item.id,{...x,edges:by.get(x.item.id)||new Set()});}
 return out;
}
function countPrimary(meta){const post=new Map();for(const [id,x] of meta)for(const e of x.edges){const k=x.key.hash+'|'+e;if(!post.has(k))post.set(k,[]);post.get(k).push(id);}const pairs=new Map();for(const [k,ids0] of post){const ids=uniq(ids0),edge=k.slice(k.indexOf('|')+1);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pk=pairKey(ids[i],ids[j]);if(!pairs.has(pk))pairs.set(pk,{ids:[ids[i],ids[j]],shared:new Set()});pairs.get(pk).shared.add(edge);}}let n=0;for(const p of pairs.values()){const A=meta.get(p.ids[0]),B=meta.get(p.ids[1]);if(!A||!B||A.item.paper===B.item.paper||A.text_hash===B.text_hash||!complement(A.content,B.content).pass)continue;if(p.shared.size>=2&&chainExists(p.shared))n++;}return n;}
export function nullCourt(items,observed){const vals=[];for(let r=0;r<LAW.nullReplicates;r++)vals.push(countPrimary(pseudoMeta(items,r)));const s=[...vals].sort((a,b)=>a-b),p95=s[Math.min(s.length-1,Math.floor(.95*s.length))]??0,ge=vals.filter(x=>x>=observed).length,p=(1+ge)/(1+vals.length);return {replicates:vals.length,observed,null_mean:vals.reduce((a,b)=>a+b,0)/(vals.length||1),null_min:s[0]??0,null_median:s[Math.floor(s.length/2)]??0,null_p95:p95,null_max:s.at(-1)??0,plus_one_p:p,pass:observed>0&&observed>p95&&p<=LAW.alpha};}
export function ledger(items){const rows=[];for(const item of items){const ex=protectedCore(item,'exact'),fa=protectedCore(item,'family'),ed=uniq([...bigrams(item.bcog)]),ct=uniq([...content(item.bcog)]);if(!ex||!fa||!ed.length)continue;rows.push([item.id,item.paper,ex.hash,fa.hash,fa.predicate_family,sha(norm(item.text)),ed.join(';'),ct.join(';')].join('\t'));}return rows.sort();}
