// KSGT G9-P36-R4 C3-R4-BCOG-v1
// Deterministic, surface-anchored, fail-closed obligation graph compiler.
// External semantic formalisms are design donors only; no model score is row authority.

export const CONTRACT=Object.freeze({
  version:"C3-R4-BCOG-v1",
  principle:"LOSSLESS_CUSTODY_PLUS_CONSERVATIVE_BINDING",
  unresolved:"ABSTAIN",
  mnmc:["A","R","F","V","G"],
  naturalLanguageRealization:"OUTSIDE_CERTIFICATE_AUTHORITY"
});

const STOP=new Set(("a an the and or but to of in on at for from with by as is are was were be been being do does did have has had this that these those it they them their we our you your authors author paper work study result results reviewer").split(/\s+/));
const FORCE_WORDS=new Set(("no not never without neither nor cannot can't may might could should would must can will intend plan expect aim all every each any some many few several none only").split(/\s+/));
const POINTER=/\b(?:fig(?:ure)?\.?\s*\d+|table\s*\d+|section\s*\d+(?:\.\d+)*|appendix\s*[A-Z0-9]+)\b/ig;
const VALUE=/\b(?:[<>]=?\s*)?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*(?:%|percent|ms|s|sec(?:ond)?s?|min(?:ute)?s?|hours?|MB|GB|KB|tokens?|words?|parameters?|samples?|points?|×|x)?\b/ig;
const UNIT=/^(?:%|percent|ms|s|sec(?:ond)?s?|min(?:ute)?s?|hours?|mb|gb|kb|tokens?|words?|parameters?|samples?|points?|×|x)$/i;
const NEG=new Set(["no","not","never","without","neither","nor","cannot","can't"]);
const MODALS=["may","might","could","should","would","must","can","will","intend","plan","expect","aim"];
const QUANTS=["all","every","each","any","some","many","few","several","none","only"];
const CONDITIONS=["if","when","unless","under","given","provided that","conditional on","in this setting","in this case","for this setting","for this case"];
const REV={
  add:"add",adds:"add",added:"add",adding:"add",
  revise:"revise",revises:"revise",revised:"revise",revising:"revise",
  update:"update",updates:"update",updated:"update",updating:"update",
  include:"include",includes:"include",included:"include",including:"include",
  conduct:"conduct",conducts:"conduct",conducted:"conduct",conducting:"conduct",
  perform:"perform",performs:"perform",performed:"perform",performing:"perform",
  release:"release",releases:"release",released:"release",releasing:"release",
  clarify:"clarify",clarifies:"clarify",clarified:"clarify",clarifying:"clarify",
  explain:"explain",explains:"explain",explained:"explain",explaining:"explain",
  report:"report",reports:"report",reported:"report",reporting:"report",
  compare:"compare",compares:"compare",compared:"compare",comparing:"compare",
  discuss:"discuss",discusses:"discuss",discussed:"discuss",discussing:"discuss",
  provide:"provide",provides:"provide",provided:"provide",providing:"provide",
  correct:"correct",corrects:"correct",corrected:"correct",correcting:"correct",
  expand:"expand",expands:"expand",expanded:"expand",expanding:"expand",
  change:"change",changes:"change",changed:"change",changing:"change",
  remove:"remove",removes:"remove",removed:"remove",removing:"remove",
  recreate:"recreate",recreates:"recreate",recreated:"recreate",
  cite:"cite",cites:"cite",cited:"cite",citing:"cite",
  address:"address",addresses:"address",addressed:"address",addressing:"address"
};
const GENERIC={
  show:"show",shows:"show",showed:"show",shown:"show",
  indicate:"indicate",indicates:"indicate",indicated:"indicate",
  demonstrate:"demonstrate",demonstrates:"demonstrate",demonstrated:"demonstrate",
  suggest:"suggest",suggests:"suggest",suggested:"suggest",
  find:"find",finds:"find",found:"find",
  observe:"observe",observes:"observe",observed:"observe",
  use:"use",uses:"use",used:"use",
  evaluate:"evaluate",evaluates:"evaluate",evaluated:"evaluate",
  test:"test",tests:"test",tested:"test",
  run:"run",runs:"run",ran:"run",
  confirm:"confirm",confirms:"confirm",confirmed:"confirm",
  support:"support",supports:"support",supported:"support",
  improve:"improve",improves:"improve",improved:"improve",
  reduce:"reduce",reduces:"reduce",reduced:"reduce",
  increase:"increase",increases:"increase",increased:"increase"
};
const CMP=[
 ["outperforms","outperform"],["outperform","outperform"],["underperforms","underperform"],["underperform","underperform"],
 ["is higher than","higher_than"],["are higher than","higher_than"],["is lower than","lower_than"],["are lower than","lower_than"],
 ["is greater than","greater_than"],["is less than","less_than"],["is better than","better_than"],["is worse than","worse_than"],
 ["is equal to","equal_to"],["is the same as","same_as"],["exceeds","exceed"],["exceed","exceed"],["beats","beat"],["beat","beat"]
];
const CAUSAL={
  causes:"cause",cause:"cause","leads to":"lead_to","lead to":"lead_to","results in":"result_in","result in":"result_in",
  enables:"enable",enable:"enable",prevents:"prevent",prevent:"prevent"
};

export function normalize(s){
  return String(s||"").normalize("NFKC").toLowerCase()
   .replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\bpercent\b/g,"%")
   .replace(/\s+/g," ").trim();
}
function canonPhrase(s){
  return normalize(s).replace(POINTER,m=>normalize(m)).replace(/[\s\"'.,;:!?()[\]{}*_]+/g," ").trim();
}
function wordTokens(s){
  const out=[]; const r=/[\p{L}\p{N}_+%.-]+/gu; let m;
  while((m=r.exec(s))){out.push({raw:m[0],norm:normalize(m[0]),start:m.index,end:m.index+m[0].length});}
  return out;
}
function contentTokens(s){
  return wordTokens(s).filter(t=>t.norm.length>1&&!STOP.has(t.norm)&&!FORCE_WORDS.has(t.norm));
}
function roleAtoms(role,phrase){
  const toks=wordTokens(phrase),atoms=[],run=[];
  const flush=()=>{for(let i=0;i<run.length;i++){atoms.push(`ROLE:${role}:TOK:${run[i]}`);if(i)atoms.push(`ROLE:${role}:BIGRAM:${run[i-1]}>${run[i]}`);}run.length=0;};
  for(const t of toks){
    if(STOP.has(t.norm)||FORCE_WORDS.has(t.norm)||/^[.,;:!?]$/.test(t.raw)){flush();continue;}
    run.push(t.norm);
  } flush();
  return [...new Set(atoms)];
}
function phraseContent(phrase){return contentTokens(phrase).map(t=>t.norm);}
function leadingScope(text){
  const n=normalize(text);
  for(const c of CONDITIONS){
    if(n.startsWith(c+" ")){
      const comma=text.indexOf(",");
      if(comma>0&&comma<160)return {condition:canonPhrase(text.slice(0,comma)),main:text.slice(comma+1).trim(),offset:comma+1};
    }
  }
  return {condition:"NONE",main:text,offset:0};
}
function detectFrame(text){
  const scoped=leadingScope(text),s=scoped.main.trim(),n=normalize(s);
  let m;
  const revRe=/^(we|the authors?|authors?)\s+(?:(will|may|might|could|should|would|must|can|plan to|intend to|expect to|aim to|have|has|had)\s+)?([\p{L}-]+)\s+(.+)$/iu;
  m=s.match(revRe);
  if(m&&REV[normalize(m[3])]){
    return {class:"REVISION_ACTION",predicate:REV[normalize(m[3])],surfacePredicate:m[3],arg0:"AUTHOR",arg1:m[4].trim(),modal:normalize(m[2]||"ASSERT"),condition:scoped.condition,authority:"AUTHOR_COMMITMENT"};
  }
  for(const [surface,lemma] of CMP){
    const idx=n.indexOf(surface);
    if(idx>0){
      const left=s.slice(0,idx).trim(),right=s.slice(idx+surface.length).trim();
      if(left&&right)return {class:"COMPARISON",predicate:lemma,surfacePredicate:surface,arg0:left,arg1:right,modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION",direction:lemma};
    }
  }
  for(const [surface,lemma] of Object.entries(CAUSAL).sort((a,b)=>b[0].length-a[0].length)){
    const idx=n.indexOf(surface);
    if(idx>0){
      const left=s.slice(0,idx).trim(),right=s.slice(idx+surface.length).trim();
      if(left&&right)return {class:"CAUSAL_RELATION",predicate:lemma,surfacePredicate:surface,arg0:left,arg1:right,modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION"};
    }
  }
  const reportRe=/^(.{1,100}?)\s+(show|shows|showed|shown|indicate|indicates|indicated|demonstrate|demonstrates|demonstrated|suggest|suggests|suggested|confirm|confirms|confirmed|support|supports|supported)\s+(.+)$/i;
  m=s.match(reportRe);
  if(m)return {class:"REPORT_EVIDENCE",predicate:GENERIC[normalize(m[2])]||normalize(m[2]),surfacePredicate:m[2],arg0:m[1].trim(),arg1:m[3].trim(),modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION"};
  const possRe=/^(.{1,100}?)\s+(has|have|had)\s+(.+)$/i;
  m=s.match(possRe);
  if(m)return {class:"EXISTENCE_POSSESSION",predicate:"have",surfacePredicate:m[2],arg0:m[1].trim(),arg1:m[3].trim(),modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION"};
  const copRe=/^(.{1,120}?)\s+(is|are|was|were|remains|remain|becomes|become)\s+(.+)$/i;
  m=s.match(copRe);
  if(m)return {class:"COPULAR_ATTRIBUTE",predicate:normalize(m[2]),surfacePredicate:m[2],arg0:m[1].trim(),arg1:m[3].trim(),modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION"};
  const genericRe=/^(we|our (?:results?|experiments?|analysis)|the (?:results?|experiments?|analysis))\s+([\p{L}-]+)\s+(.+)$/iu;
  m=s.match(genericRe);
  if(m&&GENERIC[normalize(m[2])])return {class:"GENERIC_LEXICAL_RELATION",predicate:GENERIC[normalize(m[2])],surfacePredicate:m[2],arg0:/^we$/i.test(m[1])?"AUTHOR":m[1].trim(),arg1:m[3].trim(),modal:"ASSERT",condition:scoped.condition,authority:"AUTHOR_ASSERTION"};
  return null;
}
function force(text,frame){
  const n=normalize(text),toks=wordTokens(text);
  const polarity=toks.some(t=>NEG.has(t.norm))?"NEG":"POS";
  let modal=frame.modal||"ASSERT";
  if(modal==="ASSERT"){
    const hit=MODALS.find(x=>new RegExp(`\\b${x}\\b`,"i").test(n));
    if(hit)modal=hit;
  }
  const quantifiers=[];
  for(const q of QUANTS)if(new RegExp(`\\b${q}\\b`,"i").test(n))quantifiers.push(q);
  return {polarity,modal,quantifiers,condition:frame.condition||"NONE"};
}
function values(text,frame){
  POINTER.lastIndex=0; VALUE.lastIndex=0;
  const pointers=[...(text.match(POINTER)||[])].map(normalize);
  const vals=[...(text.match(VALUE)||[])].map(v=>normalize(v)).filter(v=>!pointers.some(p=>p.includes(v)));
  const bindings=[],unresolved=[];
  const all=wordTokens(text);
  for(const raw of vals){
    const needle=raw.replace(/\s+/g,"");
    const pos=normalize(text).replace(/\s+/g,"").indexOf(needle);
    let value=raw,unit="";
    const um=raw.match(/^(.+?)\s*(%|ms|s|sec(?:ond)?s?|min(?:ute)?s?|hours?|mb|gb|kb|tokens?|words?|parameters?|samples?|points?|×|x)$/i);
    if(um){value=um[1].trim();unit=normalize(um[2]);}
    const rawIndex=normalize(text).indexOf(value);
    const before=all.filter(t=>t.start<rawIndex&&!STOP.has(t.norm)&&!FORCE_WORDS.has(t.norm)&&!UNIT.test(t.norm));
    const entity=before.slice(-1)[0]?.norm||null;
    if(!entity)unresolved.push(`UNBOUND_VALUE:${raw}`);
    else bindings.push({entity,value,unit,targetRole:canonPhrase(frame.arg1).includes(entity)?"ARG1":"ARG0"});
  }
  return {bindings,pointers,unresolved};
}
function protectedNestedRisk(frame){
  const n=normalize(frame.arg1);
  const known=[...Object.keys(CAUSAL),...CMP.map(x=>x[0])," shows "," show "," indicates "," indicate "," demonstrates "," demonstrate "];
  return known.some(k=>n.includes(k.trim()))?"NESTED_RELATION_UNRESOLVED":null;
}
function graphAtoms(frame,F,V){
  const atoms=[`PRED:${frame.class}:${frame.predicate}`,`EDGE:${frame.predicate}:ARG0`,`EDGE:${frame.predicate}:ARG1`,`AUTH:${frame.authority}`];
  atoms.push(...roleAtoms("ARG0",frame.arg0==="AUTHOR"?"author":frame.arg0));
  atoms.push(...roleAtoms("ARG1",frame.arg1));
  atoms.push(`FORCE:POLARITY:${F.polarity}@${frame.predicate}`,`FORCE:MODAL:${F.modal}@${frame.predicate}`);
  if(F.condition!=="NONE")atoms.push(`SCOPE:CONDITION:${canonPhrase(F.condition)}@${frame.predicate}`);
  for(const q of F.quantifiers){
    const target=canonPhrase(frame.arg0).includes(q)?"ARG0":"ARG1";
    atoms.push(`SCOPE:QUANT:${q}@${target}:${frame.predicate}`);
  }
  if(frame.direction)atoms.push(`RELATION:DIRECTION:${frame.direction}`);
  for(const b of V.bindings)atoms.push(`VALUE:${b.entity}=${b.value}${b.unit?":"+b.unit:""}@${b.targetRole}:${frame.predicate}`);
  for(const p of V.pointers)atoms.push(`GROUND:POINTER:${p}`);
  if(frame.class==="REVISION_ACTION")atoms.push(`ACTION:${frame.predicate}@AUTHOR`);
  return [...new Set(atoms)].sort();
}
function custody(text,frame,F,V){
  const tokens=contentTokens(text);
  const represented=new Set([...phraseContent(frame.arg0==="AUTHOR"?"author":frame.arg0),...phraseContent(frame.arg1),frame.predicate]);
  for(const b of V.bindings){represented.add(b.entity);represented.add(normalize(b.value));if(b.unit)represented.add(b.unit);}
  for(const p of V.pointers)for(const t of contentTokens(p))represented.add(t.norm);
  const missing=tokens.map(t=>t.norm).filter(t=>!represented.has(t)&&!REV[t]&&!GENERIC[t]&&!Object.values(CAUSAL).includes(t));
  return {pass:missing.length===0,missing:[...new Set(missing)],token_count:tokens.length};
}
export function compileBCOG(text,grounding={}){
  const frame=detectFrame(text),unresolved=[];
  if(!frame)return {version:CONTRACT.version,text,complete:false,unresolved:["NO_BINDABLE_PREDICATE"],atoms:[]};
  const F=force(text,frame),V=values(text,frame);
  unresolved.push(...V.unresolved);
  const nested=protectedNestedRisk(frame); if(nested)unresolved.push(nested);
  if(F.polarity==="NEG"){
    const predIdx=normalize(text).indexOf(normalize(frame.surfacePredicate));
    const negIdx=Math.max(...wordTokens(text).filter(t=>NEG.has(t.norm)).map(t=>t.start),-999);
    if(negIdx>predIdx+String(frame.surfacePredicate).length)unresolved.push("NEGATION_SCOPE_AMBIGUOUS");
  }
  const C=custody(text,frame,F,V); if(!C.pass)unresolved.push("SURFACE_CUSTODY_GAP");
  const atoms=graphAtoms(frame,F,V);
  const complete=unresolved.length===0;
  return {
    version:CONTRACT.version,text,complete,unresolved:[...new Set(unresolved)],
    frame:{...frame,arg0_canon:canonPhrase(frame.arg0==="AUTHOR"?"author":frame.arg0),arg1_canon:canonPhrase(frame.arg1)},
    force:F,values:V,custody:C,atoms,
    grounding,
    representation_certificate:{
      surface_custody:C.pass,
      predicate_argument_bound:!!frame.predicate&&!!frame.arg0&&!!frame.arg1,
      value_binding_complete:V.unresolved.length===0,
      force_scope_closed:!unresolved.some(x=>/SCOPE|NESTED/.test(x)),
      grounding_present:!!grounding.review_root&&!!grounding.response_chunk_id&&!!grounding.structural_role,
      pass:complete&&!!grounding.review_root&&!!grounding.response_chunk_id&&!!grounding.structural_role
    }
  };
}
export function compatibleCore(a,b){
  if(!a.complete||!b.complete)return {pass:false,reason:"INCOMPLETE_REPRESENTATION"};
  const A=a.frame,B=b.frame;
  const same=A.class===B.class&&A.predicate===B.predicate&&A.arg0_canon===B.arg0_canon&&
    a.force.polarity===b.force.polarity&&a.force.modal===b.force.modal&&
    canonPhrase(a.force.condition)===canonPhrase(b.force.condition)&&A.authority===B.authority;
  if(!same)return {pass:false,reason:"CORE_BINDING_MISMATCH"};
  const av=new Map(a.values.bindings.map(x=>[x.entity+"|"+x.targetRole,x.value+"|"+x.unit]));
  const bv=new Map(b.values.bindings.map(x=>[x.entity+"|"+x.targetRole,x.value+"|"+x.unit]));
  for(const [k,v] of av)if(bv.has(k)&&bv.get(k)!==v)return {pass:false,reason:"VALUE_BINDING_CONFLICT"};
  return {pass:true,reason:"COMPATIBLE_CORE"};
}
export function controlledFusionWitness(a,b){
  const c=compatibleCore(a,b); if(!c.pass)return {pass:false,reason:c.reason};
  if(a.frame.class!=="REVISION_ACTION")return {pass:false,reason:"NO_AUTHORIZED_CONTROLLED_REALIZER"};
  if(a.force.modal!=="will"||b.force.modal!=="will")return {pass:false,reason:"CONTROLLED_REALIZER_REQUIRES_SHARED_WILL"};
  const oa=a.frame.arg1.trim().replace(/[.!?]+$/,""),ob=b.frame.arg1.trim().replace(/[.!?]+$/,"");
  if(!oa||!ob||canonPhrase(oa)===canonPhrase(ob))return {pass:false,reason:"NO_DISTINCT_OBJECTS"};
  const text=`We will ${a.frame.predicate} ${oa} and ${ob}.`;
  const grounding=a.grounding||{};
  const w=compileBCOG(text,grounding);
  const union=[...new Set([...a.atoms,...b.atoms])].sort();
  const wa=w.atoms.filter(x=>!x.startsWith("ROLE:ARG1:BIGRAM:")).sort();
  const ua=union.filter(x=>!x.startsWith("ROLE:ARG1:BIGRAM:")).sort();
  const graphEqual=w.complete&&JSON.stringify(wa)===JSON.stringify(ua);
  return {pass:graphEqual&&text.length<a.text.length+b.text.length+1,reason:graphEqual?"ROUNDTRIP_GRAPH_EQUAL":"ROUNDTRIP_GRAPH_MISMATCH",text,compiled:w,union_atoms:union,gain_chars:a.text.length+b.text.length+1-text.length};
}
