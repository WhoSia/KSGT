// KSGT G9-P36-R1 canonical obligation-graph replay specification.
// Runtime target: connector-native JavaScript/V8. High-precision, abstention-first.
// Raw Re3Align bytes are never committed.

export const CONTRACT = Object.freeze({
  version:"C3-R1-FULL121-v1",
  mnmc:["A","R","F","V","G"],
  witnesses:["W0","W1","W2"],
  w3:false,
  unresolved:"ABSTAIN",
  ground:"review_id + normalized quoted_review",
  same_surface_cross_ground:false
});

const STOP=new Set(("a an the and or but if then than to of in on at for from with without by as is are was were be been being do does did have has had can could may might must should would will this that these those it they we our you your reviewer authors paper work study result results").split(/\s+/));
const MODAL=/\b(may|might|could|should|would|must|can|will|intend|plan|expect|aim)\b/i;
const NEG=/\b(no|not|never|without|neither|nor|cannot|can't|doesn't|didn't|isn't|aren't|wasn't|weren't)\b/i;
const COMP=/\b(at least|at most|less than|more than|higher than|lower than|greater than|smaller than|increase|decrease|outperform|underperform|better|worse|equal|same as)\b/i;
const CONDITION=/\b(if|when|unless|under|given|conditional on|provided that|for .* setting|in .* setting)\b/i;
const DEICTIC=/\b(this|that|these|those|it|they|them|their|the results?|these results?|the statistics?|this issue|this concern|this point|the above|the following)\b/i;
const POINTER=/\b(fig(?:ure)?\.?\s*\d+|table\s*\d+|section\s*\d+(?:\.\d+)*|appendix\s*[A-Z0-9]+)\b/ig;
const VALUE=/(?:[<>]=?\s*)?\b\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*(?:%|percent|ms|s|sec(?:ond)?s?|min(?:ute)?s?|hours?|MB|GB|KB|tokens?|words?|parameters?|samples?|points?|×|x)?\b/ig;
const ENTITY=/\b(?:GPT-?\d(?:\.\d+)?|LLaMA(?:-?\d+[Bb])?|Qwen(?:\s*\d+(?:\.\d+)?[Bb](?:-Chat|-Instruct)?)?|BERTScore|BERT|RoBERTa|GRU|LSTM|FAISS|BLEU(?:-\d)?|METEOR|ROUGE(?:-[12L])?|F1|accuracy|latency|cost|parameters?|samples?|annotators?|dataset|model|method|baseline|metric|score|rate|time)\b/ig;

export function normalize(s){
  return (s||"").normalize("NFKC").toLowerCase()
    .replace(/\bfig\.?(?=\s*\d)/g,"figure")
    .replace(/\bpercent\b/g,"%")
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/\s+/g," ").trim();
}
export function splitSentences(s){
  let x=(s||"").replace(/\b(Fig)\./g,"$1§").replace(/\b(e\.g|i\.e)\./gi,m=>m.replace(/\./g,"§"));
  return x.split(/(?<=[.!?])\s+|\n{2,}/).map(z=>z.replace(/§/g,".").trim()).filter(z=>z.length>3);
}
function contentSkeleton(s){
  return normalize(s).replace(POINTER," ").replace(VALUE," ").match(/[\p{L}\p{N}_+-]+/gu)?.filter(t=>!STOP.has(t)&&t.length>2).slice(0,24)||[];
}
function scope(s){
  const z=normalize(s); return {
    polarity:NEG.test(z)?"NEG":"POS",
    modal:(z.match(MODAL)||["ASSERT"])[0].toLowerCase(),
    comparator:(z.match(COMP)||["NONE"])[0].toLowerCase(),
    condition:(z.match(CONDITION)||["NONE"])[0].toLowerCase()
  };
}
function values(s){
  POINTER.lastIndex=0; VALUE.lastIndex=0; ENTITY.lastIndex=0;
  const pointers=[...(s.match(POINTER)||[])].map(normalize);
  const vals=[...(s.match(VALUE)||[])].map(normalize).filter(v=>!pointers.some(p=>p.includes(v)));
  const ents=[...(s.match(ENTITY)||[])].map(normalize);
  return {pointers,vals,ents};
}
function actionObject(s){
  const m=normalize(s).match(/\b(?:we|authors?)\s+(?:will|plan to|intend to|have|has|had|are|were)?\s*(add|revise|update|include|conduct|perform|release|clarify|explain|report|compare|discuss|provide|correct|expand|change|remove|recreate|open-source)\b\s*(.{0,100})/);
  if(!m)return null; return {verb:m[1],object:contentSkeleton(m[2]).slice(0,10)};
}
export function compileSentence(s,ctx){
  const n=normalize(s), sk=contentSkeleton(s), sv=scope(s), vv=values(s), act=actionObject(s);
  const unresolved=[];
  let coref=null;
  if(DEICTIC.test(n)){
    if(/\b(this issue|this concern|this point|the above|the following)\b/.test(n)) coref="QUOTE_ROOT";
    else if(ctx.prevResolved===1) coref="PREV_UNIQUE";
    else unresolved.push("UNRESOLVED_REFERENCE");
  }
  if(vv.vals.length && vv.ents.length===0 && !(coref==="PREV_UNIQUE"&&ctx.prevEntityCount===1)) unresolved.push("UNRESOLVED_VALUE_ENTITY");
  if(act && act.object.length===0) unresolved.push("UNRESOLVED_ACTION_OBJECT");
  const substantive=sk.length>=2 || vv.vals.length>0 || !!act;
  if(!substantive)return {substantive:false};
  const graph={A:sk.slice(0,8),R:sk.slice(8,16),F:sv,V:{values:vv.vals,entities:vv.ents},G:{ground:ctx.ground,coref,pointers:vv.pointers},ACTION:act};
  return {substantive:true,graph,unresolved,norm:n,signature:JSON.stringify(graph)};
}
export function replayDocument(doc){
  const obligations=[],sentences=[];
  for(const node of Object.values(doc.response_chunk_nodes_by_quote||{})){
    const ground=doc.review_id+"::"+normalize(node.quoted_review||"");
    let prevResolved=0,prevEntityCount=0;
    for(const s of splitSentences(node.author_reply||"")){
      const c=compileSentence(s,{ground,prevResolved,prevEntityCount});
      sentences.push({ground,text:s,compiled:c});
      if(c.substantive){
        obligations.push({ground,text:s,...c});
        prevResolved=c.unresolved.length?0:1;
        prevEntityCount=c.graph.V.entities.length;
      } else { prevResolved=0; prevEntityCount=0; }
    }
  }
  const byExact=new Map(),bySig=new Map();
  for(const o of obligations){
    if(o.unresolved.length)continue;
    const ek=o.ground+"::"+o.norm, sk=o.ground+"::"+o.signature;
    (byExact.get(ek)||byExact.set(ek,[]).get(ek)).push(o);
    (bySig.get(sk)||bySig.set(sk,[]).get(sk)).push(o);
  }
  const W0=[...byExact.values()].filter(v=>v.length>1);
  const W2=[...bySig.values()].filter(v=>v.length>1 && new Set(v.map(x=>x.norm)).size>1);
  // W1 is deterministic surface normalization beyond exact NFKC/whitespace:
  // figure/Fig and percent/% are already canonicalized in normalize(), so W1 is
  // the subset of same-signature groups whose raw surfaces differ only by those aliases.
  const W1=W2.filter(v=>v.every(x=>normalize(x.text).replace(/figure|%/g,"@")===normalize(v[0].text).replace(/figure|%/g,"@")));
  const certifiable=new Set();
  for(const g of [...W0,...W1,...W2]) for(const x of g.slice(1)) certifiable.add(x);
  return {sentences,obligations,W0,W1,W2,certifiable:[...certifiable]};
}
