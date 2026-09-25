import crypto from 'node:crypto';
import {quotient} from '../g9-p36-r6/factor_r6.mjs';

export const LAW=Object.freeze({
  version:'C3-R7-REM-v1',
  nullVersion:'C3-R7-ADJACENCY-NULL-v1',
  nullReplicates:127,
  nullSeed:'KSGT-G9-P36-R7-20260925',
  alpha:0.05,
  globalAllPairs:false
});
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const normText=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,;:!?()[\]{}*_]+/g,' ').replace(/\s+/g,' ').trim();
const uniq=a=>[...new Set(a)].sort();
const pairKey=(a,b)=>sha([a,b].sort().join('\n'));
const edgeOf=f=>f.startsWith('ARG1_BIGRAM|')?f.slice('ARG1_BIGRAM|'.length):null;
const bigramSet=q=>new Set(q.content.filter(x=>x.startsWith('ARG1_BIGRAM|')).map(edgeOf));
const contentSet=q=>new Set(q.content);
function chainExists(edges){
  const es=[...edges].map(x=>x.split('>'));
  const lefts=new Map();
  for(const [a,b] of es){if(!lefts.has(a))lefts.set(a,new Set());lefts.get(a).add(b);}
  for(const [a,b] of es)if(lefts.has(b)&&lefts.get(b).size)return true;
  return false;
}
function complement(A,B){
  let l=0,r=0;for(const x of A)if(!B.has(x))l++;for(const x of B)if(!A.has(x))r++;
  return {pass:l>0&&r>0,left_unique:l,right_unique:r};
}
export function analyzeObserved(items){
  const post=new Map(),meta=new Map();
  for(const item of items){
    const q=quotient(item.bcog);if(!q.pass)continue;
    const edges=bigramSet(q);if(!edges.size)continue;
    meta.set(item.id,{item,q,edges,content:contentSet(q),text_hash:sha(normText(item.text))});
    for(const e of edges){const k=q.q_core+'|'+e;if(!post.has(k))post.set(k,[]);post.get(k).push(item.id);}
  }
  const pairEdges=new Map();let postings=0;
  for(const [k,ids0] of post){const ids=uniq(ids0);postings+=ids.length;const edge=k.slice(k.indexOf('|')+1);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pk=pairKey(ids[i],ids[j]);if(!pairEdges.has(pk))pairEdges.set(pk,{ids:[ids[i],ids[j]],shared:new Set()});pairEdges.get(pk).shared.add(edge);}}
  const witnesses=[];let exploratory=0,chainAny=0,primary=0;
  for(const [pk,p] of pairEdges){
    const A=meta.get(p.ids[0]),B=meta.get(p.ids[1]);if(!A||!B)continue;
    if(A.q.q_core!==B.q.q_core)throw new Error('index core mismatch');
    if(A.text_hash===B.text_hash)continue;
    const comp=complement(A.content,B.content);if(!comp.pass)continue;
    const shared=uniq([...p.shared]);
    exploratory++;
    const chain=shared.length>=2&&chainExists(new Set(shared));
    if(chain)chainAny++;
    const crossPaper=A.item.paper!==B.item.paper;
    if(chain&&crossPaper)primary++;
    witnesses.push({pair_key:pk,left:{id:A.item.id,paper:A.item.paper,text:A.item.text},right:{id:B.item.id,paper:B.item.paper,text:B.item.text},shared_edges:shared,shared_edge_count:shared.length,connected_chain:chain,cross_paper:crossPaper,complementarity:comp});
  }
  return {witnesses:witnesses.sort((a,b)=>b.shared_edge_count-a.shared_edge_count||a.pair_key.localeCompare(b.pair_key)),stats:{items:meta.size,relation_postings:postings,shared_pair_keys:pairEdges.size,exploratory_edge_recurrence_pairs:exploratory,connected_chain_pairs_any_paper:chainAny,primary_cross_paper_connected_chain_pairs:primary,global_all_pairs:false},meta};
}
function hashOrder(seed,x){return sha(seed+'|'+x);}
function pseudoEdgesByCore(items,rep){
  const cores=new Map();
  for(const item of items){
    const q=quotient(item.bcog);if(!q.pass)continue;const edges=[...bigramSet(q)];if(!edges.length)continue;
    if(!cores.has(q.q_core))cores.set(q.q_core,[]);
    cores.get(q.q_core).push({item,q,edges,content:contentSet(q),text_hash:sha(normText(item.text))});
  }
  const out=new Map();
  for(const [core,xs] of cores){
    const occ=[];
    for(const x of xs)for(let i=0;i<x.edges.length;i++){const [l,r]=x.edges[i].split('>');occ.push({id:x.item.id,l,r,slot:i});}
    if(!occ.length)continue;
    const slots=[...occ].sort((a,b)=>hashOrder(LAW.nullSeed+'|slot|'+rep+'|'+core,a.id+'|'+a.slot+'|'+a.l).localeCompare(hashOrder(LAW.nullSeed+'|slot|'+rep+'|'+core,b.id+'|'+b.slot+'|'+b.l)));
    const rights=occ.map((o,i)=>({r:o.r,i})).sort((a,b)=>hashOrder(LAW.nullSeed+'|right|'+rep+'|'+core,a.r+'|'+a.i).localeCompare(hashOrder(LAW.nullSeed+'|right|'+rep+'|'+core,b.r+'|'+b.i)));
    const byItem=new Map();
    for(let i=0;i<slots.length;i++){const o=slots[i],e=o.l+'>'+rights[i].r;if(!byItem.has(o.id))byItem.set(o.id,new Set());byItem.get(o.id).add(e);}
    for(const x of xs)out.set(x.item.id,{item:x.item,q:x.q,edges:byItem.get(x.item.id)||new Set(),content:x.content,text_hash:x.text_hash});
  }
  return out;
}
function countPrimaryPseudo(meta){
  const post=new Map();
  for(const [id,x] of meta)for(const e of x.edges){const k=x.q.q_core+'|'+e;if(!post.has(k))post.set(k,[]);post.get(k).push(id);}
  const pairs=new Map();
  for(const [k,ids0] of post){const ids=uniq(ids0),edge=k.slice(k.indexOf('|')+1);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pk=pairKey(ids[i],ids[j]);if(!pairs.has(pk))pairs.set(pk,{ids:[ids[i],ids[j]],shared:new Set()});pairs.get(pk).shared.add(edge);}}
  let n=0;
  for(const p of pairs.values()){
    const A=meta.get(p.ids[0]),B=meta.get(p.ids[1]);if(!A||!B||A.text_hash===B.text_hash||A.item.paper===B.item.paper)continue;
    if(!complement(A.content,B.content).pass)continue;
    if(p.shared.size>=2&&chainExists(p.shared))n++;
  }
  return n;
}
export function adjacencyNullCourt(items,observedPrimary){
  const nulls=[];
  for(let r=0;r<LAW.nullReplicates;r++)nulls.push(countPrimaryPseudo(pseudoEdgesByCore(items,r)));
  const sorted=[...nulls].sort((a,b)=>a-b);
  const p95=sorted[Math.min(sorted.length-1,Math.floor(0.95*sorted.length))];
  const ge=nulls.filter(x=>x>=observedPrimary).length;
  const p=(1+ge)/(1+nulls.length);
  const mean=nulls.reduce((a,b)=>a+b,0)/(nulls.length||1);
  const pass=observedPrimary>0&&observedPrimary>p95&&p<=LAW.alpha;
  return {replicates:nulls.length,seed:LAW.nullSeed,observed:observedPrimary,null_mean:mean,null_min:sorted[0]??0,null_median:sorted[Math.floor(sorted.length/2)]??0,null_p95:p95,null_max:sorted.at(-1)??0,ge_observed:ge,plus_one_p:p,alpha:LAW.alpha,pass,null_counts:nulls};
}
export function itemLedgerRows(items){
  const rows=[];
  for(const item of items){const q=quotient(item.bcog);if(!q.pass)continue;const edges=uniq([...bigramSet(q)]),content=uniq([...contentSet(q)]);if(!edges.length)continue;rows.push([item.id,item.paper,q.q_core,sha(normText(item.text)),edges.join(';'),content.join(';')].join('\t'));}
  return rows.sort();
}
