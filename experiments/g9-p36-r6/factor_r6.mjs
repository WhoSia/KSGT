import crypto from 'node:crypto';

export const LAW=Object.freeze({
  version:'C3-R6-OFQ-v1',
  base:'C3-R4-BCOG-v1',
  reuseAuthority:'DESCRIPTIVE_REDUNDANCY_ONLY',
  microfusionCrossGrounding:false,
  globalAllPairs:false
});
const sorted=a=>[...new Set(a)].sort();
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[\s"'“”‘’.,;:!?()[\]{}*_]+/g,' ').trim();
const pairKey=(a,b)=>crypto.createHash('sha256').update([a,b].sort().join('\n')).digest('hex');

export function coreDescriptor(b){
 if(!b?.representation_certificate?.pass)return null;
 const f=b.force||{},fr=b.frame||{};
 const values=(b.values?.bindings||[]).map(x=>({entity:x.entity,targetRole:x.targetRole,value:x.value,unit:x.unit||''}))
   .sort((a,z)=>JSON.stringify(a).localeCompare(JSON.stringify(z)));
 return {
  class:fr.class,predicate:fr.predicate,arg0:fr.arg0_canon,authority:fr.authority,
  direction:fr.direction||null,polarity:f.polarity,modal:f.modal,
  quantifiers:sorted(f.quantifiers||[]),condition:canon(f.condition||'NONE'),values
 };
}
export function groundingDescriptor(b){
 const g=b?.grounding||{};
 if(!g.review_root||!g.response_chunk_id||!g.structural_role)return null;
 return {
  review_root:g.review_root,response_chunk_id:g.response_chunk_id,
  structural_role:g.structural_role,block_type:g.block_type||null,
  attachment_key:g.attachment_key??null,antecedent_key:g.antecedent_key??null,
  local_scope_key:g.local_scope_key??null
 };
}
export const coreHash=b=>{const x=coreDescriptor(b);return x?hash(x):null;};
export const groundHash=b=>{const x=groundingDescriptor(b);return x?hash(x):null;};

export function contentFactors(b){
 if(!b?.representation_certificate?.pass)return [];
 const atoms=b.atoms||[],out=[];
 for(const a of atoms){
  if(a.startsWith('ROLE:ARG1:BIGRAM:'))out.push('ARG1_BIGRAM|'+a.slice('ROLE:ARG1:BIGRAM:'.length));
  else if(a.startsWith('ROLE:ARG1:TOK:'))out.push('ARG1_TOKEN|'+a.slice('ROLE:ARG1:TOK:'.length));
  else if(a.startsWith('GROUND:POINTER:'))out.push('DOC_POINTER|'+a.slice('GROUND:POINTER:'.length));
 }
 return sorted(out);
}
export function quotient(b){
 const c=coreDescriptor(b),g=groundingDescriptor(b),content=contentFactors(b);
 if(!c||!g||!content.length)return {pass:false,reason:'INCOMPLETE_QUOTIENT_SUPPORT'};
 return {pass:true,core:c,grounding:g,content,q_core:hash(c),q_ground:hash(g),q_content:hash(content)};
}
function addPosting(map,key,item){if(!map.has(key))map.set(key,[]);map.get(key).push(item);}

function indexedPairs(items,keyer){
 const postings=new Map();let postingEntries=0;
 for(const item of items){
  const q=quotient(item.bcog);if(!q.pass)continue;
  for(const f of q.content){postingEntries++;addPosting(postings,keyer(q,f),{item,q,f});}
 }
 const pairs=new Map();
 for(const xs of postings.values()){
  const uniq=[...new Map(xs.map(x=>[x.item.id,x])).values()];
  for(let i=0;i<uniq.length;i++)for(let j=i+1;j<uniq.length;j++){
   const a=uniq[i],b=uniq[j],k=pairKey(a.item.id,b.item.id);
   let r=pairs.get(k);if(!r){r={left:a.item,right:b.item,q_left:a.q,q_right:b.q,shared:new Set()};pairs.set(k,r);}
   r.shared.add(a.f);
  }
 }
 return {postings,pairs,postingEntries};
}
export function indexFactorReuse(items){
 const raw=indexedPairs(items,(q,f)=>f);
 const qualified=indexedPairs(items,(q,f)=>q.q_core+'|'+f);
 const rows=[];
 for(const [k,r] of qualified.pairs){
  const A=new Set(r.q_left.content),B=new Set(r.q_right.content);
  rows.push({pair_key:k,left:r.left,right:r.right,shared:sorted([...r.shared]),
   left_unique:sorted([...A].filter(x=>!B.has(x))),right_unique:sorted([...B].filter(x=>!A.has(x))),
   same_grounding:r.q_left.q_ground===r.q_right.q_ground,core_hash:r.q_left.q_core});
 }
 return {rows,stats:{
  items:items.length,raw_factor_postings:raw.postingEntries,qualified_factor_postings:qualified.postingEntries,
  raw_factor_pair_collisions:raw.pairs.size,core_qualified_reuse_pairs:qualified.pairs.size,
  same_grounding_reuse_pairs:rows.filter(x=>x.same_grounding).length,
  cross_grounding_reuse_pairs:rows.filter(x=>!x.same_grounding).length,
  global_all_pairs:false
 }};
}
export function indexMicrofusion(items){
 const idx=indexedPairs(items,(q,f)=>q.q_core+'|'+q.q_ground+'|'+f),rows=[];
 for(const [k,r] of idx.pairs){
  const A=new Set(r.q_left.content),B=new Set(r.q_right.content);
  const shared=sorted([...r.shared]),left=sorted([...A].filter(x=>!B.has(x))),right=sorted([...B].filter(x=>!A.has(x)));
  if(!shared.length||!left.length||!right.length)continue;
  rows.push({pair_key:k,left:r.left,right:r.right,shared,left_unique:left,right_unique:right,
   q_core:r.q_left.q_core,q_ground:r.q_left.q_ground});
 }
 return {rows,stats:{items:items.length,qualified_grounded_postings:idx.postingEntries,
   shared_pair_keys:idx.pairs.size,microfusion_candidate_pairs:rows.length,global_all_pairs:false}};
}
export function couplingAudit(a,b){
 const qa=quotient(a),qb=quotient(b);if(!qa.pass||!qb.pass)return {pass:false,reason:'INCOMPLETE_QUOTIENT_SUPPORT'};
 if(qa.q_core!==qb.q_core)return {pass:false,reason:'PROTECTED_CORE_MISMATCH'};
 if(qa.q_ground!==qb.q_ground)return {pass:false,reason:'GROUNDING_MISMATCH'};
 const A=new Set(qa.content),B=new Set(qb.content),shared=[...A].filter(x=>B.has(x));
 const left=[...A].filter(x=>!B.has(x)),right=[...B].filter(x=>!A.has(x));
 if(!shared.length)return {pass:false,reason:'NO_SHARED_CONTENT_FACTOR'};
 if(!left.length||!right.length)return {pass:false,reason:'NOT_COMPLEMENTARY'};
 return {pass:true,reason:'FACTOR_INDEPENDENCE_NOT_YET_REFUTED',shared:sorted(shared),left_unique:sorted(left),right_unique:sorted(right)};
}
