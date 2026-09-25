import crypto from 'node:crypto';
import {coreDescriptor,contentFactors} from '../g9-p36-r6/factor_r6.mjs';
export const LAW=Object.freeze({version:'C3-R9-LD-v1',nullVersion:'C3-R9-LINEAGE-AWARE-ADJACENCY-NULL-v1',replicates:127,seed:'KSGT-G9-P36-R9-20260925',alpha:.05});
const F=new Map(Object.entries({add:'ADD',include:'ADD',provide:'ADD',incorporate:'ADD',introduce:'ADD',append:'ADD',revise:'REVISE',update:'REVISE',modify:'REVISE',change:'REVISE',rewrite:'REVISE',edit:'REVISE',correct:'REVISE',clarify:'CLARIFY',explain:'CLARIFY',discuss:'CLARIFY',describe:'CLARIFY',elaborate:'CLARIFY',analyze:'ANALYZE',analyse:'ANALYZE',evaluate:'ANALYZE',assess:'ANALYZE',examine:'ANALYZE',investigate:'ANALYZE',show:'SHOW',demonstrate:'SHOW',indicate:'SHOW',report:'SHOW',present:'SHOW',run:'RUN',conduct:'RUN',perform:'RUN',execute:'RUN',compare:'COMPARE',contrast:'COMPARE',release:'RELEASE',publish:'RELEASE',share:'RELEASE'}));
const STOP=new Set(['CNN','RNN','LLM','NLP','AI','ML','GPU','CPU','SOTA']);
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,;:!?()[\]{}*_]+/g,' ').replace(/\s+/g,' ').trim();
const uniq=a=>[...new Set(a)].sort(); const pairKey=(a,b)=>sha([a,b].sort().join('\n'));
const fam=p=>F.get(String(p||'').toLowerCase())||('EXACT:'+String(p||'').toLowerCase());
const bigrams=b=>new Set(contentFactors(b).filter(x=>x.startsWith('ARG1_BIGRAM|')).map(x=>x.slice(12)));
const content=b=>new Set(contentFactors(b));
const chain=es=>{const n=new Map();for(const e of es){const [a,b]=e.split('>');if(!n.has(a))n.set(a,new Set());n.get(a).add(b)}for(const e of es){const [,b]=e.split('>');if(n.has(b)&&n.get(b).size)return true}return false};
const comp=(A,B)=>{let l=0,r=0;for(const x of A)if(!B.has(x))l++;for(const x of B)if(!A.has(x))r++;return {pass:l>0&&r>0,left_unique:l,right_unique:r}};
const atoks=a=>new Set((a||[]).map(x=>norm(x)).filter(Boolean));
const titleTokens=s=>new Set(norm(s).split(' ').filter(x=>x.length>=3));
const jac=(A,B)=>{let i=0;for(const x of A)if(B.has(x))i++;const u=A.size+B.size-i;return u?i/u:0};
function mids(s){const out=[];for(const t of String(s||'').match(/[A-Za-z][A-Za-z0-9-]{2,}/g)||[]){if(STOP.has(t.toUpperCase()))continue;if(/[A-Z].*[A-Z]/.test(t)||/[A-Za-z].*\d|\d.*[A-Za-z]/.test(t)||t.includes('-'))out.push(t.toLowerCase())}return new Set(out)}
export function shell(item,arm='family'){const c=coreDescriptor(item.bcog);if(!c)return null;const d={...c,predicate:arm==='family'?fam(c.predicate):c.predicate,rebuttal_label:item.rebuttal_label,review_perspective:item.perspective};return {hash:sha(JSON.stringify(d)),predicate:c.predicate,predicate_family:fam(c.predicate)}}
export function lineage(itemA,itemB,authors){
 const A=authors[itemA.paper],B=authors[itemB.paper];
 if(!A?.openreview_found||!B?.openreview_found)return {independent:false,reason:'AUTHOR_METADATA_UNKNOWN'};
 const aa=atoks((A.authorids?.length?A.authorids:A.authors)),bb=atoks((B.authorids?.length?B.authorids:B.authors));const ov=[...aa].filter(x=>bb.has(x));
 if(ov.length)return {independent:false,reason:'SHARED_AUTHOR',shared_authors:ov};
 const ma=mids((itemA.title||'')+' '+itemA.text),mb=mids((itemB.title||'')+' '+itemB.text),mi=[...ma].filter(x=>mb.has(x));
 const tj=jac(titleTokens(itemA.title),titleTokens(itemB.title));
 if(mi.length&&tj>=.15)return {independent:false,reason:'METHOD_ANCESTRY',shared_identifiers:mi,title_jaccard:tj};
 return {independent:true,reason:'NO_SHARED_AUTHOR_OR_METHOD_ANCESTRY',title_jaccard:tj,shared_identifiers:mi};
}
function build(items,arm,edgeOverride=null){
 const post=new Map(),meta=new Map();
 for(const item of items){const k=shell(item,arm),edges=edgeOverride?.get(item.id)||bigrams(item.bcog),ct=content(item.bcog);if(!k||!edges.size||!ct.size)continue;const m={item,key:k,edges,content:ct,text_hash:sha(norm(item.text))};meta.set(item.id,m);for(const e of edges){const pk=k.hash+'|'+e;if(!post.has(pk))post.set(pk,[]);post.get(pk).push(item.id)}}
 const pairs=new Map();for(const [k,ids0] of post){const ids=uniq(ids0),e=k.slice(k.indexOf('|')+1);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pk=pairKey(ids[i],ids[j]);if(!pairs.has(pk))pairs.set(pk,{ids:[ids[i],ids[j]],shared:new Set()});pairs.get(pk).shared.add(e)}}
 return {meta,pairs,postings:[...post.values()].reduce((a,x)=>a+x.length,0)};
}
export function analyze(items,authors,arm='family',edgeOverride=null){
 const {meta,pairs,postings}=build(items,arm,edgeOverride);let exploratory=0,chains=0,base=0,ind=0;const ws=[];
 for(const [pk,p] of pairs){const A=meta.get(p.ids[0]),B=meta.get(p.ids[1]);if(!A||!B||A.key.hash!==B.key.hash||A.text_hash===B.text_hash)continue;const cp=comp(A.content,B.content);if(!cp.pass)continue;exploratory++;const sh=uniq([...p.shared]),ch=sh.length>=2&&chain(sh);if(ch)chains++;const cross=A.item.paper!==B.item.paper;if(!(ch&&cross))continue;base++;const lin=lineage(A.item,B.item,authors);if(lin.independent)ind++;ws.push({pair_key:pk,left:{id:A.item.id,paper:A.item.paper,title:A.item.title,text:A.item.text,predicate:A.key.predicate},right:{id:B.item.id,paper:B.item.paper,title:B.item.title,text:B.item.text,predicate:B.key.predicate},predicate_family:A.key.predicate_family,shared_edges:sh,lineage:lin,complementarity:cp})}
 const iw=ws.filter(x=>x.lineage.independent),papers=new Set(iw.flatMap(x=>[x.left.paper,x.right.paper])),families=new Set(iw.map(x=>x.predicate_family));
 const authorComponents=new Set();for(const x of iw){for(const p of [x.left.paper,x.right.paper]){const a=authors[p];const ids=(a?.authorids?.length?a.authorids:a?.authors)||[];authorComponents.add(ids.map(norm).sort().join('|')||p)}}
 return {stats:{items:meta.size,relation_postings:postings,shared_pair_keys:pairs.size,exploratory_pairs:exploratory,chain_pairs:chains,base_cross_paper_primary_pairs:base,lineage_independent_primary_pairs:ind,distinct_independent_papers:papers.size,distinct_independent_families:families.size,distinct_author_components:authorComponents.size,global_all_pairs:false},witnesses:ws};
}
function shuffleEdges(items,rep){
 const buckets=new Map();
 for(const item of items){const k=shell(item,'family'),ed=[...bigrams(item.bcog)];if(!k||!ed.length)continue;if(!buckets.has(k.hash))buckets.set(k.hash,[]);buckets.get(k.hash).push({item,ed})}
 const out=new Map();
 for(const [core,xs] of buckets){const occ=[];for(const x of xs)for(let i=0;i<x.ed.length;i++){const [l,r]=x.ed[i].split('>');occ.push({id:x.item.id,l,r,i})}
  const slots=[...occ].sort((a,b)=>sha(LAW.seed+'|s|'+rep+'|'+core+'|'+a.id+'|'+a.i).localeCompare(sha(LAW.seed+'|s|'+rep+'|'+core+'|'+b.id+'|'+b.i)));
  const rights=occ.map((o,i)=>({r:o.r,i})).sort((a,b)=>sha(LAW.seed+'|r|'+rep+'|'+core+'|'+a.r+'|'+a.i).localeCompare(sha(LAW.seed+'|r|'+rep+'|'+core+'|'+b.r+'|'+b.i)));
  for(let i=0;i<slots.length;i++){const o=slots[i];if(!out.has(o.id))out.set(o.id,new Set());out.get(o.id).add(o.l+'>'+rights[i].r)}
 }return out;
}
export function nullCourt(items,authors,observed){const vals=[];for(let r=0;r<LAW.replicates;r++)vals.push(analyze(items,authors,'family',shuffleEdges(items,r)).stats.lineage_independent_primary_pairs);const s=[...vals].sort((a,b)=>a-b),p95=s[Math.min(s.length-1,Math.floor(.95*s.length))]??0,ge=vals.filter(x=>x>=observed).length,p=(1+ge)/(1+vals.length);return {replicates:vals.length,observed,null_mean:vals.reduce((a,b)=>a+b,0)/(vals.length||1),null_min:s[0]??0,null_median:s[Math.floor(s.length/2)]??0,null_p95:p95,null_max:s.at(-1)??0,plus_one_p:p,pass:observed>0&&observed>p95&&p<=LAW.alpha}}
