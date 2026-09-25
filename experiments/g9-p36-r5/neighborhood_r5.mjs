import crypto from 'node:crypto';

export const LAW=Object.freeze({version:'C3-R5-RNSN-v1',predicateEquivalence:'EXACT_LEMMA_ONLY',globalAllPairs:false,minSharedTokens:2,minTokenJaccard:0.25});
const sorted=a=>[...new Set(a)].sort();
const canon=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[\s"'“”‘’.,;:!?()[\]{}*_]+/g,' ').trim();
const typedArg1=b=>(b?.atoms||[]).filter(x=>x.startsWith('ROLE:ARG1:')||x.startsWith('VALUE:')||x.startsWith('GROUND:POINTER:'));
const tokens=b=>typedArg1(b).filter(x=>x.startsWith('ROLE:ARG1:TOK:'));
const bigOrValue=b=>typedArg1(b).filter(x=>!x.startsWith('ROLE:ARG1:TOK:'));
export function exactBucketSignature(b){
 if(!b?.representation_certificate?.pass)return null;
 const g=b.grounding||{},f=b.force||{},r={
  review:g.review_root,chunk:g.response_chunk_id,role:g.structural_role,block:g.block_type,
  attachment:g.attachment_key??null,antecedent:g.antecedent_key??null,scope:g.local_scope_key,
  class:b.frame?.class,predicate:b.frame?.predicate,arg0:b.frame?.arg0_canon,authority:b.frame?.authority,
  polarity:f.polarity,modal:f.modal,quantifiers:f.quantifiers||[],condition:canon(f.condition)
 };
 if(!r.review||!r.chunk||!r.role||r.block!=='PROSE'||!r.class||!r.predicate||!r.arg0||!r.authority)return null;
 return crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex');
}
export function neighborhood(a,b){
 const sigA=exactBucketSignature(a),sigB=exactBucketSignature(b);
 if(!sigA||!sigB)return {pass:false,reason:'INCOMPLETE_REPRESENTATION'};
 if(sigA!==sigB)return {pass:false,reason:'EXACT_INVARIANT_MISMATCH'};
 const at=new Set(tokens(a)),bt=new Set(tokens(b)),inter=[...at].filter(x=>bt.has(x));
 const union=new Set([...at,...bt]),jaccard=union.size?inter.length/union.size:0;
 const aa=new Set(typedArg1(a)),ba=new Set(typedArg1(b));
 const left=[...aa].filter(x=>!ba.has(x)),right=[...ba].filter(x=>!aa.has(x));
 const subset=(left.length===0&&right.length>0)||(right.length===0&&left.length>0);
 const rich=[...new Set(bigOrValue(a))].some(x=>new Set(bigOrValue(b)).has(x));
 const values=x=>new Map((x.values?.bindings||[]).map(v=>[`${v.entity}|${v.targetRole}`,`${v.value}|${v.unit}`]));
 const av=values(a),bv=values(b);for(const [k,v] of av)if(bv.has(k)&&bv.get(k)!==v)return {pass:false,reason:'VALUE_CONFLICT'};
 if(inter.length<LAW.minSharedTokens||jaccard<LAW.minTokenJaccard||(!rich&&!subset))return {pass:false,reason:'ARG1_TYPED_OVERLAP_BELOW_THRESHOLD',overlap:{shared_tokens:inter.length,jaccard,rich}};
 if(left.length===0&&right.length===0)return {pass:false,reason:'EXACT_OR_ALIAS_R2_TERRITORY'};
 return {pass:true,reason:subset?'R5_SUBSUMPTION_NEIGHBOR':'R5_FUSION_NEIGHBOR',operation:subset?'S1_SUBSUMPTION':'F1_CONJUNCTIVE_FUSION',overlap:{shared_tokens:inter.length,jaccard,rich},left_unique:left,right_unique:right,union:sorted([...aa,...ba])};
}
export function pairKey(a,b){return crypto.createHash('sha256').update([a,b].sort().join('\n')).digest('hex');}
export function indexNeighborhoods(items){
 const buckets=new Map();for(const item of items){const s=exactBucketSignature(item.bcog);if(!s)continue;const atom=tokens(item.bcog);for(const t of atom){const k=`${s}|${t}`;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(item);}}
 const counts=new Map(),pairRefs=new Map();let postings=0;
 for(const xs of buckets.values()){postings+=xs.length;for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++){const k=pairKey(xs[i].id,xs[j].id);counts.set(k,(counts.get(k)||0)+1);pairRefs.set(k,[xs[i],xs[j]]);}}
 const emitted=[];for(const [k,n] of counts){if(n<LAW.minSharedTokens)continue;const pair=pairRefs.get(k);const test=neighborhood(pair[0].bcog,pair[1].bcog);if(test.pass)emitted.push({pair_key:k,left:pair[0],right:pair[1],test});}
 return {emitted,stats:{items:items.length,signature_atom_postings:postings,shared_pair_keys:counts.size,emitted_pairs:emitted.length,global_all_pairs:false}};
}
